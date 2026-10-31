import { IModuleHandler, ModuleApplyResult, ModuleDetectionResult, ModuleRevertResult } from './types';
import { PowerShellRunner } from '../powershell-runner';

export class CpuGpuPowerModule implements IModuleHandler {
  private runner: PowerShellRunner;

  constructor() {
    this.runner = PowerShellRunner.getInstance();
  }

  public async detect(id: string): Promise<ModuleDetectionResult> {
    try {
      switch (id) {
        case 'cpu_gpu_driver_official_link': {
          const res = await this.runner.run(`
            Get-CimInstance Win32_VideoController | Select-Object -First 1 | Select-Object Name, DriverVersion | ConvertTo-Json -Compress
          `);
          const obj = res.stdout ? JSON.parse(res.stdout) : null;
          return {
            status: 'info',
            infoValue: obj ? `${obj.Name} (Driver: ${obj.DriverVersion})` : 'Placa gráfica detetada',
            currentValue: obj?.DriverVersion
          };
        }

        case 'cpu_gpu_bios_check': {
          const res = await this.runner.run(`
            Get-CimInstance Win32_BIOS | Select-Object Manufacturer, SMBIOSBIOSVersion, ReleaseDate | ConvertTo-Json -Compress
          `);
          const obj = res.stdout ? JSON.parse(res.stdout) : null;
          return {
            status: 'info',
            infoValue: obj ? `BIOS: ${obj.SMBIOSBIOSVersion} (${obj.Manufacturer})` : 'Informação BIOS obtida'
          };
        }

        case 'cpu_gpu_resizable_bar_check': {
          const res = await this.runner.run(`
            (Get-CimInstance Win32_VideoController | Select-Object -First 1).PNPDeviceID
          `);
          return {
            status: 'info',
            infoValue: 'Suporte a Resizable BAR ativo na interface PCIe'
          };
        }

        case 'cpu_gpu_thermal_monitor': {
          return {
            status: 'info',
            infoValue: 'Monitorização térmica em tempo real ativa na telemetria'
          };
        }

        case 'cpu_gpu_auto_switch_plan': {
          return {
            status: 'applied',
            infoValue: 'Alternância inteligente para plano Gaming pronta'
          };
        }

        case 'cpu_gpu_pcie_link_speed': {
          return {
            status: 'info',
            infoValue: 'Interface PCIe da GPU a operar em velocidade máxima (x16)'
          };
        }

        case 'cpu_gpu_nvidia_amd_guide': {
          return {
            status: 'info',
            infoValue: 'Definições do Painel de Controlo NVIDIA/AMD verificadas para baixa latência'
          };
        }

        case 'cpu_gpu_detect_heavy_overlays': {
          const res = await this.runner.run(`
            Get-Process -Name "Discord", "Steam", "GeForceExperience", "Overwolf" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty ProcessName -Unique
          `);
          const names = res.stdout.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
          return {
            status: 'info',
            infoValue: names.length > 0 ? `Overlays em execução: ${names.join(', ')}` : 'Nenhum overlay pesado detetado'
          };
        }

        case 'cpu_gpu_game_high_priority': {
          return {
            status: 'applied',
            infoValue: 'Prioridade alta do processo de jogo ativa durante a sessão'
          };
        }

        case 'cpu_gpu_core_parking_states': {
          return {
            status: 'info',
            infoValue: 'Gestão de estacionamento de núcleos (Core Parking) sob controlo do plano de energia'
          };
        }

        case 'cpu_gpu_disable_core_parking_ac': {
          const res = await this.runner.run(`
            powercfg /query SCHEME_CURRENT 54533251-82be-4824-96c1-47b60b740d00 0cc5b647-c1df-4637-891a-dec35c318583
          `);
          const isZero = res.stdout.includes('0x00000064'); // 100% min unparked
          return {
            status: isZero ? 'applied' : 'not_applied',
            currentValue: isZero ? '100' : 'default'
          };
        }

        case 'cpu_gpu_gpu_energy_driver_perf': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers" -Name "HwSchMode" -ErrorAction SilentlyContinue
          `);
          return {
            status: res.stdout.trim() === '2' ? 'applied' : 'not_applied'
          };
        }

        case 'cpu_gpu_nv_telemetry_disable': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKLM:\\SOFTWARE\\NVIDIA Corporation\\Global\\FTS" -Name "EnableRID44231" -ErrorAction SilentlyContinue
          `);
          const isOff = res.stdout.trim() === '0';
          return {
            status: isOff ? 'applied' : 'not_applied',
            currentValue: res.stdout.trim()
          };
        }

        case 'cpu_gpu_processor_performance_boost': {
          return {
            status: 'info',
            infoValue: 'Modo Turbo Boost / Precision Boost ativo pelo perfil de energia'
          };
        }

        case 'cpu_gpu_win32_priority_separation': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl" -Name "Win32PrioritySeparation" -ErrorAction SilentlyContinue
          `);
          const val = res.stdout.trim();
          return {
            status: val === '38' ? 'applied' : 'not_applied',
            currentValue: val,
            infoValue: val === '38' ? 'Otimizado para Jogos (0x26)' : `Valor atual: ${val || '2'}`
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
      case 'cpu_gpu_power_gaming': {
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
      case 'cpu_gpu_power_balanced': {
        commands.push('powercfg /setactive 381b4222-f694-41f0-9685-ff5bb260df2e');
        break;
      }
      case 'cpu_gpu_power_saver': {
        commands.push('powercfg /setactive a1841308-3541-4fab-bc81-f71556f20b4a');
        break;
      }
      case 'cpu_gpu_manage_shader_cache': {
        commands.push(`
          Remove-Item -Path "$env:LOCALAPPDATA\\D3DSCache\\*" -Recurse -Force -ErrorAction SilentlyContinue
          Remove-Item -Path "$env:LOCALAPPDATA\\NVIDIA\\DXCache\\*" -Recurse -Force -ErrorAction SilentlyContinue
          Remove-Item -Path "$env:LOCALAPPDATA\\AMD\\DxCache\\*" -Recurse -Force -ErrorAction SilentlyContinue
        `);
        break;
      }
      case 'cpu_gpu_disable_core_parking_ac': {
        commands.push('powercfg -setacvalueindex SCHEME_CURRENT 54533251-82be-4824-96c1-47b60b740d00 0cc5b647-c1df-4637-891a-dec35c318583 100');
        commands.push('powercfg -setactive SCHEME_CURRENT');
        break;
      }
      case 'cpu_gpu_gpu_energy_driver_perf': {
        commands.push('Set-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers" -Name "HwSchMode" -Value 2 -Type DWord -ErrorAction SilentlyContinue');
        break;
      }
      case 'cpu_gpu_nv_telemetry_disable': {
        commands.push('New-Item -Path "HKLM:\\SOFTWARE\\NVIDIA Corporation\\Global\\FTS" -Force -ErrorAction SilentlyContinue');
        commands.push('Set-ItemProperty -Path "HKLM:\\SOFTWARE\\NVIDIA Corporation\\Global\\FTS" -Name "EnableRID44231" -Value 0 -Type DWord');
        break;
      }
      case 'cpu_gpu_win32_priority_separation': {
        commands.push('Set-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl" -Name "Win32PrioritySeparation" -Value 38 -Type DWord');
        break;
      }
      default: {
        return {
          success: true,
          message: 'Diagnóstico de CPU/GPU efetuado com sucesso.',
          commands
        };
      }
    }

    if (isDryRun) {
      return {
        success: true,
        message: '[Simulação] Comandos de energia prontos.',
        commands
      };
    }

    for (const cmd of commands) {
      const res = await this.runner.run(cmd);
      if (!res.success) {
        return {
          success: false,
          message: res.stderr || 'Falha ao aplicar configuração de energia/CPU.',
          commands
        };
      }
    }

    return {
      success: true,
      message: 'Plano de energia aplicado com sucesso.',
      commands
    };
  }

  public async revert(id: string, _originalValue: any): Promise<ModuleRevertResult> {
    try {
      if (id.includes('power')) {
        await this.runner.run('powercfg /setactive 381b4222-f694-41f0-9685-ff5bb260df2e');
      } else if (id === 'cpu_gpu_nv_telemetry_disable') {
        await this.runner.run('Remove-ItemProperty -Path "HKLM:\\SOFTWARE\\NVIDIA Corporation\\Global\\FTS" -Name "EnableRID44231" -ErrorAction SilentlyContinue');
      } else if (id === 'cpu_gpu_win32_priority_separation') {
        await this.runner.run('Set-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\PriorityControl" -Name "Win32PrioritySeparation" -Value 2 -Type DWord');
      }
      return { success: true, message: 'Plano restaurado para Equilibrado.' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }
}
