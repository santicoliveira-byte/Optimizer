import { globalShortcut, BrowserWindow } from 'electron';
import { RamCleanerService } from './ram-cleaner-service';
import { LatencyBenchmarkService } from './latency-benchmark-service';

export interface HotkeyBinding {
  id: string;
  name: string;
  shortcut: string;
  description: string;
  enabled: boolean;
}

export class HotkeyService {
  private static instance: HotkeyService;
  private window: BrowserWindow | null = null;
  private registered: Map<string, string> = new Map();
  private overlayCallback: (() => void) | null = null;

  public static getInstance(): HotkeyService {
    if (!HotkeyService.instance) {
      HotkeyService.instance = new HotkeyService();
    }
    return HotkeyService.instance;
  }

  public init(win: BrowserWindow) {
    this.window = win;
    this.registerDefaults();
  }

  public setOverlayCallback(cb: () => void) {
    this.overlayCallback = cb;
  }

  public registerDefaults() {
    this.unregisterAll();

    // 1. Ctrl+Shift+F1: Ultra Game Mode + 0.5ms precision timer
    try {
      globalShortcut.register('CommandOrControl+Shift+F1', async () => {
        await LatencyBenchmarkService.getInstance().setPrecisionTimer(true);
        if (this.window && !this.window.isDestroyed()) {
          this.window.webContents.send('hotkey:trigger', {
            action: 'ultra-game-mode',
            message: '⚡ Modo Ultra Jogo Ativado! Resolução 0.500ms ligada.'
          });
        }
      });
      this.registered.set('ultra-game-mode', 'CommandOrControl+Shift+F1');
    } catch {}

    // 2. Ctrl+Shift+F2: Instant RAM & Standby List Clean
    try {
      globalShortcut.register('CommandOrControl+Shift+F2', async () => {
        const res = await RamCleanerService.getInstance().cleanRamAndStandby();
        if (this.window && !this.window.isDestroyed()) {
          this.window.webContents.send('hotkey:trigger', {
            action: 'ram-clean',
            message: `🧹 RAM Limpa via Atalho: ~${res.freedEstimateMB}MB libertados!`
          });
        }
      });
      this.registered.set('ram-clean', 'CommandOrControl+Shift+F2');
    } catch {}

    // 3. Ctrl+Shift+F3: Toggle Draggable HUD Overlay
    try {
      globalShortcut.register('CommandOrControl+Shift+F3', () => {
        if (this.overlayCallback) {
          try { this.overlayCallback(); } catch {}
        }
        if (this.window && !this.window.isDestroyed()) {
          this.window.webContents.send('hotkey:trigger', {
            action: 'toggle-overlay',
            message: '🎮 Game HUD Overlay alternado.'
          });
        }
      });
      this.registered.set('toggle-overlay', 'CommandOrControl+Shift+F3');
    } catch {}
  }

  public getHotkeysList(): HotkeyBinding[] {
    return [
      {
        id: 'ultra-game-mode',
        name: 'Modo Ultra Gaming Instantâneo',
        shortcut: 'Ctrl + Shift + F1',
        description: 'Ativa temporizador de 0.500ms e prioridade máxima para jogos',
        enabled: globalShortcut.isRegistered('CommandOrControl+Shift+F1')
      },
      {
        id: 'ram-clean',
        name: 'Limpeza Instantânea de RAM & Standby List',
        shortcut: 'Ctrl + Shift + F2',
        description: 'Purga caches vazios do Windows e reduz uso de memória em tempo real',
        enabled: globalShortcut.isRegistered('CommandOrControl+Shift+F2')
      },
      {
        id: 'toggle-overlay',
        name: 'Alternar HUD Overlay em Jogo',
        shortcut: 'Ctrl + Shift + F3',
        description: 'Abre/fecha widget flutuante de FPS, Ping, Latência e CPU/GPU',
        enabled: globalShortcut.isRegistered('CommandOrControl+Shift+F3')
      }
    ];
  }

  public unregisterAll() {
    globalShortcut.unregisterAll();
    this.registered.clear();
  }
}
