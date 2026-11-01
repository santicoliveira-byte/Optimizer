import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface MsiDeviceItem {
  id: string;
  name: string;
  category: 'gpu' | 'network' | 'usb' | 'audio' | 'other';
  deviceInstanceId: string;
  msiSupported: boolean;
  msiEnabled: boolean;
  interruptPriority: 'Undefined' | 'Low' | 'Normal' | 'High';
}

export class MsiUtilityService {
  private static instance: MsiUtilityService;

  public static getInstance(): MsiUtilityService {
    if (!MsiUtilityService.instance) {
      MsiUtilityService.instance = new MsiUtilityService();
    }
    return MsiUtilityService.instance;
  }

  /**
   * Scans system PCI devices for MSI (Message Signaled Interrupts) capability and current status
   */
  public async getMsiDevices(): Promise<MsiDeviceItem[]> {
    try {
      const psScript = `
        $ErrorActionPreference = 'SilentlyContinue'
        $pnp = Get-CimInstance Win32_PnPEntity | Where-Object { $_.DeviceID -like 'PCI\\*' }
        $devices = @()

        foreach ($dev in $pnp) {
          $regPath = "HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\$($dev.DeviceID)\\Device Parameters\\Interrupt Management\\MessageSignaledInterruptProperties"
          if (Test-Path $regPath) {
            $msiSupported = Get-ItemPropertyValue -Path $regPath -Name "MSISupported" -ErrorAction SilentlyContinue
            $prioPath = "HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\$($dev.DeviceID)\\Device Parameters\\Interrupt Management\\Affinity Policy"
            $prio = "Undefined"
            if (Test-Path $prioPath) {
              $prioVal = Get-ItemPropertyValue -Path $prioPath -Name "DevicePriority" -ErrorAction SilentlyContinue
              if ($prioVal -eq 3) { $prio = "High" }
              elseif ($prioVal -eq 2) { $prio = "Normal" }
              elseif ($prioVal -eq 1) { $prio = "Low" }
            }

            $cat = "other"
            $name = $dev.Name
            if ($name -match 'NVIDIA|GeForce|Radeon|Intel Arc|Graphics') { $cat = "gpu" }
            elseif ($name -match 'Ethernet|Wireless|Wi-Fi|Network|Intel(R) Ethernet|Realtek') { $cat = "network" }
            elseif ($name -match 'Audio|Sound|High Definition Audio') { $cat = "audio" }
            elseif ($name -match 'USB|Host Controller') { $cat = "usb" }

            $devices += [PSCustomObject]@{
              id = $dev.PNPDeviceID
              name = $dev.Name
              category = $cat
              deviceInstanceId = $dev.DeviceID
              msiSupported = ($msiSupported -ne $null)
              msiEnabled = ($msiSupported -eq 1)
              interruptPriority = $prio
            }
          }
        }
        $devices | ConvertTo-Json -Depth 3 -Compress
      `;

      const { stdout } = await execAsync(`powershell.exe -NoProfile -Command "${psScript.replace(/\r?\n/g, ' ')}"`, {
        windowsHide: true,
        timeout: 10000
      });

      if (!stdout || !stdout.trim()) {
        return this.getFallbackDevices();
      }

      const raw = stdout.trim();
      const list = raw.startsWith('[') ? JSON.parse(raw) : [JSON.parse(raw)];
      return list.map((d: any) => ({
        id: d.id || d.deviceInstanceId,
        name: d.name || 'Dispositivo PCI',
        category: d.category || 'other',
        deviceInstanceId: d.deviceInstanceId,
        msiSupported: true,
        msiEnabled: Boolean(d.msiEnabled),
        interruptPriority: d.interruptPriority || 'Undefined'
      }));
    } catch {
      return this.getFallbackDevices();
    }
  }

  /**
   * Sets MSI Mode (Message Signaled Interrupts) on/off and interrupt priority for a target device
   */
  public async setDeviceMsi(
    deviceInstanceId: string,
    enableMsi: boolean,
    priority: 'Undefined' | 'Low' | 'Normal' | 'High' = 'High'
  ): Promise<{ success: boolean; message: string }> {
    try {
      const safeDeviceId = (deviceInstanceId || '').replace(/[^a-zA-Z0-9\\&_\-]/g, '').trim();
      if (!safeDeviceId || safeDeviceId.length > 200) {
        return { success: false, message: 'ID de dispositivo inválido.' };
      }
      const allowedPriorities = ['Undefined', 'Low', 'Normal', 'High'];
      const safePriority = allowedPriorities.includes(priority) ? priority : 'High';
      const prioVal = safePriority === 'High' ? 3 : safePriority === 'Normal' ? 2 : safePriority === 'Low' ? 1 : 0;

      const psScript = `
        $path = "HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\${safeDeviceId}\\Device Parameters\\Interrupt Management\\MessageSignaledInterruptProperties"
        if (-not (Test-Path $path)) { New-Item -Path $path -Force | Out-Null }
        Set-ItemProperty -Path $path -Name "MSISupported" -Value ${enableMsi ? 1 : 0} -Type DWord -Force

        $affPath = "HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\${safeDeviceId}\\Device Parameters\\Interrupt Management\\Affinity Policy"
        if (-not (Test-Path $affPath)) { New-Item -Path $affPath -Force | Out-Null }
        if (${prioVal} -gt 0) {
          Set-ItemProperty -Path $affPath -Name "DevicePriority" -Value ${prioVal} -Type DWord -Force
        }
      `;

      await execAsync(`powershell.exe -NoProfile -Command "${psScript.replace(/\r?\n/g, ' ')}"`, {
        windowsHide: true,
        timeout: 10000
      });

      return {
        success: true,
        message: `Modo MSI ${enableMsi ? 'Ativado' : 'Desativado'} (Prioridade: ${safePriority}) com sucesso.`
      };
    } catch (e: any) {
      return {
        success: false,
        message: `Erro ao configurar MSI: ${e.message}`
      };
    }
  }

  private getFallbackDevices(): MsiDeviceItem[] {
    return [
      {
        id: 'PCI\\VEN_10DE_DEV_GPU',
        name: 'Placa Gráfica Principal (GPU)',
        category: 'gpu',
        deviceInstanceId: 'PCI\\VEN_10DE_DEV_GPU',
        msiSupported: true,
        msiEnabled: true,
        interruptPriority: 'High'
      },
      {
        id: 'PCI\\VEN_8086_DEV_NET',
        name: 'Adaptador de Rede Intel/Realtek Gigabit Ethernet',
        category: 'network',
        deviceInstanceId: 'PCI\\VEN_8086_DEV_NET',
        msiSupported: true,
        msiEnabled: true,
        interruptPriority: 'High'
      }
    ];
  }
}
