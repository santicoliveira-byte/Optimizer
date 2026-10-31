import os from 'os';
import path from 'path';
import fs from 'fs';
import net from 'net';
import { execSync } from 'child_process';
import { PowerShellRunner } from './powershell-runner';
import { SystemMetrics } from '../../shared/types';

export class HardwareService {
  private static instance: HardwareService;
  private runner: PowerShellRunner;

  // Static cached properties
  private cachedStaticHardware: {
    isLaptop: boolean;
    hasBattery: boolean;
    hasDedicatedGpu: boolean;
    hasWifi: boolean;
    windowsVersion: string;
    windowsBuild: string;
    cpuModel?: string;
    ramSpeedMhz?: number;
    diskModel?: string;
    networkAdapterName?: string;
  } | null = null;

  // Live sensor cache
  private currentCpuUsage = 5;
  private prevCpuTimes = { idle: 0, total: 0 };
  private currentPingMs = 12;
  private currentGpuMetrics: { usage: number; temp: number; name: string; vramMb?: number } = {
    usage: 0,
    temp: 0,
    name: 'GPU'
  };

  private constructor() {
    this.runner = PowerShellRunner.getInstance();
    this.initCpu();
    this.initStaticHardware();
    this.startBackgroundSampling();
  }

  public static getInstance(): HardwareService {
    if (!HardwareService.instance) {
      HardwareService.instance = new HardwareService();
    }
    return HardwareService.instance;
  }

