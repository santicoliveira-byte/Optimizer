import { PowerShellRunner } from './powershell-runner';

export interface MaintenanceTaskInfo {
  id: string;
  name: string;
  description: string;
  category: 'repair' | 'storage' | 'system';
  icon: string;
  estimatedDuration: string;
  lastRun?: string;
  lastStatus?: 'idle' | 'running' | 'success' | 'warning' | 'error';
  lastOutput?: string;
}

export interface MaintenanceRunResult {
  taskId: string;
  success: boolean;
  message: string;
  output: string;
  durationMs: number;
}

export interface FullMaintenanceSummary {
  success: boolean;
  completedTasks: number;
  totalTasks: number;
  durationMs: number;
  results: MaintenanceRunResult[];
  message: string;
}

export class WindowsMaintenanceService {
  private static instance: WindowsMaintenanceService;
  private runner: PowerShellRunner;
  private tasksStatus: Map<string, { lastRun: string; lastStatus: 'idle' | 'running' | 'success' | 'warning' | 'error'; lastOutput: string }> = new Map();

  private constructor() {
    this.runner = PowerShellRunner.getInstance();
  }

  public static getInstance(): WindowsMaintenanceService {
    if (!WindowsMaintenanceService.instance) {
      WindowsMaintenanceService.instance = new WindowsMaintenanceService();
    }
    return WindowsMaintenanceService.instance;
  }

  public getTasks(): MaintenanceTaskInfo[] {
    const definitions: Omit<MaintenanceTaskInfo, 'lastRun' | 'lastStatus' | 'lastOutput'>[] = [
      {
        id: 'trim_ssd',
        name: 'Otimização & TRIM de SSDs',
        description: 'Envia o sinal TRIM a todas as unidades SSD para garantir tempo de acesso ultrarrápido e evitar degradação de desempenho.',
        category: 'storage',
        icon: 'HardDrive',
        estimatedDuration: '~10-20 seg'
      },
      {
        id: 'clean_caches',
        name: 'Limpeza de Caches & Ficheiros Temporários',
        description: 'Elimina resíduos de programas em %TEMP%, ficheiros residuais do Windows Temp e recria a cache de ícones do explorador.',
        category: 'storage',
        icon: 'Trash2',
        estimatedDuration: '~15 seg'
      },
      {
        id: 'sfc_scan',
        name: 'Verificação de Ficheiros do Sistema (SFC)',
        description: 'Executa sfc /scannow para identificar e substituir automaticamente ficheiros protegidos do Windows que estejam em falta ou danificados.',
        category: 'repair',
        icon: 'ShieldCheck',
        estimatedDuration: '~2-4 min'
      },
      {
        id: 'dism_repair',
        name: 'Reparação da Imagem do Windows (DISM)',
        description: 'Executa DISM /Online /Cleanup-Image /RestoreHealth para reparar o repositório de componentes a partir do Windows Update.',
        category: 'repair',
        icon: 'Wrench',
        estimatedDuration: '~3-5 min'
      },
      {
        id: 'winsxs_cleanup',
        name: 'Limpeza de Componentes WinSxS',
        description: 'Limpa pacotes substituídos e versões antigas de atualizações guardadas no repositório do Windows, libertando múltiplos GBs.',
        category: 'storage',
        icon: 'Archive',
        estimatedDuration: '~2-3 min'
      },
      {
        id: 'chkdsk_scan',
        name: 'Verificação Rápida de Disco (CHKDSK)',
        description: 'Executa chkdsk C: /scan para inspecionar a integridade do sistema de ficheiros NTFS em tempo real sem necessitar de reiniciar.',
        category: 'system',
        icon: 'Activity',
        estimatedDuration: '~1-2 min'
      },
      {
        id: 'repair_wu',
        name: 'Reposição do Windows Update',
        description: 'Para temporariamente os serviços de atualização, limpa a pasta de downloads SoftwareDistribution corrompida e reinicia os serviços.',
        category: 'repair',
        icon: 'RefreshCw',
        estimatedDuration: '~25 seg'
      }
    ];

    return definitions.map((def) => {
      const recorded = this.tasksStatus.get(def.id);
      return {
        ...def,
        lastRun: recorded?.lastRun,
        lastStatus: recorded?.lastStatus || 'idle',
        lastOutput: recorded?.lastOutput
      };
    });
  }

