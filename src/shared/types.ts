export type OptimizationRisk = 'safe' | 'moderate';
export type OptimizationType = 'alter' | 'inform' | 'clean';
export type OptimizationStatus = 'applied' | 'not_applied' | 'info' | 'error' | 'unsupported';

export type CategoryId =
  | 'input_latency'
  | 'network_internet'
  | 'wifi'
  | 'startup_services'
  | 'memory_storage'
  | 'cpu_gpu_power'
  | 'gaming'
  | 'visual_ui'
  | 'privacy_telemetry'
  | 'safe_cleanup'
  | 'maintenance_diag';

export interface CategoryMeta {
  id: CategoryId;
  index: number;
  name: string;
  shortDesc: string;
  icon: string;
  totalItems: number;
}

export interface HardwareCompat {
  win10?: boolean;
  win11?: boolean;
  desktop?: boolean;
  laptop?: boolean;
  requiresDedicatedGpu?: boolean;
  requiresWifi?: boolean;
}

export interface OptimizationItem {
  id: string;
  category: CategoryId;
  itemNumber: number;
  name: string;
  description: string;
  exactChange: string;
  risk: OptimizationRisk;
  type: OptimizationType;
  requiresAdmin: boolean;
  requiresReboot: boolean;
  compat: HardwareCompat;
  recommended: boolean;
}

export interface OptimizationState {
  item: OptimizationItem;
  status: OptimizationStatus;
  currentValue?: any;
  originalBackupValue?: any;
  lastActionTime?: string;
  infoValue?: string;
  error?: string;
}

export interface SystemMetrics {
  cpuUsagePercent: number;
  cpuModel?: string;
  cpuCores?: number;
  cpuThreads?: number;
  cpuClockSpeedGhz?: number;
  ramUsagePercent: number;
  ramUsedGb: number;
  ramTotalGb: number;
  ramFreeGb?: number;
  ramSpeedMhz?: number;
  gpuUsagePercent?: number;
  gpuTempC?: number;
  gpuName?: string;
  gpuVramMb?: number;
  diskUsagePercent: number;
  diskUsedGb?: number;
  diskTotalGb?: number;
  diskFreeGb?: number;
  diskModel?: string;
  networkBytesSec: number;
  currentPingMs?: number;
  networkAdapterName?: string;
  isLaptop: boolean;
  hasBattery: boolean;
  hasDedicatedGpu: boolean;
  hasWifi: boolean;
  windowsVersion: string;
  windowsBuild: string;
}

export interface AuditLogEntry {
  id: string;
  optimizationId: string;
  optimizationName: string;
  timestamp: string;
  action: 'apply' | 'revert' | 'dry_run' | 'detect' | 'cleanup';
  previousValue?: any;
  newValue?: any;
  status: 'success' | 'failure' | 'simulated';
  message: string;
}

export interface OptimizationProfile {
  id: string;
  name: string;
  description: string;
  icon: string;
  itemIds: string[];
  isBuiltIn: boolean;
}

export interface DryRunPreview {
  optimizationId: string;
  name: string;
  exactChange: string;
  currentValue: any;
  targetValue: any;
  commands: string[];
  risk: OptimizationRisk;
}

export interface BackupRecord {
  id: string;
  optimizationId: string;
  timestamp: string;
  originalValue: any;
  registryPath?: string;
  valueName?: string;
  powerGuid?: string;
  netAdapter?: string;
}

export type NetworkPriorityMode = 'ethernet' | 'wifi' | 'auto' | 'custom';

export interface NetworkAdapterItem {
  name: string;
  description: string;
  interfaceIndex: number;
  type: 'ethernet' | 'wifi' | 'other';
  status: string;
  linkSpeed: string;
  metric: number;
  isAutomaticMetric: boolean;
}

export interface NetworkPriorityState {
  mode: NetworkPriorityMode;
  adapters: NetworkAdapterItem[];
  activeAdapterName?: string;
  primaryType?: 'ethernet' | 'wifi' | 'other' | 'none';
  primaryAdapterName?: string;
}

export interface DnsServerItem {
  id: string;
  name: string;
  primaryIp: string;
  secondaryIp: string;
  provider: string;
  pingMs?: number;
  status: 'pending' | 'testing' | 'success' | 'failed';
  isCurrent?: boolean;
}

export interface StartupItem {
  id: string;
  name: string;
  command: string;
  location: string;
  enabled: boolean;
  impact: 'low' | 'medium' | 'high';
  publisher?: string;
}

export interface ShaderCacheCategory {
  id: string;
  name: string;
  path: string;
  sizeBytes: number;
  fileCount: number;
  exists: boolean;
}

export interface LatencyBenchmarkData {
  timerResolution: {
    currentMs: number;
    minimumMs: number;
    maximumMs: number;
    isOptimal: boolean;
  };
  serverPings: {
    name: string;
    location: string;
    host: string;
    ip: string;
    pingMs: number;
    jitterMs: number;
    status: 'good' | 'moderate' | 'poor';
  }[];
  dpcDivergenceMs: number;
  cpuInterruptLoadPercent: number;
  overallScore: number;
}

export interface GameRouteItem {
  id: string;
  name: string;
  processName: string;
  category: 'fps' | 'battle_royale' | 'moba' | 'racing' | 'other';
  icon: string;
  isPrioritized: boolean;
  dscpValue: number;
  detectedRunning?: boolean;
  isCustom?: boolean;
}

export interface ExitLagStackStatus {
  tcpNoDelay: boolean;
  tcpAckFrequency: boolean;
  networkThrottlingDisabled: boolean;
  systemResponsiveness: boolean;
  qosBandwidthLimitDisabled: boolean;
  udpBufferScaled: boolean;
  rscDisabled: boolean;
  rssEnabled: boolean;
  wifiScanDisabled: boolean;
}

export interface ExitLagServerRoute {
  id: string;
  name: string;
  region: string;
  city: string;
  country: string;
  ip: string;
  pingMs: number;
  jitterMs: number;
  packetLossPercent: number;
  quality: 'optimal' | 'good' | 'moderate' | 'poor' | 'offline';
  estimatedExitLagPing: number;
}

export interface DetectedGame {
  id: string;
  name: string;
  category: string;
  platform: 'Steam' | 'Epic Games' | 'Riot Games' | 'EA Desktop' | 'Ubisoft' | 'GOG Galaxy' | 'Xbox / Microsoft' | 'Personalizado' | 'Windows';
  coverImage: string;
  processNames: string[];
  installDir?: string;
  executablePath?: string;
  recommendedOptimizations: string[];
  description: string;
  isRunning?: boolean;
  isCustom?: boolean;
}


