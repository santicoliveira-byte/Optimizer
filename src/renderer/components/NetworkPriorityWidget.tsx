import React, { useState, useEffect, useCallback } from 'react';
import {
  Network,
  Wifi,
  ArrowRightLeft,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Radio,
  Loader2
} from 'lucide-react';
import { NetworkPriorityState } from '../../shared/types';

interface NetworkPriorityWidgetProps {
  className?: string;
}

export const NetworkPriorityWidget: React.FC<NetworkPriorityWidgetProps> = ({ className = '' }) => {
  const [priorityState, setPriorityState] = useState<NetworkPriorityState | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pendingTarget, setPendingTarget] = useState<'ethernet' | 'wifi' | 'auto' | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchPriority = useCallback(async () => {
    try {
      if (window.optimizerApi?.getNetworkPriority) {
        const state = await window.optimizerApi.getNetworkPriority();
        setPriorityState(state);
      }
    } catch (err: any) {
      console.error('Failed to load network priority:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPriority();
  }, [fetchPriority]);

  const handleSetPriority = async (targetMode: 'ethernet' | 'wifi' | 'auto') => {
    if (pendingTarget) return;
    setPendingTarget(targetMode);
    setFeedback(null);

    // Instant optimistic UI update
    setPriorityState((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        mode: targetMode,
        adapters: prev.adapters.map((a) => {
          if (targetMode === 'ethernet') {
            return a.type === 'ethernet' ? { ...a, metric: 10 } : { ...a, metric: 50 };
          }
          if (targetMode === 'wifi') {
            return a.type === 'wifi' ? { ...a, metric: 10 } : { ...a, metric: 50 };
          }
          return { ...a, isAutomaticMetric: true };
        })
      };
    });

    try {
      if (!window.optimizerApi?.setNetworkPriority) {
        throw new Error('API de rede indisponível');
      }

      const res = await window.optimizerApi.setNetworkPriority(targetMode);
      if (res.success) {
        if (res.state) {
          setPriorityState(res.state);
        } else {
          await fetchPriority();
        }
        setFeedback({
          type: 'success',
          message: res.message || 'Prioridade atualizada com sucesso!'
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.message || 'Falha ao alterar prioridade.'
        });
        await fetchPriority();
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Erro inesperado ao definir prioridade de rede.'
      });
      await fetchPriority();
    } finally {
      setPendingTarget(null);
    }
  };

  const currentMode = pendingTarget || priorityState?.mode || 'auto';
  const adapters = priorityState?.adapters || [];
  const ethAdapter = adapters.find((a) => a.type === 'ethernet');
  const wifiAdapter = adapters.find((a) => a.type === 'wifi');

  return (
    <div className={`bg-[#0C1222] border border-[#1E293B] hover:border-[#2D3E64] rounded-2xl p-5 shadow-xl transition-all duration-300 relative overflow-hidden ${className}`}>
      {/* Decorative gradient glow in background */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1E293B]/80 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Prioridade de Conexão de Rede
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wider rounded-md uppercase bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                IPv4 Routing Metric
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Escolha qual interface o Windows deve priorizar para jogos e navegação de internet
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setIsLoading(true);
            fetchPriority();
          }}
          disabled={isLoading || Boolean(pendingTarget)}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 bg-[#141B2D] hover:bg-[#1C263F] border border-[#22304F] transition-all disabled:opacity-50"
          title="Recarregar estado atual dos adaptadores"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Status Feedback Banner */}
      {feedback && (
        <div
          className={`mt-4 p-3 rounded-xl border flex items-center gap-2.5 text-xs transition-all animate-fadeIn ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="flex-1">{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-gray-400 hover:text-white text-xs font-bold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Priority Mode Switcher Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 my-4 relative z-10">
        {/* Mode 1: Ethernet Priority */}
        <div
          onClick={() => handleSetPriority('ethernet')}
          className={`cursor-pointer rounded-xl p-4 flex flex-col justify-between transition-all duration-200 select-none border relative overflow-hidden group ${
            currentMode === 'ethernet'
              ? 'bg-gradient-to-b from-[#0F2236] to-[#0D1828] border-cyan-500/80 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-500/60'
              : 'bg-[#121A2C] border-[#1C2843] hover:border-cyan-500/40 hover:bg-[#162137]'
          }`}
        >
          {currentMode === 'ethernet' && (
            <div className="absolute top-0 right-0 bg-cyan-500 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-bl-lg tracking-wider flex items-center gap-1 shadow">
              {pendingTarget === 'ethernet' ? (
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-2.5 h-2.5 stroke-[3]" />
              )}
              {pendingTarget === 'ethernet' ? 'A aplicar...' : 'Prioritário'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  currentMode === 'ethernet'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-cyan-500/15 text-cyan-400 group-hover:bg-cyan-500/25'
                }`}
              >
                <Network className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                  Ethernet (Cabo)
                </h4>
                <span className="text-[10px] text-cyan-400/90 font-medium">
                  Métrica 10 Primária
                </span>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Força todo o tráfego pelo cabo RJ-45. Ideal para o menor atraso (jitter) e estabilidade máxima em jogos.
            </p>
          </div>

          <div className="mt-4 pt-2.5 border-t border-[#1C2843] flex items-center justify-between text-[11px]">
            <span className="text-gray-400">
              {ethAdapter ? `${ethAdapter.status === 'Up' ? '🟢 Conectado' : '⚪ Desconectado'}` : 'Placa de rede'}
            </span>
            <span
              className={`font-semibold flex items-center gap-1 ${
                currentMode === 'ethernet' ? 'text-cyan-300' : 'text-gray-400 group-hover:text-white'
              }`}
            >
              {pendingTarget === 'ethernet' && <Loader2 className="w-3 h-3 animate-spin text-cyan-400" />}
              {currentMode === 'ethernet' ? (pendingTarget === 'ethernet' ? 'A aplicar...' : 'Ativo no Sistema') : 'Ativar Cabo'}
            </span>
          </div>
        </div>

        {/* Mode 2: Wi-Fi Priority */}
        <div
          onClick={() => handleSetPriority('wifi')}
          className={`cursor-pointer rounded-xl p-4 flex flex-col justify-between transition-all duration-200 select-none border relative overflow-hidden group ${
            currentMode === 'wifi'
              ? 'bg-gradient-to-b from-[#1C1636] to-[#120F24] border-purple-500/80 shadow-lg shadow-purple-500/20 ring-1 ring-purple-500/60'
              : 'bg-[#121A2C] border-[#1C2843] hover:border-purple-500/40 hover:bg-[#162137]'
          }`}
        >
          {currentMode === 'wifi' && (
            <div className="absolute top-0 right-0 bg-purple-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-bl-lg tracking-wider flex items-center gap-1 shadow">
              {pendingTarget === 'wifi' ? (
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-2.5 h-2.5 stroke-[3]" />
              )}
              {pendingTarget === 'wifi' ? 'A aplicar...' : 'Prioritário'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  currentMode === 'wifi'
                    ? 'bg-purple-500 text-white font-bold'
                    : 'bg-purple-500/15 text-purple-400 group-hover:bg-purple-500/25'
                }`}
              >
                <Wifi className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                  Wi-Fi (Sem Fios)
                </h4>
                <span className="text-[10px] text-purple-400/90 font-medium">
                  Métrica 10 Primária
                </span>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Direciona o tráfego pela antena sem fios. Recomendado se o seu Wi-Fi 6/6E for mais veloz que a porta Ethernet.
            </p>
          </div>

          <div className="mt-4 pt-2.5 border-t border-[#1C2843] flex items-center justify-between text-[11px]">
            <span className="text-gray-400">
              {wifiAdapter ? `${wifiAdapter.status === 'Up' ? '🟢 Conectado' : '⚪ Desconectado'}` : 'Placa Wi-Fi'}
            </span>
            <span
              className={`font-semibold flex items-center gap-1 ${
                currentMode === 'wifi' ? 'text-purple-300' : 'text-gray-400 group-hover:text-white'
              }`}
            >
              {pendingTarget === 'wifi' && <Loader2 className="w-3 h-3 animate-spin text-purple-400" />}
              {currentMode === 'wifi' ? (pendingTarget === 'wifi' ? 'A aplicar...' : 'Ativo no Sistema') : 'Ativar Wi-Fi'}
            </span>
          </div>
        </div>

        {/* Mode 3: Automatic Windows Management */}
        <div
          onClick={() => handleSetPriority('auto')}
          className={`cursor-pointer rounded-xl p-4 flex flex-col justify-between transition-all duration-200 select-none border relative overflow-hidden group ${
            currentMode === 'auto'
              ? 'bg-gradient-to-b from-[#122421] to-[#0D1817] border-emerald-500/80 shadow-lg shadow-emerald-500/20 ring-1 ring-emerald-500/60'
              : 'bg-[#121A2C] border-[#1C2843] hover:border-emerald-500/40 hover:bg-[#162137]'
          }`}
        >
          {currentMode === 'auto' && (
            <div className="absolute top-0 right-0 bg-emerald-500 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded-bl-lg tracking-wider flex items-center gap-1 shadow">
              {pendingTarget === 'auto' ? (
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-2.5 h-2.5 stroke-[3]" />
              )}
              {pendingTarget === 'auto' ? 'A aplicar...' : 'Automático'}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  currentMode === 'auto'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : 'bg-emerald-500/15 text-emerald-400 group-hover:bg-emerald-500/25'
                }`}
              >
                <Radio className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Automático do Windows
                </h4>
                <span className="text-[10px] text-emerald-400/90 font-medium">
                  AutomaticMetric Ativado
                </span>
              </div>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              O Windows calcula a métrica com base na velocidade de link negociada pelas placas de rede.
            </p>
          </div>

          <div className="mt-4 pt-2.5 border-t border-[#1C2843] flex items-center justify-between text-[11px]">
            <span className="text-gray-400">Padrão do SO</span>
            <span
              className={`font-semibold flex items-center gap-1 ${
                currentMode === 'auto' ? 'text-emerald-300' : 'text-gray-400 group-hover:text-white'
              }`}
            >
              {pendingTarget === 'auto' && <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />}
              {currentMode === 'auto' ? (pendingTarget === 'auto' ? 'A aplicar...' : 'Ativo no Sistema') : 'Ativar Auto'}
            </span>
          </div>
        </div>
      </div>

      {/* Detected Adapters Details Table */}
      {adapters.length > 0 && (
        <div className="mt-3 bg-[#090F1C] border border-[#1A253D] rounded-xl p-3.5 relative z-10">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Adaptadores Físicos Detetados ({adapters.length})
            </span>
            <span className="text-[10px] text-gray-400">
              Menor valor de Métrica = Prioridade de Roteamento
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {adapters.map((adapter) => {
              const isPri =
                (currentMode === 'ethernet' && adapter.type === 'ethernet') ||
                (currentMode === 'wifi' && adapter.type === 'wifi') ||
                adapter.metric === Math.min(...adapters.map((a) => a.metric));

              return (
                <div
                  key={adapter.interfaceIndex}
                  className={`p-3 rounded-lg border flex items-center justify-between gap-3 transition-colors ${
                    isPri
                      ? 'bg-[#101D33] border-cyan-500/40 text-white'
                      : 'bg-[#0E1524] border-[#182339] text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                        adapter.type === 'wifi'
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-cyan-500/20 text-cyan-400'
                      }`}
                    >
                      {adapter.type === 'wifi' ? <Wifi className="w-3.5 h-3.5" /> : <Network className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">
                          {adapter.name}
                        </span>
                        <span
                          className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                            adapter.status.toLowerCase() === 'up'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-gray-700 text-gray-400'
                          }`}
                        >
                          {adapter.status.toLowerCase() === 'up' ? 'Ligado' : adapter.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-400 truncate mt-0.5" title={adapter.description}>
                        {adapter.description} {adapter.linkSpeed ? `• ${adapter.linkSpeed}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="flex items-center gap-1.5 justify-end">
                      {isPri && (
                        <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-cyan-500 text-slate-950">
                          Roteador Principal
                        </span>
                      )}
                      <span className="text-xs font-mono font-bold text-gray-200">
                        Métrica {adapter.metric}
                      </span>
                    </div>
                    <span className="text-[9px] text-gray-400 block mt-0.5">
                      {adapter.isAutomaticMetric ? 'Métrica Automática' : 'Métrica Manual'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
