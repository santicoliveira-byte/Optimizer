import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Flame, 
  RefreshCw, 
  Sliders, 
  ShieldCheck, 
  Cpu, 
  Monitor,
  Sparkles
} from 'lucide-react';

interface GpuDriverSetting {
  id: string;
  name: string;
  description: string;
  vendor: 'nvidia' | 'amd' | 'intel' | 'all';
  enabled: boolean;
  impact: string;
}

interface GpuTweakOverview {
  vendor: 'nvidia' | 'amd' | 'intel' | 'unknown';
  gpuName: string;
  driverVersion: string;
  settings: GpuDriverSetting[];
}

interface GpuTuningViewProps {
  onShowNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const GpuTuningView: React.FC<GpuTuningViewProps> = ({ onShowNotification }) => {
  const [overview, setOverview] = useState<GpuTweakOverview | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isPresetOperating, setIsPresetOperating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    setIsLoading(true);
    try {
      if (window.optimizerApi?.gpuTweakGetOverview) {
        const data = await window.optimizerApi.gpuTweakGetOverview();
        setOverview(data);
      }
    } catch {} finally {
      setIsLoading(false);
    }
  };

  const handleApplyPreset = async () => {
    setIsPresetOperating(true);
    try {
      const res = await window.optimizerApi.gpuTweakApplyCompetitive();
      onShowNotification(res.message, res.success ? 'success' : 'error');
      await loadOverview();
    } catch (e: any) {
      onShowNotification(e.message, 'error');
    } finally {
      setIsPresetOperating(false);
    }
  };

  const handleToggle = async (setting: GpuDriverSetting) => {
    setTogglingId(setting.id);
    const target = !setting.enabled;
    try {
      const res = await window.optimizerApi.gpuTweakToggle(setting.id, target);
      onShowNotification(res.message, res.success ? 'success' : 'error');
      await loadOverview();
    } catch (e: any) {
      onShowNotification(e.message, 'error');
    } finally {
      setTogglingId(null);
    }
  };

  const vendorColor =
    overview?.vendor === 'nvidia'
      ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/20'
      : overview?.vendor === 'amd'
      ? 'text-rose-400 border-rose-500/40 bg-rose-500/20'
      : 'text-cyan-400 border-cyan-500/40 bg-cyan-500/20';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#10172A] border border-[#1E293B] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-amber-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-lg">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-white tracking-tight">Tuning de Drivers de GPU (NVIDIA & AMD)</h2>
                <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border uppercase ${vendorColor}`}>
                  {overview?.vendor || 'GPU'} Dedicated
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
                Tuning direto no pipeline do driver de vídeo para modo <strong>Ultra Low Latency</strong>, eliminação de micro-stutters
                de compilação de shaders e impedimento de quedas de clock em partidas competitivas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={handleApplyPreset}
              disabled={isPresetOperating}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black shadow-amber-950/40 font-bold"
            >
              <Flame className={`w-3.5 h-3.5 ${isPresetOperating ? 'animate-spin' : ''}`} />
              <span>{isPresetOperating ? 'A Aplicar Preset...' : '1-Clique: Preset eSports Ultra Latência'}</span>
            </button>
            <button
              onClick={loadOverview}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-white text-xs font-medium transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        {/* Hardware Status Cards */}
        <div className="mt-5 pt-4 border-t border-[#1E293B] grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[#0B0F19] rounded-xl p-3 border border-[#1E293B] flex items-center gap-3">
            <Monitor className="w-5 h-5 text-indigo-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-gray-400 uppercase font-semibold">Adaptador Gráfico</div>
              <div className="text-xs font-bold text-white truncate">{overview?.gpuName || 'A Detetar...'}</div>
            </div>
          </div>

          <div className="bg-[#0B0F19] rounded-xl p-3 border border-[#1E293B] flex items-center gap-3">
            <Cpu className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] text-gray-400 uppercase font-semibold">Versão do Driver WHQL</div>
              <div className="text-xs font-bold text-amber-300 font-mono truncate">{overview?.driverVersion || 'Ativo'}</div>
            </div>
          </div>

          <div className="bg-[#0B0F19] rounded-xl p-3 border border-[#1E293B] flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold">Segurança do Driver</div>
              <div className="text-xs font-bold text-emerald-300">Oficial Microsoft / WDDM 3.1</div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {overview?.settings.map((st) => {
          const isBusy = togglingId === st.id;

          return (
            <div
              key={st.id}
              className={`rounded-2xl p-4 transition-all border ${
                st.enabled
                  ? 'bg-[#10172A] border-amber-500/30 shadow-[0_4px_16px_rgba(245,158,11,0.06)]'
                  : 'bg-[#10172A]/70 border-[#1E293B]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      st.enabled
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-[#1E293B] text-gray-400'
                    }`}
                  >
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white truncate">{st.name}</h4>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-1 leading-relaxed line-clamp-2">
                      {st.description}
                    </p>
                    <div className="mt-2 text-[10px] font-mono font-medium text-amber-400/90 flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>{st.impact}</span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center">
                  <button
                    onClick={() => handleToggle(st)}
                    disabled={isBusy}
                    className={`w-12 h-6 rounded-full transition-colors relative p-0.5 focus:outline-none ${
                      st.enabled ? 'bg-amber-500' : 'bg-gray-700'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        st.enabled ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
