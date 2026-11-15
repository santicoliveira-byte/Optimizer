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
    const candidates = [
      // 1. Packaged extraResources bin folder
      path.join(process.resourcesPath || '', 'bin', 'net-merge', 'net-merge.exe'),
      // 2. Dev root build/bin/net-merge folder
      path.resolve(__dirname, '../../build/bin/net-merge/net-merge.exe'),
      path.resolve(process.cwd(), 'build/bin/net-merge/net-merge.exe'),
      // 3. User apps or standard installations
      'D:\\Apps\\net-merge\\net-merge.exe',
      'C:\\Program Files\\net-merge\\net-merge.exe',
      path.join(process.env.LOCALAPPDATA || '', 'Programs', 'net-merge', 'net-merge.exe'),
      path.join(process.env.USERPROFILE || '', 'Downloads', 'net-merge', 'net-merge.exe')
    ];
    for (const c of candidates) {
      if (c && fs.existsSync(c)) return c;
    }
    return 'D:\\Apps\\net-merge\\net-merge.exe';
  }

  public getTrayBinaryPath(): string {
    const binDir = path.dirname(this.getBinaryPath());
    const trayCandidates = [
      path.join(binDir, 'net-merge-tray.exe'),
      path.join(process.resourcesPath || '', 'bin', 'net-merge', 'net-merge-tray.exe'),
      path.resolve(__dirname, '../../build/bin/net-merge/net-merge-tray.exe'),
      'D:\\Apps\\net-merge\\net-merge-tray.exe',
      'C:\\Program Files\\net-merge\\net-merge-tray.exe'
    ];
    for (const c of trayCandidates) {
      if (c && fs.existsSync(c)) return c;
    }
    return path.join(binDir, 'net-merge-tray.exe');
  }

  public isInstalled(): boolean {
    return fs.existsSync(this.getBinaryPath());
  }

  private async isTrayProcessRunning(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq net-merge*" /NH');
      return /net-merge/i.test(stdout);
    } catch {
      return false;
    }
  }

  private async ensureTrayStarted(): Promise<void> {
    const isRunning = await this.isTrayProcessRunning();
    if (isRunning) return;

    const trayBin = this.getTrayBinaryPath();
    const bin = this.getBinaryPath();

    if (fs.existsSync(trayBin)) {
      await this.runner.run(`Start-Process -FilePath "${trayBin}" -ErrorAction SilentlyContinue`, 5000, true);
    } else if (fs.existsSync(bin)) {
      await this.runner.run(`Start-Process -FilePath "${bin}" -ArgumentList "tray" -WindowStyle Hidden -ErrorAction SilentlyContinue`, 5000, true);
    }

    for (let i = 0; i < 6; i++) {
      await new Promise((r) => setTimeout(r, 500));
      if (await this.isTrayProcessRunning()) break;
    }
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
      // 1. Run list to discover available adapters
      let listOut = '';
      try {
        const res = await execAsync(`"${bin}" list`, { timeout: 4000 });
        listOut = res.stdout;
      } catch {}

      // 2. Run status to get live state
      let statusOut = '';
      try {
        const res = await execAsync(`"${bin}" status`, { timeout: 4000 });
        statusOut = res.stdout;
      } catch {}

      // 3. Run limit to get saved speed limits
      let limitOut = '';
      try {
        const res = await execAsync(`"${bin}" limit`, { timeout: 4000 });
        limitOut = res.stdout;
      } catch {}

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
        const tokens = trimmed.split(/\s+/);
        if (!tokens.length) continue;
        const isUse = tokens[0].toUpperCase() === 'USE';
        const isSkip = tokens[0].toUpperCase() === 'SKIP';
        if (isUse || isSkip) {
          const name = tokens[1];
          const v4Idx = tokens.indexOf('v4');
          const v6Idx = tokens.indexOf('v6');
          const idxIdx = tokens.indexOf('(index');
          const ipv4 = v4Idx !== -1 && v4Idx + 1 < tokens.length ? tokens[v4Idx + 1] : '-';
          const ipv6 = v6Idx !== -1 && v6Idx + 1 < tokens.length ? tokens[v6Idx + 1] : '-';
          let indexNum: number | undefined = undefined;
          if (idxIdx !== -1 && idxIdx + 1 < tokens.length) {
            indexNum = parseInt(tokens[idxIdx + 1].replace(/\D/g, ''), 10);
          }
          listMap.set(name, {
            status: isUse ? 'USE' : 'skip',
            ipv4,
            ipv6,
            index: indexNum
          });
        }
      }

      // Populate base adapters from listMap so adapters are ALWAYS visible even when Net-Merge is OFF
      const adapterMap = new Map<string, NetMergeAdapterInfo>();
      for (const [name, meta] of listMap.entries()) {
        adapterMap.set(name, {
          name,
          status: meta.status,
          ipv4: meta.ipv4,
          ipv6: meta.ipv6,
          index: meta.index,
          reason: meta.reason,
          downMbit: 0,
          upMbit: 0,
          activeFlows: 0,
          totalFlows: 0,
          weight: '1.0/1.0',
          failed: 0,
          limitMbps: limits[name]
        });
      }

      let totalDownMbit = 0;
      let totalUpMbit = 0;
      let totalActiveFlows = 0;
      let totalFlows = 0;

      // If status has live telemetry lines (when merging is ON), merge telemetry
      for (let i = 2; i < lines.length; i++) {
        const line = lines[i];
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

        adapterMap.set(name, {
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

      const adapters = Array.from(adapterMap.values());

      // Fallback: If no adapters found from Net-Merge CLI, detect physical adapters via Windows PowerShell
      if (adapters.length === 0) {
        try {
          const adapterScript = `
            Get-NetAdapter -Physical | Where-Object { $_.Status -eq 'Up' } | ForEach-Object {
              $ip = (Get-NetIPAddress -InterfaceIndex $_.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue).IPAddress
              "$($_.Name)|$ip|$($_.InterfaceIndex)"
            }
          `;
          const aRes = await this.runner.run(adapterScript, 3000, true);
          const rawLines = aRes.stdout.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
          for (const l of rawLines) {
            const parts = l.split('|');
            if (parts.length >= 2) {
              adapters.push({
                name: parts[0],
                status: 'USE',
                ipv4: parts[1] || 'Conectado',
                ipv6: 'Ativo',
                index: parts[2] ? parseInt(parts[2], 10) : undefined,
                downMbit: 0,
                upMbit: 0,
                activeFlows: 0,
                totalFlows: 0,
                weight: '1.0/1.0',
                failed: 0,
                limitMbps: limits[parts[0]]
              });
            }
          }
        } catch {}
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
      return { success: false, message: 'O executável Net-Merge não foi encontrado no sistema.' };
    }

    try {
      if (enabled) {
        await this.ensureTrayStarted();
        const { stdout } = await execAsync(`"${bin}" on`, { timeout: 6000 });
        return {
          success: true,
          message: stdout.trim() || 'Fusão Net-Merge ativada! O tráfego está a ser distribuído por todas as placas conectadas.'
        };
      } else {
        const { stdout } = await execAsync(`"${bin}" off`, { timeout: 6000 });
        return {
          success: true,
          message: stdout.trim() || 'Fusão Net-Merge pausada.'
        };
      }
    } catch (e: any) {
      if (e.message && (e.message.includes('already off') || e.message.includes('already on'))) {
        return {
          success: true,
          message: e.message.includes('already on') ? 'A fusão já está ativa.' : 'A fusão já se encontra pausada.'
        };
      }
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