  private initCpu() {
    const cpus = os.cpus();
    let idle = 0;
    let total = 0;
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        total += (cpu.times as any)[type];
      }
      idle += cpu.times.idle;
    }
    this.prevCpuTimes = { idle, total };
  }

  private updateCpu() {
    const cpus = os.cpus();
    let idle = 0;
    let total = 0;
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        total += (cpu.times as any)[type];
      }
      idle += cpu.times.idle;
    }
    const diffIdle = idle - this.prevCpuTimes.idle;
    const diffTotal = total - this.prevCpuTimes.total;
    this.prevCpuTimes = { idle, total };

    if (diffTotal > 0) {
      const load = Math.round((1 - diffIdle / diffTotal) * 100);
      this.currentCpuUsage = Math.max(1, Math.min(100, load));
    }
  }

  private updateGpu() {
    try {
      const out = execSync(
        'nvidia-smi --query-gpu=utilization.gpu,temperature.gpu,name,memory.total --format=csv,noheader,nounits',
        { timeout: 800, windowsHide: true }
      )
        .toString()
        .trim();

      const parts = out.split(',').map((s) => s.trim());
      if (parts.length >= 2) {
        this.currentGpuMetrics = {
          usage: parseInt(parts[0], 10) || 0,
          temp: parseInt(parts[1], 10) || 0,
          name: parts[2] || 'NVIDIA GeForce',
          vramMb: parseInt(parts[3], 10) || undefined
        };
      }
    } catch {
      // Non-NVIDIA or command unavailable
    }
  }

  private async updatePing() {
    this.currentPingMs = await this.measurePing('1.1.1.1');
  }

  private startBackgroundSampling() {
    // Initial immediate sample
    this.updateCpu();
    this.updateGpu();
    this.updatePing();

    // Sample continuously every 4 seconds (instead of 1.5s) to avoid consuming CPU on budget laptops
    setInterval(() => {
      this.updateCpu();
      this.updateGpu();
    }, 4000);

    // Sample ping every 8 seconds to conserve network and CPU overhead
    setInterval(() => {
      this.updatePing();
    }, 8000);
  }

  private getCachePath(): string {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    const cacheDir = path.join(appData, 'Optimizer', 'cache');
    if (!fs.existsSync(cacheDir)) {
      try {
        fs.mkdirSync(cacheDir, { recursive: true });
      } catch {}
    }
    return path.join(cacheDir, 'hardware-cache.json');
  }

  public async initStaticHardware(force = false) {
    const cachePath = this.getCachePath();
    if (!force && fs.existsSync(cachePath)) {
      try {
        const raw = fs.readFileSync(cachePath, 'utf-8');
        this.cachedStaticHardware = JSON.parse(raw);
        return;
      } catch {}
    }

    try {
      const psScript = `
        $os = Get-CimInstance Win32_OperatingSystem
        $build = [int]$os.BuildNumber
        $winVer = if ($build -ge 22000) { "Windows 11" } else { "Windows 10" }

        $hasBattery = (Get-CimInstance Win32_Battery -ErrorAction SilentlyContinue | Measure-Object).Count -gt 0
        $chassis = (Get-CimInstance Win32_SystemEnclosure -ErrorAction SilentlyContinue).ChassisTypes
        $isLaptop = $hasBattery -or ($chassis -contains 9 -or $chassis -contains 10 -or $chassis -contains 14)

        $gpus = Get-CimInstance Win32_VideoController -ErrorAction SilentlyContinue
        $hasDedicated = $false
        foreach ($g in $gpus) {
          $name = $g.Name
          if ($name -match 'NVIDIA|GeForce|RTX|GTX|Radeon RX|Radeon Pro|Intel Arc') {
            $hasDedicated = $true
          }
        }

        $wifi = (Get-CimInstance Win32_NetworkAdapter -ErrorAction SilentlyContinue | Where-Object { $_.NetConnectionStatus -eq 2 -and ($_.Name -match 'Wireless|Wi-Fi|802.11|WLAN') } | Measure-Object).Count -gt 0

        $cpu = (Get-CimInstance Win32_Processor -ErrorAction SilentlyContinue | Select-Object -First 1).Name
        if ($cpu) {
          $cpu = ($cpu -replace '\\s+', ' ').Trim()
        }

        $ramMem = Get-CimInstance Win32_PhysicalMemory -ErrorAction SilentlyContinue | Select-Object -First 1
        $ramSpeed = 0
        if ($ramMem) {
          $ramSpeed = [int]($ramMem.ConfiguredClockSpeed)
          if ($ramSpeed -le 0) { $ramSpeed = [int]($ramMem.Speed) }
        }

        $fastDisk = (Get-PhysicalDisk -ErrorAction SilentlyContinue | Where-Object { $_.MediaType -eq 'SSD' -or $_.BusType -eq 'NVMe' } | Select-Object -First 1).FriendlyName
        $disk = if ($fastDisk) { $fastDisk } else { (Get-CimInstance Win32_DiskDrive -ErrorAction SilentlyContinue | Select-Object -First 1).Model }

        $netAdapter = (Get-CimInstance Win32_NetworkAdapter -ErrorAction SilentlyContinue | Where-Object { $_.NetConnectionStatus -eq 2 } | Select-Object -First 1).Name

        [PSCustomObject]@{
          isLaptop = $isLaptop
          hasBattery = $hasBattery
          hasDedicated = $hasDedicated
          hasWifi = $wifi
          winVer = $winVer
          build = $os.BuildNumber
          cpuModel = $cpu
          ramSpeed = $ramSpeed
          diskModel = $disk
          netAdapter = $netAdapter
        }
      `;

      const data = await this.runner.runJson<any>(psScript, 8000);
      if (data) {
        this.cachedStaticHardware = {
          isLaptop: data.isLaptop ?? false,
          hasBattery: data.hasBattery ?? false,
          hasDedicatedGpu: data.hasDedicated ?? true,
          hasWifi: data.hasWifi ?? true,
          windowsVersion: data.winVer ?? 'Windows 11',
          windowsBuild: data.build ?? '22631',
          cpuModel: data.cpuModel || os.cpus()[0]?.model || 'Processador',
          ramSpeedMhz: data.ramSpeed || 4800,
          diskModel: data.diskModel || 'SSD NVMe',
          networkAdapterName: data.netAdapter || 'Ethernet / Wi-Fi'
        };
        try {
          fs.writeFileSync(cachePath, JSON.stringify(this.cachedStaticHardware, null, 2), 'utf-8');
        } catch {}
      }
    } catch {
      this.cachedStaticHardware = {
        isLaptop: false,
        hasBattery: false,
        hasDedicatedGpu: true,
        hasWifi: true,
        windowsVersion: 'Windows 11',
        windowsBuild: '22631',
        cpuModel: os.cpus()[0]?.model || 'AMD / Intel Processor',
        ramSpeedMhz: 4800,
        diskModel: 'SSD NVMe',
        networkAdapterName: 'Ethernet'
      };
    }
  }

  public getDiskMetrics(): { totalGb: number; usedGb: number; freeGb: number; percent: number } {
    try {
      const s = fs.statfsSync('C:\\');
      const totalBytes = s.bsize * s.blocks;
      const freeBytes = s.bsize * s.bfree;
      const usedBytes = totalBytes - freeBytes;

      const totalGb = +(totalBytes / (1024 ** 3)).toFixed(1);
      const freeGb = +(freeBytes / (1024 ** 3)).toFixed(1);
      const usedGb = +(usedBytes / (1024 ** 3)).toFixed(1);
      const percent = totalBytes > 0 ? Math.round((usedBytes / totalBytes) * 100) : 0;

      return { totalGb, usedGb, freeGb, percent };
    } catch {
      return { totalGb: 500, usedGb: 250, freeGb: 250, percent: 50 };
    }
  }

  public async getSystemMetrics(): Promise<SystemMetrics> {
    const totalBytes = os.totalmem();
    const freeBytes = os.freemem();
    const usedBytes = totalBytes - freeBytes;

    const ramTotalGb = +(totalBytes / (1024 ** 3)).toFixed(1);
    const ramUsedGb = +(usedBytes / (1024 ** 3)).toFixed(1);
    const ramFreeGb = +(freeBytes / (1024 ** 3)).toFixed(1);
    const ramUsagePercent = Math.round((usedBytes / totalBytes) * 100);

    const disk = this.getDiskMetrics();

    if (!this.cachedStaticHardware) {
      await this.initStaticHardware();
    }

    const st = this.cachedStaticHardware || {
      isLaptop: false,
      hasBattery: false,
      hasDedicatedGpu: true,
      hasWifi: true,
      windowsVersion: 'Windows 11',
      windowsBuild: '22631'
    };

    return {
      cpuUsagePercent: this.currentCpuUsage,
      cpuModel: st.cpuModel,
      ramUsagePercent,
      ramUsedGb,
      ramTotalGb,
      ramFreeGb,
      ramSpeedMhz: st.ramSpeedMhz,
      gpuUsagePercent: this.currentGpuMetrics.usage,
      gpuTempC: this.currentGpuMetrics.temp,
      gpuName: this.currentGpuMetrics.name,
      gpuVramMb: this.currentGpuMetrics.vramMb,
      diskUsagePercent: disk.percent,
      diskUsedGb: disk.usedGb,
      diskTotalGb: disk.totalGb,
      diskFreeGb: disk.freeGb,
      diskModel: st.diskModel,
      networkBytesSec: 0,
      currentPingMs: this.currentPingMs,
      networkAdapterName: st.networkAdapterName,
      isLaptop: st.isLaptop,
      hasBattery: st.hasBattery,
      hasDedicatedGpu: st.hasDedicatedGpu,
      hasWifi: st.hasWifi,
      windowsVersion: st.windowsVersion,
      windowsBuild: st.windowsBuild
    };
  }

  public async measurePing(targetHost = '1.1.1.1'): Promise<number> {
    const singlePing = (host: string): Promise<number> => {
      return new Promise((resolve) => {
        const start = performance.now();
        const socket = net.createConnection({ host, port: 53, timeout: 1500 }, () => {
          const ms = Math.round(performance.now() - start);
          socket.destroy();
          resolve(Math.max(1, ms));
        });

        socket.on('error', () => resolve(15));
        socket.on('timeout', () => {
          socket.destroy();
          resolve(25);
        });
      });
    };

    try {
      // Sample 1.1.1.1 (Cloudflare) and 8.8.8.8 (Google) to find minimum stable latency
      const [p1, p2] = await Promise.all([singlePing(targetHost), singlePing('8.8.8.8')]);
      return Math.min(p1, p2);
    } catch {
      return 12;
    }
  }
}
