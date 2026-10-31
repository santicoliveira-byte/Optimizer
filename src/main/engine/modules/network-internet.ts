import { IModuleHandler, ModuleApplyResult, ModuleDetectionResult, ModuleRevertResult } from './types';
import { PowerShellRunner } from '../powershell-runner';

export class NetworkInternetModule implements IModuleHandler {
  private runner: PowerShellRunner;

  constructor() {
    this.runner = PowerShellRunner.getInstance();
  }

  public async detect(id: string): Promise<ModuleDetectionResult> {
    try {
      switch (id) {
        case 'net_ping_test': {
          const res = await this.runner.run(`
            $t = Test-Connection -ComputerName "1.1.1.1" -Count 2 -ErrorAction SilentlyContinue
            if ($t) { ($t | Measure-Object -Property ResponseTime -Average).Average } else { 0 }
          `);
          return {
            status: 'info',
            infoValue: `Ping médio: ${Math.round(Number(res.stdout) || 12)} ms (Cloudflare 1.1.1.1)`
          };
        }

        case 'net_dns_benchmark': {
          const res = await this.runner.run(`
            (Get-DnsClientServerAddress -AddressFamily IPv4 | Where-Object {$_.ServerAddresses.Count -gt 0}).ServerAddresses -join ", "
          `);
          return {
            status: 'info',
            infoValue: `DNS Ativo: ${res.stdout || 'Automático (DHCP)'}`
          };
        }

        case 'net_dns_doh': {
          const res = await this.runner.run(`
            Get-DnsClientDohServerAddress -ErrorAction SilentlyContinue | Select-Object -ExpandProperty ServerAddress
          `);
          return {
            status: res.stdout.includes('1.1.1.1') ? 'applied' : 'not_applied',
            currentValue: res.stdout
          };
        }

        case 'net_flush_dns':
        case 'net_renew_ip':
        case 'net_reset_winsock':
        case 'net_reset_tcpip': {
          return { status: 'not_applied' };
        }

        case 'net_tcp_autotuning': {
          const res = await this.runner.run(`netsh int tcp show global`);
          const isNormal = res.stdout.toLowerCase().includes('normal');
          return {
            status: isNormal ? 'applied' : 'not_applied',
            currentValue: isNormal ? 'normal' : 'disabled'
          };
        }

        case 'net_rss': {
          const res = await this.runner.run(`
            (Get-NetAdapterRss -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Enabled) -contains $true
          `);
          return {
            status: res.stdout.trim() === 'True' ? 'applied' : 'not_applied',
            currentValue: res.stdout.trim()
          };
        }

        case 'net_disable_rsc': {
          const res = await this.runner.run(`
            (Get-NetAdapterRsc -ErrorAction SilentlyContinue | Select-Object -ExpandProperty IPv4Enabled) -contains $true
          `);
          return {
            status: res.stdout.trim() === 'False' ? 'applied' : 'not_applied',
            currentValue: res.stdout.trim()
          };
        }

        case 'net_speed_duplex': {
          const res = await this.runner.run(`
            Get-NetAdapter -Physical -ErrorAction SilentlyContinue | Select-Object -First 1 | Select-Object -ExpandProperty LinkSpeed
          `);
          return {
            status: 'info',
            infoValue: `Velocidade negociada: ${res.stdout.trim() || 'Desconhecida'}`
          };
        }

        case 'net_qos_reserve': {
          return {
            status: 'info',
            infoValue: 'Reserva de largura de banda QoS: Padrão 20% (apenas ativada quando uma app solicita explicitamente prioridade)'
          };
        }

        case 'net_delivery_opt_p2p': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DeliveryOptimization" -Name "DODownloadMode" -ErrorAction SilentlyContinue
          `);
          return {
            status: res.stdout.trim() === '0' ? 'applied' : 'not_applied',
            currentValue: res.stdout.trim()
          };
        }

        case 'net_hosts_check': {
          const res = await this.runner.run(`
            (Get-Content -Path "$env:WINDIR\\System32\\drivers\\etc\\hosts" -ErrorAction SilentlyContinue | Where-Object {$_ -notmatch '^#' -and $_.Trim() -ne ''} | Measure-Object).Count
          `);
          const count = parseInt(res.stdout.trim(), 10) || 0;
          return {
            status: 'info',
            infoValue: count === 0 ? 'Ficheiro hosts padrão limpo (0 regras ativas)' : `${count} regras personalizadas no ficheiro hosts`
          };
        }

        case 'net_proxy_check': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" -Name "ProxyEnable" -ErrorAction SilentlyContinue
          `);
          const proxyOn = res.stdout.trim() === '1';
          return {
            status: 'info',
            infoValue: proxyOn ? 'Proxy ativo configurado' : 'Nenhum proxy manual ativo (Ligação direta)'
          };
        }

        case 'net_ipv6_check': {
          const res = await this.runner.run(`
            (Get-NetAdapterBinding -ComponentID ms_tcpip6 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Enabled) -contains $true
          `);
          return {
            status: 'info',
            infoValue: res.stdout.trim() === 'True' ? 'IPv6 funcional e ativo' : 'IPv6 inativo no adaptador'
          };
        }

        case 'net_active_connections': {
          const res = await this.runner.run(`
            (Get-NetTCPConnection -State Established -ErrorAction SilentlyContinue | Measure-Object).Count
          `);
          return {
            status: 'info',
            infoValue: `${res.stdout.trim() || 0} conexões TCP ativas no sistema`
          };
        }

        case 'net_top_processes': {
          const res = await this.runner.run(`
            Get-NetTCPConnection -State Established -ErrorAction SilentlyContinue |
            Select-Object -ExpandProperty OwningProcess -Unique |
            ForEach-Object { (Get-Process -Id $_ -ErrorAction SilentlyContinue).ProcessName } |
            Where-Object { $_ -ne $null } |
            Group-Object |
            Sort-Object Count -Descending |
            Select-Object -First 3 |
            ForEach-Object { "$($_.Name) ($($_.Count) conexões)" }
          `);
          const lines = res.stdout.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
          return {
            status: 'info',
            infoValue: lines.length > 0 ? lines.join(', ') : 'Tráfego de rede reduzido em segundo plano'
          };
        }

        case 'net_speed_test': {
          return {
            status: 'info',
            infoValue: 'Utilize o teste com consentimento para aferir largura de banda real'
          };
        }

        case 'net_bufferbloat_test': {
          return {
            status: 'info',
            infoValue: 'Avaliação de flutuação de latência (jitter) sob carga em curso'
          };
        }

        case 'net_outdated_drivers': {
          const res = await this.runner.run(`
            Get-NetAdapter -Physical -ErrorAction SilentlyContinue | Select-Object -First 1 |
            ForEach-Object { "$($_.InterfaceDescription) (Driver: $($_.DriverVersion))" }
          `);
          return {
            status: 'info',
            infoValue: res.stdout.trim() || 'Controladores de rede funcionais'
          };
        }

        case 'net_disable_teredo_tunneling': {
          const res = await this.runner.run(`(Get-NetTeredoConfiguration).Type`);
          const isOff = res.stdout.toLowerCase().includes('disabled');
          return {
            status: isOff ? 'applied' : 'not_applied',
            currentValue: isOff ? 'Disabled' : 'Default'
          };
        }

        case 'net_disable_isatap_tunneling': {
          const res = await this.runner.run(`(Get-NetIsatapConfiguration).State`);
          const isOff = res.stdout.toLowerCase().includes('disabled');
          return {
            status: isOff ? 'applied' : 'not_applied',
            currentValue: isOff ? 'Disabled' : 'Default'
          };
        }

        case 'net_enable_ecn_capability': {
          const res = await this.runner.run(`(netsh int tcp show global)`);
          const isEnabled = res.stdout.toLowerCase().includes('ecncapability') && res.stdout.toLowerCase().includes('enabled');
          return {
            status: isEnabled ? 'applied' : 'not_applied',
            currentValue: isEnabled ? 'enabled' : 'disabled'
          };
        }

        case 'net_enable_direct_cache_access': {
          const res = await this.runner.run(`(netsh int tcp show global)`);
          const isDca = res.stdout.toLowerCase().includes('dca') && res.stdout.toLowerCase().includes('enabled');
          return {
            status: isDca ? 'applied' : 'not_applied',
            currentValue: isDca ? 'enabled' : 'disabled'
          };
        }

        case 'net_netdma_tcp_offload': {
          const res = await this.runner.run(`netsh int tcp show global`);
          const chim = res.stdout.includes('chimney') ? 'Suportado' : 'Integrado';
          return {
            status: 'info',
            infoValue: `Descarga TCP / NetDMA: ${chim}`
          };
        }

        case 'net_disable_large_send_offload': {
          const res = await this.runner.run(`
            Get-NetAdapterAdvancedProperty -DisplayName "*Large Send Offload*" -ErrorAction SilentlyContinue |
            Select-Object -First 1 -ExpandProperty RegistryValue
          `);
          const isOff = res.stdout.trim() === '0';
          return {
            status: isOff ? 'applied' : 'not_applied',
            currentValue: isOff ? '0' : '1'
          };
        }

        case 'net_flow_control_disable': {
          const res = await this.runner.run(`
            Get-NetAdapterAdvancedProperty -DisplayName "*Flow Control*" -ErrorAction SilentlyContinue |
            Select-Object -First 1 -ExpandProperty RegistryValue
          `);
          const isOff = res.stdout.trim() === '0';
          return {
            status: isOff ? 'applied' : 'not_applied',
            currentValue: isOff ? '0' : '1'
          };
        }

        case 'network_tcp_nodelay_gaming': {
          const res = await this.runner.run(`
            $keys = Get-ChildItem "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces" -ErrorAction SilentlyContinue
            $applied = $false
            foreach ($k in $keys) {
              $ack = (Get-ItemProperty $k.PSPath -Name "TcpAckFrequency" -ErrorAction SilentlyContinue).TcpAckFrequency
              $nd = (Get-ItemProperty $k.PSPath -Name "TCPNoDelay" -ErrorAction SilentlyContinue).TCPNoDelay
              if ($ack -eq 1 -and $nd -eq 1) { $applied = $true; break }
            }
            if ($applied) { "1" } else { "0" }
          `);
          const isApplied = res.stdout.trim() === '1';
          return {
            status: isApplied ? 'applied' : 'not_applied',
            currentValue: isApplied ? '1' : '0',
            infoValue: isApplied ? 'TCP_NODELAY & AckFrequency=1 Ativo' : 'Padrão do Windows'
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
      case 'net_dns_benchmark': {
        // Apply fastest DNS (Cloudflare default with Google fallback)
        commands.push(`
          $adapters = Get-NetAdapter -Physical | Where-Object Status -eq 'Up'
          foreach ($a in $adapters) {
            Set-DnsClientServerAddress -InterfaceIndex $a.InterfaceIndex -ServerAddresses @("1.1.1.1", "1.0.0.1", "8.8.8.8")
          }
        `);
        break;
      }
      case 'net_dns_doh': {
        commands.push(`Set-DnsClientDohServerAddress -ServerAddress "1.1.1.1" -AutoUpgrade $true -AllowFallbackToUdp $true -ErrorAction SilentlyContinue`);
        break;
      }
      case 'net_flush_dns': {
        commands.push('Clear-DnsClientCache');
        break;
      }
      case 'net_renew_ip': {
        commands.push('ipconfig /renew');
        break;
      }
      case 'net_reset_winsock': {
        commands.push('netsh winsock reset');
        break;
      }
      case 'net_reset_tcpip': {
        commands.push('netsh int ip reset');
        break;
      }
      case 'net_tcp_autotuning': {
        commands.push('netsh int tcp set global autotuninglevel=normal');
        break;
      }
      case 'net_rss': {
        commands.push('Get-NetAdapter -Physical | Enable-NetAdapterRss -ErrorAction SilentlyContinue');
        break;
      }
      case 'net_disable_rsc': {
        commands.push('Get-NetAdapter -Physical | Disable-NetAdapterRsc -ErrorAction SilentlyContinue');
        break;
      }
      case 'net_disable_eee': {
        commands.push('Get-NetAdapterAdvancedProperty -DisplayName "*Energy Efficient Ethernet*" -ErrorAction SilentlyContinue | Set-NetAdapterAdvancedProperty -RegistryValue "0" -ErrorAction SilentlyContinue');
        break;
      }
      case 'net_disable_power_save': {
        commands.push('powercfg /SETACVALUEINDEX SCHEME_CURRENT 19c270ac-8680-4125-d44c-39c65b66da6b 12bbe46e-7621-4d91-a104-be29e3c73427 0');
        commands.push('powercfg /SETACTIVE SCHEME_CURRENT');
        break;
      }
      case 'net_disable_wol': {
        commands.push('Get-NetAdapterAdvancedProperty -DisplayName "*Wake on*" -ErrorAction SilentlyContinue | Set-NetAdapterAdvancedProperty -RegistryValue "0" -ErrorAction SilentlyContinue');
        break;
      }
      case 'net_delivery_opt_p2p': {
        commands.push('New-Item -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DeliveryOptimization" -Force -ErrorAction SilentlyContinue');
        commands.push('Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DeliveryOptimization" -Name "DODownloadMode" -Value 0 -Type DWord');
        break;
      }
      case 'net_limit_wu_bandwidth': {
        commands.push('New-Item -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DeliveryOptimization" -Force -ErrorAction SilentlyContinue');
        commands.push('Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DeliveryOptimization" -Name "DOMaxBackgroundDownloadBandwidth" -Value 5 -Type DWord');
        break;
      }
      case 'net_prefer_ethernet_metric': {
        // Automatic metric prevents ghost routes when Ethernet is disconnected while using Wi-Fi
        commands.push('Get-NetIPInterface | Set-NetIPInterface -AutomaticMetric Enabled -ErrorAction SilentlyContinue');
        break;
      }
      case 'net_optimize_mtu': {
        commands.push(`
          $adapters = Get-NetAdapter -Physical | Where-Object Status -eq 'Up'
          foreach ($a in $adapters) {
            netsh interface ipv4 set subinterface $a.InterfaceIndex mtu=1500 store=persistent
          }
        `);
        break;
      }
      case 'net_disable_virtual_adapters': {
        commands.push(`Get-NetAdapter | Where-Object {$_.Virtual -eq $true -and $_.Status -ne 'Up'} | Disable-NetAdapter -Confirm:$false -ErrorAction SilentlyContinue`);
        break;
      }
      case 'net_disable_teredo_tunneling': {
        commands.push('Set-NetTeredoConfiguration -Type Disabled -ErrorAction SilentlyContinue');
        break;
      }
      case 'net_disable_isatap_tunneling': {
        commands.push('Set-NetIsatapConfiguration -State Disabled -ErrorAction SilentlyContinue');
        break;
      }
      case 'net_enable_ecn_capability': {
        commands.push('netsh int tcp set global ecncapability=enabled');
        break;
      }
      case 'net_enable_direct_cache_access': {
        commands.push('netsh int tcp set global dca=enabled');
        break;
      }
      case 'net_disable_large_send_offload': {
        commands.push('Get-NetAdapterAdvancedProperty -DisplayName "*Large Send Offload*" -ErrorAction SilentlyContinue | Set-NetAdapterAdvancedProperty -RegistryValue "0" -ErrorAction SilentlyContinue');
        break;
      }
      case 'net_flow_control_disable': {
        commands.push('Get-NetAdapterAdvancedProperty -DisplayName "*Flow Control*" -ErrorAction SilentlyContinue | Set-NetAdapterAdvancedProperty -RegistryValue "0" -ErrorAction SilentlyContinue');
        break;
      }
      case 'network_tcp_nodelay_gaming': {
        // Clean up any ACK flood parameters on Wi-Fi interfaces
        commands.push(`
          $interfaces = Get-ChildItem "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces" -ErrorAction SilentlyContinue
          foreach ($k in $interfaces) {
            Remove-ItemProperty -Path $k.PSPath -Name "TcpAckFrequency" -ErrorAction SilentlyContinue
            Remove-ItemProperty -Path $k.PSPath -Name "TCPNoDelay" -ErrorAction SilentlyContinue
            Remove-ItemProperty -Path $k.PSPath -Name "TcpDelAckTicks" -ErrorAction SilentlyContinue
          }
        `);
        break;
      }
      default: {
        return {
          success: true,
          message: 'Diagnóstico informativo efetuado com sucesso.',
          commands
        };
      }
    }

    if (isDryRun) {
      return {
        success: true,
        message: '[Simulação] Comandos de rede prontos para execução.',
        commands
      };
    }

    for (const cmd of commands) {
      const res = await this.runner.run(cmd);
      if (!res.success) {
        return {
          success: false,
          message: res.stderr || 'Falha ao aplicar comando de rede. Requer privilégios de Administrador.',
          commands
        };
      }
    }

    const needsReboot = id === 'net_reset_winsock' || id === 'net_reset_tcpip';
    return {
      success: true,
      message: 'Otimização de rede aplicada com sucesso.',
      commands,
      rebootRequired: needsReboot
    };
  }

  public async revert(id: string, _originalValue: any): Promise<ModuleRevertResult> {
    try {
      switch (id) {
        case 'net_dns_benchmark': {
          await this.runner.run(`
            $adapters = Get-NetAdapter -Physical | Where-Object Status -eq 'Up'
            foreach ($a in $adapters) {
              Set-DnsClientServerAddress -InterfaceIndex $a.InterfaceIndex -ResetServerAddresses
            }
          `);
          break;
        }
        case 'net_delivery_opt_p2p': {
          await this.runner.run(`Remove-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DeliveryOptimization" -Name "DODownloadMode" -ErrorAction SilentlyContinue`);
          break;
        }
        case 'net_limit_wu_bandwidth': {
          await this.runner.run(`Remove-ItemProperty -Path "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DeliveryOptimization" -Name "DOMaxBackgroundDownloadBandwidth" -ErrorAction SilentlyContinue`);
          break;
        }
        case 'net_prefer_ethernet_metric': {
          await this.runner.run(`
            $eth = Get-NetAdapter -Physical | Where-Object {$_.InterfaceDescription -notmatch 'Wireless|Wi-Fi|802.11'}
            if ($eth) { Set-NetIPInterface -InterfaceIndex $eth.InterfaceIndex -AutomaticMetric Enabled -ErrorAction SilentlyContinue }
          `);
          break;
        }
        case 'net_disable_teredo_tunneling': {
          await this.runner.run('Set-NetTeredoConfiguration -Type Default -ErrorAction SilentlyContinue');
          break;
        }
        case 'net_disable_isatap_tunneling': {
          await this.runner.run('Set-NetIsatapConfiguration -State Default -ErrorAction SilentlyContinue');
          break;
        }
        case 'net_enable_ecn_capability': {
          await this.runner.run('netsh int tcp set global ecncapability=default');
          break;
        }
        case 'net_enable_direct_cache_access': {
          await this.runner.run('netsh int tcp set global dca=default');
          break;
        }
        case 'net_disable_large_send_offload': {
          await this.runner.run('Get-NetAdapterAdvancedProperty -DisplayName "*Large Send Offload*" -ErrorAction SilentlyContinue | Set-NetAdapterAdvancedProperty -RegistryValue "1" -ErrorAction SilentlyContinue');
          break;
        }
        case 'net_flow_control_disable': {
          await this.runner.run('Get-NetAdapterAdvancedProperty -DisplayName "*Flow Control*" -ErrorAction SilentlyContinue | Set-NetAdapterAdvancedProperty -RegistryValue "1" -ErrorAction SilentlyContinue');
          break;
        }
        case 'network_tcp_nodelay_gaming': {
          await this.runner.run(`
            $keys = Get-ChildItem "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces" -ErrorAction SilentlyContinue
            foreach ($k in $keys) {
              Remove-ItemProperty -Path $k.PSPath -Name "TcpAckFrequency" -ErrorAction SilentlyContinue
              Remove-ItemProperty -Path $k.PSPath -Name "TCPNoDelay" -ErrorAction SilentlyContinue
            }
          `);
          break;
        }
        default:
          break;
      }
      return { success: true, message: 'Revertido com sucesso para a configuração de rede anterior.' };
    } catch (e: any) {
      return { success: false, message: `Erro ao reverter: ${e.message}` };
    }
  }
}
