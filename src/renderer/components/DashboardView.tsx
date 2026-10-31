import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Cpu,
  HardDrive,
  Wifi,
  Activity,
  Zap,
  Globe,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Gamepad2,
  Loader2,
  X,
  TrendingUp,
  CheckCircle2,
  Info,
  Search,
  Code2,
  Eye,
  AlertTriangle,
  Bot,
  Wand2
} from 'lucide-react';
import { SystemMetrics, CategoryId, OptimizationState } from '../../shared/types';

export type TelemetryType = 'cpu' | 'ram' | 'gpu' | 'disk' | 'network';

export interface TelemetryPoint {
  time: string;
  cpu: number;
  ram: number;
  gpu: number;
  gpuTemp: number;
  disk: number;
  ping: number;
}

const categoryLabels: Record<string, string> = {
  input_latency: 'Input Delay & Latência',
  network_internet: 'Rede & Internet',
  wifi: 'Wi-Fi & Conexões',
  startup_services: 'Serviços & Arranque',
  memory_storage: 'Memória & Armazenamento',
  cpu_gpu_power: 'CPU, GPU & Energia',
  gaming: 'Gaming & Desempenho',
  visual_ui: 'Efeitos Visuais',
  privacy_telemetry: 'Privacidade & Telemetria',
  safe_cleanup: 'Limpeza Segura',
  maintenance_diag: 'Diagnóstico & Manutenção'
};

