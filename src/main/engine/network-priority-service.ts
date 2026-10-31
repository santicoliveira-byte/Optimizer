import { exec } from 'child_process';
import { PowerShellRunner } from './powershell-runner';
import { NetworkPriorityMode, NetworkPriorityState, NetworkAdapterItem } from '../../shared/types';

export class NetworkPriorityService {
  private static instance: NetworkPriorityService;
  private runner: PowerShellRunner;
  private cachedAdapters: NetworkAdapterItem[] = [];
  private lastDiscoveryTime = 0;

  private constructor() {
    this.runner = PowerShellRunner.getInstance();
  }

  public static getInstance(): NetworkPriorityService {
    if (!NetworkPriorityService.instance) {
      NetworkPriorityService.instance = new NetworkPriorityService();
    }
    return NetworkPriorityService.instance;
  }

  /**
   * Fast query for IPv4 interface metrics via netsh (takes ~50ms)
   */
  private queryNetshMetrics(): Promise<Map<number, { metric: number; state: string; name: string }>> {
    return new Promise((resolve) => {
      exec('netsh interface ipv4 show interfaces', { windowsHide: true }, (err, stdout) => {
        if (err || !stdout) return resolve(new Map());
        const map = new Map<number, { metric: number; state: string; name: string }>();
        const lines = stdout.split(/\r?\n/);
        for (const line of lines) {
          const match = line.trim().match(/^(\d+)\s+(\d+)\s+(\d+)\s+(\S+)\s+(.+)$/);
          if (match) {
            map.set(parseInt(match[1], 10), {
              metric: parseInt(match[2], 10),
              state: match[4],
              name: match[5].trim()
            });
          }
        }
        resolve(map);
      });
    });
  }

  /**
   * Full discovery of physical network adapters via PowerShell.
   * Runs only once or after 60s cache expiration.
   */
  private async discoverPhysicalAdapters(): Promise<NetworkAdapterItem[]> {
    const queryScript = `
      $adapters = Get-NetAdapter -Physical -ErrorAction SilentlyContinue;
      $res = @();
      foreach ($a in $adapters) {
        $ip = Get-NetIPInterface -InterfaceIndex $a.InterfaceIndex -AddressFamily IPv4 -ErrorAction SilentlyContinue;
        if ($null -ne $ip) {
          $isWifi = ($a.InterfaceDescription -match 'Wi-Fi|Wireless|802\\.11' -or $a.Name -match 'Wi-Fi');
          $res += [PSCustomObject]@{
            name = $a.Name;
            description = $a.InterfaceDescription;
            interfaceIndex = $a.InterfaceIndex;
            type = if ($isWifi) { 'wifi' } else { 'ethernet' };
            status = $a.Status;
            linkSpeed = $a.LinkSpeed;
            metric = $ip.InterfaceMetric;
            isAutomaticMetric = ($ip.AutomaticMetric -eq 1 -or $ip.AutomaticMetric -eq 'Enabled');
          }
        }
      };
      $res | ConvertTo-Json -Depth 3 -Compress
    `;

    try {
      const execRes = await this.runner.run(queryScript, 8000, false);
      let rawList: any[] = [];

      if (execRes.success && execRes.stdout) {
        try {
          const parsed = JSON.parse(execRes.stdout);
          rawList = Array.isArray(parsed) ? parsed : [parsed];
        } catch {
          rawList = [];
        }
      }

      const adapters: NetworkAdapterItem[] = rawList.map((a: any) => ({
        name: String(a.name || ''),
        description: String(a.description || ''),
        interfaceIndex: Number(a.interfaceIndex || 0),
        type: a.type === 'wifi' ? 'wifi' : 'ethernet',
        status: String(a.status || 'Unknown'),
        linkSpeed: String(a.linkSpeed || ''),
        metric: Number(a.metric ?? 0),
        isAutomaticMetric: Boolean(a.isAutomaticMetric)
      }));

      this.cachedAdapters = adapters;
      this.lastDiscoveryTime = Date.now();
      return adapters;
    } catch {
      return this.cachedAdapters;
    }
  }

