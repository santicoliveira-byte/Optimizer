import { IModuleHandler, ModuleApplyResult, ModuleDetectionResult, ModuleRevertResult } from './types';
import { PowerShellRunner } from '../powershell-runner';

export class InputLatencyModule implements IModuleHandler {
  private runner: PowerShellRunner;

  constructor() {
    this.runner = PowerShellRunner.getInstance();
  }

  public async detect(id: string): Promise<ModuleDetectionResult> {
    try {
      switch (id) {
        case 'input_power_plan': {
          const res = await this.runner.run(`(powercfg /getactivescheme)`);
          const isHighOrUltimate = res.stdout.toLowerCase().includes('ultimate') ||
                                   res.stdout.toLowerCase().includes('alto desempenho') ||
                                   res.stdout.toLowerCase().includes('high performance');
          return {
            status: isHighOrUltimate ? 'applied' : 'not_applied',
            currentValue: res.stdout,
            infoValue: res.stdout
          };
        }

        case 'input_game_mode': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKCU:\\Software\\Microsoft\\GameBar" -Name "AutoGameModeEnabled" -ErrorAction SilentlyContinue
          `);
          const val = res.stdout.trim();
          return {
            status: val === '1' ? 'applied' : 'not_applied',
            currentValue: val
          };
        }

        case 'input_mouse_accel': {
          const res = await this.runner.run(`
            $speed = Get-ItemPropertyValue -Path "HKCU:\\Control Panel\\Mouse" -Name "MouseSpeed" -ErrorAction SilentlyContinue
            $t1 = Get-ItemPropertyValue -Path "HKCU:\\Control Panel\\Mouse" -Name "MouseThreshold1" -ErrorAction SilentlyContinue
            $t2 = Get-ItemPropertyValue -Path "HKCU:\\Control Panel\\Mouse" -Name "MouseThreshold2" -ErrorAction SilentlyContinue
            "$speed,$t1,$t2"
          `);
          const parts = res.stdout.split(',');
          const isOff = parts[0] === '0' && parts[1] === '0' && parts[2] === '0';
          return {
            status: isOff ? 'applied' : 'not_applied',
            currentValue: res.stdout
          };
        }

        case 'input_pointer_speed': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKCU:\\Control Panel\\Mouse" -Name "MouseSensitivity" -ErrorAction SilentlyContinue
          `);
          const val = res.stdout.trim();
          return {
            status: val === '10' ? 'applied' : 'not_applied',
            currentValue: val,
            infoValue: `Velocidade atual: ${val || '10'} (Ideal: 10)`
          };
        }

        case 'input_sticky_keys': {
          const res = await this.runner.run(`
            (Get-ItemPropertyValue -Path "HKCU:\\Control Panel\\Accessibility\\StickyKeys" -Name "Flags" -ErrorAction SilentlyContinue)
          `);
          const val = parseInt(res.stdout.trim(), 10);
          // Standard disabled flag has bit 0 (enabled) turned off
          const isOff = !isNaN(val) && (val % 2 === 0 || val === 506);
          return {
            status: isOff ? 'applied' : 'not_applied',
            currentValue: res.stdout.trim()
          };
        }

        case 'input_filter_keys': {
          const res = await this.runner.run(`
            (Get-ItemPropertyValue -Path "HKCU:\\Control Panel\\Accessibility\\Keyboard Response" -Name "Flags" -ErrorAction SilentlyContinue)
          `);
          const val = parseInt(res.stdout.trim(), 10);
          const isOff = !isNaN(val) && (val % 2 === 0 || val === 122);
          return {
            status: isOff ? 'applied' : 'not_applied',
            currentValue: res.stdout.trim()
          };
        }

        case 'input_toggle_keys': {
          const res = await this.runner.run(`
            (Get-ItemPropertyValue -Path "HKCU:\\Control Panel\\Accessibility\\ToggleKeys" -Name "Flags" -ErrorAction SilentlyContinue)
          `);
          const val = parseInt(res.stdout.trim(), 10);
          const isOff = !isNaN(val) && (val % 2 === 0 || val === 58);
          return {
            status: isOff ? 'applied' : 'not_applied',
            currentValue: res.stdout.trim()
          };
        }

        case 'input_game_dvr': {
          const res = await this.runner.run(`
            $u = Get-ItemPropertyValue -Path "HKCU:\\System\\GameConfigStore" -Name "GameDVR_Enabled" -ErrorAction SilentlyContinue
            $m = Get-ItemPropertyValue -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\GameDVR" -Name "AllowGameDVR" -ErrorAction SilentlyContinue
            "$u,$m"
          `);
          const parts = res.stdout.split(',');
          const isOff = parts[0] === '0' || parts[1] === '0';
          return {
            status: isOff ? 'applied' : 'not_applied',
            currentValue: res.stdout
          };
        }

        case 'input_game_bar': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR" -Name "AppCaptureEnabled" -ErrorAction SilentlyContinue
          `);
          return {
            status: res.stdout.trim() === '0' ? 'applied' : 'not_applied',
            currentValue: res.stdout.trim()
          };
        }

        case 'input_monitor_refresh': {
          const res = await this.runner.run(`
            Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty CurrentRefreshRate -ErrorAction SilentlyContinue
          `);
          const rates = res.stdout.split(/\r?\n/).filter(Boolean);
          const maxRate = rates.length ? Math.max(...rates.map(Number)) : 60;
          return {
            status: 'info',
            infoValue: `${maxRate} Hz detetado`,
            currentValue: maxRate
          };
        }

        case 'input_vrr': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKCU:\\Control Panel\\GraphicsDrivers" -Name "VariableRefreshRate" -ErrorAction SilentlyContinue
          `);
          return {
            status: res.stdout.trim() === '1' ? 'applied' : 'not_applied',
            currentValue: res.stdout.trim()
          };
        }

        case 'input_windowed_optimizations': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKCU:\\Software\\Microsoft\\DirectX\\UserGpuPreferences" -Name "DirectXUserGlobalSettings" -ErrorAction SilentlyContinue
          `);
          const hasSwap = res.stdout.includes('SwapEffectUpgradeEnable=1');
          return {
            status: hasSwap ? 'applied' : 'not_applied',
            currentValue: res.stdout.trim()
          };
        }

        case 'input_hags': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers" -Name "HwSchMode" -ErrorAction SilentlyContinue
          `);
          const val = res.stdout.trim();
          return {
            status: val === '2' ? 'applied' : 'not_applied',
            currentValue: val
          };
        }

        case 'input_usb_selective_suspend': {
          const res = await this.runner.run(`
            powercfg /query SCHEME_CURRENT 2a737441-1930-4402-8d77-b2bebba4d5a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226
          `);
          const isOff = res.stdout.includes('0x00000000');
          return {
            status: isOff ? 'applied' : 'not_applied',
            currentValue: isOff ? '0' : '1'
          };
        }

        case 'input_monitor_gpu_check': {
          const res = await this.runner.run(`
            Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name
          `);
          return {
            status: 'info',
            infoValue: res.stdout.replace(/\r?\n/g, ', '),
            currentValue: res.stdout
          };
        }

        case 'input_mouse_polling_info': {
          return {
            status: 'info',
            infoValue: 'Taxa nominal recomendada: 1000 Hz / 0.1ms delay',
            currentValue: '1000Hz'
          };
        }

        case 'input_cursor_blink_rate': {
          const res = await this.runner.run(`Get-ItemPropertyValue -Path "HKCU:\\Control Panel\\Desktop" -Name "CursorBlinkRate" -ErrorAction SilentlyContinue`);
          const val = res.stdout.trim();
          return {
            status: val === '200' ? 'applied' : 'not_applied',
            currentValue: val
          };
        }

        case 'input_keyboard_delay': {
          const res = await this.runner.run(`Get-ItemPropertyValue -Path "HKCU:\\Control Panel\\Keyboard" -Name "KeyboardDelay" -ErrorAction SilentlyContinue`);
          const val = res.stdout.trim();
          return {
            status: val === '0' ? 'applied' : 'not_applied',
            currentValue: val
          };
        }

        case 'input_keyboard_speed': {
          const res = await this.runner.run(`Get-ItemPropertyValue -Path "HKCU:\\Control Panel\\Keyboard" -Name "KeyboardSpeed" -ErrorAction SilentlyContinue`);
          const val = res.stdout.trim();
          return {
            status: val === '31' ? 'applied' : 'not_applied',
            currentValue: val
          };
        }

        case 'input_fse_behavior': {
          const res = await this.runner.run(`Get-ItemPropertyValue -Path "HKCU:\\System\\GameConfigStore" -Name "Win32_Dx12_LowLatencyFlags" -ErrorAction SilentlyContinue`);
          return {
            status: res.stdout.trim() === '1' ? 'applied' : 'not_applied',
            currentValue: res.stdout.trim()
          };
        }

        case 'input_coalescing_timer_disable': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power" -Name "CoalescingTimerInterval" -ErrorAction SilentlyContinue
          `);
          const val = res.stdout.trim();
          return {
            status: val === '0' ? 'applied' : 'not_applied',
            currentValue: val,
            infoValue: val === '0' ? 'Desativado (0ms agrupamento)' : 'Padrão do Windows'
          };
        }

        default: {
          return {
            status: 'not_applied',
            currentValue: null
          };
        }
      }
    } catch (e: any) {
      return {
        status: 'error',
        error: e.message
      };
    }
  }

  public async apply(id: string, isDryRun: boolean): Promise<ModuleApplyResult> {
    const commands: string[] = [];

    switch (id) {
      case 'input_power_plan': {
        commands.push(`
          $active = (powercfg /getactivescheme)
          if (-not ($active -match 'Elevado|High|Ultimate|Desempenho')) {
            $guid = ((powercfg /l) | Select-String '([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}).*?(Desempenho|Elevado)' | ForEach-Object { $_.Matches[0].Groups[1].Value } | Select-Object -First 1)
            if ($guid) {
              powercfg /setactive $guid
            } else {
              powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c
            }
          }
        `);
        break;
      }
      case 'input_game_mode': {
        commands.push('Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\GameBar" -Name "AutoGameModeEnabled" -Value 1 -Type DWord');
        break;
      }
      case 'input_mouse_accel': {
        commands.push('Set-ItemProperty -Path "HKCU:\\Control Panel\\Mouse" -Name "MouseSpeed" -Value "0"');
        commands.push('Set-ItemProperty -Path "HKCU:\\Control Panel\\Mouse" -Name "MouseThreshold1" -Value "0"');
        commands.push('Set-ItemProperty -Path "HKCU:\\Control Panel\\Mouse" -Name "MouseThreshold2" -Value "0"');
        break;
      }
      case 'input_pointer_speed': {
        commands.push('Set-ItemProperty -Path "HKCU:\\Control Panel\\Mouse" -Name "MouseSensitivity" -Value "10"');
        break;
      }
      case 'input_sticky_keys': {
        commands.push('Set-ItemProperty -Path "HKCU:\\Control Panel\\Accessibility\\StickyKeys" -Name "Flags" -Value "506"');
        break;
      }
      case 'input_filter_keys': {
        commands.push('Set-ItemProperty -Path "HKCU:\\Control Panel\\Accessibility\\Keyboard Response" -Name "Flags" -Value "122"');
        break;
      }
      case 'input_toggle_keys': {
        commands.push('Set-ItemProperty -Path "HKCU:\\Control Panel\\Accessibility\\ToggleKeys" -Name "Flags" -Value "58"');
        break;
      }
      case 'input_game_dvr': {
        commands.push('Set-ItemProperty -Path "HKCU:\\System\\GameConfigStore" -Name "GameDVR_Enabled" -Value 0 -Type DWord');
        commands.push('New-Item -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\GameDVR" -Force -ErrorAction SilentlyContinue');
        commands.push('Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\GameDVR" -Name "AllowGameDVR" -Value 0 -Type DWord');
        break;
      }
      case 'input_game_bar': {
        commands.push('Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR" -Name "AppCaptureEnabled" -Value 0 -Type DWord');
        break;
      }
      case 'input_vrr': {
        commands.push('New-Item -Path "HKCU:\\Control Panel\\GraphicsDrivers" -Force -ErrorAction SilentlyContinue');
        commands.push('Set-ItemProperty -Path "HKCU:\\Control Panel\\GraphicsDrivers" -Name "VariableRefreshRate" -Value 1 -Type DWord');
        break;
      }
      case 'input_windowed_optimizations': {
        commands.push('New-Item -Path "HKCU:\\Software\\Microsoft\\DirectX\\UserGpuPreferences" -Force -ErrorAction SilentlyContinue');
        commands.push('Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\DirectX\\UserGpuPreferences" -Name "DirectXUserGlobalSettings" -Value "SwapEffectUpgradeEnable=1;"');
        break;
      }
      case 'input_hags': {
        commands.push('Set-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers" -Name "HwSchMode" -Value 2 -Type DWord');
        break;
      }
      case 'input_usb_selective_suspend': {
        commands.push('powercfg /SETACVALUEINDEX SCHEME_CURRENT 2a737441-1930-4402-8d77-b2bebba4d5a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 0');
        commands.push('powercfg /SETACTIVE SCHEME_CURRENT');
        break;
      }
      case 'input_usb_hub_power':
      case 'input_hid_power_saving': {
        commands.push('powercfg /SETACVALUEINDEX SCHEME_CURRENT 2a737441-1930-4402-8d77-b2bebba4d5a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 0');
        commands.push('powercfg /SETACTIVE SCHEME_CURRENT');
        break;
      }
      case 'input_pcie_link_state': {
        commands.push('powercfg /SETACVALUEINDEX SCHEME_CURRENT 501a4d13-42af-4429-9e86-e8a0247994fa ee12f506-d07c-4780-9169-959828d11c79 0');
        commands.push('powercfg /SETACTIVE SCHEME_CURRENT');
        break;
      }
      case 'input_cpu_min_state': {
        commands.push('powercfg /SETACVALUEINDEX SCHEME_CURRENT 54533251-82be-4824-96c1-47b60b740d00 893dee8e-2bef-41e0-89c6-b55d0929964c 100');
        commands.push('powercfg /SETACTIVE SCHEME_CURRENT');
        break;
      }
      case 'input_disk_idle_timeout': {
        commands.push('powercfg /SETACVALUEINDEX SCHEME_CURRENT 0012ee47-9041-4b5d-9b77-535fba8b1442 6738e2c4-e8a5-4ac4-ac3e-00122e23297a 0');
        commands.push('powercfg /SETACTIVE SCHEME_CURRENT');
        break;
      }
      case 'input_prevent_sleep_gaming': {
        commands.push('powercfg /change monitor-timeout-ac 0');
        commands.push('powercfg /change standby-timeout-ac 0');
        break;
      }
      case 'input_focus_assist': {
        commands.push('New-Item -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\CloudStore\\Store\\Cache\\DefaultAccount\\$$windows.data.blings.focusassist" -Force -ErrorAction SilentlyContinue');
        break;
      }
      case 'input_gpu_preference': {
        commands.push('New-Item -Path "HKCU:\\Software\\Microsoft\\DirectX\\UserGpuPreferences" -Force -ErrorAction SilentlyContinue');
        break;
      }
      case 'input_system_responsiveness_gaming': {
        commands.push('Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile" -Name "SystemResponsiveness" -Value 10 -Type DWord');
        break;
      }
      case 'input_network_throttling_gaming': {
        commands.push('Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile" -Name "NetworkThrottlingIndex" -Value 0xFFFFFFFF -Type DWord');
        break;
      }
      case 'input_game_priority_boost': {
        commands.push('Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games" -Name "GPU Priority" -Value 8 -Type DWord');
        commands.push('Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games" -Name "Priority" -Value 6 -Type DWord');
        commands.push('Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games" -Name "Scheduling Category" -Value "High"');
        break;
      }
      case 'input_keyboard_repeat_rate': {
        commands.push('Set-ItemProperty -Path "HKCU:\\Control Panel\\Keyboard" -Name "KeyboardDelay" -Value "0"');
        commands.push('Set-ItemProperty -Path "HKCU:\\Control Panel\\Keyboard" -Name "KeyboardSpeed" -Value "31"');
        break;
      }
      case 'input_cursor_blink_rate': {
        commands.push('Set-ItemProperty -Path "HKCU:\\Control Panel\\Desktop" -Name "CursorBlinkRate" -Value "200"');
        break;
      }
      case 'input_keyboard_delay': {
        commands.push('Set-ItemProperty -Path "HKCU:\\Control Panel\\Keyboard" -Name "KeyboardDelay" -Value "0"');
        break;
      }
      case 'input_keyboard_speed': {
        commands.push('Set-ItemProperty -Path "HKCU:\\Control Panel\\Keyboard" -Name "KeyboardSpeed" -Value "31"');
        break;
      }
      case 'input_fse_behavior': {
        commands.push('New-Item -Path "HKCU:\\System\\GameConfigStore" -Force -ErrorAction SilentlyContinue');
        commands.push('Set-ItemProperty -Path "HKCU:\\System\\GameConfigStore" -Name "Win32_Dx12_LowLatencyFlags" -Value 1 -Type DWord');
        break;
      }
      case 'input_coalescing_timer_disable': {
        commands.push('New-Item -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power" -Force -ErrorAction SilentlyContinue');
        commands.push('Set-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power" -Name "CoalescingTimerInterval" -Value 0 -Type DWord');
        break;
      }
      default: {
        return {
          success: true,
          message: 'Item informativo ou não requer modificação do sistema.',
          commands
        };
      }
    }

    if (isDryRun) {
      return {
        success: true,
        message: '[Simulação] Nenhuma alteração efetuada.',
        commands
      };
    }

    for (const cmd of commands) {
      const res = await this.runner.run(cmd);
      if (!res.success) {
        return {
          success: false,
          message: res.stderr || 'Falha ao aplicar otimização de latência.',
          commands
        };
      }
    }

    return {
      success: true,
      message: 'Otimização aplicada com sucesso.',
      commands,
      rebootRequired: id === 'input_hags'
    };
  }

  public async revert(id: string, originalValue: any): Promise<ModuleRevertResult> {
    try {
      switch (id) {
        case 'input_power_plan': {
          await this.runner.run('powercfg /setactive 381b4222-f694-41f0-9685-ff5bb260df2e'); // Balanced
          break;
        }
        case 'input_game_mode': {
          await this.runner.run('Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\GameBar" -Name "AutoGameModeEnabled" -Value 0 -Type DWord');
          break;
        }
        case 'input_mouse_accel': {
          await this.runner.run(`
            Set-ItemProperty -Path "HKCU:\\Control Panel\\Mouse" -Name "MouseSpeed" -Value "1"
            Set-ItemProperty -Path "HKCU:\\Control Panel\\Mouse" -Name "MouseThreshold1" -Value "6"
            Set-ItemProperty -Path "HKCU:\\Control Panel\\Mouse" -Name "MouseThreshold2" -Value "10"
          `);
          break;
        }
        case 'input_pointer_speed': {
          const val = originalValue || '10';
          await this.runner.run(`Set-ItemProperty -Path "HKCU:\\Control Panel\\Mouse" -Name "MouseSensitivity" -Value "${val}"`);
          break;
        }
        case 'input_sticky_keys': {
          await this.runner.run('Set-ItemProperty -Path "HKCU:\\Control Panel\\Accessibility\\StickyKeys" -Name "Flags" -Value "510"');
          break;
        }
        case 'input_filter_keys': {
          await this.runner.run('Set-ItemProperty -Path "HKCU:\\Control Panel\\Accessibility\\Keyboard Response" -Name "Flags" -Value "126"');
          break;
        }
        case 'input_toggle_keys': {
          await this.runner.run('Set-ItemProperty -Path "HKCU:\\Control Panel\\Accessibility\\ToggleKeys" -Name "Flags" -Value "62"');
          break;
        }
        case 'input_game_dvr': {
          await this.runner.run(`
            Set-ItemProperty -Path "HKCU:\\System\\GameConfigStore" -Name "GameDVR_Enabled" -Value 1 -Type DWord
            Remove-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\GameDVR" -Name "AllowGameDVR" -ErrorAction SilentlyContinue
          `);
          break;
        }
        case 'input_hags': {
          await this.runner.run('Set-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers" -Name "HwSchMode" -Value 1 -Type DWord');
          break;
        }
        case 'input_usb_selective_suspend': {
          await this.runner.run('powercfg /SETACVALUEINDEX SCHEME_CURRENT 2a737441-1930-4402-8d77-b2bebba4d5a3 48e6b7a6-50f5-4782-a5d4-53bb8f07e226 1');
          await this.runner.run('powercfg /SETACTIVE SCHEME_CURRENT');
          break;
        }
        case 'input_pcie_link_state': {
          await this.runner.run('powercfg /SETACVALUEINDEX SCHEME_CURRENT 501a4d13-42af-4429-9e86-e8a0247994fa ee12f506-d07c-4780-9169-959828d11c79 1');
          await this.runner.run('powercfg /SETACTIVE SCHEME_CURRENT');
          break;
        }
        case 'input_cpu_min_state': {
          await this.runner.run('powercfg /SETACVALUEINDEX SCHEME_CURRENT 54533251-82be-4824-96c1-47b60b740d00 893dee8e-2bef-41e0-89c6-b55d0929964c 5');
          await this.runner.run('powercfg /SETACTIVE SCHEME_CURRENT');
          break;
        }
        case 'input_disk_idle_timeout': {
          await this.runner.run('powercfg /SETACVALUEINDEX SCHEME_CURRENT 0012ee47-9041-4b5d-9b77-535fba8b1442 6738e2c4-e8a5-4ac4-ac3e-00122e23297a 20');
          await this.runner.run('powercfg /SETACTIVE SCHEME_CURRENT');
          break;
        }
        case 'input_prevent_sleep_gaming': {
          await this.runner.run('powercfg /change monitor-timeout-ac 15');
          await this.runner.run('powercfg /change standby-timeout-ac 30');
          break;
        }
        case 'input_system_responsiveness_gaming': {
          await this.runner.run('Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile" -Name "SystemResponsiveness" -Value 20 -Type DWord');
          break;
        }
        case 'input_network_throttling_gaming': {
          await this.runner.run('Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile" -Name "NetworkThrottlingIndex" -Value 10 -Type DWord');
          break;
        }
        case 'input_game_priority_boost': {
          await this.runner.run('Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games" -Name "GPU Priority" -Value 8 -Type DWord');
          await this.runner.run('Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games" -Name "Priority" -Value 2 -Type DWord');
          await this.runner.run('Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games" -Name "Scheduling Category" -Value "Medium"');
          break;
        }
        case 'input_cursor_blink_rate': {
          await this.runner.run('Set-ItemProperty -Path "HKCU:\\Control Panel\\Desktop" -Name "CursorBlinkRate" -Value "530"');
          break;
        }
        case 'input_keyboard_delay': {
          await this.runner.run('Set-ItemProperty -Path "HKCU:\\Control Panel\\Keyboard" -Name "KeyboardDelay" -Value "1"');
          break;
        }
        case 'input_keyboard_speed': {
          await this.runner.run('Set-ItemProperty -Path "HKCU:\\Control Panel\\Keyboard" -Name "KeyboardSpeed" -Value "31"');
          break;
        }
        case 'input_fse_behavior': {
          await this.runner.run('Remove-ItemProperty -Path "HKCU:\\System\\GameConfigStore" -Name "Win32_Dx12_LowLatencyFlags" -ErrorAction SilentlyContinue');
          break;
        }
        case 'input_coalescing_timer_disable': {
          await this.runner.run('Remove-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Power" -Name "CoalescingTimerInterval" -ErrorAction SilentlyContinue');
          break;
        }
        default:
          break;
      }
      return { success: true, message: 'Revertido com sucesso para os valores padrão.' };
    } catch (e: any) {
      return { success: false, message: `Erro ao reverter: ${e.message}` };
    }
  }
}
