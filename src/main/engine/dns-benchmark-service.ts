import net from 'net';
import { exec } from 'child_process';
import { DnsServerItem } from '../../shared/types';
import { PowerShellRunner } from './powershell-runner';

export class DnsBenchmarkService {
  private static instance: DnsBenchmarkService;
  private runner: PowerShellRunner;

  private defaultServers: DnsServerItem[] = [
    {
      id: 'cloudflare',
      name: 'Cloudflare Ultra-Fast',
      provider: 'Cloudflare (1.1.1.1)',
      primaryIp: '1.1.1.1',
      secondaryIp: '1.0.0.1',
      status: 'pending'
    },
    {
      id: 'google',
      name: 'Google Public DNS',
      provider: 'Google (8.8.8.8)',
      primaryIp: '8.8.8.8',
      secondaryIp: '8.8.4.4',
      status: 'pending'
    },
    {
      id: 'quad9',
      name: 'Quad9 Security & Gaming',
      provider: 'Quad9 (9.9.9.9)',
      primaryIp: '9.9.9.9',
      secondaryIp: '149.112.112.112',
      status: 'pending'
    },
    {
      id: 'opendns',
      name: 'OpenDNS Cisco',
      provider: 'Cisco OpenDNS (208.67.222.222)',
      primaryIp: '208.67.222.222',
      secondaryIp: '208.67.220.220',
      status: 'pending'
    },
    {
      id: 'adguard',
      name: 'AdGuard Ad-Blocking DNS',
      provider: 'AdGuard Default (94.140.14.14)',
      primaryIp: '94.140.14.14',
      secondaryIp: '94.140.15.15',
      status: 'pending'
    }
  ];

  private constructor() {
    this.runner = PowerShellRunner.getInstance();
  }

  public static getInstance(): DnsBenchmarkService {
    if (!DnsBenchmarkService.instance) {
      DnsBenchmarkService.instance = new DnsBenchmarkService();
    }
    return DnsBenchmarkService.instance;
  }

  /**
   * Measure TCP connection latency to DNS port 53 (ultra-fast & accurate in ms)
   */
  private measureDnsPing(ip: string): Promise<number> {
    return new Promise((resolve) => {
      const start = process.hrtime();
      const socket = new net.Socket();
      let resolved = false;

      socket.setTimeout(1200);

      socket.connect(53, ip, () => {
        if (!resolved) {
          resolved = true;
          const diff = process.hrtime(start);
          const ms = Math.round(diff[0] * 1000 + diff[1] / 1e6);
          socket.destroy();
          resolve(Math.max(1, ms));
        }
      });

      socket.on('error', () => {
        if (!resolved) {
          resolved = true;
          socket.destroy();
          resolve(999);
        }
      });

      socket.on('timeout', () => {
        if (!resolved) {
          resolved = true;
          socket.destroy();
          resolve(999);
        }
      });
    });
  }

  public async benchmarkAll(): Promise<DnsServerItem[]> {
    const results: DnsServerItem[] = [];

    for (const server of this.defaultServers) {
      // 3 samples for stability
      const p1 = await this.measureDnsPing(server.primaryIp);
      const p2 = await this.measureDnsPing(server.primaryIp);
      const p3 = await this.measureDnsPing(server.primaryIp);

      const valid = [p1, p2, p3].filter((p) => p < 999);
      const avg = valid.length > 0 ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : 999;

      results.push({
        ...server,
        pingMs: avg,
        status: avg < 900 ? 'success' : 'failed'
      });
    }

    results.sort((a, b) => (a.pingMs ?? 999) - (b.pingMs ?? 999));
    return results;
  }

  public async applyDns(primaryIp: string, secondaryIp: string): Promise<{ success: boolean; message: string }> {
    // Security validation: ensure strings are strictly valid IPv4 or IPv6 addresses
    if (!net.isIP(primaryIp) || (secondaryIp && !net.isIP(secondaryIp))) {
      return { success: false, message: 'Segurança: Endereço IP de DNS inválido ou potencialmente inseguro.' };
    }

    try {
      // Apply on all active physical network adapters via netsh/PowerShell
      const script = `
        $adapters = Get-NetAdapter -Physical | Where-Object { $_.Status -eq 'Up' };
        foreach ($a in $adapters) {
          Set-DnsClientServerAddress -InterfaceIndex $a.InterfaceIndex -ServerAddresses ('${primaryIp}', '${secondaryIp}') -ErrorAction SilentlyContinue
        }
        ipconfig /flushdns
      `;

      const res = await this.runner.run(script, 10000, true);
      return {
        success: res.success,
        message: res.success ? `DNS configurado com sucesso para ${primaryIp} e ${secondaryIp}!` : res.stderr
      };
    } catch (e: any) {
      return {
        success: false,
        message: e?.message || 'Falha ao configurar DNS'
      };
    }
  }

  public async resetDnsToDhcp(): Promise<{ success: boolean; message: string }> {
    try {
      const script = `
        $adapters = Get-NetAdapter -Physical | Where-Object { $_.Status -eq 'Up' };
        foreach ($a in $adapters) {
          Set-DnsClientServerAddress -InterfaceIndex $a.InterfaceIndex -ResetServerAddresses -ErrorAction SilentlyContinue
        }
        ipconfig /flushdns
      `;
      const res = await this.runner.run(script, 10000, true);
      return {
        success: res.success,
        message: res.success ? 'DNS restaurado para automático (DHCP).' : res.stderr
      };
    } catch (e: any) {
      return {
        success: false,
        message: e?.message || 'Falha ao restaurar DNS'
      };
    }
  }
}
