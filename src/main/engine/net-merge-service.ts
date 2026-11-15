import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { PowerShellRunner } from './powershell-runner';

const execAsync = promisify(exec);

export interface NetMergeAdapterInfo {
  name: string;
  status: 'USE' | 'skip';
  ipv4: string;
  ipv6: string;
  index?: number;
  reason?: string;
  downMbit: number;
  upMbit: number;
  activeFlows: number;
  totalFlows: number;
  weight: string;
  failed: number;
  limitMbps?: number;
}

export interface NetMergeStatus {
  isInstalled: boolean;
  isRunning: boolean;
  isMerging: boolean;
  pid: number | null;
  uptime: string;
  ipv6Mode: string;
  totalDownMbit: number;
  totalUpMbit: number;
  totalActiveFlows: number;
  totalFlows: number;
  adapters: NetMergeAdapterInfo[];
  limits: Record<string, number>;
  simultaneousPolicyActive: boolean;
}

export class NetMergeService {
  private static instance: NetMergeService;
  private runner: PowerShellRunner;
  private binaryPath: string;

  private constructor() {
    this.runner = PowerShellRunner.getInstance();
    this.binaryPath = 'C:\\Program Files\\net-merge\\net-merge.exe';
  }

  public static getInstance(): NetMergeService {
    if (!NetMergeService.instance) {
      NetMergeService.instance = new NetMergeService();
    }
    return NetMergeService.instance;
  }

  public getBinaryPath(): string {
    if (fs.existsSync(this.binaryPath)) {
      return this.binaryPath;
    }
    // Check D:\Apps or other known locations
    const altPath = 'D:\\Apps\\net-merge\\net-merge.exe';
    if (fs.existsSync(altPath)) {
      return altPath;
    }
    return this.binaryPath;
  }

  public isInstalled(): boolean {
    return fs.existsSync(this.getBinaryPath());
  }

