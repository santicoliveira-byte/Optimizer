import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

export interface ProcessTarget {
  name: string;
  displayName: string;
  pid: number | null;
  isRunning: boolean;
  priority: 'Normal' | 'AboveNormal' | 'High' | 'RealTime';
  ioPriority: 'Normal' | 'High';
  affinityMask: number;
  affinityCores: number[];
  totalCores: number;
  isCustom?: boolean;
}

export interface LassoConfig {
  autoBoostEnabled: boolean;
  pCoresOnly: boolean;
  defaultPriority: 'Normal' | 'AboveNormal' | 'High' | 'RealTime';
  customProcesses: string[];
}

export class ProcessLassoService {
  private static instance: ProcessLassoService;

  private config: LassoConfig = {
    autoBoostEnabled: true,
    pCoresOnly: true,
    defaultPriority: 'High',
    customProcesses: []
  };

  private knownGames: { name: string; displayName: string }[] = [
    { name: 'cs2.exe', displayName: 'Counter-Strike 2' },
    { name: 'csgo.exe', displayName: 'CS:GO' },
    { name: 'VALORANT-Win64-Shipping.exe', displayName: 'Valorant' },
    { name: 'FortniteClient-Win64-Shipping.exe', displayName: 'Fortnite' },
    { name: 'r5apex.exe', displayName: 'Apex Legends' },
    { name: 'Overwatch.exe', displayName: 'Overwatch 2' },
    { name: 'RainbowSix.exe', displayName: 'Rainbow Six Siege' },
    { name: 'RocketLeague.exe', displayName: 'Rocket League' },
    { name: 'GTA5.exe', displayName: 'Grand Theft Auto V' },
    { name: 'RDR2.exe', displayName: 'Red Dead Redemption 2' },
    { name: 'b1-Win64-Shipping.exe', displayName: 'Black Myth: Wukong' },
    { name: 'AssettoCorsa.exe', displayName: 'Assetto Corsa' },
    { name: 'League of Legends.exe', displayName: 'League of Legends' },
    { name: 'ModernWarfare.exe', displayName: 'Call of Duty: Warzone' },
    { name: 'Cod.exe', displayName: 'Call of Duty HQ' }
  ];

  public static getInstance(): ProcessLassoService {
    if (!ProcessLassoService.instance) {
      ProcessLassoService.instance = new ProcessLassoService();
    }
    return ProcessLassoService.instance;
  }

  /**
   * Returns system CPU core topology
   */
  public getCpuTopology(): { totalCores: number; pCoreIndices: number[] } {
    const cpus = os.cpus();
    const totalCores = Math.max(1, cpus.length);
    // On systems with 8+ threads, P-cores typically occupy the first half or physical threads
    // Provide performance core indices (first half of logical threads or all if <= 8)
    const pCoresCount = totalCores > 8 ? Math.ceil(totalCores * 0.75) : totalCores;
    const pCoreIndices = Array.from({ length: pCoresCount }, (_, i) => i);
    return { totalCores, pCoreIndices };
  }

  /**
   * Scans running processes and matches known & custom games
   */
  public async getTargetProcesses(): Promise<ProcessTarget[]> {
    const { totalCores } = this.getCpuTopology();
    const allGames = [
      ...this.knownGames,
      ...this.config.customProcesses.map((p) => ({ name: p, displayName: p, isCustom: true }))
    ];

    try {
      const psScript = `
        $ErrorActionPreference = 'SilentlyContinue'
        $procs = Get-Process | Select-Object Id, ProcessName, PriorityClass, ProcessorAffinity
        $procs | ConvertTo-Json -Compress
      `;

      const { stdout } = await execAsync(
        `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "${psScript.replace(/\n/g, ' ')}"`,
        { windowsHide: true, timeout: 5000 }
      );

      let runningList: any[] = [];
      if (stdout && stdout.trim()) {
        try {
          const parsed = JSON.parse(stdout.trim());
          runningList = Array.isArray(parsed) ? parsed : [parsed];
        } catch {}
      }

      const results: ProcessTarget[] = allGames.map((game) => {
        const cleanExe = game.name.replace(/\.exe$/i, '').toLowerCase();
        const found = runningList.find(
          (p) => p.ProcessName && p.ProcessName.toLowerCase() === cleanExe
        );

        if (found) {
          const mask = typeof found.ProcessorAffinity === 'number' ? found.ProcessorAffinity : (1 << totalCores) - 1;
          const affinityCores: number[] = [];
          for (let i = 0; i < totalCores; i++) {
            if ((mask & (1 << i)) !== 0) {
              affinityCores.push(i);
            }
          }

          let priority: ProcessTarget['priority'] = 'Normal';
          const pClass = String(found.PriorityClass || '').toLowerCase();
          if (pClass.includes('high')) priority = 'High';
          else if (pClass.includes('abovenormal')) priority = 'AboveNormal';
          else if (pClass.includes('realtime')) priority = 'RealTime';

          return {
            name: game.name,
            displayName: game.displayName,
            pid: found.Id || null,
            isRunning: true,
            priority,
            ioPriority: priority === 'High' || priority === 'RealTime' ? 'High' : 'Normal',
            affinityMask: mask,
            affinityCores,
            totalCores,
            isCustom: (game as any).isCustom
          };
        }

        return {
          name: game.name,
          displayName: game.displayName,
          pid: null,
          isRunning: false,
          priority: 'Normal',
          ioPriority: 'Normal',
          affinityMask: (1 << totalCores) - 1,
          affinityCores: Array.from({ length: totalCores }, (_, i) => i),
          totalCores,
          isCustom: (game as any).isCustom
        };
      });

      return results;
    } catch {
      return allGames.map((game) => ({
        name: game.name,
        displayName: game.displayName,
        pid: null,
        isRunning: false,
        priority: 'Normal',
        ioPriority: 'Normal',
        affinityMask: (1 << totalCores) - 1,
        affinityCores: Array.from({ length: totalCores }, (_, i) => i),
        totalCores,
        isCustom: (game as any).isCustom
      }));
    }
  }

