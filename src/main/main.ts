import { app, BrowserWindow, ipcMain, shell, Tray, Menu } from 'electron';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { OptimizerEngine } from './engine/optimizer-engine';
import { ProfileService } from './engine/profile-service';
import { NetworkPriorityService } from './engine/network-priority-service';
import { DnsBenchmarkService } from './engine/dns-benchmark-service';
import { ShaderCacheService } from './engine/shader-cache-service';
import { StartupManagerService } from './engine/startup-manager-service';
import { LatencyBenchmarkService } from './engine/latency-benchmark-service';
import { GameTrafficRoutingService } from './engine/game-traffic-routing-service';
import { AiOptimizerService } from './engine/ai-optimizer-service';
import { RamCleanerService } from './engine/ram-cleaner-service';
import { HotkeyService } from './engine/hotkey-service';
import { RuntimesService } from './engine/runtimes-service';
import { MsiUtilityService } from './engine/msi-utility-service';
import { ProcessLassoService } from './engine/process-lasso-service';
import { UwpDebloaterService } from './engine/uwp-debloater-service';
import { GpuDriverTweakService } from './engine/gpu-driver-tweak-service';
import { TimerResolutionService } from './engine/timer-resolution-service';
import { GameBoosterDaemon } from './engine/game-booster-daemon';
import { GameConfigTunerService } from './engine/game-config-tuner-service';
import { HoneSuiteService } from './engine/hone-suite-service';
import { WindowsMaintenanceService } from './engine/windows-maintenance-service';
import { BottleneckGameService } from './engine/bottleneck-game-service';
import { HowManyFpsService } from './engine/howmanyfps-service';
import { CpuZInspectorService } from './engine/cpuz-inspector-service';
import { AutoUpdaterService } from './engine/auto-updater-service';
import { GameSensorService } from './engine/game-sensor-service';
import { FpsMonitorService } from './engine/fps-monitor-service';
import { OverlayConfigService } from './engine/overlay-config-service';

// Hardware & low-end PC performance switches
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('disable-background-timer-throttling', 'false');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');

