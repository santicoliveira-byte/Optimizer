import { globalShortcut, BrowserWindow } from 'electron';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { RamCleanerService } from './ram-cleaner-service';
import { LatencyBenchmarkService } from './latency-benchmark-service';

export interface HotkeyOption {
  label: string;
  value: string;
}

export interface HotkeyBinding {
  id: string;
  name: string;
  shortcut: string;
  accelerator: string;
  description: string;
  enabled: boolean;
  options: HotkeyOption[];
}

export class HotkeyService {
  private static instance: HotkeyService;
  private window: BrowserWindow | null = null;
  private configPath: string;
  private overlayCallback: (() => void) | null = null;
  private ghostToggleCallback: (() => void) | null = null;
  private benchmarkCallback: (() => void) | null = null;

  private defaultShortcuts: Record<string, string> = {
    'ultra-game-mode': 'CommandOrControl+Shift+F1',
    'ram-clean': 'CommandOrControl+Shift+F2',
    'toggle-overlay': 'CommandOrControl+Shift+F3',
    'toggle-ghost': 'CommandOrControl+Shift+F4',
    'toggle-benchmark': 'CommandOrControl+Shift+F5'
  };

  private shortcuts: Record<string, string> = {
    ...this.defaultShortcuts
  };

  private constructor() {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    this.configPath = path.join(appData, 'Optimizer', 'config', 'hotkeys.json');
    this.loadSavedConfig();
  }

  public static getInstance(): HotkeyService {
    if (!HotkeyService.instance) {
      HotkeyService.instance = new HotkeyService();
    }
    return HotkeyService.instance;
  }

