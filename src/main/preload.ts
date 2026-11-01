import { contextBridge, ipcRenderer } from 'electron';
import { DryRunPreview, OptimizationProfile, OptimizationState, SystemMetrics, OverlayConfig, BenchmarkSession, GsyncCapResult, StartupConfig, LicenseStatus } from '../shared/types';

export interface OptimizerApi {
  getCatalog: () => Promise<any[]>;
  getQuickStates: () => Promise<OptimizationState[]>;
  detectAll: (force?: boolean) => Promise<OptimizationState[]>;
  isInitialScanDone: () => Promise<boolean>;
  detectItem: (id: string) => Promise<OptimizationState>;
  previewDryRun: (id: string) => Promise<DryRunPreview>;
  apply: (id: string, isDryRun: boolean) => Promise<{ success: boolean; message: string; requiresReboot?: boolean }>;
  revert: (id: string) => Promise<{ success: boolean; message: string }>;
  revertAll: () => Promise<{ revertedCount: number; errors: string[] }>;
  applyRecommended: (isDryRun: boolean) => Promise<{ appliedCount: number; messages: string[] }>;
  getHealthScore: () => Promise<{ score: number; appliedCount: number; totalAlterCount: number }>;
  getSystemMetrics: () => Promise<SystemMetrics>;
  createRestorePoint: (desc?: string) => Promise<{ success: boolean; message: string }>;
  getAuditLogs: () => Promise<any[]>;
  getProfiles: () => Promise<OptimizationProfile[]>;
  saveProfile: (profile: OptimizationProfile) => Promise<void>;
  deleteProfile: (id: string) => Promise<boolean>;
  exportHtmlReport: () => Promise<{ success: boolean; path?: string }>;
  checkIsAdmin: () => Promise<boolean>;
  relaunchAsAdmin: () => Promise<boolean>;
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  isWindowMaximized: () => Promise<boolean>;
  detectRunningGame: (gameProcessNames: string[]) => Promise<string | null>;
  onWindowStateChanged: (callback: (state: { isFocused: boolean; isMinimized?: boolean }) => void) => () => void;
  getNetworkPriority: () => Promise<any>;
  setNetworkPriority: (mode: 'ethernet' | 'wifi' | 'auto') => Promise<{ success: boolean; message: string; state?: any }>;
  dnsBenchmarkAll: () => Promise<any[]>;
  dnsApply: (primaryIp: string, secondaryIp: string) => Promise<{ success: boolean; message: string }>;
  dnsReset: () => Promise<{ success: boolean; message: string }>;
  shaderCacheGetStatus: () => Promise<any[]>;
  shaderCacheClean: (id?: string) => Promise<{ success: boolean; freedBytes: number; deletedFiles: number; message: string }>;
  startupGetItems: () => Promise<any[]>;
  startupToggleItem: (item: any, enable: boolean) => Promise<{ success: boolean; message: string }>;
  onTrayActivateGaming: (callback: () => void) => () => void;
  latencyRunBenchmark: () => Promise<any>;
  latencySetPrecisionTimer: (enable: boolean) => Promise<{ success: boolean; message: string }>;
  gameRouteGetGames: () => Promise<any[]>;
  gameRouteToggle: (gameId: string, enable: boolean) => Promise<{ success: boolean; message: string }>;
  gameRoutePrioritizeAll: (enable: boolean) => Promise<{ success: boolean; count: number; message: string }>;
  gameRouteCleanNetwork: () => Promise<{ success: boolean; message: string }>;
  gameRouteGetStackStatus: () => Promise<any>;
  gameRouteApplyStack: (enable: boolean) => Promise<{ success: boolean; message: string }>;
  gameRouteToggleWifiScan: (disable: boolean) => Promise<{ success: boolean; message: string }>;
  gameRouteGetRoutes: () => Promise<any[]>;
  gameRouteAddCustom: (name: string, processName: string) => Promise<{ success: boolean; message: string; game?: any }>;
  gameRouteRemoveCustom: (gameId: string) => Promise<{ success: boolean; message: string }>;
  aiRecommend: (metrics: any) => Promise<any>;
  aiAutoApply: (metrics: any) => Promise<{ success: boolean; appliedCount: number; failedCount: number; recommendation: any; message: string }>;
  oneClickBoost: () => Promise<{ success: boolean; freedRamMb: number; timerMs: number; shaderFreedMb: number; message: string }>;
  ramClean: () => Promise<{ success: boolean; freedEstimateMB: number; standbyCleared: boolean; message: string }>;
  ramSetCompression: (enable: boolean) => Promise<{ success: boolean; message: string }>;
  hotkeysGetList: () => Promise<any[]>;
  hotkeyUpdate: (actionId: string, accelerator: string) => Promise<{ success: boolean; message?: string }>;
  hotkeysResetDefaults: () => Promise<boolean>;
  onHotkeyTrigger: (callback: (data: { action: string; message: string }) => void) => () => void;
  runtimesGetStatus: () => Promise<any[]>;
  runtimesInstall: (item: any) => Promise<{ success: boolean; message: string }>;
  runtimesGetMpo: () => Promise<boolean>;
  runtimesSetMpo: (disable: boolean) => Promise<{ success: boolean; message: string }>;
  msiGetDevices: () => Promise<any[]>;
  msiSetDevice: (deviceId: string, enable: boolean, priority?: string) => Promise<{ success: boolean; message: string }>;
  lassoGetTargets: () => Promise<any[]>;
  lassoSetPriority: (processName: string, priority: string) => Promise<{ success: boolean; message: string }>;
  lassoSetAffinity: (processName: string, coreIndices: number[]) => Promise<{ success: boolean; message: string }>;
  lassoApplyBoost: (processName: string) => Promise<{ success: boolean; message: string }>;
  lassoAddCustom: (processName: string) => Promise<boolean>;
  lassoRemoveCustom: (processName: string) => Promise<boolean>;
  debloatGetApps: () => Promise<any[]>;
  debloatUninstall: (appId: string) => Promise<{ success: boolean; message: string }>;
  debloatBatchRecommended: () => Promise<{ success: boolean; count: number; freedRamMb: number }>;
  debloatRemoveOneDrive: () => Promise<{ success: boolean; message: string }>;
  gpuTweakGetOverview: () => Promise<any>;
  gpuTweakToggle: (settingId: string, enable: boolean) => Promise<{ success: boolean; message: string }>;
  gpuTweakApplyCompetitive: () => Promise<{ success: boolean; message: string }>;
  timerGetStatus: () => Promise<{ currentMs: number; minMs: number; maxMs: number; isLockedHalfMs: boolean }>;
  timerSetPrecision: (enable: boolean) => Promise<{ success: boolean; message: string; currentMs: number }>;
  tournamentActivate: () => Promise<{ success: boolean; message: string }>;
  tournamentDeactivate: () => Promise<{ success: boolean; message: string }>;
  boosterGetState: () => Promise<{ daemonEnabled: boolean; activeGame: string | null; boostActive: boolean; lastBoostMessage: string | null }>;
  boosterSetEnabled: (enable: boolean) => Promise<any>;
  onBoosterGameStarted: (callback: (data: { game: string; message: string }) => void) => () => void;
  onBoosterGameFinished: (callback: (data: { game: string; message: string }) => void) => () => void;
  gameConfigGetConfigs: () => Promise<any[]>;
  gameConfigOptimize: (gameId: string) => Promise<{ success: boolean; message: string }>;
  gameConfigRevert: (gameId: string) => Promise<{ success: boolean; message: string }>;
  gameConfigOptimizeAll: () => Promise<{ success: boolean; count: number; messages: string[] }>;
  honeSuiteGetTweaks: () => Promise<any[]>;
  honeSuiteApplyAll: () => Promise<{ success: boolean; message: string }>;
  maintGetTasks: () => Promise<any[]>;
  maintRunTask: (taskId: string) => Promise<{ taskId: string; success: boolean; message: string; output: string; durationMs: number }>;
  maintRunFull: () => Promise<{ success: boolean; completedTasks: number; totalTasks: number; durationMs: number; results: any[]; message: string }>;
  bottleneckGetSystemRig: () => Promise<any>;
  bottleneckCalculate: (cpuName: string, gpuName: string, resolution: string, workload: string) => Promise<any>;
  caniGetGames: (search?: string, genre?: string) => Promise<any[]>;
  hmfQueryFps: (options: { gameId: string; resolution?: string; upscaling?: string; cpuName?: string; gpuName?: string }) => Promise<any>;
  hmfGetStatus: () => Promise<any>;
  hmfSetApiKey: (key: string) => Promise<{ success: boolean }>;
  hmfGetApiKey: () => Promise<string>;
  cpuzGetData: () => Promise<any>;
  cpuzRunBench: (mode: 'single' | 'multi' | 'stress') => Promise<any>;
  cpuzStopStress: () => Promise<{ success: boolean }>;
  cpuzGetLiveMetrics: () => Promise<any>;
  updaterCheck: () => Promise<any>;
  updaterDownloadInstall: (downloadUrl: string) => Promise<{ success: boolean; path?: string; error?: string }>;
  gameSensorScan: () => Promise<any[]>;
  gameSensorAddCustom: (gameData: any) => Promise<any>;
  gameSensorRemoveCustom: (gameId: string) => Promise<boolean>;
  overlayToggle: () => Promise<{ isOpen: boolean; isClickThrough?: boolean }>;
  overlaySetClickThrough: (ignore: boolean) => Promise<{ isClickThrough: boolean }>;
  overlayToggleGhost: () => Promise<{ isClickThrough: boolean }>;
  overlayGetStatus: () => Promise<{ isOpen: boolean; isClickThrough: boolean }>;
  overlaySetPosition: (preset: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left') => Promise<{ success: boolean }>;
  overlayClose: () => Promise<{ success: boolean }>;
  onOverlayGhostChanged: (callback: (isClickThrough: boolean) => void) => () => void;
  fpsGetLive: () => Promise<{ fps: number; min1Fps: number; frametimeMs?: number; isGameActive: boolean; gameName?: string; refreshRate: number }>;
  overlayGetConfig: () => Promise<OverlayConfig>;
  overlayUpdateConfig: (config: Partial<OverlayConfig>) => Promise<OverlayConfig>;
  overlayResetConfig: () => Promise<OverlayConfig>;
  onOverlayConfigChanged: (callback: (config: OverlayConfig) => void) => () => void;
  overlayGetFullscreenSupport: () => Promise<{ enabled: boolean }>;
  overlayEnableFullscreenSupport: () => Promise<{ success: boolean; message: string }>;
  gsyncCalculateCap: (hz?: number) => Promise<number>;
  gsyncApplyCap: (cap: number, hz?: number) => Promise<GsyncCapResult>;
  benchmarkToggle: (gameName?: string) => Promise<{ isRecording: boolean; session: BenchmarkSession | null; message: string }>;
  benchmarkGetStatus: () => Promise<{ isRecording: boolean; elapsedSeconds: number; sampleCount: number; currentFps: number; lastSession: BenchmarkSession | null }>;
  benchmarkGetHistory: () => Promise<BenchmarkSession[]>;
  benchmarkClearHistory: () => Promise<boolean>;
  benchmarkExportCsv: () => Promise<{ success: boolean; filePath?: string; csvContent: string }>;
  onBenchmarkStatusChanged: (callback: (status: { isRecording: boolean; elapsedSeconds: number }) => void) => () => void;
  startupGetStatus: () => Promise<StartupConfig>;
  startupSetStatus: (enabled: boolean, silent?: boolean) => Promise<{ success: boolean; message: string }>;
  licenseGetStatus: () => Promise<LicenseStatus>;
  licenseActivate: (key: string, name?: string) => Promise<{ success: boolean; message: string; isPro: boolean }>;
  licenseDeactivate: () => Promise<{ success: boolean; message: string }>;
}

const api: OptimizerApi = {
  getCatalog: () => ipcRenderer.invoke('optimizer:get-catalog'),
  getQuickStates: () => ipcRenderer.invoke('optimizer:get-quick-states'),
  detectAll: (force?: boolean) => ipcRenderer.invoke('optimizer:detect-all', force),
  isInitialScanDone: () => ipcRenderer.invoke('optimizer:is-initial-scan-done'),
  detectItem: (id: string) => ipcRenderer.invoke('optimizer:detect-item', id),
  previewDryRun: (id: string) => ipcRenderer.invoke('optimizer:preview-dry-run', id),
  apply: (id: string, isDryRun: boolean) => ipcRenderer.invoke('optimizer:apply', id, isDryRun),
  revert: (id: string) => ipcRenderer.invoke('optimizer:revert', id),
  revertAll: () => ipcRenderer.invoke('optimizer:revert-all'),
  applyRecommended: (isDryRun: boolean) => ipcRenderer.invoke('optimizer:apply-recommended', isDryRun),
  getHealthScore: () => ipcRenderer.invoke('optimizer:get-health-score'),
  getSystemMetrics: () => ipcRenderer.invoke('optimizer:get-metrics'),
  createRestorePoint: (desc?: string) => ipcRenderer.invoke('optimizer:create-restore-point', desc),
  getAuditLogs: () => ipcRenderer.invoke('optimizer:get-audit-logs'),
  getProfiles: () => ipcRenderer.invoke('optimizer:get-profiles'),
  saveProfile: (profile: OptimizationProfile) => ipcRenderer.invoke('optimizer:save-profile', profile),
  deleteProfile: (id: string) => ipcRenderer.invoke('optimizer:delete-profile', id),
  exportHtmlReport: () => ipcRenderer.invoke('optimizer:export-html-report'),
  checkIsAdmin: () => ipcRenderer.invoke('optimizer:check-admin'),
  relaunchAsAdmin: () => ipcRenderer.invoke('optimizer:relaunch-admin'),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  isWindowMaximized: () => ipcRenderer.invoke('window:is-maximized'),
  detectRunningGame: (gameProcessNames: string[]) => ipcRenderer.invoke('optimizer:detect-running-game', gameProcessNames),
  onWindowStateChanged: (callback: (state: { isFocused: boolean; isMinimized?: boolean }) => void) => {
    const handler = (_: any, state: { isFocused: boolean; isMinimized?: boolean }) => callback(state);
    ipcRenderer.on('window:state-changed', handler);
    return () => {
      ipcRenderer.removeListener('window:state-changed', handler);
    };
  },
  getNetworkPriority: () => ipcRenderer.invoke('optimizer:get-network-priority'),
  setNetworkPriority: (mode: 'ethernet' | 'wifi' | 'auto') => ipcRenderer.invoke('optimizer:set-network-priority', mode),
  dnsBenchmarkAll: () => ipcRenderer.invoke('dns:benchmark-all'),
  dnsApply: (primaryIp: string, secondaryIp: string) => ipcRenderer.invoke('dns:apply', primaryIp, secondaryIp),
  dnsReset: () => ipcRenderer.invoke('dns:reset'),
  shaderCacheGetStatus: () => ipcRenderer.invoke('shader-cache:get-status'),
  shaderCacheClean: (id?: string) => ipcRenderer.invoke('shader-cache:clean', id),
  startupGetItems: () => ipcRenderer.invoke('startup:get-items'),
  startupToggleItem: (item: any, enable: boolean) => ipcRenderer.invoke('startup:toggle-item', item, enable),
  onTrayActivateGaming: (callback: () => void) => {
    const handler = () => callback();
    ipcRenderer.on('tray:activate-gaming', handler);
    return () => {
      ipcRenderer.removeListener('tray:activate-gaming', handler);
    };
  },
  latencyRunBenchmark: () => ipcRenderer.invoke('latency:run-benchmark'),
  latencySetPrecisionTimer: (enable: boolean) => ipcRenderer.invoke('latency:set-precision-timer', enable),
  gameRouteGetGames: () => ipcRenderer.invoke('game-route:get-games'),
  gameRouteToggle: (gameId: string, enable: boolean) => ipcRenderer.invoke('game-route:toggle', gameId, enable),
  gameRoutePrioritizeAll: (enable: boolean) => ipcRenderer.invoke('game-route:prioritize-all', enable),
  gameRouteCleanNetwork: () => ipcRenderer.invoke('game-route:clean-network'),
  gameRouteGetStackStatus: () => ipcRenderer.invoke('game-route:get-stack-status'),
  gameRouteApplyStack: (enable: boolean) => ipcRenderer.invoke('game-route:apply-stack', enable),
  gameRouteToggleWifiScan: (disable: boolean) => ipcRenderer.invoke('game-route:toggle-wifi-scan', disable),
  gameRouteGetRoutes: () => ipcRenderer.invoke('game-route:get-routes'),
  gameRouteAddCustom: (name: string, processName: string) => ipcRenderer.invoke('game-route:add-custom', name, processName),
  gameRouteRemoveCustom: (gameId: string) => ipcRenderer.invoke('game-route:remove-custom', gameId),
  aiRecommend: (metrics: any) => ipcRenderer.invoke('ai:recommend', metrics),
  aiAutoApply: (metrics: any) => ipcRenderer.invoke('ai:auto-apply', metrics),
  oneClickBoost: () => ipcRenderer.invoke('optimizer:one-click-boost'),
  ramClean: () => ipcRenderer.invoke('ram:clean'),
  ramSetCompression: (enable: boolean) => ipcRenderer.invoke('ram:set-compression', enable),
  hotkeysGetList: () => ipcRenderer.invoke('hotkeys:get-list'),
  hotkeyUpdate: (actionId: string, accelerator: string) => ipcRenderer.invoke('hotkeys:update', actionId, accelerator),
  hotkeysResetDefaults: () => ipcRenderer.invoke('hotkeys:reset'),
  onHotkeyTrigger: (callback: (data: { action: string; message: string }) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('hotkey:trigger', handler);
    return () => {
      ipcRenderer.removeListener('hotkey:trigger', handler);
    };
  },
  runtimesGetStatus: () => ipcRenderer.invoke('runtimes:get-status'),
  runtimesInstall: (item: any) => ipcRenderer.invoke('runtimes:install', item),
  runtimesGetMpo: () => ipcRenderer.invoke('runtimes:get-mpo'),
  runtimesSetMpo: (disable: boolean) => ipcRenderer.invoke('runtimes:set-mpo', disable),
  msiGetDevices: () => ipcRenderer.invoke('msi:get-devices'),
  msiSetDevice: (deviceId: string, enable: boolean, priority?: string) => ipcRenderer.invoke('msi:set-device', deviceId, enable, priority),
  lassoGetTargets: () => ipcRenderer.invoke('lasso:get-targets'),
  lassoSetPriority: (processName: string, priority: string) => ipcRenderer.invoke('lasso:set-priority', processName, priority),
  lassoSetAffinity: (processName: string, coreIndices: number[]) => ipcRenderer.invoke('lasso:set-affinity', processName, coreIndices),
  lassoApplyBoost: (processName: string) => ipcRenderer.invoke('lasso:apply-boost', processName),
  lassoAddCustom: (processName: string) => ipcRenderer.invoke('lasso:add-custom', processName),
  lassoRemoveCustom: (processName: string) => ipcRenderer.invoke('lasso:remove-custom', processName),
  debloatGetApps: () => ipcRenderer.invoke('debloat:get-apps'),
  debloatUninstall: (appId: string) => ipcRenderer.invoke('debloat:uninstall', appId),
  debloatBatchRecommended: () => ipcRenderer.invoke('debloat:batch-recommended'),
  debloatRemoveOneDrive: () => ipcRenderer.invoke('debloat:remove-onedrive'),
  gpuTweakGetOverview: () => ipcRenderer.invoke('gpu-tweak:get-overview'),
  gpuTweakToggle: (settingId: string, enable: boolean) => ipcRenderer.invoke('gpu-tweak:toggle', settingId, enable),
  gpuTweakApplyCompetitive: () => ipcRenderer.invoke('gpu-tweak:apply-competitive'),
  timerGetStatus: () => ipcRenderer.invoke('timer:get-status'),
  timerSetPrecision: (enable: boolean) => ipcRenderer.invoke('timer:set-precision', enable),
  tournamentActivate: () => ipcRenderer.invoke('tournament:activate'),
  tournamentDeactivate: () => ipcRenderer.invoke('tournament:deactivate'),
  boosterGetState: () => ipcRenderer.invoke('booster:get-state'),
  boosterSetEnabled: (enable: boolean) => ipcRenderer.invoke('booster:set-enabled', enable),
  onBoosterGameStarted: (callback: (data: { game: string; message: string }) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('booster:game-started', handler);
    return () => {
      ipcRenderer.removeListener('booster:game-started', handler);
    };
  },
  onBoosterGameFinished: (callback: (data: { game: string; message: string }) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('booster:game-finished', handler);
    return () => {
      ipcRenderer.removeListener('booster:game-finished', handler);
    };
  },
  gameConfigGetConfigs: () => ipcRenderer.invoke('game-config:get-configs'),
  gameConfigOptimize: (gameId: string) => ipcRenderer.invoke('game-config:optimize', gameId),
  gameConfigRevert: (gameId: string) => ipcRenderer.invoke('game-config:revert', gameId),
  gameConfigOptimizeAll: () => ipcRenderer.invoke('game-config:optimize-all'),
  honeSuiteGetTweaks: () => ipcRenderer.invoke('hone-suite:get-tweaks'),
  honeSuiteApplyAll: () => ipcRenderer.invoke('hone-suite:apply-all'),
  maintGetTasks: () => ipcRenderer.invoke('maint:get-tasks'),
  maintRunTask: (taskId: string) => ipcRenderer.invoke('maint:run-task', taskId),
  maintRunFull: () => ipcRenderer.invoke('maint:run-full'),
  bottleneckGetSystemRig: () => ipcRenderer.invoke('bottleneck:get-system-rig'),
  bottleneckCalculate: (cpuName: string, gpuName: string, resolution: string, workload: string) =>
    ipcRenderer.invoke('bottleneck:calculate', cpuName, gpuName, resolution, workload),
  caniGetGames: (search?: string, genre?: string) => ipcRenderer.invoke('cani:get-games', search, genre),
  hmfQueryFps: (options: { gameId: string; resolution?: string; upscaling?: string; cpuName?: string; gpuName?: string }) =>
    ipcRenderer.invoke('hmf:query-fps', options),
  hmfGetStatus: () => ipcRenderer.invoke('hmf:get-status'),
  hmfSetApiKey: (key: string) => ipcRenderer.invoke('hmf:set-api-key', key),
  hmfGetApiKey: () => ipcRenderer.invoke('hmf:get-api-key'),
  cpuzGetData: () => ipcRenderer.invoke('cpuz:get-data'),
  cpuzRunBench: (mode: 'single' | 'multi' | 'stress') => ipcRenderer.invoke('cpuz:run-bench', mode),
  cpuzStopStress: () => ipcRenderer.invoke('cpuz:stop-stress'),
  cpuzGetLiveMetrics: () => ipcRenderer.invoke('cpuz:get-live-metrics'),
  updaterCheck: () => ipcRenderer.invoke('updater:check'),
  updaterDownloadInstall: (downloadUrl: string) => ipcRenderer.invoke('updater:download-install', downloadUrl),
  gameSensorScan: () => ipcRenderer.invoke('game-sensor:scan'),
  gameSensorAddCustom: (gameData: any) => ipcRenderer.invoke('game-sensor:add-custom', gameData),
  gameSensorRemoveCustom: (gameId: string) => ipcRenderer.invoke('game-sensor:remove-custom', gameId),
  overlayToggle: () => ipcRenderer.invoke('overlay:toggle'),
  overlaySetClickThrough: (ignore: boolean) => ipcRenderer.invoke('overlay:set-click-through', ignore),
  overlayToggleGhost: () => ipcRenderer.invoke('overlay:toggle-ghost'),
  overlayGetStatus: () => ipcRenderer.invoke('overlay:get-status'),
  overlaySetPosition: (preset: any) => ipcRenderer.invoke('overlay:set-position', preset),
  overlayClose: () => ipcRenderer.invoke('overlay:close'),
  onOverlayGhostChanged: (callback: (isClickThrough: boolean) => void) => {
    const handler = (_: any, val: boolean) => callback(val);
    ipcRenderer.on('overlay:ghost-changed', handler);
    return () => {
      ipcRenderer.removeListener('overlay:ghost-changed', handler);
    };
  },
  fpsGetLive: () => ipcRenderer.invoke('fps:get-live'),
  overlayGetConfig: () => ipcRenderer.invoke('overlay:get-config'),
  overlayUpdateConfig: (config: Partial<OverlayConfig>) => ipcRenderer.invoke('overlay:update-config', config),
  overlayResetConfig: () => ipcRenderer.invoke('overlay:reset-config'),
  onOverlayConfigChanged: (callback: (config: OverlayConfig) => void) => {
    const handler = (_: any, val: OverlayConfig) => callback(val);
    ipcRenderer.on('overlay:config-changed', handler);
    return () => {
      ipcRenderer.removeListener('overlay:config-changed', handler);
    };
  },
  overlayGetFullscreenSupport: () => ipcRenderer.invoke('overlay:get-fullscreen-support'),
  overlayEnableFullscreenSupport: () => ipcRenderer.invoke('overlay:enable-fullscreen-support'),
  gsyncCalculateCap: (hz?: number) => ipcRenderer.invoke('gsync:calculate-cap', hz),
  gsyncApplyCap: (cap: number, hz?: number) => ipcRenderer.invoke('gsync:apply-cap', cap, hz),
  benchmarkToggle: (gameName?: string) => ipcRenderer.invoke('benchmark:toggle', gameName),
  benchmarkGetStatus: () => ipcRenderer.invoke('benchmark:get-status'),
  benchmarkGetHistory: () => ipcRenderer.invoke('benchmark:get-history'),
  benchmarkClearHistory: () => ipcRenderer.invoke('benchmark:clear-history'),
  benchmarkExportCsv: () => ipcRenderer.invoke('benchmark:export-csv'),
  onBenchmarkStatusChanged: (callback: (status: { isRecording: boolean; elapsedSeconds: number }) => void) => {
    const handler = (_: any, val: any) => callback(val);
    ipcRenderer.on('benchmark:status-changed', handler);
    return () => {
      ipcRenderer.removeListener('benchmark:status-changed', handler);
    };
  },
  startupGetStatus: () => ipcRenderer.invoke('startup:get-status'),
  startupSetStatus: (enabled: boolean, silent?: boolean) => ipcRenderer.invoke('startup:set-status', enabled, silent),
  licenseGetStatus: () => ipcRenderer.invoke('license:get-status'),
  licenseActivate: (key: string, name?: string) => ipcRenderer.invoke('license:activate', key, name),
  licenseDeactivate: () => ipcRenderer.invoke('license:deactivate')
};

contextBridge.exposeInMainWorld('optimizerApi', api);