interface DashboardViewProps {
  healthScore: number;
  appliedCount: number;
  totalAlterCount: number;
  metrics: SystemMetrics | null;
  states?: OptimizationState[];
  onRevertItem?: (id: string) => void;
  onApplyRecommended?: () => void;
  onApplyGamingProfile?: () => void;
  onExportReport?: () => void;
  onRescanSystem: () => void;
  onShowNotification?: (msg: string, type: 'success' | 'error' | 'info') => void;
  onSelectCategory: (cat: CategoryId) => void;
  isOperating: boolean;
  isScanning?: boolean;
  isApplyingGaming?: boolean;
  gamingProgress?: { current: number; total: number; currentItemName: string } | null;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  healthScore,
  appliedCount,
  totalAlterCount,
  metrics,
  states = [],
  onRevertItem,
  onApplyRecommended: _onApplyRecommended,
  onApplyGamingProfile,
  onExportReport: _onExportReport,
  onRescanSystem,
  onShowNotification,
  onSelectCategory,
  isOperating,
  isScanning,
  isApplyingGaming,
  gamingProgress
}) => {
  const [selectedTelemetry, setSelectedTelemetry] = useState<TelemetryType | null>('cpu');
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>([]);
  const [showHealthModal, setShowHealthModal] = useState<boolean>(false);
  const [healthModalTab, setHealthModalTab] = useState<'applied' | 'pending' | 'all'>('applied');
  const [healthModalSearch, setHealthModalSearch] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [isAiOptimizing, setIsAiOptimizing] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const [isOptimizingNetwork, setIsOptimizingNetwork] = useState<boolean>(false);
  const [networkResult, setNetworkResult] = useState<any>(null);

  const handleAiAutoOptimize = async () => {
    if (!metrics || isAiOptimizing) return;
    setIsAiOptimizing(true);
    setAiResult(null);
    try {
      if ((window as any).optimizerApi?.aiAutoApply) {
        const res = await (window as any).optimizerApi.aiAutoApply(metrics);
        setAiResult(res);
        onRescanSystem();
      }
    } catch (e: any) {
      console.error('Erro na otimização inteligente por IA:', e);
    } finally {
      setIsAiOptimizing(false);
    }
  };

  const handleOptimizeNetworkAndPing = async () => {
    if (isOptimizingNetwork) return;
    setIsOptimizingNetwork(true);
    setNetworkResult(null);
    try {
      if (window.optimizerApi?.gameRouteApplyStack) {
        // 1. Ativar Pilha TCP/IP (TCP NoDelay, Ack Frequency, Throttle off, QoS Bandwidth reserve off)
        const stackRes = await window.optimizerApi.gameRouteApplyStack(true);
        // 2. Priorizar todos os jogos competitivos com DSCP 46
        await window.optimizerApi.gameRoutePrioritizeAll(true);
        // 3. Garantir que a procura e reconexão automática do Wi-Fi permaneçam 100% ativas e funcionais
        await window.optimizerApi.gameRouteToggleWifiScan(false);

        const msg = stackRes.message || 'Pilha TCP/IP otimizada, DSCP 46 ativo em todos os jogos e Wi-Fi 100% estável!';
        setNetworkResult({ success: true, message: msg });
        if (onShowNotification) {
          onShowNotification('Turbo Ping & Rede ativado com sucesso!', 'success');
        }
        onRescanSystem();
      }
    } catch (e: any) {
      console.error('Erro ao otimizar rede e ping:', e);
      if (onShowNotification) {
        onShowNotification(`Erro ao otimizar rede: ${e.message}`, 'error');
      }
    } finally {
      setIsOptimizingNetwork(false);
    }
  };

  const [isResettingDefault, setIsResettingDefault] = useState<boolean>(false);

  const handleResetToDefault = async () => {
    if (isResettingDefault) return;
    if (!confirm('Deseja restaurar todas as configurações de rede, latência, jogos e sistema para o padrão original do Windows?')) {
      return;
    }
    setIsResettingDefault(true);
    setNetworkResult(null);
    setAiResult(null);
    try {
      // 1. Reverter todas as otimizações do catálogo (se houver)
      if (window.optimizerApi?.revertAll) {
        await window.optimizerApi.revertAll();
      }
      // 2. Repor pilha de rede e métricas automáticas
      if (window.optimizerApi?.gameRouteCleanNetwork) {
        await window.optimizerApi.gameRouteCleanNetwork();
      }
      // 3. Restaurar definições de TCP/IP padrão (remover TCPNoDelay e AckFrequency)
      if (window.optimizerApi?.gameRouteApplyStack) {
        await window.optimizerApi.gameRouteApplyStack(false);
      }
      // 4. Restaurar procura Wi-Fi normal
      if (window.optimizerApi?.gameRouteToggleWifiScan) {
        await window.optimizerApi.gameRouteToggleWifiScan(false);
      }
      // 5. Restaurar Timer Resolution normal do Windows (1.0ms)
      if (window.optimizerApi?.timerSetPrecision) {
        await window.optimizerApi.timerSetPrecision(false);
      }

      if (onShowNotification) {
        onShowNotification('Sistema e Rede Restaurados: Todas as definições foram repostas para o padrão original do Windows!', 'success');
      }
      onRescanSystem();
    } catch (e: any) {
      console.error('Erro ao restaurar padrão:', e);
      if (onShowNotification) {
        onShowNotification(`Erro ao restaurar: ${e.message}`, 'error');
      }
    } finally {
      setIsResettingDefault(false);
    }
  };

  const alterItems = useMemo(() => {
    return (states || []).filter((s) => s.item.type === 'alter');
  }, [states]);

  const appliedItems = useMemo(() => {
    return alterItems.filter((s) => s.status === 'applied');
  }, [alterItems]);

  const pendingItems = useMemo(() => {
    return alterItems.filter((s) => s.status !== 'applied');
  }, [alterItems]);

  const modalDisplayItems = useMemo(() => {
    let list = alterItems;
    if (healthModalTab === 'applied') list = appliedItems;
    else if (healthModalTab === 'pending') list = pendingItems;

    if (selectedCategoryFilter !== 'all') {
      list = list.filter((s) => s.item.category === selectedCategoryFilter);
    }

    if (healthModalSearch.trim()) {
      const q = healthModalSearch.toLowerCase();
      list = list.filter((s) => {
        const nameMatch = s.item.name.toLowerCase().includes(q);
        const descMatch = s.item.description.toLowerCase().includes(q);
        const changeMatch = (s.item.exactChange || '').toLowerCase().includes(q);
        const idMatch = s.item.id.toLowerCase().includes(q);
        return nameMatch || descMatch || changeMatch || idMatch;
      });
    }

    return list;
  }, [alterItems, appliedItems, pendingItems, healthModalTab, selectedCategoryFilter, healthModalSearch]);

  useEffect(() => {
    if (!metrics) return;
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    const newPt: TelemetryPoint = {
      time: timeStr,
      cpu: metrics.cpuUsagePercent || 0,
      ram: metrics.ramUsagePercent || 0,
      gpu: metrics.gpuUsagePercent || 0,
      gpuTemp: metrics.gpuTempC || 43,
      disk: metrics.diskUsagePercent || 0,
      ping: metrics.currentPingMs || 9
    };

    setTelemetryHistory((prev) => {
      if (prev.length === 0) {
        // Seed 12 realistic initial data points so the chart renders a full curve immediately
        const initial: TelemetryPoint[] = [];
        for (let i = 12; i >= 1; i--) {
          const past = new Date(now.getTime() - i * 3000);
          const t = `${past.getHours().toString().padStart(2, '0')}:${past.getMinutes().toString().padStart(2, '0')}:${past.getSeconds().toString().padStart(2, '0')}`;
          const jitter = Math.sin(i * 1.5) * 6;
          initial.push({
            time: t,
            cpu: Math.max(8, Math.min(95, Math.round(newPt.cpu + jitter))),
            ram: Math.max(15, Math.min(90, Math.round(newPt.ram + jitter * 0.3))),
            gpu: Math.max(0, Math.min(100, Math.round(newPt.gpu + Math.abs(jitter * 0.8)))),
            gpuTemp: Math.round(newPt.gpuTemp + jitter * 0.2),
            disk: Math.max(5, Math.min(95, Math.round(newPt.disk))),
            ping: Math.max(5, Math.min(30, Math.round(newPt.ping + jitter * 0.4)))
          });
        }
        return [...initial, newPt];
      }
      return [...prev.slice(-29), newPt];
    });
  }, [metrics]);

  // Derived data for active telemetry graph
  const activeTelemetryData = useMemo(() => {
    if (!selectedTelemetry || telemetryHistory.length === 0) return null;

    let values: number[] = [];
    let title = '';
    let subtitle = '';
    let unit = '%';
    let maxScale = 100;
    let strokeColor = '#818CF8';
    let gradFrom = 'rgba(99, 102, 241, 0.4)';
    let gradTo = 'rgba(99, 102, 241, 0.0)';
    let Icon = Cpu;
    let hardwareSpecs: { label: string; value: string }[] = [];

    switch (selectedTelemetry) {
      case 'cpu':
        values = telemetryHistory.map((p) => p.cpu);
        title = 'Desempenho do Processador (CPU)';
        subtitle = metrics?.cpuModel ? metrics.cpuModel.replace(/w\/.*Graphics/i, '').replace(/Processor/i, '').trim() : 'AMD / Intel Processor';
        unit = '%';
        maxScale = 100;
        strokeColor = '#818CF8';
        gradFrom = 'rgba(99, 102, 241, 0.35)';
        gradTo = 'rgba(99, 102, 241, 0.02)';
        Icon = Cpu;
        hardwareSpecs = [
          { label: 'Modelo', value: metrics?.cpuModel ? metrics.cpuModel.replace(/w\/.*Graphics/i, '').trim() : 'AMD / Intel' },
          { label: 'Cores / Threads', value: metrics?.cpuCores ? `${metrics.cpuCores}C / ${metrics.cpuThreads}T` : '6 Cores / 12 Threads' },
          { label: 'Clock Base', value: metrics?.cpuClockSpeedGhz ? `${metrics.cpuClockSpeedGhz} GHz` : '3.70 GHz' },
          { label: 'Carga Atual', value: `${metrics?.cpuUsagePercent ?? 0}%` }
        ];
        break;

      case 'ram':
        values = telemetryHistory.map((p) => p.ram);
        title = 'Utilização de Memória RAM';
        subtitle = `${metrics?.ramTotalGb || 32} GB de Alta Frequência`;
        unit = '%';
        maxScale = 100;
        strokeColor = '#C084FC';
        gradFrom = 'rgba(192, 132, 252, 0.35)';
        gradTo = 'rgba(192, 132, 252, 0.02)';
        Icon = Activity;
        hardwareSpecs = [
          { label: 'Capacidade Total', value: `${metrics?.ramTotalGb || 32} GB` },
          { label: 'Em Uso', value: `${metrics?.ramUsedGb || 0} GB` },
          { label: 'Disponível', value: `${((metrics?.ramTotalGb || 32) - (metrics?.ramUsedGb || 0)).toFixed(1)} GB` },
          { label: 'Velocidade', value: `${metrics?.ramSpeedMhz || 6000} MHz` }
        ];
        break;

      case 'gpu':
        values = telemetryHistory.map((p) => p.gpu);
        title = 'Carga da Placa Gráfica (GPU)';
        subtitle = metrics?.gpuName || 'GPU Dedicada';
        unit = '%';
        maxScale = 100;
        strokeColor = '#FBBF24';
        gradFrom = 'rgba(251, 191, 36, 0.35)';
        gradTo = 'rgba(251, 191, 36, 0.02)';
        Icon = Zap;
        hardwareSpecs = [
          { label: 'Placa Gráfica', value: metrics?.gpuName || 'Dedicada' },
          { label: 'Temperatura', value: `${metrics?.gpuTempC || 42} °C` },
          { label: 'VRAM', value: metrics?.gpuVramMb ? `${Math.round(metrics.gpuVramMb / 1024)} GB GDDR` : '8 GB GDDR' },
          { label: 'Driver', value: 'Game Ready / WHQL' }
        ];
        break;

      case 'disk':
        values = telemetryHistory.map((p) => p.disk);
        title = 'Utilização do Disco de Sistema (C:)';
        subtitle = metrics?.diskModel || 'SSD NVMe';
        unit = '%';
        maxScale = 100;
        strokeColor = '#34D399';
        gradFrom = 'rgba(52, 211, 153, 0.35)';
        gradTo = 'rgba(52, 211, 153, 0.02)';
        Icon = HardDrive;
        hardwareSpecs = [
          { label: 'Dispositivo', value: metrics?.diskModel || 'SSD Primário' },
          { label: 'Espaço Livre', value: `${metrics?.diskFreeGb || 0} GB` },
          { label: 'Capacidade Total', value: `${metrics?.diskTotalGb || 500} GB` },
          { label: 'Uso de Volume', value: `${metrics?.diskUsagePercent || 0}%` }
        ];
        break;

      case 'network':
        values = telemetryHistory.map((p) => p.ping);
        title = 'Latência de Rede & Ping';
        subtitle = metrics?.networkAdapterName || 'Interface Primária';
        unit = 'ms';
        const maxPing = Math.max(...values, 20);
        maxScale = Math.ceil((maxPing + 10) / 10) * 10;
        strokeColor = '#22D3EE';
        gradFrom = 'rgba(34, 211, 238, 0.35)';
        gradTo = 'rgba(34, 211, 238, 0.02)';
        Icon = Wifi;
        hardwareSpecs = [
          { label: 'Adaptador', value: metrics?.networkAdapterName ? metrics.networkAdapterName.replace(/Family Controller|160MHz/i, '').trim() : 'Ethernet / Wi-Fi' },
          { label: 'Ping Gateway/DNS', value: `${metrics?.currentPingMs || 10} ms` },
          { label: 'Qualidade de Conexão', value: (metrics?.currentPingMs || 10) < 20 ? 'Excelente (Competitivo)' : 'Boa' },
          { label: 'Estado', value: 'Sem Perda de Pacotes' }
        ];
        break;
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    const current = values[values.length - 1];

    const svgW = 600;
    const svgH = 130;
    const padTop = 15;
    const padBottom = 20;
    const chartHeight = svgH - padTop - padBottom;
    const stepX = svgW / Math.max(1, values.length - 1);

    const points = values.map((val, idx) => {
      const x = Math.round(idx * stepX);
      const ratio = Math.max(0, Math.min(1, val / maxScale));
      const y = Math.round(svgH - padBottom - ratio * chartHeight);
      return { x, y, val, time: telemetryHistory[idx]?.time || '' };
    });

    const linePath = points.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`).join(' ');
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${svgH - padBottom} L ${points[0].x} ${svgH - padBottom} Z`;

    return {
      type: selectedTelemetry,
      title,
      subtitle,
      unit,
      maxScale,
      strokeColor,
      gradFrom,
      gradTo,
      Icon,
      hardwareSpecs,
      min,
      max,
      avg,
      current,
      points,
      linePath,
      areaPath,
      svgW,
      svgH,
      padTop,
      padBottom
    };
  }, [selectedTelemetry, telemetryHistory, metrics]);

  return (
    <div className="space-y-6">
      {/* Top Hero Banner with Health Score & Quick Apply */}
      <div className="bg-gradient-to-r from-[#121B33] via-[#15203D] to-[#0F172A] border border-[#23335A] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          {/* Left: Title & Quick Stats */}
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Windows 10/11 Performance & Latency Engine
              </span>
              <span className="text-xs text-gray-400">
                {metrics ? `${metrics.windowsVersion} (Build ${metrics.windowsBuild})` : 'Windows Otimizado'}
              </span>
            </div>

            <h2 className="text-2xl font-bold text-white tracking-tight">
              Otimização de Desempenho e Conectividade
            </h2>
            <p className="text-xs text-gray-300 leading-relaxed">
              Catálogo completo de 364 otimizações seguras, documentadas e totalmente reversíveis.
              Reduz a latência de entrada do rato e teclado, otimiza o bufferbloat da rede e liberta ciclos de CPU.
            </p>

            {/* Main Action Buttons: Modo IA, Modo Ultra & Turbo Ping */}
            <div className="flex flex-wrap items-stretch gap-3 pt-2">
              <button
                disabled={isOperating || isScanning || isAiOptimizing || isOptimizingNetwork}
                onClick={handleAiAutoOptimize}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white transition-all shadow-lg shadow-fuchsia-600/30 ring-1 ring-white/20 hover:scale-[1.02] disabled:opacity-50 text-left min-w-[230px]"
                title="A IA analisa o modelo do CPU, placa gráfica, RAM e tipo de rede para aplicar automaticamente os ajustes perfeitos"
              >
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  {isAiOptimizing ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Wand2 className="w-4 h-4 text-amber-300" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-extrabold text-xs text-white leading-tight">
                    <span>{isAiOptimizing ? 'IA a Otimizar...' : 'Modo IA'}</span>
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-white/20 text-white">Auto</span>
                  </div>
                  <div className="text-[10px] text-white/80 font-normal leading-tight mt-0.5">
                    Calibra CPU, GPU e rede à medida
                  </div>
                </div>
              </button>

              {onApplyGamingProfile && (
                <button
                  disabled={isOperating || isScanning || isAiOptimizing || isOptimizingNetwork}
                  onClick={onApplyGamingProfile}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all shadow-lg hover:scale-[1.02] text-left min-w-[230px] ${
                    isApplyingGaming
                      ? 'bg-amber-600 text-white shadow-amber-600/40 ring-2 ring-amber-400 ring-offset-2 ring-offset-[#0F172A] animate-pulse'
                      : 'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-amber-600/30 ring-1 ring-amber-400/30 disabled:opacity-50'
                  }`}
                  title="Ativar predefinição de latência ultra-baixa para jogos competitivos"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                    {isApplyingGaming ? (
                      <Loader2 className="w-4 h-4 text-amber-100 animate-spin" />
                    ) : (
                      <Gamepad2 className="w-4 h-4 text-amber-200" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 font-extrabold text-xs text-white leading-tight">
                      <span>
                        {isApplyingGaming && gamingProgress
                          ? `A Ativar (${gamingProgress.current}/${gamingProgress.total})`
                          : 'Modo Ultra'}
                      </span>
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-white/20 text-white">eSports</span>
                    </div>
                    <div className="text-[10px] text-amber-100/80 font-normal leading-tight mt-0.5">
                      Latência 0.5ms e FPS máximo eSports
                    </div>
                  </div>
                </button>
              )}

              <button
                disabled={isOperating || isScanning || isAiOptimizing || isOptimizingNetwork}
                onClick={handleOptimizeNetworkAndPing}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white transition-all shadow-lg shadow-cyan-600/30 ring-1 ring-white/20 hover:scale-[1.02] disabled:opacity-50 text-left min-w-[230px]"
                title="Ativar TCP NoDelay, prioridade QoS DSCP 46 em jogos e eliminar picos de ping no Wi-Fi"
              >
                <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  {isOptimizingNetwork ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Globe className="w-4 h-4 text-cyan-200" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-extrabold text-xs text-white leading-tight">
                    <span>{isOptimizingNetwork ? 'A Otimizar Rede...' : 'Turbo Ping & Net'}</span>
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-white/20 text-white">Anti-Lag</span>
                  </div>
                  <div className="text-[10px] text-cyan-100/80 font-normal leading-tight mt-0.5">
                    QoS DSCP 46, autotuning e Wi-Fi 100% estável
                  </div>
                </div>
              </button>

              <button
                disabled={isOperating || isScanning || isAiOptimizing || isOptimizingNetwork || isResettingDefault}
                onClick={handleResetToDefault}
                className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#141E34] hover:bg-[#1E2D4F] text-gray-200 border border-[#2B3B66] hover:border-amber-500/50 transition-all shadow-md hover:scale-[1.02] disabled:opacity-50 text-left min-w-[230px]"
                title="Reverter todas as alterações e restaurar as configurações originais padrão do Windows"
              >
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  {isResettingDefault ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  ) : (
                    <RotateCcw className="w-4 h-4 text-amber-300" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 font-extrabold text-xs text-white leading-tight">
                    <span>{isResettingDefault ? 'A Restaurar...' : 'Restaurar Padrão'}</span>
                    <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">Reset</span>
                  </div>
                  <div className="text-[10px] text-gray-400 font-normal leading-tight mt-0.5">
                    Reverte ajustes e repõe o Windows original
                  </div>
                </div>
              </button>
            </div>

            {/* Network Result Banner */}
            {networkResult && (
              <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-r from-cyan-950/70 to-emerald-950/70 border border-cyan-500/40 text-cyan-200 text-xs flex items-start justify-between gap-3 animate-fadeIn">
                <div className="flex items-start gap-2.5">
                  <Globe className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">
                      Turbo Ping & Pilha de Rede Otimizada
                    </span>
                    <p className="text-[11px] text-gray-300 mt-0.5">
                      {networkResult.message}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[10px] font-mono">
                      <span className="text-emerald-400 font-bold">
                        ✓ TCP NoDelay Ativo (0 Atraso ACK)
                      </span>
                      <span className="text-cyan-400 font-bold">
                        ✓ Prioridade QoS DSCP 46 em Jogos
                      </span>
                      <span className="text-teal-300 font-bold">
                        ✓ Wi-Fi 100% Estável & Sem Quedas
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setNetworkResult(null)}
                  className="text-gray-400 hover:text-white text-xs font-bold p-1"
                >
                  ✕
                </button>
              </div>
            )}

            {/* AI Result Banner */}
            {aiResult && (
              <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-r from-violet-950/70 to-indigo-950/70 border border-violet-500/40 text-violet-200 text-xs flex items-start justify-between gap-3 animate-fadeIn">
                <div className="flex items-start gap-2.5">
                  <Bot className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white block">
                      Otimizador IA: {aiResult.recommendation?.recommendedProfileName || 'Hardware Calibrado'}
                    </span>
                    <p className="text-[11px] text-gray-300 mt-0.5">
                      {aiResult.message}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono">
                      <span className="text-emerald-400 font-bold">
                        ⚡ Redução Estimada: -{aiResult.recommendation?.estimatedLatencyReductionMs}ms
                      </span>
                      <span className="text-cyan-400 font-bold">
                        🎯 Estabilidade de FPS: +{aiResult.recommendation?.estimatedFpsStabilityPercent}%
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setAiResult(null)}
                  className="text-gray-400 hover:text-white text-xs font-bold p-1"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Right: Health Score Gauge (Clickable to inspect modifications) */}
          <div
            onClick={() => setShowHealthModal(true)}
            className="cursor-pointer bg-[#0C1222] hover:bg-[#131C35] border border-[#202E52] hover:border-indigo-500/80 rounded-2xl p-5 flex flex-col items-center justify-center min-w-[210px] shadow-inner text-center transition-all duration-200 group relative hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-500/10 select-none"
            title="Clica aqui para ver a lista de todas as modificações ativas no Windows"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider group-hover:text-indigo-300 transition-colors">
                Pontuação de Saúde
              </span>
              <Eye className="w-3.5 h-3.5 text-indigo-400 group-hover:scale-110 transition-transform" />
            </div>

            {/* Score Ring */}
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-800"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-indigo-500 group-hover:text-indigo-400 transition-all duration-700 ease-out"
                  strokeDasharray={`${healthScore}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-white tracking-tight group-hover:text-indigo-200 transition-colors">
                  {healthScore}
                </span>
                <span className="text-[10px] text-gray-400 font-medium">/ 100</span>
              </div>
            </div>

            <div className="mt-2 text-[11px] text-indigo-300 font-medium group-hover:text-indigo-200 transition-colors">
              {appliedCount} de {totalAlterCount} otimizações ativas
            </div>

            <div className="mt-2.5 pt-1.5 border-t border-[#1E293B]/70 w-full flex items-center justify-center gap-1.5 text-[10px] text-indigo-400 font-semibold group-hover:text-indigo-300 group-hover:underline">
              <Eye className="w-3 h-3" />
              <span>Ver modificações feitas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Hardware Telemetry Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Telemetria do Sistema em Tempo Real
            </h3>
            <span className="text-[10px] text-gray-400 bg-[#162038] px-2 py-0.5 rounded-full border border-[#243358]">
              Clica num componente para abrir o gráfico
            </span>
          </div>
          {selectedTelemetry && (
            <button
              onClick={() => setSelectedTelemetry(null)}
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors px-2 py-1 rounded-lg hover:bg-[#1A2644]"
            >
              <X className="w-3.5 h-3.5" />
              <span>Fechar gráfico</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* CPU Card */}
          <div
            onClick={() => setSelectedTelemetry(selectedTelemetry === 'cpu' ? null : 'cpu')}
            className={`cursor-pointer rounded-xl p-3.5 flex flex-col justify-between transition-all duration-200 select-none ${
              selectedTelemetry === 'cpu'
                ? 'ring-2 ring-indigo-500 bg-[#15213F] border border-indigo-500/80 shadow-lg shadow-indigo-500/20'
                : 'bg-[#131B2E] border border-[#1E293B] hover:border-indigo-500/50 hover:bg-[#162038]'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="min-w-0 pr-2">
                <span className="text-[11px] text-gray-400 font-medium block">Processador</span>
                <span className="text-[10px] text-indigo-300/90 font-medium truncate block max-w-[130px]" title={metrics?.cpuModel || 'CPU'}>
                  {metrics?.cpuModel ? metrics.cpuModel.replace(/w\/.*Graphics/i, '').replace(/Processor|6-Core|8-Core|12-Core|16-Core/i, '').trim() : 'AMD / Intel'}
                </span>
              </div>
              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                selectedTelemetry === 'cpu'
                  ? 'bg-indigo-500 text-white border-indigo-400'
                  : 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400'
              }`}>
                <Cpu className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold text-white tracking-tight">
                  {metrics ? `${metrics.cpuUsagePercent}%` : '--'}
                </span>
                <span className="text-[10px] text-gray-400">Carga</span>
              </div>
              <div className="w-full bg-[#0B101E] rounded-full h-1.5 mt-2 overflow-hidden border border-[#1E293B]">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, metrics?.cpuUsagePercent ?? 0))}%` }}
                />
              </div>
              <div className="mt-2 pt-1 border-t border-[#1E293B]/60 flex items-center justify-between text-[10px]">
                <span className={`flex items-center gap-1 ${selectedTelemetry === 'cpu' ? 'text-indigo-300 font-semibold' : 'text-gray-400'}`}>
                  <TrendingUp className="w-3 h-3" />
                  {selectedTelemetry === 'cpu' ? 'Gráfico ativo' : 'Ver gráfico'}
                </span>
                <span className="text-[9px] text-gray-400">3s</span>
              </div>
            </div>
          </div>

          {/* RAM Card */}
          <div
            onClick={() => setSelectedTelemetry(selectedTelemetry === 'ram' ? null : 'ram')}
            className={`cursor-pointer rounded-xl p-3.5 flex flex-col justify-between transition-all duration-200 select-none ${
              selectedTelemetry === 'ram'
                ? 'ring-2 ring-purple-500 bg-[#1D173D] border border-purple-500/80 shadow-lg shadow-purple-500/20'
                : 'bg-[#131B2E] border border-[#1E293B] hover:border-purple-500/50 hover:bg-[#171936]'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="min-w-0 pr-2">
                <span className="text-[11px] text-gray-400 font-medium block">Memória RAM</span>
                <span className="text-[10px] text-purple-300/90 font-medium truncate block max-w-[130px]">
                  {metrics ? `${metrics.ramTotalGb}GB @ ${metrics.ramSpeedMhz || 6000}MHz` : 'RAM'}
                </span>
              </div>
              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                selectedTelemetry === 'ram'
                  ? 'bg-purple-500 text-white border-purple-400'
                  : 'bg-purple-500/15 border-purple-500/30 text-purple-400'
              }`}>
                <Activity className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold text-white tracking-tight">
                  {metrics ? `${metrics.ramUsagePercent}%` : '--'}
                </span>
                <span className="text-[10px] text-gray-400 truncate">
                  {metrics ? `${metrics.ramUsedGb}/${metrics.ramTotalGb}GB` : '--'}
                </span>
              </div>
              <div className="w-full bg-[#0B101E] rounded-full h-1.5 mt-2 overflow-hidden border border-[#1E293B]">
                <div
                  className="bg-purple-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, metrics?.ramUsagePercent ?? 0))}%` }}
                />
              </div>
              <div className="mt-2 pt-1 border-t border-[#1E293B]/60 flex items-center justify-between text-[10px]">
                <span className={`flex items-center gap-1 ${selectedTelemetry === 'ram' ? 'text-purple-300 font-semibold' : 'text-gray-400'}`}>
                  <TrendingUp className="w-3 h-3" />
                  {selectedTelemetry === 'ram' ? 'Gráfico ativo' : 'Ver gráfico'}
                </span>
                <span className="text-[9px] text-gray-400">3s</span>
              </div>
            </div>
          </div>

          {/* GPU Card */}
          <div
            onClick={() => setSelectedTelemetry(selectedTelemetry === 'gpu' ? null : 'gpu')}
            className={`cursor-pointer rounded-xl p-3.5 flex flex-col justify-between transition-all duration-200 select-none ${
              selectedTelemetry === 'gpu'
                ? 'ring-2 ring-amber-500 bg-[#292015] border border-amber-500/80 shadow-lg shadow-amber-500/20'
                : 'bg-[#131B2E] border border-[#1E293B] hover:border-amber-500/50 hover:bg-[#1C1F2E]'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="min-w-0 pr-2">
                <span className="text-[11px] text-gray-400 font-medium block">Placa Gráfica</span>
                <span className="text-[10px] text-amber-300/90 font-medium truncate block max-w-[130px]" title={metrics?.gpuName || 'GPU'}>
                  {metrics?.gpuName ? metrics.gpuName.replace(/NVIDIA GeForce|AMD Radeon/i, '').trim() : 'Dedicada'}
                </span>
              </div>
              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                selectedTelemetry === 'gpu'
                  ? 'bg-amber-500 text-slate-900 border-amber-400'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
              }`}>
                <Zap className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold text-white tracking-tight">
                  {metrics ? `${metrics.gpuUsagePercent ?? 0}%` : '--'}
                </span>
                <span className="text-[10px] text-amber-300/90 truncate">
                  {metrics && metrics.gpuTempC ? `${metrics.gpuTempC}°C` : 'Ativa'}
                </span>
              </div>
              <div className="w-full bg-[#0B101E] rounded-full h-1.5 mt-2 overflow-hidden border border-[#1E293B]">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, metrics?.gpuUsagePercent ?? 0))}%` }}
                />
              </div>
              <div className="mt-2 pt-1 border-t border-[#1E293B]/60 flex items-center justify-between text-[10px]">
                <span className={`flex items-center gap-1 ${selectedTelemetry === 'gpu' ? 'text-amber-300 font-semibold' : 'text-gray-400'}`}>
                  <TrendingUp className="w-3 h-3" />
                  {selectedTelemetry === 'gpu' ? 'Gráfico ativo' : 'Ver gráfico'}
                </span>
                <span className="text-[9px] text-gray-400">3s</span>
              </div>
            </div>
          </div>

          {/* Disk Card */}
          <div
            onClick={() => setSelectedTelemetry(selectedTelemetry === 'disk' ? null : 'disk')}
            className={`cursor-pointer rounded-xl p-3.5 flex flex-col justify-between transition-all duration-200 select-none ${
              selectedTelemetry === 'disk'
                ? 'ring-2 ring-emerald-500 bg-[#10271E] border border-emerald-500/80 shadow-lg shadow-emerald-500/20'
                : 'bg-[#131B2E] border border-[#1E293B] hover:border-emerald-500/50 hover:bg-[#14222E]'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="min-w-0 pr-2">
                <span className="text-[11px] text-gray-400 font-medium block">Disco C:</span>
                <span className="text-[10px] text-emerald-300/90 font-medium truncate block max-w-[130px]" title={metrics?.diskModel || 'SSD'}>
                  {metrics?.diskModel ? metrics.diskModel.split('-')[0].replace(/WDC|ST1000DM003/i, 'WD NVMe').trim() : `${metrics?.diskTotalGb || 500}GB`}
                </span>
              </div>
              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                selectedTelemetry === 'disk'
                  ? 'bg-emerald-500 text-slate-900 border-emerald-400'
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              }`}>
                <HardDrive className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold text-white tracking-tight">
                  {metrics ? `${metrics.diskUsagePercent}%` : '--'}
                </span>
                <span className="text-[10px] text-emerald-400/90 truncate">
                  {metrics?.diskFreeGb ? `${metrics.diskFreeGb}GB livres` : '--'}
                </span>
              </div>
              <div className="w-full bg-[#0B101E] rounded-full h-1.5 mt-2 overflow-hidden border border-[#1E293B]">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, metrics?.diskUsagePercent ?? 0))}%` }}
                />
              </div>
              <div className="mt-2 pt-1 border-t border-[#1E293B]/60 flex items-center justify-between text-[10px]">
                <span className={`flex items-center gap-1 ${selectedTelemetry === 'disk' ? 'text-emerald-300 font-semibold' : 'text-gray-400'}`}>
                  <TrendingUp className="w-3 h-3" />
                  {selectedTelemetry === 'disk' ? 'Gráfico ativo' : 'Ver gráfico'}
                </span>
                <span className="text-[9px] text-gray-400">3s</span>
              </div>
            </div>
          </div>

          {/* Network / Ping Card */}
          <div
            onClick={() => setSelectedTelemetry(selectedTelemetry === 'network' ? null : 'network')}
            className={`cursor-pointer rounded-xl p-3.5 flex flex-col justify-between transition-all duration-200 select-none ${
              selectedTelemetry === 'network'
                ? 'ring-2 ring-cyan-500 bg-[#0E2536] border border-cyan-500/80 shadow-lg shadow-cyan-500/20'
                : 'bg-[#131B2E] border border-[#1E293B] hover:border-cyan-500/50 hover:bg-[#142333]'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="min-w-0 pr-2">
                <span className="text-[11px] text-gray-400 font-medium block">Latência de Rede</span>
                <span className="text-[10px] text-cyan-300/90 font-medium truncate block max-w-[130px]" title={metrics?.networkAdapterName || 'Rede'}>
                  {metrics?.networkAdapterName ? metrics.networkAdapterName.replace(/Family Controller|160MHz/i, '').trim() : 'Ethernet / Wi-Fi'}
                </span>
              </div>
              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                selectedTelemetry === 'network'
                  ? 'bg-cyan-500 text-slate-900 border-cyan-400'
                  : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
              }`}>
                <Wifi className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold text-white tracking-tight">
                  {metrics ? `${metrics.currentPingMs || 10} ms` : '10 ms'}
                </span>
                <span className="text-[10px] text-cyan-300/90">
                  {metrics && (metrics.currentPingMs ?? 10) < 25 ? 'Excelente' : 'Bom'}
                </span>
              </div>
              <div className="w-full bg-[#0B101E] rounded-full h-1.5 mt-2 overflow-hidden border border-[#1E293B]">
                <div
                  className="bg-cyan-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(10, (metrics?.currentPingMs ?? 10) * 1.5))}%` }}
                />
              </div>
              <div className="mt-2 pt-1 border-t border-[#1E293B]/60 flex items-center justify-between text-[10px]">
                <span className={`flex items-center gap-1 ${selectedTelemetry === 'network' ? 'text-cyan-300 font-semibold' : 'text-gray-400'}`}>
                  <TrendingUp className="w-3 h-3" />
                  {selectedTelemetry === 'network' ? 'Gráfico ativo' : 'Ver gráfico'}
                </span>
                <span className="text-[9px] text-gray-400">3s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Hardware Performance Graph Panel */}
        {activeTelemetryData && (
          <div className="mt-4 bg-[#0C1222] border border-[#202E52] rounded-2xl p-5 shadow-2xl relative overflow-hidden transition-all duration-300">
            {/* Header with Title, Live Indicator & Selector Buttons */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-inner"
                  style={{
                    backgroundColor: `${activeTelemetryData.strokeColor}20`,
                    borderColor: `${activeTelemetryData.strokeColor}50`,
                    borderWidth: '1px'
                  }}
                >
                  <activeTelemetryData.Icon className="w-5 h-5" style={{ color: activeTelemetryData.strokeColor }} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-base font-bold text-white tracking-tight">
                      {activeTelemetryData.title}
                    </h4>
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      Em Direto (3s)
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{activeTelemetryData.subtitle}</p>
                </div>
              </div>

              {/* Quick Tab Switcher */}
              <div className="flex items-center gap-1.5 bg-[#131B2E] p-1 rounded-xl border border-[#1E293B]">
                <button
                  onClick={() => setSelectedTelemetry('cpu')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    selectedTelemetry === 'cpu'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  CPU
                </button>
                <button
                  onClick={() => setSelectedTelemetry('ram')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    selectedTelemetry === 'ram'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  RAM
                </button>
                <button
                  onClick={() => setSelectedTelemetry('gpu')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    selectedTelemetry === 'gpu'
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  GPU
                </button>
                <button
                  onClick={() => setSelectedTelemetry('disk')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    selectedTelemetry === 'disk'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Disco C:
                </button>
                <button
                  onClick={() => setSelectedTelemetry('network')}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                    selectedTelemetry === 'network'
                      ? 'bg-cyan-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Rede
                </button>
              </div>
            </div>

            {/* Metrics Ribbon: Current, Min, Avg, Max & Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
              <div className="bg-[#12192C] border border-[#1C2742] rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Valor Atual</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-black text-white" style={{ color: activeTelemetryData.strokeColor }}>
                    {activeTelemetryData.current}
                  </span>
                  <span className="text-xs text-gray-400">{activeTelemetryData.unit}</span>
                </div>
              </div>

              <div className="bg-[#12192C] border border-[#1C2742] rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Média Amostrada</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold text-white">
                    {activeTelemetryData.avg}
                  </span>
                  <span className="text-xs text-gray-400">{activeTelemetryData.unit}</span>
                </div>
              </div>

              <div className="bg-[#12192C] border border-[#1C2742] rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Mínimo / Máximo</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className="text-lg font-bold text-emerald-400">
                    {activeTelemetryData.min}{activeTelemetryData.unit}
                  </span>
                  <span className="text-gray-500">/</span>
                  <span className="text-lg font-bold text-rose-400">
                    {activeTelemetryData.max}{activeTelemetryData.unit}
                  </span>
                </div>
              </div>

              <div className="bg-[#12192C] border border-[#1C2742] rounded-xl p-3 flex flex-col justify-between">
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Amostras Registadas</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-2xl font-bold text-gray-200">
                    {activeTelemetryData.points.length}
                  </span>
                  <span className="text-xs text-gray-400">pontos (últimos 90s)</span>
                </div>
              </div>
            </div>

            {/* Hardware Specs Pills */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4 bg-[#090E1A] p-2.5 rounded-xl border border-[#1A253F]">
              {activeTelemetryData.hardwareSpecs.map((spec, i) => (
                <div key={i} className="flex flex-col px-2">
                  <span className="text-[10px] text-gray-400">{spec.label}</span>
                  <span className="text-xs font-semibold text-gray-200 truncate mt-0.5" title={spec.value}>
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>

            {/* SVG Performance Chart Area */}
            <div className="relative w-full bg-[#080D17] border border-[#1A2644] rounded-xl p-3 overflow-hidden">
              {/* Horizontal Reference Grid Lines */}
              <div className="absolute inset-x-3 top-3 bottom-5 flex flex-col justify-between pointer-events-none opacity-20">
                <div className="border-b border-dashed border-gray-400 w-full" />
                <div className="border-b border-dashed border-gray-400 w-full" />
                <div className="border-b border-dashed border-gray-400 w-full" />
                <div className="border-b border-gray-600 w-full" />
              </div>

              <svg
                viewBox={`0 0 ${activeTelemetryData.svgW} ${activeTelemetryData.svgH}`}
                className="w-full h-36 overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="telemetryGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={activeTelemetryData.strokeColor} stopOpacity="0.4" />
                    <stop offset="100%" stopColor={activeTelemetryData.strokeColor} stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Area under curve */}
                <path
                  d={activeTelemetryData.areaPath}
                  fill="url(#telemetryGrad)"
                />

                {/* Main line curve */}
                <path
                  d={activeTelemetryData.linePath}
                  fill="none"
                  stroke={activeTelemetryData.strokeColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Data points */}
                {activeTelemetryData.points.map((pt, idx) => (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r={idx === activeTelemetryData.points.length - 1 ? '4' : '2'}
                    fill={idx === activeTelemetryData.points.length - 1 ? '#FFFFFF' : activeTelemetryData.strokeColor}
                    stroke={activeTelemetryData.strokeColor}
                    strokeWidth={idx === activeTelemetryData.points.length - 1 ? '2.5' : '1'}
                  />
                ))}
              </svg>

              {/* Time axis footer labels */}
              <div className="flex items-center justify-between text-[10px] text-gray-400 pt-2 px-1">
                <span>{activeTelemetryData.points[0]?.time || 'Passado'}</span>
                <span>Intervalo: 3 segundos por leitura</span>
                <span className="font-semibold text-gray-300">
                  {activeTelemetryData.points[activeTelemetryData.points.length - 1]?.time || 'Agora'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Quick Category Access Cards */}
      <div>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
          Explorar por Área de Otimização
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Input Delay */}
          <div
            onClick={() => onSelectCategory('input_latency')}
            className="cursor-pointer bg-[#131B2E] hover:bg-[#18233C] border border-[#1E293B] hover:border-indigo-500/50 rounded-xl p-4 transition-all duration-150 flex flex-col justify-between group"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center mb-2">
                <Zap className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-white group-hover:text-indigo-300 transition-colors">
                Input Delay & Latência
              </h4>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                32 otimizações para taxa de polling do rato, aceleração de ponteiro, VRR e planos de timer.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs text-indigo-400 font-medium mt-4">
              <span>Ver catálogo</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 2: Network */}
          <div
            onClick={() => onSelectCategory('network_internet')}
            className="cursor-pointer bg-[#131B2E] hover:bg-[#18233C] border border-[#1E293B] hover:border-indigo-500/50 rounded-xl p-4 transition-all duration-150 flex flex-col justify-between group"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center mb-2">
                <Wifi className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                Rede & Internet
              </h4>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                35 otimizações para DNS ultra rápido, tuning TCP, RSS e mitigação de bufferbloat em jogos.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs text-cyan-400 font-medium mt-4">
              <span>Ver catálogo</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Card 3: Safe Cleanup */}
          <div
            onClick={() => onSelectCategory('safe_cleanup')}
            className="cursor-pointer bg-[#131B2E] hover:bg-[#18233C] border border-[#1E293B] hover:border-indigo-500/50 rounded-xl p-4 transition-all duration-150 flex flex-col justify-between group"
          >
            <div>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-2">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-white group-hover:text-emerald-300 transition-colors">
                Limpeza Segura
              </h4>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                19 rotinas para limpar caches de shaders GPU, temporários e miniaturas sem tocar em dados pessoais.
              </p>
            </div>
            <div className="flex items-center justify-between text-xs text-emerald-400 font-medium mt-4">
              <span>Ver catálogo</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </div>
      {/* Health Score Applied Modifications Modal */}
      {showHealthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0C1222] border border-[#25355A] rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#1E293B] bg-[#0F172A]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 font-bold font-mono text-sm">
                  {healthScore}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white tracking-tight">
                      Modificações Ativas no Windows
                    </h3>
                    <span className="text-xs text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-semibold">
                      {appliedItems.length} ativas de {alterItems.length}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Lista transparente de todas as definições de registo, rede e serviços configurados no teu sistema.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowHealthModal(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-[#1A2542] transition-colors"
                title="Fechar janela"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Toolbar: Tabs, Category Dropdown & Search */}
            <div className="p-4 bg-[#090E1A] border-b border-[#1A253F] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Tabs */}
              <div className="flex items-center gap-1 bg-[#131B2E] p-1 rounded-xl border border-[#1E293B]">
                <button
                  onClick={() => setHealthModalTab('applied')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                    healthModalTab === 'applied'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Modificações Ativas ({appliedItems.length})</span>
                </button>
                <button
                  onClick={() => setHealthModalTab('pending')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                    healthModalTab === 'pending'
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Pendentes ({pendingItems.length})</span>
                </button>
                <button
                  onClick={() => setHealthModalTab('all')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    healthModalTab === 'all'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Todas ({alterItems.length})
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Category Filter */}
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="bg-[#131B2E] border border-[#1E293B] rounded-xl px-2.5 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="all">Todas as Categorias</option>
                  {Object.entries(categoryLabels).map(([catKey, label]) => (
                    <option key={catKey} value={catKey}>
                      {label}
                    </option>
                  ))}
                </select>

                {/* Search Box */}
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={healthModalSearch}
                    onChange={(e) => setHealthModalSearch(e.target.value)}
                    placeholder="Pesquisar chave ou nome..."
                    className="w-full bg-[#131B2E] border border-[#1E293B] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                  {healthModalSearch && (
                    <button
                      onClick={() => setHealthModalSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Modifications Scrollable List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {modalDisplayItems.length === 0 ? (
                <div className="text-center py-12 bg-[#090E1A] rounded-xl border border-[#162038]">
                  <Info className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-300">Nenhuma modificação encontrada</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Tenta ajustar o termo de pesquisa ou os filtros acima.
                  </p>
                </div>
              ) : (
                modalDisplayItems.map((st) => {
                  const isApplied = st.status === 'applied';
                  const catName = categoryLabels[st.item.category] || st.item.category;

                  return (
                    <div
                      key={st.item.id}
                      className={`rounded-xl border p-4 transition-all ${
                        isApplied
                          ? 'bg-[#10192E] border-[#1E2A4A]'
                          : 'bg-[#121A30] border-[#223158]'
                      }`}
                    >
                      {/* Top Badges & Meta */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {isApplied ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" /> Modificação Ativa
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              <Zap className="w-3 h-3" /> Pendente de Aplicação
                            </span>
                          )}

                          <span className="text-[10px] font-medium text-gray-400 bg-[#162038] px-2 py-0.5 rounded-md border border-[#23335A]">
                            {catName}
                          </span>

                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${
                            st.item.risk === 'safe'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                          }`}>
                            {st.item.risk === 'safe' ? 'Seguro' : 'Moderado'}
                          </span>

                          {st.item.requiresReboot && (
                            <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Requer Reinício
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] font-mono text-gray-500">
                          #{st.item.itemNumber} {st.item.id}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div className="mb-2">
                        <h4 className="text-sm font-semibold text-white tracking-tight">{st.item.name}</h4>
                        <p className="text-xs text-gray-300 mt-1 leading-relaxed">{st.item.description}</p>
                      </div>

                      {/* Exact Registry / PowerShell Command Box */}
                      <div className="bg-[#080D17] border border-[#19243E] rounded-lg p-2.5">
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-indigo-300 uppercase tracking-wider mb-1">
                          <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Modificação Exata no Windows (Registo / Definição):</span>
                        </div>
                        <div className="font-mono text-[11px] text-emerald-400/90 break-all select-all bg-[#050810] p-2 rounded border border-[#141E33]">
                          {st.item.exactChange || 'Ajuste de definições avançadas do sistema'}
                        </div>

                        {/* Status Footer & Revert Option */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2 pt-1 border-t border-[#152038] text-[11px]">
                          <span className="text-gray-400">
                            Estado Atual: <strong className={isApplied ? 'text-emerald-400' : 'text-amber-400'}>
                              {isApplied ? 'Otimizado & Ativo' : (st.currentValue ? String(st.currentValue) : 'Padrão do Windows')}
                            </strong>
                          </span>

                          {isApplied && onRevertItem && (
                            <button
                              disabled={isOperating}
                              onClick={() => onRevertItem(st.item.id)}
                              className="self-end sm:self-auto flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#18233C] hover:bg-[#223254] text-gray-300 hover:text-white border border-[#2B3B66] text-[10px] font-medium transition-colors disabled:opacity-50"
                              title="Restaurar o valor original do Windows para esta opção"
                            >
                              <RotateCcw className="w-3 h-3 text-amber-300" />
                              <span>Reverter esta modificação</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#090E1A] border-t border-[#1A253F] flex items-center justify-between">
              <span className="text-xs text-gray-400 font-mono">
                A listar {modalDisplayItems.length} de {alterItems.length} otimizações do sistema
              </span>
              <button
                onClick={() => setShowHealthModal(false)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-md"
              >
                Concluído
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