  public async runTask(taskId: string): Promise<MaintenanceRunResult> {
    const startTime = Date.now();
    this.tasksStatus.set(taskId, {
      lastRun: new Date().toLocaleTimeString(),
      lastStatus: 'running',
      lastOutput: 'A executar operação...'
    });

    let script = '';
    let taskTimeout = 300000; // 5 min default

    switch (taskId) {
      case 'trim_ssd':
        script = `
          Get-Volume | Where-Object { $_.DriveType -eq 'Fixed' -and $_.DriveLetter } | ForEach-Object {
            Write-Output "A enviar TRIM para unidade $($_.DriveLetter):..."
            Optimize-Volume -DriveLetter $_.DriveLetter -ReTrim -Verbose -ErrorAction SilentlyContinue
          }
          Write-Output "TRIM concluído em todas as unidades SSD ativas."
        `;
        taskTimeout = 60000;
        break;

      case 'clean_caches':
        script = `
          Write-Output "A limpar ficheiros temporários do utilizador..."
          $c1 = (Get-ChildItem -Path "$env:TEMP" -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object).Count
          Remove-Item -Path "$env:TEMP\\*" -Recurse -Force -ErrorAction SilentlyContinue
          
          Write-Output "A limpar pasta temporária do Windows..."
          $c2 = (Get-ChildItem -Path "$env:WINDIR\\Temp" -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object).Count
          Remove-Item -Path "$env:WINDIR\\Temp\\*" -Recurse -Force -ErrorAction SilentlyContinue
          
          Write-Output "A limpar miniaturas do Explorador..."
          Remove-Item -Path "$env:LOCALAPPDATA\\Microsoft\\Windows\\Explorer\\thumbcache_*.db" -Force -ErrorAction SilentlyContinue
          
          Clear-DnsClientCache -ErrorAction SilentlyContinue
          Write-Output "Limpeza de temporários concluída com sucesso ($c1 + $c2 itens processados)."
        `;
        taskTimeout = 60000;
        break;

      case 'sfc_scan':
        script = `
          Write-Output "A iniciar verificação e reparação SFC (System File Checker)..."
          sfc /scannow
        `;
        taskTimeout = 600000; // 10 min
        break;

      case 'dism_repair':
        script = `
          Write-Output "A iniciar DISM /Online /Cleanup-Image /RestoreHealth..."
          Dism.exe /Online /Cleanup-Image /RestoreHealth
        `;
        taskTimeout = 600000; // 10 min
        break;

      case 'winsxs_cleanup':
        script = `
          Write-Output "A iniciar limpeza da pasta WinSxS (Component Cleanup)..."
          Dism.exe /Online /Cleanup-Image /StartComponentCleanup /ResetBase
        `;
        taskTimeout = 600000; // 10 min
        break;

      case 'chkdsk_scan':
        script = `
          Write-Output "A examinar integridade do disco C:..."
          chkdsk C: /scan
        `;
        taskTimeout = 300000; // 5 min
        break;

      case 'repair_wu':
        script = `
          Write-Output "A parar serviços do Windows Update..."
          Stop-Service -Name wuauserv, cryptSvc, bits, msiserver -Force -ErrorAction SilentlyContinue
          
          Write-Output "A limpar pasta SoftwareDistribution..."
          Remove-Item -Path "$env:WINDIR\\SoftwareDistribution\\Download\\*" -Recurse -Force -ErrorAction SilentlyContinue
          
          Write-Output "A reiniciar serviços de atualização..."
          Start-Service -Name wuauserv, cryptSvc, bits -ErrorAction SilentlyContinue
          Write-Output "Serviços do Windows Update reiniciados com sucesso."
        `;
        taskTimeout = 90000;
        break;

      default:
        return {
          taskId,
          success: false,
          message: `Tarefa desconhecida: ${taskId}`,
          output: '',
          durationMs: 0
        };
    }

    try {
      const res = await this.runner.run(script, taskTimeout, true);
      const durationMs = Date.now() - startTime;
      const output = (res.stdout || res.stderr || '').trim();

      const isSuccess = res.success && !output.includes('Failed') && !output.includes('Erro:');
      const status: 'success' | 'warning' | 'error' = isSuccess ? 'success' : res.success ? 'warning' : 'error';

      this.tasksStatus.set(taskId, {
        lastRun: new Date().toLocaleTimeString(),
        lastStatus: status,
        lastOutput: output || (isSuccess ? 'Operação concluída com sucesso.' : 'Concluído com avisos.')
      });

      return {
        taskId,
        success: isSuccess,
        message: isSuccess
          ? 'Tarefa concluída com sucesso!'
          : 'Tarefa concluída com avisos do sistema.',
        output: output || 'Operação finalizada.',
        durationMs
      };
    } catch (err: any) {
      const durationMs = Date.now() - startTime;
      this.tasksStatus.set(taskId, {
        lastRun: new Date().toLocaleTimeString(),
        lastStatus: 'error',
        lastOutput: err.message
      });

      return {
        taskId,
        success: false,
        message: `Erro ao executar: ${err.message}`,
        output: err.message,
        durationMs
      };
    }
  }

  public async runFullMaintenance(): Promise<FullMaintenanceSummary> {
    const startTime = Date.now();
    const taskSequence = ['trim_ssd', 'clean_caches', 'winsxs_cleanup', 'sfc_scan', 'chkdsk_scan'];
    const results: MaintenanceRunResult[] = [];
    let completedCount = 0;

    for (const taskId of taskSequence) {
      const res = await this.runTask(taskId);
      results.push(res);
      if (res.success) {
        completedCount++;
      }
    }

    const durationMs = Date.now() - startTime;
    return {
      success: completedCount > 0,
      completedTasks: completedCount,
      totalTasks: taskSequence.length,
      durationMs,
      results,
      message: `Manutenção Geral Concluída: ${completedCount}/${taskSequence.length} tarefas executadas com sucesso.`
    };
  }
}