  /**
   * Sets Process Priority (High, AboveNormal, RealTime, Normal)
   */
  public async setProcessPriority(
    processName: string,
    priority: 'Normal' | 'AboveNormal' | 'High' | 'RealTime'
  ): Promise<{ success: boolean; message: string }> {
    const cleanName = processName.replace(/\.exe$/i, '');
    try {
      const psScript = `
        $ErrorActionPreference = 'SilentlyContinue'
        $proc = Get-Process -Name "${cleanName}" -ErrorAction SilentlyContinue
        if ($proc) {
          $proc | ForEach-Object { $_.PriorityClass = '${priority}' }
          "OK"
        } else {
          "NOT_RUNNING"
        }
      `;

      const { stdout } = await execAsync(
        `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "${psScript.replace(/\n/g, ' ')}"`,
        { windowsHide: true, timeout: 5000 }
      );

      if (stdout.includes('NOT_RUNNING')) {
        return { success: false, message: `O processo ${processName} não está em execução no momento.` };
      }

      return { success: true, message: `Prioridade de ${processName} definida para ${priority} com sucesso.` };
    } catch (e: any) {
      return { success: false, message: `Falha ao alterar prioridade: ${e.message}` };
    }
  }

  /**
   * Sets Processor Affinity (CPU Cores Bitmask)
   */
  public async setProcessAffinity(
    processName: string,
    coreIndices: number[]
  ): Promise<{ success: boolean; message: string }> {
    const cleanName = processName.replace(/\.exe$/i, '');
    let mask = 0;
    for (const core of coreIndices) {
      mask |= (1 << core);
    }

    try {
      const psScript = `
        $ErrorActionPreference = 'SilentlyContinue'
        $proc = Get-Process -Name "${cleanName}" -ErrorAction SilentlyContinue
        if ($proc) {
          $proc | ForEach-Object { $_.ProcessorAffinity = [IntPtr]${mask} }
          "OK"
        } else {
          "NOT_RUNNING"
        }
      `;

      const { stdout } = await execAsync(
        `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "${psScript.replace(/\n/g, ' ')}"`,
        { windowsHide: true, timeout: 5000 }
      );

      if (stdout.includes('NOT_RUNNING')) {
        return { success: false, message: `O processo ${processName} não está em execução.` };
      }

      return {
        success: true,
        message: `Afinidade de ${processName} configurada para ${coreIndices.length} núcleos selecionados.`
      };
    } catch (e: any) {
      return { success: false, message: `Falha ao definir afinidade: ${e.message}` };
    }
  }

  /**
   * 1-Click Process Lasso Boost (High Priority + Lock to P-Cores)
   */
  public async applyLassoOptimization(
    processName: string
  ): Promise<{ success: boolean; message: string }> {
    const { pCoreIndices } = this.getCpuTopology();
    const prioRes = await this.setProcessPriority(processName, 'High');
    if (!prioRes.success && prioRes.message.includes('não está em execução')) {
      return prioRes;
    }

    const affinRes = await this.setProcessAffinity(processName, pCoreIndices);
    return {
      success: true,
      message: `Process Lasso Ativado: ${processName} colocado em Alta Prioridade e alocado aos P-Cores (${pCoreIndices.length} núcleos).`
    };
  }

  /**
   * Add a custom game / application executable to monitored list
   */
  public addCustomProcess(processName: string): boolean {
    const clean = processName.trim();
    if (!clean) return false;
    const formatted = clean.endsWith('.exe') ? clean : `${clean}.exe`;
    if (!this.config.customProcesses.includes(formatted)) {
      this.config.customProcesses.push(formatted);
      return true;
    }
    return false;
  }

  /**
   * Remove custom application
   */
  public removeCustomProcess(processName: string): boolean {
    const index = this.config.customProcesses.indexOf(processName);
    if (index > -1) {
      this.config.customProcesses.splice(index, 1);
      return true;
    }
    return false;
  }
}