  public async getPriorityState(): Promise<NetworkPriorityState> {
    const now = Date.now();
    // Re-discover if cache is empty or older than 60 seconds
    let adapters = this.cachedAdapters;
    if (adapters.length === 0 || now - this.lastDiscoveryTime > 60000) {
      adapters = await this.discoverPhysicalAdapters();
    }

    // Always fetch live metrics in 50ms via netsh
    const netshMap = await this.queryNetshMetrics();
    if (netshMap.size > 0) {
      adapters = adapters.map((a) => {
        const live = netshMap.get(a.interfaceIndex);
        if (live) {
          return {
            ...a,
            metric: live.metric,
            status: live.state.toLowerCase() === 'connected' ? 'Up' : a.status
          };
        }
        return a;
      });
      this.cachedAdapters = adapters;
    }

    const upAdapters = adapters.filter((a) => a.status.toLowerCase() === 'up');
    const activeAdapters = upAdapters.length > 0 ? upAdapters : adapters;

    let lowestMetric = 99999;
    let primaryAdapter: NetworkAdapterItem | undefined;

    for (const a of activeAdapters) {
      if (a.metric < lowestMetric) {
        lowestMetric = a.metric;
        primaryAdapter = a;
      }
    }

    const eth = adapters.find((a) => a.type === 'ethernet');
    const wifi = adapters.find((a) => a.type === 'wifi');

    let mode: NetworkPriorityMode = 'auto';

    if (adapters.length > 0 && adapters.every((a) => a.isAutomaticMetric)) {
      mode = 'auto';
    } else if (eth && wifi) {
      if (eth.metric < wifi.metric && eth.metric <= 20) {
        mode = 'ethernet';
      } else if (wifi.metric < eth.metric && wifi.metric <= 20) {
        mode = 'wifi';
      } else {
        mode = 'custom';
      }
    } else if (primaryAdapter) {
      if (primaryAdapter.type === 'ethernet' && primaryAdapter.metric <= 20) {
        mode = 'ethernet';
      } else if (primaryAdapter.type === 'wifi' && primaryAdapter.metric <= 20) {
        mode = 'wifi';
      } else {
        mode = 'auto';
      }
    }

    return {
      mode,
      adapters,
      activeAdapterName: primaryAdapter ? `${primaryAdapter.name} (${primaryAdapter.description})` : undefined,
      primaryType: primaryAdapter?.type || 'none',
      primaryAdapterName: primaryAdapter?.name
    };
  }

  public async setPriority(mode: 'ethernet' | 'wifi' | 'auto'): Promise<{ success: boolean; message: string; state?: NetworkPriorityState }> {
    // Ensure we have adapters cached
    if (this.cachedAdapters.length === 0) {
      await this.discoverPhysicalAdapters();
    }

    const eth = this.cachedAdapters.find((a) => a.type === 'ethernet');
    const wifi = this.cachedAdapters.find((a) => a.type === 'wifi');

    let script = '';

    // Fast direct index modification without WMI queries
    if (mode === 'ethernet') {
      const ethCmd = eth ? `Set-NetIPInterface -InterfaceIndex ${eth.interfaceIndex} -InterfaceMetric 10 -AutomaticMetric Disabled -ErrorAction SilentlyContinue;` : '';
      const wifiCmd = wifi ? `Set-NetIPInterface -InterfaceIndex ${wifi.interfaceIndex} -InterfaceMetric 50 -AutomaticMetric Disabled -ErrorAction SilentlyContinue;` : '';
      script = `${ethCmd} ${wifiCmd}`;
    } else if (mode === 'wifi') {
      const wifiCmd = wifi ? `Set-NetIPInterface -InterfaceIndex ${wifi.interfaceIndex} -InterfaceMetric 10 -AutomaticMetric Disabled -ErrorAction SilentlyContinue;` : '';
      const ethCmd = eth ? `Set-NetIPInterface -InterfaceIndex ${eth.interfaceIndex} -InterfaceMetric 50 -AutomaticMetric Disabled -ErrorAction SilentlyContinue;` : '';
      script = `${wifiCmd} ${ethCmd}`;
    } else {
      // Auto
      const ethCmd = eth ? `Set-NetIPInterface -InterfaceIndex ${eth.interfaceIndex} -AutomaticMetric Enabled -ErrorAction SilentlyContinue;` : '';
      const wifiCmd = wifi ? `Set-NetIPInterface -InterfaceIndex ${wifi.interfaceIndex} -AutomaticMetric Enabled -ErrorAction SilentlyContinue;` : '';
      script = `${ethCmd} ${wifiCmd}`;
    }

    try {
      const res = await this.runner.run(script, 10000, true);
      if (!res.success && res.stderr) {
        return {
          success: false,
          message: `Falha ao alterar prioridade de rede: ${res.stderr}`
        };
      }

      // Fast update in ~50ms using netsh
      const newState = await this.getPriorityState();
      // Ensure the returned mode matches if metric updated
      if (mode === 'ethernet' || mode === 'wifi' || mode === 'auto') {
        newState.mode = mode;
      }

      const label = mode === 'ethernet' ? 'Ethernet (Cabo)' : mode === 'wifi' ? 'Wi-Fi (Sem Fios)' : 'Automático do Windows';
      return {
        success: true,
        message: `Prioridade de rede definida com sucesso para: ${label}`,
        state: newState
      };
    } catch (e: any) {
      return {
        success: false,
        message: e?.message || 'Erro inesperado ao definir prioridade de rede'
      };
    }
  }
}
