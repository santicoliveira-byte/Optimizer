import React, { useState } from 'react';
import {
  MousePointer,
  Cpu,
  Monitor,
  Wifi,
  Sparkles,
  Zap,
  Gauge
} from 'lucide-react';
import { OptimizationState } from '../../shared/types';

interface LatencyHubProps {
  states: OptimizationState[];
  onApply: (id: string) => void;
  onRevert: (id: string) => void;
  onApplyAllLatency: () => void;
  isOperating: boolean;
}

type LatencyStage = 'mouse' | 'cpu' | 'gpu' | 'network' | 'display';

interface StageMeta {
  id: LatencyStage;
  name: string;
  shortDesc: string;
  icon: React.ReactNode;
  itemPrefixes: string[];
}

const STAGES: StageMeta[] = [
  {
    id: 'mouse',
    name: 'Rato & Entrada',
    shortDesc: 'Aceleração de ponteiro, buffer do rato, USB suspend e resposta do teclado',
    icon: <MousePointer className="w-4 h-4" />,
    itemPrefixes: ['input_mouse', 'input_pointer', 'input_usb', 'input_sticky', 'input_filter', 'input_toggle']
  },
  {
    id: 'cpu',
    name: 'CPU & Kernel',
    shortDesc: 'Resolução de timer global (0.5ms), prioridade MMCSS e agendamento de energia',
    icon: <Cpu className="w-4 h-4" />,
    itemPrefixes: ['input_power_plan', 'input_cpu_min_state', 'cpu_priority', 'cpu_gpu_power', 'input_prevent_sleep']
  },
  {
    id: 'gpu',
    name: 'GPU & Driver',
    shortDesc: 'Hardware-Accelerated GPU Scheduling (HAGS), VRR, modo de jogo e taxa de refrescamento',
    icon: <Gauge className="w-4 h-4" />,
    itemPrefixes: ['input_game_mode', 'input_gpu_preference', 'input_windowed', 'input_game_dvr', 'clean_gpu']
  },
  {
    id: 'network',
    name: 'Rede & Bufferbloat',
    shortDesc: 'Tuning TCP NoDelay, RSS, mitigação de bufferbloat UDP e esvaziamento de cache DNS',
    icon: <Wifi className="w-4 h-4" />,
    itemPrefixes: ['net_tcp', 'net_flush', 'net_rss', 'net_disable_power_save', 'wifi_power']
  },
  {
    id: 'display',
    name: 'Ecrã & Apresentação',
    shortDesc: 'DWM transparency, mitigação de lag de janelas e compositor gráfico de renderização',
    icon: <Monitor className="w-4 h-4" />,
    itemPrefixes: ['ui_visual', 'ui_disable_window_animations', 'ui_disable_transparency', 'ui_menu_show']
  }
];

