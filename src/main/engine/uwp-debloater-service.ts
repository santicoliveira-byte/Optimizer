import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import os from 'os';

const execAsync = promisify(exec);

export interface DebloatAppItem {
  id: string;
  name: string;
  description: string;
  category: 'telemetry' | 'bloatware' | 'storage_ram';
  packagePattern: string;
  isInstalled: boolean;
  isSafe: boolean;
  estimatedRamMb: number;
}

export class UwpDebloaterService {
  private static instance: UwpDebloaterService;

  private appsList: DebloatAppItem[] = [
    {
      id: 'cortana',
      name: 'Microsoft Cortana',
      description: 'Assistente descontinuado que mantém serviços de escuta e telemetria em segundo plano.',
      category: 'telemetry',
      packagePattern: '*549981C3F5F10*',
      isInstalled: false,
      isSafe: true,
      estimatedRamMb: 45
    },
    {
      id: 'onedrive',
      name: 'Microsoft OneDrive Sync',
      description: 'Sincronização contínua de ficheiros na nuvem que causa I/O de disco e uso de rede em jogos.',
      category: 'storage_ram',
      packagePattern: 'OneDrive',
      isInstalled: false,
      isSafe: true,
      estimatedRamMb: 85
    },
    {
      id: 'bing_news',
      name: 'Notícias & Finanças (Bing)',
      description: 'Feed de notícias da Microsoft com tráfego periódico em segundo plano.',
      category: 'bloatware',
      packagePattern: '*BingNews*',
      isInstalled: false,
      isSafe: true,
      estimatedRamMb: 35
    },
    {
      id: 'bing_weather',
      name: 'Meteorologia (Bing)',
      description: 'Atualizações meteorológicas automáticas em segundo plano.',
      category: 'bloatware',
      packagePattern: '*BingWeather*',
      isInstalled: false,
      isSafe: true,
      estimatedRamMb: 30
    },
    {
      id: 'feedback_hub',
      name: 'Hub de Comentários (Feedback)',
      description: 'Recolha de telemetria e registos de atividade de utilizador para diagnósticos.',
      category: 'telemetry',
      packagePattern: '*WindowsFeedbackHub*',
      isInstalled: false,
      isSafe: true,
      estimatedRamMb: 25
    },
    {
      id: 'get_started',
      name: 'Sugestões & Dicas do Windows',
      description: 'Notificações promocionais e tutoriais da Microsoft.',
      category: 'bloatware',
      packagePattern: '*Getstarted*',
      isInstalled: false,
      isSafe: true,
      estimatedRamMb: 20
    },
    {
      id: 'your_phone',
      name: 'Vincular ao Telemóvel (Phone Link)',
      description: 'Serviço de espelhamento e Bluetooth que acorda processos em segundo plano.',
      category: 'bloatware',
      packagePattern: '*YourPhone*',
      isInstalled: false,
      isSafe: true,
      estimatedRamMb: 50
    },
    {
      id: 'solitaire',
      name: 'Microsoft Solitaire Collection',
      description: 'Coleção de jogos de cartas com publicidade embutida.',
      category: 'bloatware',
      packagePattern: '*SolitaireCollection*',
      isInstalled: false,
      isSafe: true,
      estimatedRamMb: 30
    },
    {
      id: 'clipchamp',
      name: 'Clipchamp Video Editor',
      description: 'Editor web pesado pré-instalado no Windows 11.',
      category: 'bloatware',
      packagePattern: '*Clipchamp*',
      isInstalled: false,
      isSafe: true,
      estimatedRamMb: 60
    },
    {
      id: 'people',
      name: 'Microsoft People (Contactos)',
      description: 'Integração de contactos de email antiga raramente utilizada.',
      category: 'bloatware',
      packagePattern: '*People*',
      isInstalled: false,
      isSafe: true,
      estimatedRamMb: 20
    },
    {
      id: 'xbox_game_bar',
      name: 'Xbox Game Bar Overlay',
      description: 'Sobreposição de gravação que gera micro-stutters e latência de frames em GPU dedicada.',
      category: 'bloatware',
      packagePattern: '*XboxGamingOverlay*',
      isInstalled: false,
      isSafe: true,
      estimatedRamMb: 95
    },
    {
      id: 'mixed_reality',
      name: 'Portal de Realidade Mista',
      description: 'Drivers e serviços de VR que ocupam espaço desnecessário.',
      category: 'bloatware',
      packagePattern: '*MixedReality*',
      isInstalled: false,
      isSafe: true,
      estimatedRamMb: 40
    }
  ];

  public static getInstance(): UwpDebloaterService {
    if (!UwpDebloaterService.instance) {
      UwpDebloaterService.instance = new UwpDebloaterService();
    }
    return UwpDebloaterService.instance;
  }