  private loadSavedConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (typeof parsed === 'object' && parsed !== null) {
          for (const key of Object.keys(this.defaultShortcuts)) {
            if (typeof parsed[key] === 'string' && parsed[key].trim()) {
              this.shortcuts[key] = parsed[key].trim();
            }
          }
        }
      }
    } catch {
      // Keep defaults
    }
  }

  private saveConfig() {
    try {
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.configPath, JSON.stringify(this.shortcuts, null, 2), 'utf-8');
    } catch {
      // Ignore write errors
    }
  }

  public init(win: BrowserWindow) {
    this.window = win;
    this.registerAll();
  }

  public setOverlayCallback(cb: () => void) {
    this.overlayCallback = cb;
  }

  public setGhostToggleCallback(cb: () => void) {
    this.ghostToggleCallback = cb;
  }

  public setBenchmarkCallback(cb: () => void) {
    this.benchmarkCallback = cb;
  }

  public registerAll() {
    this.unregisterAll();

    for (const [actionId, accelerator] of Object.entries(this.shortcuts)) {
      this.registerAction(actionId, accelerator);
    }

    // Registo de atalhos ergonómicos adicionais (Alt + O, Alt + G e Alt + B)
    // Permite que utilizadores de portáteis / teclados sem tecla Fn premida também consigam alternar com 1 mão
    if (this.shortcuts['toggle-overlay'] !== 'Alt+O') {
      try {
        globalShortcut.register('Alt+O', async () => {
          await this.handleActionTrigger('toggle-overlay');
        });
      } catch {}
    }

    if (this.shortcuts['toggle-ghost'] !== 'Alt+G') {
      try {
        globalShortcut.register('Alt+G', async () => {
          await this.handleActionTrigger('toggle-ghost');
        });
      } catch {}
    }

    if (this.shortcuts['toggle-benchmark'] !== 'Alt+B') {
      try {
        globalShortcut.register('Alt+B', async () => {
          await this.handleActionTrigger('toggle-benchmark');
        });
      } catch {}
    }
  }

  private registerAction(actionId: string, accelerator: string): boolean {
    try {
      const registered = globalShortcut.register(accelerator, async () => {
        await this.handleActionTrigger(actionId);
      });
      return registered;
    } catch {
      return false;
    }
  }

  private async handleActionTrigger(actionId: string) {
    switch (actionId) {
      case 'ultra-game-mode':
        await LatencyBenchmarkService.getInstance().setPrecisionTimer(true);
        if (this.window && !this.window.isDestroyed()) {
          this.window.webContents.send('hotkey:trigger', {
            action: 'ultra-game-mode',
            message: '⚡ Modo Ultra Jogo Ativado! Resolução 0.500ms ligada.'
          });
        }
        break;

      case 'ram-clean': {
        const res = await RamCleanerService.getInstance().cleanRamAndStandby();
        if (this.window && !this.window.isDestroyed()) {
          this.window.webContents.send('hotkey:trigger', {
            action: 'ram-clean',
            message: `🧹 RAM Limpa via Atalho: ~${res.freedEstimateMB}MB libertados!`
          });
        }
        break;
      }

      case 'toggle-overlay':
        if (this.overlayCallback) {
          try {
            this.overlayCallback();
          } catch {}
        }
        if (this.window && !this.window.isDestroyed()) {
          this.window.webContents.send('hotkey:trigger', {
            action: 'toggle-overlay',
            message: '🎮 Game HUD Overlay alternado.'
          });
        }
        break;

      case 'toggle-ghost':
        if (this.ghostToggleCallback) {
          try {
            this.ghostToggleCallback();
          } catch {}
        }
        break;

      case 'toggle-benchmark':
        if (this.benchmarkCallback) {
          try {
            this.benchmarkCallback();
          } catch {}
        }
        break;
    }
  }

  public updateShortcut(actionId: string, newAccelerator: string): { success: boolean; message?: string } {
    if (!this.shortcuts[actionId]) {
      return { success: false, message: 'Ação de atalho desconhecida.' };
    }

    const oldAccelerator = this.shortcuts[actionId];
    if (oldAccelerator === newAccelerator) {
      return { success: true };
    }

    // Check if new accelerator is already used by another action
    for (const [id, acc] of Object.entries(this.shortcuts)) {
      if (id !== actionId && acc.toLowerCase() === newAccelerator.toLowerCase()) {
        return {
          success: false,
          message: `Esta combinação de teclas já está atribuída a: ${id}`
        };
      }
    }

    // Unregister old accelerator
    try {
      globalShortcut.unregister(oldAccelerator);
    } catch {}

    // Register new accelerator
    const success = this.registerAction(actionId, newAccelerator);
    if (!success) {
      // Revert to old
      this.registerAction(actionId, oldAccelerator);
      return {
        success: false,
        message: 'Combinação de teclas em conflito com o Windows ou com outro programa.'
      };
    }

    this.shortcuts[actionId] = newAccelerator;
    this.saveConfig();
    return { success: true, message: 'Atalho atualizado com sucesso!' };
  }

  public resetDefaults(): boolean {
    this.unregisterAll();
    this.shortcuts = { ...this.defaultShortcuts };
    this.saveConfig();
    this.registerAll();
    return true;
  }

  public acceleratorToDisplay(acc: string): string {
    return acc
      .replace(/CommandOrControl/g, 'Ctrl')
      .replace(/\+/g, ' + ');
  }

  public getHotkeysList(): HotkeyBinding[] {
    return [
      {
        id: 'toggle-overlay',
        name: 'Alternar HUD Overlay em Jogo',
        shortcut: this.acceleratorToDisplay(this.shortcuts['toggle-overlay']),
        accelerator: this.shortcuts['toggle-overlay'],
        description: 'Abre/fecha widget flutuante de FPS, Ping, Latência e CPU/GPU',
        enabled: globalShortcut.isRegistered(this.shortcuts['toggle-overlay']),
        options: [
          { label: 'Ctrl + Shift + F3 (Padrão)', value: 'CommandOrControl+Shift+F3' },
          { label: 'Ctrl + F3', value: 'CommandOrControl+F3' },
          { label: 'Ctrl + Shift + O', value: 'CommandOrControl+Shift+O' },
          { label: 'Alt + O', value: 'Alt+O' },
          { label: 'Ctrl + Shift + H', value: 'CommandOrControl+Shift+H' },
          { label: 'F11', value: 'F11' },
          { label: 'F12', value: 'F12' }
        ]
      },
      {
        id: 'toggle-ghost',
        name: 'Alternar Modo Fantasma (Click-Through)',
        shortcut: this.acceleratorToDisplay(this.shortcuts['toggle-ghost']),
        accelerator: this.shortcuts['toggle-ghost'],
        description: 'Alterna passagem de cliques do rato para o jogo (Atalho de emergência)',
        enabled: globalShortcut.isRegistered(this.shortcuts['toggle-ghost']),
        options: [
          { label: 'Ctrl + Shift + F4 (Padrão)', value: 'CommandOrControl+Shift+F4' },
          { label: 'Ctrl + F4', value: 'CommandOrControl+F4' },
          { label: 'Ctrl + Shift + G', value: 'CommandOrControl+Shift+G' },
          { label: 'Alt + G', value: 'Alt+G' },
          { label: 'Ctrl + Shift + F8', value: 'CommandOrControl+Shift+F8' }
        ]
      },
      {
        id: 'ultra-game-mode',
        name: 'Modo Ultra Gaming Instantâneo',
        shortcut: this.acceleratorToDisplay(this.shortcuts['ultra-game-mode']),
        accelerator: this.shortcuts['ultra-game-mode'],
        description: 'Ativa temporizador de 0.500ms e prioridade máxima para jogos',
        enabled: globalShortcut.isRegistered(this.shortcuts['ultra-game-mode']),
        options: [
          { label: 'Ctrl + Shift + F1 (Padrão)', value: 'CommandOrControl+Shift+F1' },
          { label: 'Ctrl + F1', value: 'CommandOrControl+F1' },
          { label: 'Ctrl + Shift + U', value: 'CommandOrControl+Shift+U' },
          { label: 'Alt + U', value: 'Alt+U' }
        ]
      },
      {
        id: 'ram-clean',
        name: 'Limpeza Instantânea de RAM & Standby List',
        shortcut: this.acceleratorToDisplay(this.shortcuts['ram-clean']),
        accelerator: this.shortcuts['ram-clean'],
        description: 'Purga caches vazios do Windows e liberta memória em tempo real',
        enabled: globalShortcut.isRegistered(this.shortcuts['ram-clean']),
        options: [
          { label: 'Ctrl + Shift + F2 (Padrão)', value: 'CommandOrControl+Shift+F2' },
          { label: 'Ctrl + F2', value: 'CommandOrControl+F2' },
          { label: 'Ctrl + Shift + R', value: 'CommandOrControl+Shift+R' },
          { label: 'Alt + R', value: 'Alt+R' }
        ]
      }
    ];
  }

  public unregisterAll() {
    globalShortcut.unregisterAll();
  }
}