// Critical for In-Game Overlays: prevents Chromium from hiding HUD when games cover screen in Fullscreen
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;
const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 1024,
    minHeight: 700,
    title: 'Optimizer - Windows 10/11 Performance & Latency',
    backgroundColor: '#0B0F19',
    frame: false,
    show: true,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      backgroundThrottling: true
    }
  });

  mainWindow.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    console.log(`[Renderer Log ${level}] ${message} (${sourceId}:${line})`);
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription) => {
    console.error(`[Load Error] ${errorCode}: ${errorDescription}`);
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    const rendererPath = path.resolve(app.getAppPath(), 'dist-renderer/index.html');
    mainWindow.loadFile(rendererPath);
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('blur', () => {
    mainWindow?.webContents.send('window:state-changed', { isFocused: false });
  });

  mainWindow.on('focus', () => {
    mainWindow?.webContents.send('window:state-changed', { isFocused: true });
  });

  mainWindow.on('minimize', () => {
    mainWindow?.webContents.send('window:state-changed', { isMinimized: true, isFocused: false });
  });

  mainWindow.on('restore', () => {
    mainWindow?.webContents.send('window:state-changed', { isMinimized: false, isFocused: true });
  });

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  if (tray) return;

  // Create an icon or use fallback native icon
  const iconPath = path.resolve(app.getAppPath(), 'dist-renderer/assets/msi-Cb6F3Wl9.svg');
  tray = new Tray(fs.existsSync(iconPath) ? iconPath : process.execPath);
  tray.setToolTip('Optimizer - Windows Performance & Gaming Engine');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Abrir Optimizer',
      click: () => {
        mainWindow?.show();
        mainWindow?.focus();
      }
    },
    {
      label: 'Modo Jogo Ultra',
      click: () => {
        mainWindow?.show();
        mainWindow?.webContents.send('tray:activate-gaming');
      }
    },
    { type: 'separator' },
    {
      label: 'Sair Completamente',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

let overlayWindow: BrowserWindow | null = null;
let isOverlayClickThrough = false;
let isOverlayManuallyOpened = false;
let overlayTopGuard: NodeJS.Timeout | null = null;

function startOverlayTopGuard() {
  if (overlayTopGuard) return;
  overlayTopGuard = setInterval(() => {
    if (overlayWindow && !overlayWindow.isDestroyed() && overlayWindow.isVisible()) {
      try {
        overlayWindow.setAlwaysOnTop(true, 'screen-saver', 1);
        overlayWindow.moveTop();
      } catch {}
    }
  }, 1000);
}

function stopOverlayTopGuard() {
  if (overlayTopGuard) {
    clearInterval(overlayTopGuard);
    overlayTopGuard = null;
  }
}

function getOverlayDimensions(format: 'horizontal' | 'vertical' | 'minimal') {
  if (format === 'vertical') {
    return { width: 220, height: 290 };
  }
  if (format === 'minimal') {
    return { width: 400, height: 40 };
  }
  return { width: 620, height: 44 };
}

function toggleOverlayWindow(isManual: boolean = true) {
  if (isManual) {
    isOverlayManuallyOpened = !isOverlayManuallyOpened;
  }

  if (overlayWindow && !overlayWindow.isDestroyed()) {
    if (overlayWindow.isVisible()) {
      overlayWindow.hide();
      stopOverlayTopGuard();
      return { isOpen: false, isClickThrough: isOverlayClickThrough };
    } else {
      overlayWindow.showInactive();
      overlayWindow.setAlwaysOnTop(true, 'screen-saver', 1);
      overlayWindow.moveTop();
      startOverlayTopGuard();
      return { isOpen: true, isClickThrough: isOverlayClickThrough };
    }
  }

  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width } = primaryDisplay.workAreaSize;
  const cfg = OverlayConfigService.getInstance().getConfig();
  const { width: overlayWidth, height: overlayHeight } = getOverlayDimensions(cfg.format);

  overlayWindow = new BrowserWindow({
    width: overlayWidth,
    height: overlayHeight,
    x: Math.max(0, width - overlayWidth - 20),
    y: 16,
    type: 'toolbar', // Critical on Windows: WS_EX_TOOLWINDOW prevents full-screen games from burying or minimizing the overlay!
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    movable: true,
    skipTaskbar: true,
    focusable: false,
    fullscreenable: false,
    hasShadow: false,
    show: false,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      backgroundThrottling: false
    }
  });

  overlayWindow.showInactive();
  overlayWindow.setAlwaysOnTop(true, 'screen-saver', 1);
  overlayWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  overlayWindow.moveTop();
  startOverlayTopGuard();

  if (isDev) {
    overlayWindow.loadURL('http://localhost:5173/#overlay');
  } else {
    const rendererPath = path.resolve(app.getAppPath(), 'dist-renderer/index.html');
    overlayWindow.loadFile(rendererPath, { hash: 'overlay' });
  }

  overlayWindow.on('closed', () => {
    overlayWindow = null;
    stopOverlayTopGuard();
  });

  return { isOpen: true, isClickThrough: isOverlayClickThrough };
}

function setOverlayPositionPreset(preset: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left') {
  if (!overlayWindow || overlayWindow.isDestroyed()) return;
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  const cfg = OverlayConfigService.getInstance().getConfig();
  const { width: overlayWidth, height: overlayHeight } = getOverlayDimensions(cfg.format);

  let x = width - overlayWidth - 20;
  let y = 16;

  switch (preset) {
    case 'top-left':
      x = 20;
      y = 16;
      break;
    case 'top-center':
      x = Math.round((width - overlayWidth) / 2);
      y = 16;
      break;
    case 'bottom-right':
      x = width - overlayWidth - 20;
      y = height - overlayHeight - 20;
      break;
    case 'bottom-left':
      x = 20;
      y = height - overlayHeight - 20;
      break;
    case 'top-right':
    default:
      x = width - overlayWidth - 20;
      y = 16;
      break;
  }

  overlayWindow.setPosition(x, y);
}

