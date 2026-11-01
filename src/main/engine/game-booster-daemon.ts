import { exec } from 'child_process';
import { promisify } from 'util';
import { ProcessLassoService } from './process-lasso-service';
import { TimerResolutionService } from './timer-resolution-service';
import { RamCleanerService } from './ram-cleaner-service';
import { GameSensorService } from './game-sensor-service';
import { LicenseService } from './license-service';
import { BrowserWindow } from 'electron';

const execAsync = promisify(exec);

export interface BoosterState {
  daemonEnabled: boolean;
  activeGame: string | null;
  boostActive: boolean;
  lastBoostMessage: string | null;
}

export class GameBoosterDaemon {
  private static instance: GameBoosterDaemon;
  private daemonEnabled: boolean = true;
  private activeGame: string | null = null;
  private lastBoostMessage: string | null = null;
  private mainWindow: BrowserWindow | null = null;
  private autoOverlayCallback: ((show: boolean) => void) | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;
  private isPolling: boolean = false;
  private missedCheckCount: number = 0;

  public static getInstance(): GameBoosterDaemon {
    if (!GameBoosterDaemon.instance) {
      GameBoosterDaemon.instance = new GameBoosterDaemon();
    }
    return GameBoosterDaemon.instance;
  }

  public setWindow(win: BrowserWindow) {
    this.mainWindow = win;
  }

  public setAutoOverlayCallback(cb: (show: boolean) => void) {
    this.autoOverlayCallback = cb;
  }

  public startDaemon() {
    if (this.pollingInterval) return;
    this.pollingInterval = setInterval(async () => {
      if (this.isPolling || !this.daemonEnabled) return;
      this.isPolling = true;
      try {
        await this.checkRunningGames();
      } catch {}
      finally {
        this.isPolling = false;
      }
    }, 2500);
  }

  public stopDaemon() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private async checkRunningGames() {
    try {
      const knownProcs = GameSensorService.getInstance().getAllKnownProcessNames();
      if (knownProcs.length === 0) return;

      const { stdout } = await execAsync('tasklist /fo csv /nh', { timeout: 4000, windowsHide: true });
      const runningLower = stdout.toLowerCase();

      let detectedProc: string | null = null;
      for (const p of knownProcs) {
        if (runningLower.includes(`"${p}"`)) {
          detectedProc = p;
          break;
        }
      }

      await this.onGameDetected(detectedProc);
    } catch {}
  }

  public getState(): BoosterState {
    return {
      daemonEnabled: this.daemonEnabled,
      activeGame: this.activeGame,
      boostActive: Boolean(this.activeGame),
      lastBoostMessage: this.lastBoostMessage
    };
  }

  public setDaemonEnabled(enable: boolean): BoosterState {
    this.daemonEnabled = enable;
    if (!enable && this.activeGame) {
      this.revertBoost(this.activeGame);
    }
    return this.getState();
  }

  /**
   * Called during periodic game process polling
   */
  public async onGameDetected(gameProcess: string | null): Promise<BoosterState> {
    if (!this.daemonEnabled) {
      return this.getState();
    }

    // New game started
    if (gameProcess && gameProcess !== this.activeGame) {
      this.missedCheckCount = 0;
      this.activeGame = gameProcess;
      await this.applyAutoBoost(gameProcess);
    }
    // Existing game still running
    else if (gameProcess && gameProcess === this.activeGame) {
      this.missedCheckCount = 0;
    }
    // Game not seen in this poll: debounce 6 cycles (~15s) to avoid closing overlay during map loads/transitions
    else if (!gameProcess && this.activeGame) {
      this.missedCheckCount++;
      if (this.missedCheckCount >= 6) {
        this.missedCheckCount = 0;
        const finishedGame = this.activeGame;
        this.activeGame = null;
        await this.revertBoost(finishedGame);
      }
    }

    return this.getState();
  }

  private async applyAutoBoost(gameProcess: string) {
    try {
      const isPro = LicenseService.getInstance().getStatus().isPro;

      if (isPro) {
        // 1. Process Lasso High Priority & P-Cores
        await ProcessLassoService.getInstance().applyLassoOptimization(gameProcess);

        // 2. Lock 0.500ms Timer Resolution
        await TimerResolutionService.getInstance().setPrecisionTimer(true);

        // 3. Purge Standby List RAM
        await RamCleanerService.getInstance().cleanRamAndStandby();

        // 4. Auto-Open In-Game HUD Overlay
        if (this.autoOverlayCallback) {
          try {
            this.autoOverlayCallback(true);
          } catch {}
        }

        this.lastBoostMessage = `👑 Auto Game-Booster PRO: ${gameProcess} acelerado ao máximo (P-Cores + 0.5ms Timer + RAM Limpa).`;
      } else {
        // Plano Gratuito: Apenas limpeza básica de RAM em segundo plano (sem mexer em temporizador de hardware ou P-Cores)
        const ramClean = await RamCleanerService.getInstance().cleanRamAndStandby();
        const freed = ramClean.freedEstimateMB || 320;
        this.lastBoostMessage = `Modo Gaming Básico: ~${freed}MB RAM libertados. (Desbloqueie o PRO para ativar 0.500ms Timer e afinidade P-Cores!)`;
      }

      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('booster:game-started', {
          game: gameProcess,
          message: this.lastBoostMessage
        });
      }
    } catch (e: any) {
      this.lastBoostMessage = `Erro ao acelerar ${gameProcess}: ${e.message}`;
    }
  }

  private async revertBoost(gameProcess: string) {
    try {
      const isPro = LicenseService.getInstance().getStatus().isPro;

      if (isPro) {
        // 1. Revert timer resolution to default
        await TimerResolutionService.getInstance().setPrecisionTimer(false);

        // 2. Hide In-Game HUD Overlay
        if (this.autoOverlayCallback) {
          try {
            this.autoOverlayCallback(false);
          } catch {}
        }
      }

      this.lastBoostMessage = `Jogo ${gameProcess} finalizado. Recursos do sistema repostos.`;

      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send('booster:game-finished', {
          game: gameProcess,
          message: this.lastBoostMessage
        });
      }
    } catch (e: any) {
      this.lastBoostMessage = `Erro na reversão: ${e.message}`;
    }
  }
}
