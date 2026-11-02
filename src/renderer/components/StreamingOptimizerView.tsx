import React, { useState, useEffect } from 'react';
import {
  Tv,
  MessageSquare,
  Radio,
  Zap,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  RefreshCw,
  Video,
  Sparkles,
  Sliders,
  Cpu,
  Wifi,
  Loader2
} from 'lucide-react';

interface StreamingStatus {
  discordInstalled: boolean;
  discordRunning: boolean;
  discordCacheSizeMb: number;
  discordHwAccelDisabled: boolean;
  discordPriorityOptimized: boolean;

  obsInstalled: boolean;
  obsRunning: boolean;
  obsHighPrioritySet: boolean;
  obsGpuPreferenceSet: boolean;
  obsQosConfigured: boolean;
}

interface StreamingOptimizerViewProps {
  onShowNotification?: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const StreamingOptimizerView: React.FC<StreamingOptimizerViewProps> = ({ onShowNotification }) => {
  const [status, setStatus] = useState<StreamingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOperating, setIsOperating] = useState<string | null>(null);
  const [appliedDetails, setAppliedDetails] = useState<string[]>([]);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      if (window.optimizerApi?.streamingGetStatus) {
        const s = await window.optimizerApi.streamingGetStatus();
        setStatus(s);
      }
    } catch (e: any) {
      console.error('Erro ao ler estado de streaming:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleOptimizeDiscord = async () => {
    setIsOperating('discord');
    try {
      if (window.optimizerApi?.streamingOptimizeDiscord) {
        const res = await window.optimizerApi.streamingOptimizeDiscord();
        if (res.details) setAppliedDetails(res.details);
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

  const handleCleanDiscordCache = async () => {
    setIsOperating('discord_cache');
    try {
      if (window.optimizerApi?.streamingCleanDiscordCache) {
        const res = await window.optimizerApi.streamingCleanDiscordCache();
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

  const handleOptimizeObs = async () => {
    setIsOperating('obs');
    try {
      if (window.optimizerApi?.streamingOptimizeObs) {
        const res = await window.optimizerApi.streamingOptimizeObs();
        if (res.details) setAppliedDetails(res.details);
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

  const handleOptimizeAll = async () => {
    setIsOperating('all');
    try {
      if (window.optimizerApi?.streamingOptimizeAll) {
        const res = await window.optimizerApi.streamingOptimizeAll();
        if (res.details) setAppliedDetails(res.details);
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

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0C1527] via-[#111C38] to-[#1A1230] p-6 border border-[#232F4D] shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white shrink-0">
              <Tv className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Otimizador de Discord & OBS Studio</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
                  Anti-Drop FPS
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 max-w-xl">
                Otimiza a aceleração de hardware, prioridade de CPU e filas de rede para transmissões em direto no OBS e chamadas no Discord sem quebras de taxa de quadros no jogo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              disabled={!!isOperating || isLoading}
              onClick={handleOptimizeAll}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isOperating === 'all' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-300" />
              )}
              <span>Otimizar Tudo em 1-Clique</span>
            </button>

            <button
              onClick={fetchStatus}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-[#111A30] hover:bg-[#182342] text-gray-400 hover:text-white border border-[#232F4D] transition-colors"
              title="Atualizar Estado"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Twin Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Discord Card */}
        <div className="bg-[#0E1526] border border-[#1E293B] rounded-2xl p-6 space-y-5 shadow-lg flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    Discord Pro Tweaker
                    {status?.discordRunning && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Em execução" />
                    )}
                  </h3>
                  <span className="text-xs text-gray-400">
                    {status?.discordInstalled ? 'Instalação Detetada' : 'Não encontrado'}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Cache Acumulada</span>
                <span className="font-mono text-sm font-black text-indigo-300">
                  {status ? `${status.discordCacheSizeMb} MB` : '...'}
                </span>
              </div>
            </div>

            {/* Checklist of enhancements */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.02]">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-gray-300">Desativação de telemetria contínua e diagnóstico de fundo</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.02]">
                <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-gray-300">Afinidade de CPU equilibrada (não rouba ciclos de jogos)</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.02]">
                <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-gray-300">Eliminação de micro-stutters causados por DiscordHook DLL</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#1E293B] flex items-center gap-3">
            <button
              disabled={!!isOperating || !status?.discordInstalled}
              onClick={handleOptimizeDiscord}
              className="flex-1 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isOperating === 'discord' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sliders className="w-3.5 h-3.5" />
              )}
              <span>Otimizar Discord</span>
            </button>

            <button
              disabled={!!isOperating || !status?.discordInstalled}
              onClick={handleCleanDiscordCache}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-[#111A30] hover:bg-[#182342] text-rose-300 border border-rose-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
              title="Limpar Cache Multimédia"
            >
              {isOperating === 'discord_cache' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              <span>Limpar Cache</span>
            </button>
          </div>
        </div>

        {/* OBS Studio Card */}
        <div className="bg-[#0E1526] border border-[#1E293B] rounded-2xl p-6 space-y-5 shadow-lg flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    OBS Studio Pro Tweaker
                    {status?.obsRunning && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Em gravação / stream" />
                    )}
                  </h3>
                  <span className="text-xs text-gray-400">
                    {status?.obsInstalled ? 'Instalação Detetada' : 'Não encontrado'}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Prioridade de CPU</span>
                <span className={`font-mono text-sm font-black ${status?.obsHighPrioritySet ? 'text-emerald-400' : 'text-gray-400'}`}>
                  {status?.obsHighPrioritySet ? 'Alta (High)' : 'Normal'}
                </span>
              </div>
            </div>

            {/* Checklist of enhancements */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.02]">
                <Cpu className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-gray-300">IFEO High Priority (elimina frames perdidos no encoder de vídeo)</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.02]">
                <Zap className="w-4 h-4 text-purple-400 shrink-0" />
                <span className="text-gray-300">DirectX GPU Scheduling dedicado para aceleração NVENC/AMF</span>
              </div>
              <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white/[0.02]">
                <Wifi className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="text-gray-300">Regra de QoS de Rede (DSCP 46) para tráfego RTMP sem packet loss</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#1E293B]">
            <button
              disabled={!!isOperating || !status?.obsInstalled}
              onClick={handleOptimizeObs}
              className="w-full py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {isOperating === 'obs' ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Radio className="w-3.5 h-3.5" />
              )}
              <span>Otimizar OBS Studio</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Applied Changes Activity Feed */}
      {appliedDetails.length > 0 && (
        <div className="p-4 rounded-xl bg-[#090E1A] border border-emerald-500/20 space-y-2">
          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Otimizações Aplicadas Recentemente:
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-300">
            {appliedDetails.map((detail, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{detail}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
