import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface RuntimeItem {
  name: string;
  category: 'vcredist' | 'directx' | 'vulkan' | 'dotnet';
  installed: boolean;
  version?: string;
  downloadUrl: string;
  installCommand?: string;
}

export class RuntimesService {
  private static instance: RuntimesService;

  public static getInstance(): RuntimesService {
    if (!RuntimesService.instance) {
      RuntimesService.instance = new RuntimesService();
    }
    return RuntimesService.instance;
  }

  /**
   * Scans system for installed Visual C++ Redistributables, DirectX runtimes, and Vulkan
   */
  public async getRuntimesStatus(): Promise<RuntimeItem[]> {
    const runtimes: RuntimeItem[] = [
      {
        name: 'Visual C++ 2015-2022 (x64)',
        category: 'vcredist',
        installed: false,
        downloadUrl: 'https://aka.ms/vs/17/release/vc_redist.x64.exe',
        installCommand: 'winget install --id Microsoft.VCRedist.2015+.x64 -e --silent'
      },
      {
        name: 'Visual C++ 2015-2022 (x86)',
        category: 'vcredist',
        installed: false,
        downloadUrl: 'https://aka.ms/vs/17/release/vc_redist.x86.exe',
        installCommand: 'winget install --id Microsoft.VCRedist.2015+.x86 -e --silent'
      },
      {
        name: 'DirectX End-User Runtimes (June 2010)',
        category: 'directx',
        installed: false,
        downloadUrl: 'https://download.microsoft.com/download/1/7/1/1718CCC4-6315-4D8E-9543-8E28A4E18C4C/dxwebsetup.exe'
      },
      {
        name: '.NET Desktop Runtime 8.0 (x64)',
        category: 'dotnet',
        installed: false,
        downloadUrl: 'https://dotnet.microsoft.com/download/dotnet/8.0',
        installCommand: 'winget install Microsoft.DotNet.DesktopRuntime.8 -e --silent'
      }
    ];

    try {
      // Query registry uninstall keys for VC++ & DirectX
      const psScript = `
        Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*, HKLM:\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* |
        Select-Object DisplayName, DisplayVersion | Where-Object { $_.DisplayName } | ConvertTo-Json -Compress
      `;
      const { stdout } = await execAsync(`powershell.exe -NoProfile -Command "${psScript.replace(/\r?\n/g, ' ')}"`, {
        windowsHide: true,
        timeout: 10000
      });

      if (stdout) {
        const raw = stdout.trim();
        const list = raw.startsWith('[') ? JSON.parse(raw) : [JSON.parse(raw)];
        for (const item of list) {
          const name = String(item.DisplayName || '').toLowerCase();
          if (name.includes('visual c++') && (name.includes('2015-2022') || name.includes('2019') || name.includes('2022'))) {
            if (name.includes('x64')) {
              runtimes[0].installed = true;
              runtimes[0].version = item.DisplayVersion;
            } else if (name.includes('x86')) {
              runtimes[1].installed = true;
              runtimes[1].version = item.DisplayVersion;
            }
          }
          if (name.includes('.net') && name.includes('desktop runtime') && name.includes('8.')) {
            runtimes[3].installed = true;
            runtimes[3].version = item.DisplayVersion;
          }
        }
      }
    } catch {}

    // Check DirectX d3dx9_43.dll presence in System32
    try {
      const fs = require('fs');
      const sys32Dx = 'C:\\Windows\\System32\\d3dx9_43.dll';
      runtimes[2].installed = fs.existsSync(sys32Dx);
      if (runtimes[2].installed) {
        runtimes[2].version = 'DirectX 9/10/11 Legacy Completo';
      }
    } catch {}

    return runtimes;
  }

  /**
   * Installs or repairs a runtime via winget
   */
  public async installRuntime(item: RuntimeItem): Promise<{ success: boolean; message: string }> {
    if (!item.installCommand) {
      const { shell } = require('electron');
      shell.openExternal(item.downloadUrl);
      return { success: true, message: `Página oficial de download aberta: ${item.name}` };
    }

    try {
      await execAsync(item.installCommand, { windowsHide: true, timeout: 120000 });
      return { success: true, message: `${item.name} instalado/atualizado com sucesso via winget!` };
    } catch (e: any) {
      const { shell } = require('electron');
      shell.openExternal(item.downloadUrl);
      return { success: true, message: `A descarregar instalador oficial para ${item.name}` };
    }
  }

  /**
   * Multi-Plane Overlay (MPO) Toggle (HKLM\SOFTWARE\Microsoft\Windows\Dwm\OverlayTestMode)
   * Disabling MPO fixes black screens, stuttering on Discord/browsers with RTX/Radeon cards
   */
  public async getMpoStatus(): Promise<boolean> {
    try {
      const { stdout } = await execAsync(
        'reg query "HKLM\\SOFTWARE\\Microsoft\\Windows\\Dwm" /v OverlayTestMode',
        { windowsHide: true }
      );
      return stdout.includes('0x5'); // 5 = OverlayTestMode disabled (MPO Disabled)
    } catch {
      return false; // Default: MPO is enabled in Windows
    }
  }

  public async setMpoDisabled(disable: boolean): Promise<{ success: boolean; message: string }> {
    try {
      if (disable) {
        await execAsync(
          'reg add "HKLM\\SOFTWARE\\Microsoft\\Windows\\Dwm" /v OverlayTestMode /t REG_DWORD /d 5 /f',
          { windowsHide: true }
        );
        return {
          success: true,
          message: 'MPO (Multi-Plane Overlay) desativado com sucesso. Resolve gaguejos e ecrãs pretos no Discord/Chrome/jogos.'
        };
      } else {
        await execAsync(
          'reg delete "HKLM\\SOFTWARE\\Microsoft\\Windows\\Dwm" /v OverlayTestMode /f',
          { windowsHide: true }
        );
        return {
          success: true,
          message: 'MPO restaurado para o padrão do Windows.'
        };
      }
    } catch (e: any) {
      return {
        success: false,
        message: `Falha ao configurar MPO (Requer Administrador): ${e.message}`
      };
    }
  }
}