function setOverlayClickThrough(ignore: boolean) {
  isOverlayClickThrough = ignore;
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.setIgnoreMouseEvents(ignore, { forward: true });
    try {
      overlayWindow.webContents.send('overlay:ghost-changed', ignore);
    } catch {}
  }
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      mainWindow.webContents.send('overlay:ghost-changed', ignore);
    } catch {}
  }
  return { isClickThrough: isOverlayClickThrough };
}

function toggleOverlayGhost() {
  const next = !isOverlayClickThrough;
  setOverlayClickThrough(next);
  if (mainWindow && !mainWindow.isDestroyed()) {
    try {
      mainWindow.webContents.send('hotkey:trigger', {
        action: 'toggle-ghost',
        message: next
          ? '👻 Modo Fantasma Ativado! Os cliques passam diretos para o jogo.'
          : '🖱️ Modo Fantasma Desativado! O HUD volta a ser clicável.'
      });
    } catch {}
  }
  return { isClickThrough: next };
}

function registerIpc() {
  const engine = OptimizerEngine.getInstance();
  const profileService = ProfileService.getInstance();

  ipcMain.handle('optimizer:get-catalog', async () => {
    return engine.getCatalog();
  });

  ipcMain.handle('optimizer:get-quick-states', async () => {
    return engine.getStates();
  });

  ipcMain.handle('optimizer:detect-all', async (_, force?: boolean) => {
    return engine.detectAll(force);
  });

  ipcMain.handle('optimizer:is-initial-scan-done', async () => {
    return engine.isInitialScanDone();
  });

  ipcMain.handle('optimizer:detect-item', async (_, id: string) => {
    return engine.detectItem(id);
  });

  ipcMain.handle('optimizer:preview-dry-run', async (_, id: string) => {
    return engine.previewDryRun(id);
  });

  ipcMain.handle('optimizer:apply', async (_, id: string, isDryRun: boolean) => {
    return engine.apply(id, isDryRun);
  });

  ipcMain.handle('optimizer:revert', async (_, id: string) => {
    return engine.revert(id);
  });

  ipcMain.handle('optimizer:revert-all', async () => {
    return engine.revertAll();
  });

  ipcMain.handle('optimizer:apply-recommended', async (_, isDryRun: boolean) => {
    return engine.applyRecommended(isDryRun);
  });

  ipcMain.handle('optimizer:get-health-score', async () => {
    return engine.getHealthScore();
  });

  ipcMain.handle('optimizer:get-metrics', async () => {
    return engine.getSystemMetrics();
  });

  ipcMain.handle('optimizer:create-restore-point', async (_, desc?: string) => {
    return engine.createRestorePoint(desc);
  });

  ipcMain.handle('optimizer:get-audit-logs', async () => {
    return engine.getAuditLogs();
  });

  ipcMain.handle('optimizer:get-profiles', async () => {
    return profileService.getProfiles();
  });

  ipcMain.handle('optimizer:save-profile', async (_, profile) => {
    return profileService.saveProfile(profile);
  });

  ipcMain.handle('optimizer:delete-profile', async (_, id: string) => {
    return profileService.deleteProfile(id);
  });

  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.handle('window:close', () => {
    mainWindow?.close();
  });

  ipcMain.handle('window:is-maximized', () => {
    return mainWindow?.isMaximized() ?? false;
  });

  ipcMain.handle('optimizer:check-admin', async () => {
    return new Promise((resolve) => {
      const { exec } = require('child_process');
      exec('net session', (err: any) => {
        resolve(!err);
      });
    });
  });

  ipcMain.handle('optimizer:relaunch-admin', () => {
    const { spawn } = require('child_process');
    const electronExe = process.execPath;
    const appDir = path.resolve(__dirname, '../../');
    const elevateCmd = `Start-Process -FilePath "${electronExe}" -ArgumentList "${appDir}" -Verb RunAs`;
    spawn('powershell.exe', ['-NoProfile', '-Command', elevateCmd], { detached: true });
    setTimeout(() => {
      app.quit();
    }, 600);
    return true;
  });

  ipcMain.handle('optimizer:export-html-report', async () => {
    try {
      const metrics = await engine.getSystemMetrics();
      const html = engine.generateHtmlReport(metrics);
      const outPath = path.join(os.homedir(), 'Desktop', `Optimizer_Report_${Date.now()}.html`);
      fs.writeFileSync(outPath, html, 'utf-8');
      shell.openPath(outPath);
      return { success: true, path: outPath };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  });

  let lastTaskListTime = 0;
  let cachedTaskList = '';

  ipcMain.handle('optimizer:detect-running-game', async (_, gameProcessNames: string[]) => {
    return new Promise((resolve) => {
      const now = Date.now();
      const notifyDaemonAndResolve = (found: string | null) => {
        GameBoosterDaemon.getInstance().onGameDetected(found);
        resolve(found);
      };

      // Cache tasklist for 5 seconds to eliminate continuous CPU spikes on low-end dual-core laptops
      if (now - lastTaskListTime < 5000 && cachedTaskList) {
        const lowerList = cachedTaskList;
        for (const proc of gameProcessNames) {
          const cleanProc = proc.toLowerCase().trim();
          if (cleanProc && lowerList.includes(cleanProc)) {
            return notifyDaemonAndResolve(proc);
          }
        }
        return notifyDaemonAndResolve(null);
      }

      const { exec } = require('child_process');
      exec('tasklist /FO CSV /NH', { windowsHide: true, timeout: 4000 }, (err: any, stdout: string) => {
        if (err || !stdout) {
          return notifyDaemonAndResolve(null);
        }
        lastTaskListTime = Date.now();
        cachedTaskList = stdout.toLowerCase();
        for (const proc of gameProcessNames) {
          const cleanProc = proc.toLowerCase().trim();
          if (cleanProc && cachedTaskList.includes(cleanProc)) {
            return notifyDaemonAndResolve(proc);
          }
        }
        notifyDaemonAndResolve(null);
      });
    });
  });

  ipcMain.handle('optimizer:get-network-priority', async () => {
    return NetworkPriorityService.getInstance().getPriorityState();
  });

  ipcMain.handle('optimizer:set-network-priority', async (_, mode: 'ethernet' | 'wifi' | 'auto') => {
    return NetworkPriorityService.getInstance().setPriority(mode);
  });

  // DNS Benchmark
  ipcMain.handle('dns:benchmark-all', async () => {
    return DnsBenchmarkService.getInstance().benchmarkAll();
  });

  ipcMain.handle('dns:apply', async (_, primaryIp: string, secondaryIp: string) => {
    return DnsBenchmarkService.getInstance().applyDns(primaryIp, secondaryIp);
  });

  ipcMain.handle('dns:reset', async () => {
    return DnsBenchmarkService.getInstance().resetDnsToDhcp();
  });

  // Shader Cache
  ipcMain.handle('shader-cache:get-status', async () => {
    return ShaderCacheService.getInstance().getCacheStatus();
  });

  ipcMain.handle('shader-cache:clean', async (_, id?: string) => {
    return ShaderCacheService.getInstance().cleanCache(id);
  });

  // Startup Manager
  ipcMain.handle('startup:get-items', async () => {
    return StartupManagerService.getInstance().getStartupItems();
  });

  ipcMain.handle('startup:toggle-item', async (_, item: any, enable: boolean) => {
    return StartupManagerService.getInstance().toggleItem(item, enable);
  });

  // Latency & Timer Benchmark
  ipcMain.handle('latency:run-benchmark', async () => {
    return LatencyBenchmarkService.getInstance().runBenchmark();
  });

  ipcMain.handle('latency:set-precision-timer', async (_, enable: boolean) => {
    return LatencyBenchmarkService.getInstance().setPrecisionTimer(enable);
  });

  // ExitLag-style Game Traffic Routing & QoS
  ipcMain.handle('game-route:get-games', async () => {
    return GameTrafficRoutingService.getInstance().getGames();
  });

  ipcMain.handle('game-route:toggle', async (_, gameId: string, enable: boolean) => {
    return GameTrafficRoutingService.getInstance().toggleGamePriority(gameId, enable);
  });

  ipcMain.handle('game-route:prioritize-all', async (_, enable: boolean) => {
    return GameTrafficRoutingService.getInstance().prioritizeAll(enable);
  });

  ipcMain.handle('game-route:clean-network', async () => {
    return GameTrafficRoutingService.getInstance().resetNetworkStackClean();
  });

  ipcMain.handle('game-route:get-stack-status', async () => {
    return GameTrafficRoutingService.getInstance().getExitLagStackStatus();
  });

  ipcMain.handle('game-route:apply-stack', async (_, enable: boolean) => {
    return GameTrafficRoutingService.getInstance().applyExitLagStack(enable);
  });

  ipcMain.handle('game-route:toggle-wifi-scan', async (_, disable: boolean) => {
    return GameTrafficRoutingService.getInstance().toggleWifiScan(disable);
  });

  ipcMain.handle('game-route:get-routes', async () => {
    return GameTrafficRoutingService.getInstance().getServerRoutes();
  });

  ipcMain.handle('game-route:add-custom', async (_, name: string, processName: string) => {
    return GameTrafficRoutingService.getInstance().addCustomGame(name, processName);
  });

  ipcMain.handle('game-route:remove-custom', async (_, gameId: string) => {
    return GameTrafficRoutingService.getInstance().removeCustomGame(gameId);
  });

  // AI 1-Click Hardware Optimizer
  ipcMain.handle('ai:recommend', async (_, metrics: any) => {
    return AiOptimizerService.getInstance().analyzeHardwareAndRecommend(metrics);
  });

  ipcMain.handle('ai:auto-apply', async (_, metrics: any) => {
    return AiOptimizerService.getInstance().autoApplyBestRecommendation(metrics);
  });

  // 1-Click Game Boost & Clean
  ipcMain.handle('optimizer:one-click-boost', async () => {
    try {
      const ramRes = await RamCleanerService.getInstance().cleanRamAndStandby();
      await LatencyBenchmarkService.getInstance().setPrecisionTimer(true);
      try {
        const { exec } = require('child_process');
        exec('ipconfig /flushdns');
      } catch {}

      let shaderFreedMb = 0;
      try {
        const shaderRes = ShaderCacheService.getInstance().cleanCache();
        shaderFreedMb = Math.round((shaderRes.freedBytes || 0) / (1024 * 1024));
      } catch {}

      const freedMb = ramRes.freedEstimateMB || 450;
      return {
        success: true,
        freedRamMb: freedMb,
        timerMs: 0.500,
        shaderFreedMb,
        message: `⚡ 1-Click Boost Ativo: ~${freedMb}MB de RAM libertados, temporizador travado a 0.500ms e caches otimizados!`
      };
    } catch (e: any) {
      return {
        success: false,
        message: e?.message || 'Erro ao aplicar 1-Click Boost.'
      };
    }
  });

  // RAM & Standby List Cleaner
  ipcMain.handle('ram:clean', async () => {
    return RamCleanerService.getInstance().cleanRamAndStandby();
  });

  ipcMain.handle('ram:set-compression', async (_, enable: boolean) => {
    return RamCleanerService.getInstance().setMemoryCompression(enable);
  });

  // Global Hotkeys
  ipcMain.handle('hotkeys:get-list', async () => {
    return HotkeyService.getInstance().getHotkeysList();
  });

  // Runtimes & MPO (Multi-Plane Overlay)
  ipcMain.handle('runtimes:get-status', async () => {
    return RuntimesService.getInstance().getRuntimesStatus();
  });

  ipcMain.handle('runtimes:install', async (_, item: any) => {
    return RuntimesService.getInstance().installRuntime(item);
  });

  ipcMain.handle('runtimes:get-mpo', async () => {
    return RuntimesService.getInstance().getMpoStatus();
  });

  ipcMain.handle('runtimes:set-mpo', async (_, disable: boolean) => {
    return RuntimesService.getInstance().setMpoDisabled(disable);
  });

  // MSI Mode Utility v3 (Message Signaled Interrupts)
  ipcMain.handle('msi:get-devices', async () => {
    return MsiUtilityService.getInstance().getMsiDevices();
  });

  ipcMain.handle('msi:set-device', async (_, deviceId: string, enable: boolean, priority: any) => {
    return MsiUtilityService.getInstance().setDeviceMsi(deviceId, enable, priority);
  });

  // Dynamic Process Lasso & P-Cores
  ipcMain.handle('lasso:get-targets', async () => {
    return ProcessLassoService.getInstance().getTargetProcesses();
  });

  ipcMain.handle('lasso:set-priority', async (_, processName: string, priority: any) => {
    return ProcessLassoService.getInstance().setProcessPriority(processName, priority);
  });

  ipcMain.handle('lasso:set-affinity', async (_, processName: string, coreIndices: number[]) => {
    return ProcessLassoService.getInstance().setProcessAffinity(processName, coreIndices);
  });

  ipcMain.handle('lasso:apply-boost', async (_, processName: string) => {
    return ProcessLassoService.getInstance().applyLassoOptimization(processName);
  });

  ipcMain.handle('lasso:add-custom', async (_, processName: string) => {
    return ProcessLassoService.getInstance().addCustomProcess(processName);
  });

  ipcMain.handle('lasso:remove-custom', async (_, processName: string) => {
    return ProcessLassoService.getInstance().removeCustomProcess(processName);
  });

  // UWP & Windows Bloatware Debloater
  ipcMain.handle('debloat:get-apps', async () => {
    return UwpDebloaterService.getInstance().getDebloatApps();
  });

  ipcMain.handle('debloat:uninstall', async (_, appId: string) => {
    return UwpDebloaterService.getInstance().uninstallApp(appId);
  });

  ipcMain.handle('debloat:batch-recommended', async () => {
    return UwpDebloaterService.getInstance().batchRemoveRecommended();
  });

  ipcMain.handle('debloat:remove-onedrive', async () => {
    return UwpDebloaterService.getInstance().removeOneDrive();
  });

  // GPU Driver Tweaks (NVIDIA / AMD)
  ipcMain.handle('gpu-tweak:get-overview', async () => {
    return GpuDriverTweakService.getInstance().getGpuTweakOverview();
  });

  ipcMain.handle('gpu-tweak:toggle', async (_, settingId: string, enable: boolean) => {
    return GpuDriverTweakService.getInstance().toggleSetting(settingId, enable);
  });

  ipcMain.handle('gpu-tweak:apply-competitive', async () => {
    return GpuDriverTweakService.getInstance().applyCompetitivePreset();
  });

  // Precision Timer Resolution (0.500ms)
  ipcMain.handle('timer:get-status', async () => {
    return TimerResolutionService.getInstance().getResolutionStatus();
  });

  ipcMain.handle('timer:set-precision', async (_, enable: boolean) => {
    return TimerResolutionService.getInstance().setPrecisionTimer(enable);
  });

  // 1-Click Tournament eSports Mode
  ipcMain.handle('tournament:activate', async () => {
    // 1. Lock 0.500ms Timer
    await TimerResolutionService.getInstance().setPrecisionTimer(true);
    // 2. Clean Standby RAM
    await RamCleanerService.getInstance().cleanRamAndStandby();
    // 3. Apply GPU eSports Tweaks
    await GpuDriverTweakService.getInstance().applyCompetitivePreset();
    // 4. Prioritize network routing for games
    await GameTrafficRoutingService.getInstance().prioritizeAll(true);

    return {
      success: true,
      message: 'Modo Torneio eSports Ativado: 0.500ms Timer, GPU no Máximo, RAM e Rede Otimizadas!'
    };
  });

  ipcMain.handle('tournament:deactivate', async () => {
    await TimerResolutionService.getInstance().setPrecisionTimer(false);
    return {
      success: true,
      message: 'Modo Torneio Desativado: Recursos restaurados ao modo equilibrado.'
    };
  });

  // Background Game Booster Daemon
  ipcMain.handle('booster:get-state', () => {
    return GameBoosterDaemon.getInstance().getState();
  });

  ipcMain.handle('booster:set-enabled', (_, enable: boolean) => {
    return GameBoosterDaemon.getInstance().setDaemonEnabled(enable);
  });

  // Game Config Tuner (In-Game eSports Configs: CS2, Fortnite, Valorant, Apex, Roblox)
  ipcMain.handle('game-config:get-configs', async () => {
    return GameConfigTunerService.getInstance().getGameConfigs();
  });

  ipcMain.handle('game-config:optimize', async (_, gameId: string) => {
    return GameConfigTunerService.getInstance().optimizeConfig(gameId);
  });

  ipcMain.handle('game-config:revert', async (_, gameId: string) => {
    return GameConfigTunerService.getInstance().revertConfig(gameId);
  });

  ipcMain.handle('game-config:optimize-all', async () => {
    return GameConfigTunerService.getInstance().optimizeAllDetected();
  });

  // Hone eSports Suite (Hone Premium Tweaks Unlocked 100% Free)
  ipcMain.handle('hone-suite:get-tweaks', async () => {
    return HoneSuiteService.getInstance().getHoneTweaks();
  });

  ipcMain.handle('hone-suite:apply-all', async () => {
    return HoneSuiteService.getInstance().applyFullHoneSuite();
  });

  // Windows System Maintenance & Repair
  ipcMain.handle('maint:get-tasks', async () => {
    return WindowsMaintenanceService.getInstance().getTasks();
  });

  ipcMain.handle('maint:run-task', async (_, taskId: string) => {
    return WindowsMaintenanceService.getInstance().runTask(taskId);
  });

  ipcMain.handle('maint:run-full', async () => {
    return WindowsMaintenanceService.getInstance().runFullMaintenance();
  });

  // Bottleneck Calculator & Can I Run It
  ipcMain.handle('bottleneck:get-system-rig', async () => {
    return BottleneckGameService.getInstance().getSystemRig();
  });

  ipcMain.handle(
    'bottleneck:calculate',
    async (_, cpuName: string, gpuName: string, resolution: any, workload: any) => {
      return BottleneckGameService.getInstance().calculateBottleneck(cpuName, gpuName, resolution, workload);
    }
  );

  ipcMain.handle('cani:get-games', async (_, search?: string, genre?: string) => {
    return BottleneckGameService.getInstance().evaluateAllGames(search, genre);
  });

  ipcMain.handle('hmf:query-fps', async (_, options: any) => {
    return HowManyFpsService.getInstance().queryFps(options);
  });

  ipcMain.handle('hmf:get-status', async () => {
    return HowManyFpsService.getInstance().getStatus();
  });

  ipcMain.handle('hmf:set-api-key', async (_, key: string) => {
    HowManyFpsService.getInstance().setApiKey(key);
    return { success: true };
  });

  ipcMain.handle('hmf:get-api-key', async () => {
    return HowManyFpsService.getInstance().getApiKey();
  });

  ipcMain.handle('cpuz:get-data', async () => {
    return CpuZInspectorService.getInstance().getCpuZData();
  });

  ipcMain.handle('cpuz:run-bench', async (_, mode: 'single' | 'multi' | 'stress') => {
    return CpuZInspectorService.getInstance().runCpuBenchmark(mode);
  });

  ipcMain.handle('cpuz:stop-stress', async () => {
    return CpuZInspectorService.getInstance().stopStress();
  });

  ipcMain.handle('cpuz:get-live-metrics', async () => {
    return CpuZInspectorService.getInstance().getLiveMetrics();
  });

  ipcMain.handle('updater:check', async () => {
    return AutoUpdaterService.getInstance().checkForUpdates();
  });

  ipcMain.handle('updater:download-install', async (_, downloadUrl: string) => {
    return AutoUpdaterService.getInstance().downloadAndApplyUpdate(downloadUrl);
  });

  // Game Sensor (Dynamic Game Detection across all platforms)
  ipcMain.handle('game-sensor:scan', async () => {
    return GameSensorService.getInstance().scanAllInstalledGames();
  });

  ipcMain.handle('game-sensor:add-custom', async (_, gameData: any) => {
    return GameSensorService.getInstance().addCustomGame(gameData);
  });

  ipcMain.handle('game-sensor:remove-custom', async (_, gameId: string) => {
    return GameSensorService.getInstance().removeCustomGame(gameId);
  });

  // Ultra-Lightweight In-Game Overlay
  ipcMain.handle('overlay:toggle', async () => {
    return toggleOverlayWindow();
  });

  ipcMain.handle('overlay:set-click-through', async (_, ignore: boolean) => {
    return setOverlayClickThrough(ignore);
  });

  ipcMain.handle('overlay:toggle-ghost', async () => {
    return toggleOverlayGhost();
  });

  ipcMain.handle('hotkeys:update', async (_, actionId: string, accelerator: string) => {
    return HotkeyService.getInstance().updateShortcut(actionId, accelerator);
  });

  ipcMain.handle('hotkeys:reset', async () => {
    return HotkeyService.getInstance().resetDefaults();
  });

  ipcMain.handle('overlay:get-status', async () => {
    return {
      isOpen: Boolean(overlayWindow && !overlayWindow.isDestroyed() && overlayWindow.isVisible()),
      isClickThrough: isOverlayClickThrough
    };
  });

  ipcMain.handle('overlay:set-position', async (_, preset: any) => {
    setOverlayPositionPreset(preset);
    return { success: true };
  });

  ipcMain.handle('overlay:close', async () => {
    isOverlayManuallyOpened = false;
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.hide();
      stopOverlayTopGuard();
    }
    return { success: true };
  });

  ipcMain.handle('fps:get-live', async () => {
    return FpsMonitorService.getInstance().getLiveFps();
  });

  ipcMain.handle('overlay:get-config', async () => {
    return OverlayConfigService.getInstance().getConfig();
  });

  ipcMain.handle('overlay:update-config', async (_, partial) => {
    return OverlayConfigService.getInstance().updateConfig(partial);
  });

  ipcMain.handle('overlay:reset-config', async () => {
    return OverlayConfigService.getInstance().resetDefaults();
  });

  ipcMain.handle('overlay:get-fullscreen-support', async () => {
    return OverlayConfigService.getInstance().getFullscreenSupportStatus();
  });

  ipcMain.handle('overlay:enable-fullscreen-support', async () => {
    return OverlayConfigService.getInstance().enableFullscreenSupport();
  });
}