  /**
   * Parse `net-merge status` and `net-merge list` into structured data
   */
  public async getStatus(): Promise<NetMergeStatus> {
    const bin = this.getBinaryPath();
    const isInstalled = this.isInstalled();

    if (!isInstalled) {
      return {
        isInstalled: false,
        isRunning: false,
        isMerging: false,
        pid: null,
        uptime: '0s',
        ipv6Mode: 'Desconhecido',
        totalDownMbit: 0,
        totalUpMbit: 0,
        totalActiveFlows: 0,
        totalFlows: 0,
        adapters: [],
        limits: {},
        simultaneousPolicyActive: false
      };
    }

    try {
      // 1. Run status
      const { stdout: statusOut } = await execAsync(`"${bin}" status`, { timeout: 4000 });
      // 2. Run list
      const { stdout: listOut } = await execAsync(`"${bin}" list`, { timeout: 4000 });
      // 3. Run limit
      const { stdout: limitOut } = await execAsync(`"${bin}" limit`, { timeout: 4000 });

      // Check Group Policy for simultaneous connections
      const policyScript = `
        $key = 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\WcmSvc\\GroupPolicy'
        $val = 1
        if (Test-Path $key) {
          $val = (Get-ItemProperty -Path $key -Name "fMinimizeConnections" -ErrorAction SilentlyContinue).fMinimizeConnections
        }
        [bool]($val -eq 0)
      `;
      let simultaneousPolicyActive = false;
      try {
        const pRes = await this.runner.run(policyScript, 3000, true);
        simultaneousPolicyActive = pRes.stdout.trim().toLowerCase() === 'true';
      } catch {}

      // Parse status
      const lines = statusOut.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const firstLine = lines[0] || '';
      const isMerging = /is ON/i.test(firstLine);
      const isRunning = /is ON|is OFF/i.test(firstLine);

      let pid: number | null = null;
      let uptime = '0s';
      const pidMatch = firstLine.match(/pid\s+(\d+)/i);
      if (pidMatch) pid = parseInt(pidMatch[1], 10);
      const upMatch = firstLine.match(/up\s+([^\)]+)/i);
      if (upMatch) uptime = upMatch[1].trim();

      const ipv6Mode = lines.length > 1 ? lines[1] : '';

      // Parse limits
      const limits: Record<string, number> = {};
      const limitLines = limitOut.split(/\r?\n/);
      for (const line of limitLines) {
        const m = line.match(/^(.+?):\s+(\d+)\s+Mbit/i);
        if (m) {
          limits[m[1].trim()] = parseInt(m[2], 10);
        }
      }

      // Parse list output for IP addresses & indexes
      const listMap = new Map<string, { status: 'USE' | 'skip'; ipv4: string; ipv6: string; index?: number; reason?: string }>();
      const listLines = listOut.split(/\r?\n/);
      for (const line of listLines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        const useMatch = trimmed.match(/^USE\s+([^\s]+)\s+v4\s+([^\s]+)\s+v6\s+([^\s]+)(?:\s+\(index\s+(\d+)\))?/i);
        if (useMatch) {
          listMap.set(useMatch[1], {
            status: 'USE',
            ipv4: useMatch[2],
            ipv6: useMatch[3],
            index: useMatch[4] ? parseInt(useMatch[4], 10) : undefined
          });
          continue;
        }
        const skipMatch = trimmed.match(/^skip\s+([^\:]+):?\s*(.*)$/i);
        if (skipMatch) {
          listMap.set(skipMatch[1].trim(), {
            status: 'skip',
            ipv4: '-',
            ipv6: '-',
            reason: skipMatch[2]?.trim()
          });
        }
      }

      // Parse adapter telemetry from status lines
      const adapters: NetMergeAdapterInfo[] = [];
      let totalDownMbit = 0;
      let totalUpMbit = 0;
      let totalActiveFlows = 0;
      let totalFlows = 0;

      for (let i = 2; i < lines.length; i++) {
        const line = lines[i];
        // Example: Wi-Fi v4 up v6 up link down 0.1 up 0.1 Mbit/s via net-merge 0.1 active 17 total 557 w 0.50/1.00 failed 0
        const tokens = line.split(/\s+/);
        if (tokens.length < 5) continue;

        const name = tokens[0];
        const listMeta = listMap.get(name);

        const downIdx = tokens.indexOf('down');
        const upIdx = tokens.indexOf('up');
        const mbitIdx = tokens.indexOf('Mbit/s');
        const activeIdx = tokens.indexOf('active');
        const totalIdx = tokens.indexOf('total');
        const wIdx = tokens.indexOf('w');
        const failedIdx = tokens.indexOf('failed');

        const downMbit = downIdx !== -1 && downIdx + 1 < tokens.length ? parseFloat(tokens[downIdx + 1]) || 0 : 0;
        const upMbit = upIdx !== -1 && upIdx + 1 < tokens.length && upIdx + 1 < mbitIdx ? parseFloat(tokens[upIdx + 1]) || 0 : 0;
        const activeFlows = activeIdx !== -1 && activeIdx + 1 < tokens.length ? parseInt(tokens[activeIdx + 1], 10) || 0 : 0;
        const flows = totalIdx !== -1 && totalIdx + 1 < tokens.length ? parseInt(tokens[totalIdx + 1], 10) || 0 : 0;
        const weight = wIdx !== -1 && wIdx + 1 < tokens.length ? tokens[wIdx + 1] : '1.0/1.0';
        const failed = failedIdx !== -1 && failedIdx + 1 < tokens.length ? parseInt(tokens[failedIdx + 1], 10) || 0 : 0;

        totalDownMbit += downMbit;
        totalUpMbit += upMbit;
        totalActiveFlows += activeFlows;
        totalFlows += flows;

        adapters.push({
          name,
          status: listMeta?.status || 'USE',
          ipv4: listMeta?.ipv4 || 'Dinâmico',
          ipv6: listMeta?.ipv6 || 'Ativo',
          index: listMeta?.index,
          downMbit: parseFloat(downMbit.toFixed(1)),
          upMbit: parseFloat(upMbit.toFixed(1)),
          activeFlows,
          totalFlows: flows,
          weight,
          failed,
          limitMbps: limits[name]
        });
      }

      return {
        isInstalled: true,
        isRunning,
        isMerging,
        pid,
        uptime,
        ipv6Mode,
        totalDownMbit: parseFloat(totalDownMbit.toFixed(1)),
        totalUpMbit: parseFloat(totalUpMbit.toFixed(1)),
        totalActiveFlows,
        totalFlows,
        adapters,
        limits,
        simultaneousPolicyActive
      };
    } catch (e: any) {
      return {
        isInstalled: true,
        isRunning: false,
        isMerging: false,
        pid: null,
        uptime: '0s',
        ipv6Mode: '',
        totalDownMbit: 0,
        totalUpMbit: 0,
        totalActiveFlows: 0,
        totalFlows: 0,
        adapters: [],
        limits: {},
        simultaneousPolicyActive: false
      };
    }
  }

  public async setMerging(enabled: boolean): Promise<{ success: boolean; message: string }> {
    const bin = this.getBinaryPath();
    if (!this.isInstalled()) {
      return { success: false, message: 'O Net-Merge não se encontra instalado em C:\\Program Files\\net-merge.' };
    }

    try {
      const cmd = enabled ? 'on' : 'off';
      const { stdout } = await execAsync(`"${bin}" ${cmd}`, { timeout: 6000 });
      return {
        success: true,
        message: stdout.trim() || `Net-Merge ${enabled ? 'ativado com sucesso (fusão ligada)' : 'pausado'}.`
      };
    } catch (e: any) {
      return {
        success: false,
        message: `Falha ao alternar Net-Merge: ${e.message}`
      };
    }
  }

  public async setAdapterLimit(adapterName: string, limitMbps: number): Promise<{ success: boolean; message: string }> {
    const bin = this.getBinaryPath();
    try {
      const val = limitMbps > 0 ? limitMbps.toString() : 'unlimited';
      await execAsync(`"${bin}" limit "${adapterName}" ${val}`, { timeout: 4000 });
      return {
        success: true,
        message: limitMbps > 0
          ? `Limite de ${limitMbps} Mbit/s aplicado a ${adapterName}.`
          : `Limite removido de ${adapterName} (Velocidade máxima liberada).`
      };
    } catch (e: any) {
      return { success: false, message: `Erro ao definir limite: ${e.message}` };
    }
  }

  /**
   * Applies Windows Connection Manager Group Policy:
   * Sets fMinimizeConnections = 0 so Windows doesn't disconnect Wi-Fi when Ethernet is plugged in,
   * and enables WeakHostSend / WeakHostReceive on interfaces for high-throughput packet routing.
   */
  public async applySimultaneousPolicy(): Promise<{ success: boolean; message: string }> {
    const script = `
      # 1. Configurar Group Policy do Windows Connection Manager para não minimizar conexões simultâneas
      $wcmKey = "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\WcmSvc\\GroupPolicy"
      if (!(Test-Path $wcmKey)) { New-Item -Path $wcmKey -Force | Out-Null }
      Set-ItemProperty -Path $wcmKey -Name "fMinimizeConnections" -Type DWord -Value 0 -Force

      # 2. Ativar WeakHostSend e WeakHostReceive nas interfaces ativas
      Get-NetAdapter | Where-Object { $_.Status -eq 'Up' } | ForEach-Object {
        Set-NetIPInterface -InterfaceIndex $_.InterfaceIndex -WeakHostSend Enabled -WeakHostReceive Enabled -ErrorAction SilentlyContinue
      }

      Write-Output "POLITICA_CONFIGURADA"
    `;

    try {
      await this.runner.run(script, 10000, true);
      return {
        success: true,
        message: 'Política de conexões simultâneas ativada! O Windows agora mantém o Wi-Fi e Ethernet 100% ativos em simultâneo sem desligar nenhum.'
      };
    } catch (e: any) {
      return {
        success: false,
        message: `Erro ao aplicar política de conexões simultâneas: ${e.message}`
      };
    }
  }

  public async cleanupRoutes(): Promise<{ success: boolean; message: string }> {
    const bin = this.getBinaryPath();
    try {
      await execAsync(`"${bin}" cleanup`, { timeout: 10000 });
      return {
        success: true,
        message: 'Rotas residuais e adaptadores virtuais limpos com sucesso.'
      };
    } catch (e: any) {
      return {
        success: false,
        message: `Falha na limpeza de rotas: ${e.message}`
      };
    }
  }

  public async setAutostart(enabled: boolean): Promise<{ success: boolean; message: string }> {
    const bin = this.getBinaryPath();
    try {
      const mode = enabled ? 'on' : 'off';
      await execAsync(`"${bin}" autostart ${mode}`, { timeout: 5000 });
      return {
        success: true,
        message: `Arranque automático do Net-Merge ${enabled ? 'ativado' : 'desativado'}.`
      };
    } catch (e: any) {
      return {
        success: false,
        message: `Erro ao alterar autostart: ${e.message}`
      };
    }
  }
}
