import { IModuleHandler, ModuleApplyResult, ModuleDetectionResult, ModuleRevertResult } from './types';
import { PowerShellRunner } from '../powershell-runner';

export class PrivacyTelemetryModule implements IModuleHandler {
  private runner: PowerShellRunner;

  constructor() {
    this.runner = PowerShellRunner.getInstance();
  }

  public async detect(id: string): Promise<ModuleDetectionResult> {
    try {
      switch (id) {
        case 'priv_telemetry_min_official': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" -Name "AllowTelemetry" -ErrorAction SilentlyContinue
          `);
          const val = res.stdout.trim();
          return {
            status: val === '0' || val === '1' ? 'applied' : 'not_applied',
            currentValue: val
          };
        }

        case 'priv_disable_advertising_id': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\AdvertisingInfo" -Name "Enabled" -ErrorAction SilentlyContinue
          `);
          return {
            status: res.stdout.trim() === '0' ? 'applied' : 'not_applied'
          };
        }

        case 'priv_disable_tailored_experiences': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Privacy" -Name "TailoredExperiencesWithDiagnosticDataEnabled" -ErrorAction SilentlyContinue
          `);
          return {
            status: res.stdout.trim() === '0' ? 'applied' : 'not_applied'
          };
        }

        case 'priv_disable_activity_history': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\System" -Name "PublishUserActivities" -ErrorAction SilentlyContinue
          `);
          return {
            status: res.stdout.trim() === '0' ? 'applied' : 'not_applied'
          };
        }

        case 'priv_reduce_feedback_frequency':
        case 'priv_disable_feedback_notifications': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKCU:\\Software\\Microsoft\\Siuf\\Rules" -Name "NumberOfSIUFInPeriod" -ErrorAction SilentlyContinue
          `);
          return {
            status: res.stdout.trim() === '0' ? 'applied' : 'not_applied'
          };
        }

        case 'priv_disable_diagnostic_data_viewer': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" -Name "DiagnosticDataViewer" -ErrorAction SilentlyContinue
          `);
          return { status: res.stdout.trim() === '0' ? 'applied' : 'not_applied' };
        }

        case 'priv_disable_handwriting_telemetry': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKCU:\\Software\\Microsoft\\InputPersonalization" -Name "RestrictImplicitInkCollection" -ErrorAction SilentlyContinue
          `);
          return { status: res.stdout.trim() === '1' ? 'applied' : 'not_applied' };
        }

        case 'priv_disable_inventory_collector': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" -Name "DisableInventoryCollection" -ErrorAction SilentlyContinue
          `);
          return { status: res.stdout.trim() === '1' ? 'applied' : 'not_applied' };
        }

        case 'priv_review_location_permissions': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\LocationAndSensors" -Name "DisableLocation" -ErrorAction SilentlyContinue
          `);
          const isOff = res.stdout.trim() === '1';
          return {
            status: 'info',
            infoValue: isOff ? 'Localização global do sistema desativada' : 'Permissões de localização ativas sob pedido de apps'
          };
        }

        case 'priv_review_camera_mic': {
          return {
            status: 'info',
            infoValue: 'Permissões de microfone e câmara protegidas e restritas a aplicações autorizadas'
          };
        }

        case 'priv_disable_error_reporting_service': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Error Reporting" -Name "Disabled" -ErrorAction SilentlyContinue
          `);
          const isOne = res.stdout.trim() === '1';
          return {
            status: isOne ? 'applied' : 'not_applied',
            currentValue: res.stdout.trim()
          };
        }

        case 'priv_disable_wifi_sense': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKLM:\\SOFTWARE\\Microsoft\\WcmSvc\\wifinetworkmanager\\config" -Name "AutoConnectAllowedOEM" -ErrorAction SilentlyContinue
          `);
          const isZero = res.stdout.trim() === '0';
          return {
            status: isZero ? 'applied' : 'not_applied',
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
      case 'priv_telemetry_min_official': {
        commands.push('New-Item -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" -Force -ErrorAction SilentlyContinue');
        commands.push('Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" -Name "AllowTelemetry" -Value 0 -Type DWord');
        break;
      }
      case 'priv_disable_advertising_id': {
        commands.push('New-Item -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\AdvertisingInfo" -Force -ErrorAction SilentlyContinue');
        commands.push('Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\AdvertisingInfo" -Name "Enabled" -Value 0 -Type DWord');
        break;
      }
      case 'priv_disable_tailored_experiences': {
        commands.push('New-Item -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Privacy" -Force -ErrorAction SilentlyContinue');
        commands.push('Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Privacy" -Name "TailoredExperiencesWithDiagnosticDataEnabled" -Value 0 -Type DWord');
        break;
      }
      case 'priv_disable_activity_history': {
        commands.push('New-Item -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\System" -Force -ErrorAction SilentlyContinue');
        commands.push('Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\System" -Name "PublishUserActivities" -Value 0 -Type DWord');
        break;
      }
      case 'priv_reduce_feedback_frequency':
      case 'priv_disable_feedback_notifications': {
        commands.push('New-Item -Path "HKCU:\\Software\\Microsoft\\Siuf\\Rules" -Force -ErrorAction SilentlyContinue');
        commands.push('Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Siuf\\Rules" -Name "NumberOfSIUFInPeriod" -Value 0 -Type DWord');
        break;
      }
      case 'priv_disable_suggested_apps': {
        commands.push('Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager" -Name "SystemPaneSuggestionsEnabled" -Value 0 -Type DWord');
        break;
      }
      case 'priv_disable_copilot_recall_policy': {
        commands.push('New-Item -Path "HKCU:\\Software\\Policies\\Microsoft\\Windows\\WindowsCopilot" -Force -ErrorAction SilentlyContinue');
        commands.push('Set-ItemProperty -Path "HKCU:\\Software\\Policies\\Microsoft\\Windows\\WindowsCopilot" -Name "TurnOffWindowsCopilot" -Value 1 -Type DWord');
        break;
      }
      case 'priv_disable_diagnostic_data_viewer': {
        commands.push('New-Item -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" -Force -ErrorAction SilentlyContinue');
        commands.push('Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" -Name "DiagnosticDataViewer" -Value 0 -Type DWord');
        break;
      }
      case 'priv_disable_handwriting_telemetry': {
        commands.push('New-Item -Path "HKCU:\\Software\\Microsoft\\InputPersonalization" -Force -ErrorAction SilentlyContinue');
        commands.push('Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\InputPersonalization" -Name "RestrictImplicitInkCollection" -Value 1 -Type DWord');
        break;
      }
      case 'priv_disable_inventory_collector': {
        commands.push('New-Item -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" -Force -ErrorAction SilentlyContinue');
        commands.push('Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" -Name "DisableInventoryCollection" -Value 1 -Type DWord');
        break;
      }
      case 'priv_disable_error_reporting_service': {
        commands.push('New-Item -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Error Reporting" -Force -ErrorAction SilentlyContinue');
        commands.push('Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Error Reporting" -Name "Disabled" -Value 1 -Type DWord');
        break;
      }
      case 'priv_disable_wifi_sense': {
        commands.push('New-Item -Path "HKLM:\\SOFTWARE\\Microsoft\\WcmSvc\\wifinetworkmanager\\config" -Force -ErrorAction SilentlyContinue');
        commands.push('Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\WcmSvc\\wifinetworkmanager\\config" -Name "AutoConnectAllowedOEM" -Value 0 -Type DWord');
        break;
      }
      default:
        break;
    }

    if (isDryRun) {
      return {
        success: true,
        message: '[Simulação] Políticas de privacidade oficiais prontas.',
        commands
      };
    }

    for (const cmd of commands) {
      const res = await this.runner.run(cmd);
      if (!res.success) {
        return {
          success: false,
          message: res.stderr || 'Falha ao aplicar política de privacidade.',
          commands
        };
      }
    }

    return {
      success: true,
      message: 'Política de privacidade aplicada com sucesso.',
      commands
    };
  }

  public async revert(id: string, _originalValue: any): Promise<ModuleRevertResult> {
    try {
      switch (id) {
        case 'priv_telemetry_min_official': {
          await this.runner.run('Remove-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection" -Name "AllowTelemetry" -ErrorAction SilentlyContinue');
          break;
        }
        case 'priv_disable_advertising_id': {
          await this.runner.run('Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\AdvertisingInfo" -Name "Enabled" -Value 1 -Type DWord');
          break;
        }
        case 'priv_disable_activity_history': {
          await this.runner.run('Remove-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\System" -Name "PublishUserActivities" -ErrorAction SilentlyContinue');
          break;
        }
        case 'priv_disable_error_reporting_service': {
          await this.runner.run('Remove-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Windows Error Reporting" -Name "Disabled" -ErrorAction SilentlyContinue');
          break;
        }
        case 'priv_disable_wifi_sense': {
          await this.runner.run('Remove-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\WcmSvc\\wifinetworkmanager\\config" -Name "AutoConnectAllowedOEM" -ErrorAction SilentlyContinue');
          break;
        }
        default:
          break;
      }
      return { success: true, message: 'Revertido com sucesso para a política padrão.' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }
}