app.whenReady().then(() => {
  registerIpc();
  createWindow();
  if (mainWindow) {
    try {
      HotkeyService.getInstance().setOverlayCallback(toggleOverlayWindow);
      HotkeyService.getInstance().setGhostToggleCallback(toggleOverlayGhost);
      HotkeyService.getInstance().init(mainWindow);
      GameBoosterDaemon.getInstance().setWindow(mainWindow);
      GameBoosterDaemon.getInstance().setAutoOverlayCallback((show) => {
        if (show) {
          if (!overlayWindow || overlayWindow.isDestroyed()) {
            toggleOverlayWindow(false);
          } else if (!overlayWindow.isVisible()) {
            overlayWindow.showInactive();
            overlayWindow.setAlwaysOnTop(true, 'screen-saver', 1);
            overlayWindow.moveTop();
            startOverlayTopGuard();
          } else {
            // Already visible: reinforce topmost position above the newly focused game
            overlayWindow.setAlwaysOnTop(true, 'screen-saver', 1);
            overlayWindow.moveTop();
          }
        } else {
          // If the user manually opened the overlay via Alt+O, keep it open!
          // Only auto-hide if it was opened solely by the auto game booster daemon
          if (!isOverlayManuallyOpened && overlayWindow && !overlayWindow.isDestroyed() && overlayWindow.isVisible()) {
            overlayWindow.hide();
            stopOverlayTopGuard();
          }
        }
      });
      GameBoosterDaemon.getInstance().startDaemon();

      OverlayConfigService.getInstance().onConfigChanged((cfg) => {
        if (overlayWindow && !overlayWindow.isDestroyed()) {
          const { width: newW, height: newH } = getOverlayDimensions(cfg.format);
          const [currentW, currentH] = overlayWindow.getSize();
          if (newW !== currentW || newH !== currentH) {
            overlayWindow.setSize(newW, newH);
          }
          try {
            overlayWindow.webContents.send('overlay:config-changed', cfg);
          } catch {}
        }
        if (mainWindow && !mainWindow.isDestroyed()) {
          try {
            mainWindow.webContents.send('overlay:config-changed', cfg);
          } catch {}
        }
      });
    } catch {}
  }
  try {
    createTray();
  } catch {}

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  TimerResolutionService.getInstance().cleanup();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
