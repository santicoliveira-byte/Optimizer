import { IModuleHandler, ModuleApplyResult, ModuleDetectionResult, ModuleRevertResult } from './types';
import { PowerShellRunner } from '../powershell-runner';

export class WifiModule implements IModuleHandler {
  private runner: PowerShellRunner;

  constructor() {
    this.runner = PowerShellRunner.getInstance();
  }

  public async detect(id: string): Promise<ModuleDetectionResult> {
    try {
      switch (id) {
        case 'wifi_status_info': {
          const res = await this.runner.run(`netsh wlan show interfaces`);
          const ssid = res.stdout.match(/SSID\s*:\s*(.+)/)?.[1]?.trim() || 'Desconectado';
          const signal = res.stdout.match(/Sinal\s*:\s*(\d+)%|Signal\s*:\s*(\d+)%/i);
          const sigVal = signal ? (signal[1] || signal[2]) : '0';
          const channel = res.stdout.match(/Canal\s*:\s*(\d+)|Channel\s*:\s*(\d+)/i);
          const chVal = channel ? (channel[1] || channel[2]) : 'N/A';
          return {
            status: 'info',
            infoValue: `Rede: ${ssid} | Canal: ${chVal} | Sinal: ${sigVal}%`
          };
        }

        case 'wifi_suggest_5ghz': {
          const res = await this.runner.run(`netsh wlan show interfaces`);
          const radio = res.stdout.match(/Tipo de r.dio\s*:\s*(.+)|Radio type\s*:\s*(.+)/i);
          const val = radio ? (radio[1] || radio[2]) : '';
          const is5G = val.includes('802.11ac') || val.includes('802.11ax') || val.includes('802.11be');
          return {
            status: 'info',
            infoValue: is5G ? 'Ligado a banda de alta velocidade (5 GHz / 6 GHz)' : 'Alerta: Ligação a operar em 2.4 GHz'
          };
        }

        case 'wifi_power_plan_max_perf': {
          const res = await this.runner.run(`
            powercfg /query SCHEME_CURRENT 19c270ac-8680-4125-d44c-39c65b66da6b 12bbe46e-7621-4d91-a104-be29e3c73427
          `);
          const isMax = res.stdout.includes('0x00000000');
          return {
            status: isMax ? 'applied' : 'not_applied',
            currentValue: isMax ? '0' : '1'
          };
        }

        case 'wifi_disable_open_hotspots': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKLM:\\SOFTWARE\\Microsoft\\WlanSvc\\AnqpCache" -Name "OsuProviders" -ErrorAction SilentlyContinue
          `);
          return {
            status: res.stdout.trim() === '0' ? 'applied' : 'not_applied'
          };
        }

        case 'wifi_neighbor_analyzer': {
          const res = await this.runner.run(`netsh wlan show networks mode=bssid`);
          const count = (res.stdout.match(/SSID/g) || []).length;
          return {
            status: 'info',
            infoValue: count > 0 ? `${count} redes sem fios detetadas nas proximidades (canais recomendados: 1, 6 ou 36/40/48)` : 'Sem redes adicionais a causar interferência'
          };
        }

        case 'wifi_forget_old_networks': {
          const res = await this.runner.run(`netsh wlan show profiles`);
          const count = (res.stdout.match(/Perfil de todos os usu.rios|All User Profile/g) || []).length;
          return {
            status: count > 2 ? 'not_applied' : 'applied',
            infoValue: `${count} perfis de redes Wi-Fi guardados no sistema`
          };
        }

        case 'wifi_channel_width_check': {
          return {
            status: 'info',
            infoValue: 'Largura recomendada: 80 MHz (Wi-Fi 5) / 160 MHz (Wi-Fi 6) para máxima velocidade'
          };
        }

        case 'wifi_speed_vs_throughput': {
          const res = await this.runner.run(`netsh wlan show interfaces`);
          const tx = res.stdout.match(/Taxa de transmiss.o \(Mbps\)\s*:\s*(\d+)|Transmit rate \(Mbps\)\s*:\s*(\d+)/i);
          const rate = tx ? (tx[1] || tx[2]) : 'N/A';
          return {
            status: 'info',
            infoValue: `Velocidade teórica de link: ${rate} Mbps`
          };
        }

        case 'wifi_router_tips': {
          return {
            status: 'info',
            infoValue: 'Posicione o router em local elevado, longe de paredes de betão, espelhos e micro-ondas'
          };
        }

        case 'wifi_arp_offload_disable': {
          const res = await this.runner.run(`
            Get-NetAdapterAdvancedProperty -DisplayName "*ARP Offload*" -ErrorAction SilentlyContinue |
            Select-Object -First 1 -ExpandProperty RegistryValue
          `);
          const isOff = res.stdout.trim() === '0';
          return {
            status: isOff ? 'applied' : 'not_applied',
            currentValue: isOff ? '0' : '1'
          };
        }

        case 'wifi_ns_offload_disable': {
          const res = await this.runner.run(`
            Get-NetAdapterAdvancedProperty -DisplayName "*NS Offload*" -ErrorAction SilentlyContinue |
            Select-Object -First 1 -ExpandProperty RegistryValue
          `);
          const isOff = res.stdout.trim() === '0';
          return {
            status: isOff ? 'applied' : 'not_applied',
            currentValue: isOff ? '0' : '1'
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
      case 'wifi_power_plan_max_perf': {
        commands.push('powercfg /SETACVALUEINDEX SCHEME_CURRENT 19c270ac-8680-4125-d44c-39c65b66da6b 12bbe46e-7621-4d91-a104-be29e3c73427 0');
        commands.push('powercfg /SETACTIVE SCHEME_CURRENT');
        break;
      }
      case 'wifi_disable_power_save': {
        commands.push('powercfg /SETACVALUEINDEX SCHEME_CURRENT 19c270ac-8680-4125-d44c-39c65b66da6b 12bbe46e-7621-4d91-a104-be29e3c73427 0');
        commands.push('powercfg /SETACTIVE SCHEME_CURRENT');
        break;
      }
      case 'wifi_roaming_aggressiveness': {
        commands.push(`Get-NetAdapterAdvancedProperty -DisplayName "*Roaming Aggressiveness*" -ErrorAction SilentlyContinue | Set-NetAdapterAdvancedProperty -RegistryValue "1" -ErrorAction SilentlyContinue`);
        break;
      }
      case 'wifi_preferred_band_5ghz': {
        commands.push(`Get-NetAdapterAdvancedProperty -DisplayName "*Preferred Band*" -ErrorAction SilentlyContinue | Set-NetAdapterAdvancedProperty -RegistryValue "3" -ErrorAction SilentlyContinue`);
        break;
      }
      case 'wifi_disable_open_hotspots': {
        commands.push('New-Item -Path "HKLM:\\SOFTWARE\\Microsoft\\WlanSvc\\AnqpCache" -Force -ErrorAction SilentlyContinue');
        commands.push('Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\WlanSvc\\AnqpCache" -Name "OsuProviders" -Value 0 -Type DWord');
        break;
      }
      case 'wifi_disable_background_scan': {
        commands.push(`
          $wifi = Get-NetAdapter -Physical | Where-Object {$_.InterfaceDescription -match 'Wireless|Wi-Fi|802.11'}
          if ($wifi) { netsh wlan set autoconfig enabled=yes interface=$wifi.Name }
        `);
        break;
      }
      case 'wifi_forget_old_networks': {
        commands.push(`
          (netsh wlan show profiles) | Select-String "Perfil de todos os usu.rios\\s*:\\s*(.+)|All User Profile\\s*:\\s*(.+)" | ForEach-Object {
            $name = if ($_.Matches.Groups[1].Value) { $_.Matches.Groups[1].Value } else { $_.Matches.Groups[2].Value }
            $name = $name.Trim()
            netsh wlan delete profile name="$name"
          }
        `);
        break;
      }
      case 'wifi_arp_offload_disable': {
        commands.push('Get-NetAdapterAdvancedProperty -DisplayName "*ARP Offload*" -ErrorAction SilentlyContinue | Set-NetAdapterAdvancedProperty -RegistryValue "0" -ErrorAction SilentlyContinue');
        break;
      }
      case 'wifi_ns_offload_disable': {
        commands.push('Get-NetAdapterAdvancedProperty -DisplayName "*NS Offload*" -ErrorAction SilentlyContinue | Set-NetAdapterAdvancedProperty -RegistryValue "0" -ErrorAction SilentlyContinue');
        break;
      }
      default: {
        return {
          success: true,
          message: 'Diagnóstico Wi-Fi concluído.',
          commands
        };
      }
    }

    if (isDryRun) {
      return {
        success: true,
        message: '[Simulação] Comandos de Wi-Fi calculados.',
        commands
      };
    }

    for (const cmd of commands) {
      const res = await this.runner.run(cmd);
      if (!res.success) {
        return {
          success: false,
          message: res.stderr || 'Falha ao aplicar configuração Wi-Fi.',
          commands
        };
      }
    }

    return {
      success: true,
      message: 'Otimização de Wi-Fi aplicada com sucesso.',
      commands
    };
  }

  public async revert(id: string, _originalValue: any): Promise<ModuleRevertResult> {
    try {
      switch (id) {
        case 'wifi_power_plan_max_perf': {
          await this.runner.run('powercfg /SETACVALUEINDEX SCHEME_CURRENT 19c270ac-8680-4125-d44c-39c65b66da6b 12bbe46e-7621-4d91-a104-be29e3c73427 1');
          await this.runner.run('powercfg /SETACTIVE SCHEME_CURRENT');
          break;
        }
        case 'wifi_disable_background_scan': {
          await this.runner.run(`
            $wifi = Get-NetAdapter -Physical | Where-Object {$_.InterfaceDescription -match 'Wireless|Wi-Fi|802.11'}
            if ($wifi) { netsh wlan set autoconfig enabled=yes interface=$wifi.Name }
          `);
          break;
        }
        case 'wifi_arp_offload_disable': {
          await this.runner.run('Get-NetAdapterAdvancedProperty -DisplayName "*ARP Offload*" -ErrorAction SilentlyContinue | Set-NetAdapterAdvancedProperty -RegistryValue "1" -ErrorAction SilentlyContinue');
          break;
        }
        case 'wifi_ns_offload_disable': {
          await this.runner.run('Get-NetAdapterAdvancedProperty -DisplayName "*NS Offload*" -ErrorAction SilentlyContinue | Set-NetAdapterAdvancedProperty -RegistryValue "1" -ErrorAction SilentlyContinue');
          break;
        }
        default:
          break;
      }
      return { success: true, message: 'Revertido com sucesso para a configuração Wi-Fi padrão.' };
    } catch (e: any) {
      return { success: false, message: `Erro ao reverter: ${e.message}` };
    }
  }
}
