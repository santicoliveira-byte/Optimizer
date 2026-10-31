import { IModuleHandler, ModuleApplyResult, ModuleDetectionResult, ModuleRevertResult } from './types';
import { PowerShellRunner } from '../powershell-runner';

export class StartupServicesModule implements IModuleHandler {
  private runner: PowerShellRunner;

  constructor() {
    this.runner = PowerShellRunner.getInstance();
  }

  public async detect(id: string): Promise<ModuleDetectionResult> {
    try {
      switch (id) {
        case 'srv_startup_apps_list': {
          const res = await this.runner.run(`
            (Get-CimInstance Win32_StartupCommand | Measure-Object).Count
          `);
          return {
            status: 'info',
            infoValue: `${res.stdout.trim() || 0} aplicações configuradas no arranque`
          };
        }

        case 'srv_boot_time_measure': {
          const res = await this.runner.run(`
            $e = Get-WinEvent -FilterHashtable @{LogName="Microsoft-Windows-Diagnostics-Performance/Operational"; Id=100} -MaxEvents 1 -ErrorAction SilentlyContinue
            if ($e) { [Math]::Round(($e.Properties[0].Value / 1000), 1) } else { 0 }
          `);
          const timeSec = Number(res.stdout.trim()) || 0;
          return {
            status: 'info',
            infoValue: timeSec > 0 ? `Último arranque: ${timeSec} segundos` : 'Sem eventos de arranque registados'
          };
        }

        case 'srv_disable_restart_apps': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKCU:\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon" -Name "RestartApps" -ErrorAction SilentlyContinue
          `);
          return {
            status: res.stdout.trim() === '0' ? 'applied' : 'not_applied',
            currentValue: res.stdout.trim()
          };
        }

        case 'srv_fast_startup_toggle': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power" -Name "HiberbootEnabled" -ErrorAction SilentlyContinue
          `);
          return {
            status: res.stdout.trim() === '0' ? 'applied' : 'not_applied',
            currentValue: res.stdout.trim(),
            infoValue: res.stdout.trim() === '1' ? 'Arranque Rápido Ativo' : 'Arranque Rápido Desativado (Recomendado para evitar bugs de drivers)'
          };
        }

        case 'srv_background_apps': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications" -Name "GlobalUserDisabled" -ErrorAction SilentlyContinue
          `);
          return {
            status: res.stdout.trim() === '1' ? 'applied' : 'not_applied',
            currentValue: res.stdout.trim()
          };
        }

        case 'srv_startup_apps_toggle': {
          const res = await this.runner.run(`(Get-CimInstance Win32_StartupCommand).Count`);
          const count = parseInt(res.stdout.trim(), 10) || 0;
          return {
            status: count > 3 ? 'not_applied' : 'applied',
            infoValue: `${count} aplicações ativas no arranque do utilizador`
          };
        }

        case 'srv_delay_startup_apps': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Serialize" -Name "StartupDelayInMSec" -ErrorAction SilentlyContinue
          `);
          return {
            status: res.stdout.trim() === '0' ? 'applied' : 'not_applied',
            currentValue: res.stdout.trim()
          };
        }

        case 'srv_disable_heavy_tasks': {
          const res = await this.runner.run(`
            (Get-ScheduledTask -ErrorAction SilentlyContinue | Where-Object { $_.TaskPath -notmatch 'Microsoft|Windows' -and $_.State -eq 'Ready' } | Measure-Object).Count
          `);
          const count = parseInt(res.stdout.trim(), 10) || 0;
          return {
            status: count > 5 ? 'not_applied' : 'applied',
            infoValue: `${count} tarefas agendadas de terceiros ativas`
          };
        }

        case 'srv_third_party_services': {
          const res = await this.runner.run(`
            (Get-Service | Where-Object { $_.Status -eq 'Running' -and $_.DisplayName -notmatch 'Windows|Microsoft' } | Measure-Object).Count
          `);
          const count = parseInt(res.stdout.trim(), 10) || 0;
          return {
            status: 'info',
            infoValue: `${count} serviços de aplicações de terceiros em execução`
          };
        }

        case 'srv_disable_telemetry_service': {
          const res = await this.runner.run(`(Get-Service -Name "DiagTrack" -ErrorAction SilentlyContinue).StartType`);
          const isManualOrDisabled = res.stdout.trim() === 'Manual' || res.stdout.trim() === 'Disabled';
          return {
            status: isManualOrDisabled ? 'applied' : 'not_applied',
            currentValue: res.stdout.trim()
          };
        }

        case 'srv_disable_maps_broker': {
          const res = await this.runner.run(`(Get-Service -Name "MapsBroker" -ErrorAction SilentlyContinue).StartType`);
          const isManualOrDisabled = res.stdout.trim() === 'Manual' || res.stdout.trim() === 'Disabled';
          return {
            status: isManualOrDisabled ? 'applied' : 'not_applied',
            currentValue: res.stdout.trim()
          };
        }

        default:
          return { status: 'not_applied' };
      }
    } catch (e: any) {
      return { status: 'error', error: e.message };
    }
  }

  public async apply(id: string, isDryRun: boolean): Promise<ModuleApplyResult> {
    const commands: string[] = [];

    switch (id) {
      case 'srv_disable_restart_apps': {
        commands.push('New-Item -Path "HKCU:\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon" -Force -ErrorAction SilentlyContinue');
        commands.push('Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon" -Name "RestartApps" -Value 0 -Type DWord');
        break;
      }
      case 'srv_fast_startup_toggle': {
        commands.push('Set-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power" -Name "HiberbootEnabled" -Value 0 -Type DWord');
        break;
      }
      case 'srv_background_apps': {
        commands.push('New-Item -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications" -Force -ErrorAction SilentlyContinue');
        commands.push('Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications" -Name "GlobalUserDisabled" -Value 1 -Type DWord');
        break;
      }
      case 'srv_safe_services_manual': {
        // Safe list of non-critical services set to manual (Fax, RetailDemo, AllJoyn, MapsBroker)
        const safeServices = ['Fax', 'RetailDemo', 'AJRouter', 'MapsBroker', 'DiagTrack'];
        for (const s of safeServices) {
          commands.push(`Set-Service -Name "${s}" -StartupType Manual -ErrorAction SilentlyContinue`);
        }
        break;
      }
      case 'srv_clean_orphan_startup': {
        commands.push(`
          $runs = @('HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run', 'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run')
          foreach ($r in $runs) {
            Get-ItemProperty $r -ErrorAction SilentlyContinue | Get-Member -MemberType NoteProperty | ForEach-Object {
              $val = (Get-ItemPropertyValue $r -Name $_.Name -ErrorAction SilentlyContinue)
              if ($val -and ($val -match '^"?([a-zA-Z]:\\\\[^" ]+)')) {
                if (-not (Test-Path $matches[1])) { Remove-ItemProperty $r -Name $_.Name -ErrorAction SilentlyContinue }
              }
            }
          }
        `);
        break;
      }
      case 'srv_dual_boot_timeout': {
        commands.push('bcdedit /timeout 5');
        break;
      }
      case 'srv_delay_startup_apps': {
        commands.push('New-Item -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Serialize" -Force -ErrorAction SilentlyContinue');
        commands.push('Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Serialize" -Name "StartupDelayInMSec" -Value 0 -Type DWord');
        break;
      }
      case 'srv_disable_heavy_tasks': {
        commands.push(`
          Get-ScheduledTask -ErrorAction SilentlyContinue | Where-Object { $_.TaskPath -match 'GoogleUpdate|Adobe|EdgeUpdate' } | Disable-ScheduledTask -ErrorAction SilentlyContinue
        `);
        break;
      }
      case 'srv_startup_apps_toggle': {
        commands.push(`
          Get-CimInstance Win32_StartupCommand -ErrorAction SilentlyContinue | Where-Object { $_.Command -match 'Cortana|Teams|OneDrive' } | ForEach-Object {
            Remove-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run" -Name $_.Name -ErrorAction SilentlyContinue
          }
        `);
        break;
      }
      case 'srv_disable_telemetry_service': {
        commands.push('Set-Service -Name "DiagTrack" -StartupType Manual -ErrorAction SilentlyContinue; Stop-Service -Name "DiagTrack" -ErrorAction SilentlyContinue');
        break;
      }
      case 'srv_disable_maps_broker': {
        commands.push('Set-Service -Name "MapsBroker" -StartupType Manual -ErrorAction SilentlyContinue; Stop-Service -Name "MapsBroker" -ErrorAction SilentlyContinue');
        break;
      }
      default: {
        return {
          success: true,
          message: 'Diagnóstico de arranque concluído.',
          commands
        };
      }
    }

    if (isDryRun) {
      return {
        success: true,
        message: '[Simulação] Comandos de arranque prontos para execução.',
        commands
      };
    }

    for (const cmd of commands) {
      const res = await this.runner.run(cmd);
      if (!res.success) {
        return {
          success: false,
          message: res.stderr || 'Falha ao aplicar configuração de serviços.',
          commands
        };
      }
    }

    return {
      success: true,
      message: 'Otimização de arranque aplicada com sucesso.',
      commands
    };
  }

  public async revert(id: string, _originalValue: any): Promise<ModuleRevertResult> {
    try {
      switch (id) {
        case 'srv_disable_restart_apps': {
          await this.runner.run('Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon" -Name "RestartApps" -Value 1 -Type DWord');
          break;
        }
        case 'srv_fast_startup_toggle': {
          await this.runner.run('Set-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power" -Name "HiberbootEnabled" -Value 1 -Type DWord');
          break;
        }
        case 'srv_background_apps': {
          await this.runner.run('Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications" -Name "GlobalUserDisabled" -Value 0 -Type DWord');
          break;
        }
        case 'srv_disable_telemetry_service': {
          await this.runner.run('Set-Service -Name "DiagTrack" -StartupType Automatic -ErrorAction SilentlyContinue; Start-Service -Name "DiagTrack" -ErrorAction SilentlyContinue');
          break;
        }
        case 'srv_disable_maps_broker': {
          await this.runner.run('Set-Service -Name "MapsBroker" -StartupType Automatic -ErrorAction SilentlyContinue');
          break;
        }
        default:
          break;
      }
      return { success: true, message: 'Revertido com sucesso para a configuração original de arranque.' };
    } catch (e: any) {
      return { success: false, message: `Erro ao reverter: ${e.message}` };
    }
  }
}