  /**
   * Scans system for installed UWP bloatware packages
   */
  public async getDebloatApps(): Promise<DebloatAppItem[]> {
    try {
      const psScript = `
        $ErrorActionPreference = 'SilentlyContinue'
        $pkgs = Get-AppxPackage -AllUsers | Select-Object -ExpandProperty Name
        $pkgs -join ';'
      `;

      const { stdout } = await execAsync(
        `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "${psScript.replace(/\n/g, ' ')}"`,
        { windowsHide: true, timeout: 6000 }
      );

      const installedNames = (stdout || '').toLowerCase();

      // Check OneDrive executable location
      const oneDrivePath1 = path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'OneDrive', 'OneDrive.exe');
      const oneDrivePath2 = 'C:\\Program Files\\Microsoft OneDrive\\OneDrive.exe';
      const oneDriveInstalled = fs.existsSync(oneDrivePath1) || fs.existsSync(oneDrivePath2);

      return this.appsList.map((app) => {
        if (app.id === 'onedrive') {
          return { ...app, isInstalled: oneDriveInstalled };
        }

        const patternClean = app.packagePattern.replace(/\*/g, '').toLowerCase();
        const isInstalled = installedNames.includes(patternClean);
        return { ...app, isInstalled };
      });
    } catch {
      return this.appsList;
    }
  }

  /**
   * Uninstalls a specific UWP bloatware package
   */
  public async uninstallApp(appId: string): Promise<{ success: boolean; message: string }> {
    const target = this.appsList.find((a) => a.id === appId);
    if (!target) return { success: false, message: 'Aplicação não reconhecida.' };

    if (appId === 'onedrive') {
      return this.removeOneDrive();
    }

    try {
      const psScript = `
        $ErrorActionPreference = 'SilentlyContinue'
        Get-AppxPackage -Name "${target.packagePattern}" -AllUsers | Remove-AppxPackage -AllUsers -ErrorAction SilentlyContinue
        Get-AppxProvisionedPackage -Online | Where-Object DisplayName -like "${target.packagePattern}" | Remove-AppxProvisionedPackage -Online -ErrorAction SilentlyContinue
        "DONE"
      `;

      await execAsync(
        `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "${psScript.replace(/\n/g, ' ')}"`,
        { windowsHide: true, timeout: 15000 }
      );

      return {
        success: true,
        message: `${target.name} removido com sucesso. Libertados aproximadamente ~${target.estimatedRamMb} MB.`
      };
    } catch (e: any) {
      return { success: false, message: `Erro ao remover ${target.name}: ${e.message}` };
    }
  }

  /**
   * Completely removes Microsoft OneDrive and cleans autorun
   */
  public async removeOneDrive(): Promise<{ success: boolean; message: string }> {
    try {
      const psScript = `
        $ErrorActionPreference = 'SilentlyContinue'
        Stop-Process -Name "OneDrive" -Force -ErrorAction SilentlyContinue
        
        $envPaths = @(
          "$env:LOCALAPPDATA\\Microsoft\\OneDrive\\Update\\OneDriveSetup.exe",
          "$env:SYSTEMROOT\\System32\\OneDriveSetup.exe",
          "$env:SYSTEMROOT\\SysWOW64\\OneDriveSetup.exe"
        )
        
        foreach ($p in $envPaths) {
          if (Test-Path $p) {
            Start-Process $p -ArgumentList "/uninstall" -Wait -WindowStyle Hidden -ErrorAction SilentlyContinue
          }
        }

        Remove-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "OneDrive" -ErrorAction SilentlyContinue
        Remove-ItemProperty -Path "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" -Name "OneDrive" -ErrorAction SilentlyContinue
        "OK"
      `;

      await execAsync(
        `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "${psScript.replace(/\n/g, ' ')}"`,
        { windowsHide: true, timeout: 15000 }
      );

      return {
        success: true,
        message: 'Microsoft OneDrive desinstalado e processos de sincronização terminados.'
      };
    } catch (e: any) {
      return { success: false, message: `Erro ao desinstalar OneDrive: ${e.message}` };
    }
  }

  /**
   * 1-Click Batch remove all safe bloatware apps
   */
  public async batchRemoveRecommended(): Promise<{ success: boolean; count: number; freedRamMb: number }> {
    const apps = await this.getDebloatApps();
    const toRemove = apps.filter((a) => a.isInstalled && a.isSafe);

    let count = 0;
    let freedRamMb = 0;

    for (const app of toRemove) {
      const res = await this.uninstallApp(app.id);
      if (res.success) {
        count++;
        freedRamMb += app.estimatedRamMb;
      }
    }

    return { success: true, count, freedRamMb };
  }
}
