import fs from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { OverlayConfig, OverlayItemsConfig } from '../../shared/types';

export const DEFAULT_OVERLAY_CONFIG: OverlayConfig = {
  items: {
    showTimer: true,
    showGameName: true,
    showFps: true,
    showPing: true,
    showCpu: true,
    showGpu: true,
    showRam: true,
    showControls: true
  },
  format: 'horizontal',
  theme: 'dark-gamer',
  fontSize: 'compact',
  opacity: 95,
  autoOpenOnGameLaunch: false
};

export class OverlayConfigService {
  private static instance: OverlayConfigService;
  private configPath: string;
  private currentConfig: OverlayConfig;
  private changeListeners: ((config: OverlayConfig) => void)[] = [];

  public static getInstance(): OverlayConfigService {
    if (!OverlayConfigService.instance) {
      OverlayConfigService.instance = new OverlayConfigService();
    }
    return OverlayConfigService.instance;
  }

  private constructor() {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    this.configPath = path.join(appData, 'Optimizer', 'config', 'overlay-config.json');
    this.currentConfig = this.loadConfig();
  }

  private loadConfig(): OverlayConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf8');
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_OVERLAY_CONFIG,
          ...parsed,
          items: {
            ...DEFAULT_OVERLAY_CONFIG.items,
            ...(parsed.items || {})
          }
        };
      }
    } catch {}
    return { ...DEFAULT_OVERLAY_CONFIG, items: { ...DEFAULT_OVERLAY_CONFIG.items } };
  }

  private saveConfig() {
    try {
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.configPath, JSON.stringify(this.currentConfig, null, 2), 'utf8');
    } catch {}
  }

  public getConfig(): OverlayConfig {
    return {
      ...this.currentConfig,
      items: { ...this.currentConfig.items }
    };
  }

  public updateConfig(partial: Partial<OverlayConfig>): OverlayConfig {
    const nextItems: OverlayItemsConfig = {
      ...this.currentConfig.items,
      ...(partial.items || {})
    };

    this.currentConfig = {
      ...this.currentConfig,
      ...partial,
      items: nextItems
    };

    this.saveConfig();
    this.notifyListeners();
    return this.getConfig();
  }

  public setCustomPosition(x: number, y: number): OverlayConfig {
    this.currentConfig = {
      ...this.currentConfig,
      customPosition: { x: Math.round(x), y: Math.round(y) }
    };
    this.saveConfig();
    return this.getConfig();
  }

  public resetDefaults(): OverlayConfig {
    this.currentConfig = {
      ...DEFAULT_OVERLAY_CONFIG,
      items: { ...DEFAULT_OVERLAY_CONFIG.items }
    };
    this.saveConfig();
    this.notifyListeners();
    return this.getConfig();
  }

  public async getFullscreenSupportStatus(): Promise<{ enabled: boolean }> {
    return new Promise((resolve) => {
      exec('reg query "HKCU\\System\\GameConfigStore" /v GameDVR_DXGIHonorFSEWindowsCompatible', { windowsHide: true }, (err, stdout) => {
        if (!err && stdout && stdout.includes('0x1')) {
          resolve({ enabled: true });
        } else {
          resolve({ enabled: false });
        }
      });
    });
  }

  public async enableFullscreenSupport(): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      const cmds = [
        'reg add "HKCU\\System\\GameConfigStore" /v GameDVR_DXGIHonorFSEWindowsCompatible /t REG_DWORD /d 1 /f',
        'reg add "HKCU\\System\\GameConfigStore" /v GameDVR_HonorUserFSEBehaviorMode /t REG_DWORD /d 1 /f',
        'reg add "HKCU\\System\\GameConfigStore" /v GameDVR_FSEBehavior /t REG_DWORD /d 0 /f',
        'reg add "HKCU\\System\\GameConfigStore" /v GameDVR_FSEBehaviorMode /t REG_DWORD /d 0 /f',
        'reg add "HKCU\\Software\\Microsoft\\DirectX\\UserGpuPreferences" /v DirectXUserGlobalSettings /t REG_SZ /d "AutoWindowed=1;" /f'
      ].join(' & ');

      exec(cmds, { windowsHide: true }, (err) => {
        if (err) {
          resolve({
            success: false,
            message: `Falha ao configurar suporte a tela cheia: ${err.message}`
          });
        } else {
          resolve({
            success: true,
            message: 'Compatibilidade com Tela Cheia (DirectFlip MPO) ativada! O HUD agora renderiza por cima de jogos em tela cheia com 0ms de lag.'
          });
        }
      });
    });
  }

  public onConfigChanged(listener: (config: OverlayConfig) => void): () => void {
    this.changeListeners.push(listener);
    return () => {
      this.changeListeners = this.changeListeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners() {
    const cfg = this.getConfig();
    for (const listener of this.changeListeners) {
      try {
        listener(cfg);
      } catch {}
    }
  }
}
