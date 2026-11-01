import { PowerShellRunner } from './powershell-runner';
import { StartupItem } from '../../shared/types';

export class StartupManagerService {
  private static instance: StartupManagerService;
  private runner: PowerShellRunner;

  private constructor() {
    this.runner = PowerShellRunner.getInstance();
  }

  public static getInstance(): StartupManagerService {
    if (!StartupManagerService.instance) {
      StartupManagerService.instance = new StartupManagerService();
    }
    return StartupManagerService.instance;
  }

  public async getStartupItems(): Promise<StartupItem[]> {
    const script = `
      $items = @();
      $regHKCU = 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
      $regHKLM = 'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
      $regHKLM32 = 'HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run';

      function Get-RegEntries($path, $loc) {
        if (Test-Path $path) {
          $prop = Get-ItemProperty -Path $path;
          foreach ($name in $prop.PSObject.Properties.Name) {
            if ($name -notmatch '^PS.*') {
              [PSCustomObject]@{
                id = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes(\"$loc:$name\"));
                name = $name;
                command = [string]$prop.$name;
                location = $loc;
                enabled = $true;
              }
            }
          }
        }
      }

      $items += Get-RegEntries $regHKCU 'HKCU Run'
      $items += Get-RegEntries $regHKLM 'HKLM Run'
      $items += Get-RegEntries $regHKLM32 'HKLM 32-bit Run'

      # Startup folder
      $startupPath = [Environment]::GetFolderPath('Startup')
      if (Test-Path $startupPath) {
        $shortcuts = Get-ChildItem -Path $startupPath -Filter '*.lnk'
        foreach ($s in $shortcuts) {
          $items += [PSCustomObject]@{
            id = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes(\"Folder:$($s.Name)\"));
            name = $s.BaseName;
            command = $s.FullName;
            location = 'Startup Folder';
            enabled = $true;
          }
        }
      }

      $items | ConvertTo-Json -Depth 2 -Compress
    `;

    try {
      const res = await this.runner.run(script, 8000, false);
      if (!res.success || !res.stdout) return [];

      const parsed = JSON.parse(res.stdout);
      const list = Array.isArray(parsed) ? parsed : [parsed];

      return list.map((item: any) => {
        const cmdLower = String(item.command || '').toLowerCase();
        let impact: 'low' | 'medium' | 'high' = 'low';

        if (
          cmdLower.includes('discord') ||
          cmdLower.includes('steam') ||
          cmdLower.includes('epic') ||
          cmdLower.includes('spotify') ||
          cmdLower.includes('chrome') ||
          cmdLower.includes('edge')
        ) {
          impact = 'high';
        } else if (
          cmdLower.includes('razer') ||
          cmdLower.includes('steelseries') ||
          cmdLower.includes('logitech') ||
          cmdLower.includes('onedrive')
        ) {
          impact = 'medium';
        }

        return {
          id: String(item.id),
          name: String(item.name),
          command: String(item.command),
          location: String(item.location),
          enabled: Boolean(item.enabled),
          impact
        };
      });
    } catch {
      return [];
    }
  }

  public async toggleItem(item: StartupItem, enable: boolean): Promise<{ success: boolean; message: string }> {
    try {
      let script = '';
      if (item.location.startsWith('HKCU')) {
        const regPath = 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
        if (!enable) {
          script = `Remove-ItemProperty -Path '${regPath}' -Name '${item.name}' -ErrorAction SilentlyContinue`;
        } else {
          script = `Set-ItemProperty -Path '${regPath}' -Name '${item.name}' -Value '${item.command}' -ErrorAction SilentlyContinue`;
        }
      } else if (item.location.startsWith('HKLM')) {
        const regPath = item.location.includes('32-bit')
          ? 'HKLM:\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Run'
          : 'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';
        if (!enable) {
          script = `Remove-ItemProperty -Path '${regPath}' -Name '${item.name}' -ErrorAction SilentlyContinue`;
        } else {
          script = `Set-ItemProperty -Path '${regPath}' -Name '${item.name}' -Value '${item.command}' -ErrorAction SilentlyContinue`;
        }
      } else {
        // Startup folder file
        const backupExt = enable ? '' : '.disabled';
        if (!enable) {
          script = `Rename-Item -Path '${item.command}' -NewName '$([System.IO.Path]::GetFileName('${item.command}')).disabled' -ErrorAction SilentlyContinue`;
        } else {
          script = `Rename-Item -Path '${item.command}.disabled' -NewName '$([System.IO.Path]::GetFileName('${item.command}'))' -ErrorAction SilentlyContinue`;
        }
      }

      const res = await this.runner.run(script, 8000, true);
      return {
        success: res.success,
        message: res.success ? `${item.name} foi ${enable ? 'ativado' : 'desativado'} no arranque.` : res.stderr
      };
    } catch (e: any) {
      return {
        success: false,
        message: e?.message || 'Erro ao alterar estado no arranque'
      };
    }
  }

  public async getAppStartupStatus(): Promise<{ enabled: boolean; isSilent: boolean }> {
    const script = `
      $reg = Get-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' -Name 'Optimizer' -ErrorAction SilentlyContinue
      if ($reg -and $reg.Optimizer) {
        $isSilent = $reg.Optimizer -like '*--silent*'
        [PSCustomObject]@{ enabled = $true; isSilent = $isSilent } | ConvertTo-Json -Compress
      } else {
        [PSCustomObject]@{ enabled = $false; isSilent = $false } | ConvertTo-Json -Compress
      }
    `;
    try {
      const res = await this.runner.run(script, 4000, false);
      if (res.success && res.stdout) {
        return JSON.parse(res.stdout);
      }
    } catch {}
    return { enabled: false, isSilent: false };
  }

  public async setAppStartup(enabled: boolean, silent: boolean = true): Promise<{ success: boolean; message: string }> {
    const exePath = process.execPath;
    let script: string;

    if (enabled) {
      const targetVal = silent ? `\\"${exePath}\\" --silent` : `\\"${exePath}\\"`;
      script = `Set-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' -Name 'Optimizer' -Value '${targetVal}' -Type String -Force`;
    } else {
      script = `Remove-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' -Name 'Optimizer' -ErrorAction SilentlyContinue`;
    }

    try {
      const res = await this.runner.run(script, 4000, false);
      return {
        success: res.success,
        message: enabled
          ? 'Optimizer configurado para arrancar com o Windows em Modo Furtivo (System Tray).'
          : 'Optimizer removido do arranque do Windows.'
      };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }
}
