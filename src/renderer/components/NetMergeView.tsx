import React, { useState, useEffect } from 'react';
import {
  Layers,
  Zap,
  Wifi,
  Network,
  CheckCircle2,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Activity,
  ArrowDownCircle,
  ArrowUpCircle,
  Info,
  Loader2,
  Trash2
} from 'lucide-react';

interface NetMergeAdapterInfo {
  name: string;
  status: 'USE' | 'skip';
  ipv4: string;
  ipv6: string;
  index?: number;
  reason?: string;
  downMbit: number;
  upMbit: number;
  activeFlows: number;
  totalFlows: number;
  weight: string;
  failed: number;
  limitMbps?: number;
}

interface NetMergeStatus {
  isInstalled: boolean;
  isRunning: boolean;
  isMerging: boolean;
  pid: number | null;
  uptime: string;
  ipv6Mode: string;
  totalDownMbit: number;
  totalUpMbit: number;
  totalActiveFlows: number;
  totalFlows: number;
  adapters: NetMergeAdapterInfo[];
  limits: Record<string, number>;
  simultaneousPolicyActive: boolean;
}

interface NetMergeViewProps {
  onShowNotification?: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const NetMergeView: React.FC<NetMergeViewProps> = ({ onShowNotification }) => {
  const [status, setStatus] = useState<NetMergeStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOperating, setIsOperating] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      if (window.optimizerApi?.netmergeGetStatus) {
        const s = await window.optimizerApi.netmergeGetStatus();
        setStatus(s);
      }
    } catch (e: any) {
      console.error('Erro ao ler estado do Net-Merge:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000); // Live poll every 3 seconds
    return () => clearInterval(interval);
  }, []);

  const handleToggleMerging = async () => {
    if (!status) return;
    const next = !status.isMerging;
    setIsOperating('toggle');
    try {
      if (window.optimizerApi?.netmergeSetMerging) {
        const res = await window.optimizerApi.netmergeSetMerging(next);
        if (onShowNotification) {
          onShowNotification(res.message, res.success ? 'success' : 'error');
        }
        await fetchStatus();
      }
    } catch (e: any) {
      if (onShowNotification) onShowNotification(`Erro: ${e.message}`, 'error');
    } finally {
      setIsOperating(null);
    }
  };

  const handleSetLimit = async (adapterName: string, limitMbps: number) => {
    setIsOperating(`limit_${adapterName}`);
    try {
      if (window.optimizerApi?.netmergeSetLimit) {
        const res = await window.optimizerApi.netmergeSetLimit(adapterName, limitMbps);
        if (onShowNotification) {
          onShowNotification(res.message, res.success ? 'success' : 'error');
        }
        await fetchStatus();
      }
    } catch (e: any) {
      if (onShowNotification) onShowNotification(`Erro: ${e.message}`, 'error');
    } finally {
      setIsOperating(null);
    }
  };

  const handleApplyPolicy = async () => {
    setIsOperating('policy');
    try {
      if (window.optimizerApi?.netmergeApplyPolicy) {
        const res = await window.optimizerApi.netmergeApplyPolicy();
        if (onShowNotification) {
          onShowNotification(res.message, res.success ? 'success' : 'error');
        }
        await fetchStatus();
      }
    } catch (e: any) {
      if (onShowNotification) onShowNotification(`Erro: ${e.message}`, 'error');
    } finally {
      setIsOperating(null);
    }
  };

  const handleCleanupRoutes = async () => {
    setIsOperating('cleanup');
    try {
      if (window.optimizerApi?.netmergeCleanup) {
        const res = await window.optimizerApi.netmergeCleanup();
        if (onShowNotification) {
          onShowNotification(res.message, res.success ? 'success' : 'error');
        }
        await fetchStatus();
      }
    } catch (e: any) {
      if (onShowNotification) onShowNotification(`Erro: ${e.message}`, 'error');
    } finally {
      setIsOperating(null);
    }
  };

  const getAdapterIcon = (name: string) => {
    if (/wi-?fi|wlan|wireless/i.test(name)) {
      return <Wifi className="w-5 h-5 text-cyan-400" />;
    }
    return <Network className="w-5 h-5 text-indigo-400" />;
  };

  return (
    <div className="space-y-6">
      {/* 1. Hero Fusion Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0C1527] via-[#101D38] to-[#181232] p-6 border border-[#232F4D] shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-cyan-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-white tracking-tight">Net-Merge: Fusão de Conexões Multi-WAN</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  status?.isMerging
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-gray-800 border-gray-700 text-gray-400'
                }`}>
                  {status?.isMerging ? '✓ Fusão Ativa' : 'Pausado'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 max-w-xl">
                Combina a velocidade do teu <strong>Wi-Fi</strong>, <strong>Ethernet</strong> e <strong>Hotspot de Telemóvel</strong> em simultâneo. Downloads de jogos (Steam, Epic, EA) e navegadores utilizam a largura de banda de todas as placas somadas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              disabled={!!isOperating || isLoading || !status?.isInstalled}
              onClick={handleToggleMerging}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg disabled:opacity-50 ${
                status?.isMerging
                  ? 'bg-amber-600/90 hover:bg-amber-600 text-white shadow-amber-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
              }`}
            >
              {isOperating === 'toggle' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              <span>{status?.isMerging ? 'Pausar Fusão' : 'Ativar Fusão de Redes'}</span>
            </button>

            <button
              onClick={fetchStatus}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-[#111A30] hover:bg-[#182342] text-gray-400 hover:text-white border border-[#232F4D] transition-colors"
              title="Atualizar Telemetria"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Real-Time Fusion Telemetry Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#0E1526] border border-cyan-500/30 p-4 rounded-xl shadow-lg shadow-cyan-500/5">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[10px] font-bold uppercase">Download Combinado</span>
            <ArrowDownCircle className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <span className="font-mono text-xl font-black text-cyan-300">
            {status ? `${status.totalDownMbit} Mbit/s` : '0.0 Mbit/s'}
          </span>
        </div>

        <div className="bg-[#0E1526] border border-indigo-500/30 p-4 rounded-xl shadow-lg shadow-indigo-500/5">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[10px] font-bold uppercase">Upload Combinado</span>
            <ArrowUpCircle className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <span className="font-mono text-xl font-black text-indigo-300">
            {status ? `${status.totalUpMbit} Mbit/s` : '0.0 Mbit/s'}
          </span>
        </div>

        <div className="bg-[#0E1526] border border-[#1E293B] p-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[10px] font-bold uppercase">Conexões Ativas</span>
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className="font-mono text-xl font-black text-emerald-400">
            {status ? status.totalActiveFlows : 0} fluxos
          </span>
        </div>

        <div className="bg-[#0E1526] border border-[#1E293B] p-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between text-gray-400 mb-1">
            <span className="text-[10px] font-bold uppercase">Uptime do Motor</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <span className="font-mono text-xl font-black text-purple-300">
            {status?.uptime || '0s'}
          </span>
        </div>
      </div>

      {/* 3. Connected Adapters Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Network className="w-4 h-4 text-cyan-400" />
              Adaptadores de Rede Físicos Vinculados
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Cada conexão independente carrega parte do tráfego. Quanto mais conexões tiveres (ex: Wi-Fi + Cabo), maior a velocidade.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {status?.adapters && status.adapters.length > 0 ? (
            status.adapters.map((adapter) => {
              const currentLimit = status.limits[adapter.name] || 0;
              return (
                <div
                  key={adapter.name}
                  className="bg-[#0E1526] border border-[#1E293B] hover:border-cyan-500/40 rounded-2xl p-5 space-y-4 shadow-lg transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                        {getAdapterIcon(adapter.name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-white">{adapter.name}</h4>
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                            !status?.isMerging
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              : adapter.status === 'USE'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}>
                            {!status?.isMerging ? 'PRONTO' : adapter.status === 'USE' ? 'EM FUSÃO' : 'IGNORADO'}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-gray-400 mt-0.5">
                          {adapter.ipv4}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 font-bold uppercase block">Fluxos Ativos</span>
                      <span className="font-mono text-sm font-black text-cyan-300">
                        {adapter.activeFlows} ({adapter.totalFlows} total)
                      </span>
                    </div>
                  </div>

                  {/* Speed Strip */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-[#090E1A] border border-white/5 font-mono text-xs">
                    <div>
                      <span className="text-[10px] text-gray-400 block">Download</span>
                      <span className="text-sm font-black text-cyan-400">{adapter.downMbit} Mbit/s</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block">Upload</span>
                      <span className="text-sm font-black text-indigo-400">{adapter.upMbit} Mbit/s</span>
                    </div>
                  </div>

                  {/* Speed Limit & Weight Controls */}
                  <div className="pt-2 border-t border-[#1E293B] flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Sliders className="w-3.5 h-3.5 text-amber-400" />
                      <span>Limite:</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {[0, 10, 25, 50, 100].map((l) => (
                        <button
                          key={l}
                          disabled={!!isOperating}
                          onClick={() => handleSetLimit(adapter.name, l)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                            currentLimit === l
                              ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                              : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                          }`}
                        >
                          {l === 0 ? 'Ilimitado' : `${l}M`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-2 p-8 text-center bg-[#0E1526] border border-[#1E293B] rounded-2xl text-gray-400 text-xs">
              Nenhum adaptador de rede ativo detectado pelo Net-Merge de momento.
            </div>
          )}
        </div>
      </div>

      {/* 4. Windows Multi-WAN System Settings & Optimization Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Simultaneous Connections Policy Card */}
        <div className="bg-[#0E1526] border border-[#1E293B] rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h4 className="text-sm font-bold text-white">Desbloquear Wi-Fi + Ethernet Simultâneo</h4>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Por padrão, o Windows desliga a placa Wi-Fi assim que deteta um cabo Ethernet conectado. Esta opção configura o Windows Connection Manager (Group Policy) e ativa o modo <strong>WeakHost</strong> para permitir tráfego simultâneo sem quedas.
            </p>
          </div>

          <button
            disabled={!!isOperating}
            onClick={handleApplyPolicy}
            className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              status?.simultaneousPolicyActive
                ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30'
            }`}
          >
            {isOperating === 'policy' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            <span>{status?.simultaneousPolicyActive ? '✓ Política de Redes Simultâneas Ativa' : 'Ativar Wi-Fi + Ethernet Sem Limites'}</span>
          </button>
        </div>

        {/* Clean Routes & Troubleshooting Card */}
        <div className="bg-[#0E1526] border border-[#1E293B] rounded-2xl p-5 space-y-4 shadow-lg flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <Trash2 className="w-5 h-5 text-rose-400" />
              <h4 className="text-sm font-bold text-white">Limpeza & Reposição de Rotas Residuais</h4>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Se desligares o computador de forma abrupta ou o adaptador virtual Wintun ficar pendente, esta ferramenta remove com segurança todas as rotas de túnel do Windows e restaura as rotas originais da tua internet.
            </p>
          </div>

          <button
            disabled={!!isOperating}
            onClick={handleCleanupRoutes}
            className="w-full py-2 rounded-xl text-xs font-bold bg-[#141C30] hover:bg-[#1C2844] text-rose-300 border border-rose-500/30 transition-all flex items-center justify-center gap-2"
          >
            {isOperating === 'cleanup' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Trash2 className="w-3.5 h-3.5" />
            )}
            <span>Limpar Rotas Virtuais (Cleanup)</span>
          </button>
        </div>
      </div>

      {/* 5. Pro Tip for Browsers & Steam */}
      <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 flex items-start gap-3 text-xs">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1 text-gray-300">
          <span className="font-bold text-cyan-300">Dica eSports de Alto Desempenho:</span>
          <p className="text-[11px] leading-relaxed">
            Aplicações como o <strong>Steam</strong>, <strong>Epic Games</strong> e <strong>Battle.net</strong> já dividem os downloads em múltiplos fluxos TCP automaticamente, tirando partido imediato da fusão. Nos navegadores (Chrome, Edge e Brave), ativa o <strong>Parallel downloading</strong> em <code className="text-cyan-400 font-mono">chrome://flags/#enable-parallel-downloading</code> para duplicar a velocidade dos downloads na web.
          </p>
        </div>
      </div>
    </div>
  );
};