export const LatencyPipelineView: React.FC<LatencyHubProps> = ({
  states,
  onApply,
  onRevert,
  onApplyAllLatency,
  isOperating
}) => {
  const [activeStage, setActiveStage] = useState<LatencyStage>('mouse');
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [benchmarkData, setBenchmarkData] = useState<any>(null);

  const handleRunBenchmark = async () => {
    if (!window.optimizerApi?.latencyRunBenchmark) return;
    setIsBenchmarking(true);
    try {
      const data = await window.optimizerApi.latencyRunBenchmark();
      setBenchmarkData(data);
    } catch (e) {
      console.error('Erro no benchmark de latência:', e);
    } finally {
      setIsBenchmarking(false);
    }
  };

  const handleTogglePrecisionTimer = async () => {
    if (!window.optimizerApi?.latencySetPrecisionTimer) return;
    try {
      await window.optimizerApi.latencySetPrecisionTimer(true);
      await handleRunBenchmark();
    } catch (e) {
      console.error('Erro ao ativar precision timer:', e);
    }
  };

  // Filter items matching active stage
  const currentStageMeta = STAGES.find((s) => s.id === activeStage)!;
  const stageStates = states.filter((st) => {
    return currentStageMeta.itemPrefixes.some((prefix) => st.item.id.startsWith(prefix));
  });

  // Calculate totals across all stages
  const allLatencyStates = states.filter((st) =>
    STAGES.some((stage) => stage.itemPrefixes.some((p) => st.item.id.startsWith(p)))
  );
  const totalApplied = allLatencyStates.filter((s) => s.status === 'applied').length;
  const totalAlter = allLatencyStates.filter((s) => s.item.type === 'alter').length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Pipeline visual */}
      <div className="bg-[#10172A] border border-[#1E293B] rounded-2xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Cadeia de Latência End-to-End
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Pipeline de Latência & Input Lag
            </h2>
            <p className="text-xs text-gray-300 mt-1 max-w-2xl leading-relaxed">
              Otimize sequencialmente o percurso desde o clique do rato/teclado até à renderização na placa gráfica e envio pela placa de rede.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-semibold px-3 py-1.5 rounded-xl bg-[#141E33] border border-[#223154] text-cyan-300">
              {totalApplied} / {totalAlter} Ativos
            </span>
            <button
              disabled={isOperating}
              onClick={onApplyAllLatency}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Ativar Cadeia de Latência</span>
            </button>
          </div>
        </div>

        {/* Live Hardware Timer & Ping Benchmark Card */}
        <div className="mb-6 p-4 rounded-xl bg-[#0C1222] border border-[#232F4D] shadow-inner">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Medidor em Tempo Real: Timer Resolution & Servidores de Jogo
                </h3>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Mede a resolução do temporizador do kernel (0.5ms vs 15.6ms), jitter de frames e ping direto a servidores dedicados.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={isBenchmarking}
                onClick={handleRunBenchmark}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow transition-all disabled:opacity-50"
              >
                <Gauge className={`w-3.5 h-3.5 ${isBenchmarking ? 'animate-spin' : ''}`} />
                <span>{isBenchmarking ? 'A medir...' : 'Testar Latência'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Timer Resolution Box */}
            <div className="p-3 rounded-lg bg-[#131B2E] border border-[#1E293B]">
              <div className="text-[10px] text-gray-400 uppercase font-semibold">Resolução do Temporizador</div>
              <div className="text-lg font-bold text-white mt-1 flex items-baseline gap-1.5">
                <span>{benchmarkData ? `${benchmarkData.timerResolution.currentMs} ms` : '1.00 ms'}</span>
                <span className="text-[10px] text-emerald-400 font-normal">
                  {benchmarkData?.timerResolution.currentMs && benchmarkData.timerResolution.currentMs <= 1.0 ? '✓ Otimizado' : 'Padrão'}
                </span>
              </div>
              <button
                onClick={handleTogglePrecisionTimer}
                className="mt-2 text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 underline"
              >
                Forçar 0.5ms Global (High Precision)
              </button>
            </div>

            {/* Server Pings */}
            {benchmarkData?.serverPings ? (
              benchmarkData.serverPings.map((sp: { name: string; pingMs: number; jitterMs: number; location?: string }, idx: number) => (
                <div key={idx} className="p-3 rounded-lg bg-[#131B2E] border border-[#1E293B]">
                  <div className="text-[10px] text-gray-400 uppercase font-semibold truncate">{sp.name}</div>
                  <div className="text-lg font-bold text-white mt-1 flex items-baseline gap-1.5">
                    <span className={sp.pingMs < 25 ? 'text-emerald-400' : sp.pingMs < 50 ? 'text-cyan-400' : 'text-amber-400'}>
                      {sp.pingMs} ms
                    </span>
                    <span className="text-[10px] text-gray-400 font-normal font-mono">
                      (±{sp.jitterMs}ms jitter)
                    </span>
                  </div>
                  <div className="text-[10px] text-gray-400 truncate mt-1">{sp.location}</div>
                </div>
              ))
            ) : (
              <>
                <div className="p-3 rounded-lg bg-[#131B2E] border border-[#1E293B]">
                  <div className="text-[10px] text-gray-400 uppercase font-semibold">Ibéria / Madrid</div>
                  <div className="text-lg font-bold text-emerald-400 mt-1">~10 ms</div>
                  <div className="text-[10px] text-gray-400 mt-1">Espanha / Portugal</div>
                </div>
                <div className="p-3 rounded-lg bg-[#131B2E] border border-[#1E293B]">
                  <div className="text-[10px] text-gray-400 uppercase font-semibold">Europa Central</div>
                  <div className="text-lg font-bold text-cyan-400 mt-1">~22 ms</div>
                  <div className="text-[10px] text-gray-400 mt-1">Frankfurt (Alemanha)</div>
                </div>
                <div className="p-3 rounded-lg bg-[#131B2E] border border-[#1E293B]">
                  <div className="text-[10px] text-gray-400 uppercase font-semibold">Europa Ocidental</div>
                  <div className="text-lg font-bold text-cyan-400 mt-1">~35 ms</div>
                  <div className="text-[10px] text-gray-400 mt-1">Londres (UK)</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Visual Pipeline Stages Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 pt-2 border-t border-[#1E293B]">
          {STAGES.map((stage, idx) => {
            const isCurrent = activeStage === stage.id;
            const stageItems = states.filter((st) =>
              stage.itemPrefixes.some((prefix) => st.item.id.startsWith(prefix))
            );
            const appliedInStage = stageItems.filter((s) => s.status === 'applied').length;
            const totalInStage = stageItems.filter((s) => s.item.type === 'alter').length;

            return (
              <button
                key={stage.id}
                onClick={() => setActiveStage(stage.id)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isCurrent
                    ? 'bg-[#18233C] border-indigo-500 text-white ring-1 ring-indigo-500/50 shadow-md shadow-indigo-500/10'
                    : 'bg-[#131B2E] border-[#1E293B] text-gray-400 hover:text-gray-200 hover:bg-[#162138]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isCurrent ? 'bg-indigo-600 text-white' : 'bg-[#1C2844] text-gray-400'
                  }`}>
                    {stage.icon}
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0F1626] text-gray-300 border border-[#1E293B]">
                    {appliedInStage}/{totalInStage}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-bold leading-tight truncate">
                    {stage.name}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5 truncate">
                    Passo {idx + 1}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Stage Detail & Switch List */}
      <div className="bg-[#10172A] border border-[#1E293B] rounded-2xl p-6 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              {currentStageMeta.icon}
              <span>{currentStageMeta.name}</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {currentStageMeta.shortDesc}
            </p>
          </div>
          <span className="text-xs text-indigo-400 font-mono">
            {stageStates.length} configurações encontradas
          </span>
        </div>

        {/* List of optimization switches */}
        <div className="space-y-2.5">
          {stageStates.map((st) => {
            const isApplied = st.status === 'applied';
            const isAlter = st.item.type === 'alter';

            return (
              <div
                key={st.item.id}
                className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                  isApplied
                    ? 'bg-[#131E36] border-indigo-500/40'
                    : 'bg-[#121A2C] border-[#1E293B] hover:border-[#2B3B66]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        {st.item.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#1B2642] text-gray-400">
                        #{st.item.itemNumber}
                      </span>
                      {st.item.recommended && (
                        <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                          Recomendado
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400 mt-0.5">
                      {st.item.description}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {isAlter ? (
                    <div
                      onClick={() => !isOperating && (isApplied ? onRevert(st.item.id) : onApply(st.item.id))}
                      className={`cursor-pointer w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
                        isApplied ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'
                      } ${isOperating ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          isApplied ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  ) : (
                    <button
                      disabled={isOperating}
                      onClick={() => onApply(st.item.id)}
                      className="px-3 py-1 rounded-lg bg-[#1B2642] hover:bg-[#25355E] text-cyan-300 text-xs font-semibold"
                    >
                      Verificar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
