import { ProcessLassoService } from './process-lasso-service';
import { TimerResolutionService } from './timer-resolution-service';
import { RamCleanerService } from './ram-cleaner-service';
import { BrowserWindow } from 'electron';

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

  public static getInstance(): GameBoosterDaemon {
    if (!GameBoosterDaemon.instance) {
      GameBoosterDaemon.instance = new GameBoosterDaemon();
    }
    return GameBoosterDaemon.instance;
  }

  public setWindow(win: BrowserWindow) {
    this.mainWindow = win;
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
      this.activeGame = gameProcess;
      await this.applyAutoBoost(gameProcess);
    }
    // Game closed
    else if (!gameProcess && this.activeGame) {
      const finishedGame = this.activeGame;
      this.activeGame = null;
      await this.revertBoost(finishedGame);
    }

    return this.getState();
  }

  private async applyAutoBoost(gameProcess: string) {
    try {
      // 1. Process Lasso High Priority & P-Cores
      await ProcessLassoService.getInstance().applyLassoOptimization(gameProcess);

      // 2. Lock 0.500ms Timer Resolution
      await TimerResolutionService.getInstance().setPrecisionTimer(true);

      // 3. Purge Standby List RAM
      await RamCleanerService.getInstance().cleanRamAndStandby();

      this.lastBoostMessage = `Auto Game-Booster: ${gameProcess} acelerado com sucesso (P-Cores + 0.5ms + RAM Limpa).`;

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
      // Revert timer resolution to default
      await TimerResolutionService.getInstance().setPrecisionTimer(false);

      this.lastBoostMessage = `Jogo ${gameProcess} finalizado. Timer e recursos do sistema repostos.`;

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
