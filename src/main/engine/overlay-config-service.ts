import fs from 'fs';
import path from 'path';
import os from 'os';
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
  opacity: 95
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

  public resetDefaults(): OverlayConfig {
    this.currentConfig = {
      ...DEFAULT_OVERLAY_CONFIG,
      items: { ...DEFAULT_OVERLAY_CONFIG.items }
    };
    this.saveConfig();
    this.notifyListeners();
    return this.getConfig();
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
