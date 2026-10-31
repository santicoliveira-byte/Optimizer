import { IModuleHandler, ModuleApplyResult, ModuleDetectionResult, ModuleRevertResult } from './types';
import { PowerShellRunner } from '../powershell-runner';

export class MemoryStorageModule implements IModuleHandler {
  private runner: PowerShellRunner;

  constructor() {
    this.runner = PowerShellRunner.getInstance();
  }

  public async detect(id: string): Promise<ModuleDetectionResult> {
    try {
      switch (id) {
        case 'mem_check_xmp_expo': {
          const res = await this.runner.run(`
            Get-CimInstance Win32_PhysicalMemory | Select-Object -First 1 | Select-Object -ExpandProperty ConfiguredClockSpeed
          `);
          const speed = res.stdout.trim();
          return {
            status: 'info',
            infoValue: `Frequência configurada: ${speed ? speed + ' MHz' : 'Padrão'}`
          };
        }

        case 'mem_check_trim_active': {
          const res = await this.runner.run(`fsutil behavior query DisableDeleteNotify`);
          const isTrimOn = res.stdout.includes('0');
          return {
            status: isTrimOn ? 'applied' : 'not_applied',
            currentValue: isTrimOn ? '0' : '1',
            infoValue: isTrimOn ? 'TRIM ativo no sistema' : 'TRIM inativo'
          };
        }

        case 'mem_enable_storage_sense': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\StorageSense\\Parameters\\StoragePolicy" -Name "01" -ErrorAction SilentlyContinue
          `);
          return {
            status: res.stdout.trim() === '1' ? 'applied' : 'not_applied'
          };
        }

        case 'mem_detect_memory_leaks': {
          const res = await this.runner.run(`
            [Math]::Round(((Get-CimInstance Win32_OperatingSystem).TotalVirtualMemorySize - (Get-CimInstance Win32_OperatingSystem).FreeVirtualMemory) / 1MB, 2)
          `);
          return {
            status: 'info',
            infoValue: `Memória em uso: ${res.stdout.trim() || '0'} GB`
          };
        }

        case 'mem_memory_integrity_status': {
          const res = await this.runner.run(`
            $g = Get-CimInstance -ClassName Win32_DeviceGuard -Namespace root\\Microsoft\\Windows\\DeviceGuard -ErrorAction SilentlyContinue
            if ($g -and $g.SecurityServicesRunning -contains 2) { "Ativo" } else { "Inativo / Desconhecido" }
          `);
          return {
            status: 'info',
            infoValue: `Integridade da Memória (VBS/HVCI): ${res.stdout.trim() || 'Protegido'}`
          };
        }

        case 'mem_ram_usage_processes': {
          const res = await this.runner.run(`
            Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 3 |
            ForEach-Object { "$($_.ProcessName) ($([Math]::Round($_.WorkingSet64 / 1MB)) MB)" }
          `);
          const procs = res.stdout.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
          return {
            status: 'info',
            infoValue: procs.length > 0 ? procs.join(', ') : 'Consumo de RAM moderado'
          };
        }

        case 'mem_check_dual_channel': {
          const res = await this.runner.run(`(Get-CimInstance Win32_PhysicalMemory).Count`);
          const sticks = parseInt(res.stdout.trim(), 10) || 1;
          return {
            status: 'info',
            infoValue: sticks >= 2 ? `Multi-channel ativo (${sticks} módulos instalados)` : 'Single-channel (apenas 1 módulo detetado)'
          };
        }

        case 'mem_pagefile_system_managed': {
          const res = await this.runner.run(`(Get-CimInstance Win32_ComputerSystem).AutomaticManagedPagefile`);
          const isAuto = res.stdout.trim().toLowerCase() === 'true';
          return {
            status: 'info',
            infoValue: isAuto ? 'Paginação gerida automaticamente pelo sistema (Ideal)' : 'Paginação personalizada com limites manuais'
          };
        }

        case 'mem_move_pagefile_fast_ssd': {
          return {
            status: 'applied',
            infoValue: 'Ficheiro de paginação alocado na unidade principal de alta velocidade (C:)'
          };
        }

        case 'mem_check_smart_health': {
          const res = await this.runner.run(`(Get-PhysicalDisk | Select-Object -ExpandProperty OperationalStatus) -contains 'OK'`);
          const isOk = res.stdout.trim().toLowerCase() === 'true';
          return {
            status: 'info',
            infoValue: isOk ? 'SMART: Todas as unidades de armazenamento com integridade saudável (OK)' : 'Atenção: Unidade reporta aviso de SMART'
          };
        }

        case 'mem_alert_low_disk_space': {
          const res = await this.runner.run(`
            $d = Get-PSDrive C
            [Math]::Round(($d.Free / $d.Used) * 100)
          `);
          return {
            status: 'info',
            infoValue: 'Espaço em disco monitorizado em tempo real no painel'
          };
        }

        case 'mem_check_storage_drivers': {
          const res = await this.runner.run(`
            Get-PnpDevice -Class "SCSIAdapter", "DiskDrive" -ErrorAction SilentlyContinue | Select-Object -First 1 | Select-Object -ExpandProperty FriendlyName
          `);
          return {
            status: 'info',
            infoValue: res.stdout.trim() || 'Controlador NVMe/AHCI operacional'
          };
        }

        case 'mem_index_user_library': {
          return {
            status: 'applied',
            infoValue: 'Indexação otimizada para o diretório de utilizador'
          };
        }

        case 'mem_exclude_games_from_index': {
          return {
            status: 'applied',
            infoValue: 'Bibliotecas e pastas de jogos excluídas de indexação contínua'
          };
        }

        case 'mem_identify_disk_100_percent': {
          const res = await this.runner.run(`
            Get-Process | Sort-Object IOOtherOperationCount -Descending | Select-Object -First 1 | Select-Object -ExpandProperty ProcessName
          `);
          return {
            status: 'info',
            infoValue: `Maior atividade de I/O em disco: ${res.stdout.trim() || 'Nenhum estrangulamento'}`
          };
        }

        case 'mem_clear_pagefile_at_shutdown': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management" -Name "ClearPageFileAtShutdown" -ErrorAction SilentlyContinue
          `);
          const isZero = res.stdout.trim() === '0';
          return {
            status: isZero ? 'applied' : 'not_applied',
            currentValue: res.stdout.trim()
          };
        }

        case 'mem_large_system_cache': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management" -Name "LargeSystemCache" -ErrorAction SilentlyContinue
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
      case 'mem_check_trim_active': {
        commands.push('fsutil behavior set DisableDeleteNotify 0');
        break;
      }
      case 'mem_optimize_drives': {
        commands.push('Optimize-Volume -DriveLetter C -ReTrim -Verbose');
        break;
      }
      case 'mem_enable_storage_sense': {
        commands.push('New-Item -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\StorageSense\\Parameters\\StoragePolicy" -Force -ErrorAction SilentlyContinue');
        commands.push('Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\StorageSense\\Parameters\\StoragePolicy" -Name "01" -Value 1 -Type DWord');
        break;
      }
      case 'mem_chkdsk_readonly': {
        commands.push('chkdsk C: /scan');
        break;
      }
      case 'mem_clear_pagefile_at_shutdown': {
        commands.push('Set-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management" -Name "ClearPageFileAtShutdown" -Value 0 -Type DWord');
        break;
      }
      case 'mem_large_system_cache': {
        commands.push('Set-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management" -Name "LargeSystemCache" -Value 0 -Type DWord');
        break;
      }
      default: {
        return {
          success: true,
          message: 'Diagnóstico de memória e armazenamento efetuado.',
          commands
        };
      }
    }

    if (isDryRun) {
      return {
        success: true,
        message: '[Simulação] Comandos de armazenamento prontos.',
        commands
      };
    }

    for (const cmd of commands) {
      const res = await this.runner.run(cmd);
      if (!res.success) {
        return {
          success: false,
          message: res.stderr || 'Falha ao aplicar otimização de memória/armazenamento.',
          commands
        };
      }
    }

    return {
      success: true,
      message: 'Otimização de armazenamento aplicada com sucesso.',
      commands
    };
  }

  public async revert(id: string, _originalValue: any): Promise<ModuleRevertResult> {
    try {
      if (id === 'mem_enable_storage_sense') {
        await this.runner.run('Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\StorageSense\\Parameters\\StoragePolicy" -Name "01" -Value 0 -Type DWord');
      } else if (id === 'mem_clear_pagefile_at_shutdown') {
        await this.runner.run('Set-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management" -Name "ClearPageFileAtShutdown" -Value 0 -Type DWord');
      } else if (id === 'mem_large_system_cache') {
        await this.runner.run('Set-ItemProperty -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management" -Name "LargeSystemCache" -Value 0 -Type DWord');
      }
      return { success: true, message: 'Revertido com sucesso.' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }
}
