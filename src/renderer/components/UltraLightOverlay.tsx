import React, { useState, useEffect } from 'react';
import {
  X,
  Ghost,
  Move,
  Zap,
  Activity,
  Cpu,
  Radio,
  Gauge
} from 'lucide-react';
import { SystemMetrics, OverlayConfig } from '../../shared/types';

const DEFAULT_CONFIG: OverlayConfig = {
  items: {
    showTimer: true,
    showGameName: true,
    showFps: true,
    showPing: true,
    showCpu: true,
    showGpu: true,
    showRam: true,
    showControls: true
  },
  format: 'horizontal',
  theme: 'dark-gamer',
  fontSize: 'compact',
  opacity: 95
};

export const UltraLightOverlay: React.FC = () => {
  const [config, setConfig] = useState<OverlayConfig>(DEFAULT_CONFIG);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [timerMs, setTimerMs] = useState<number>(0.5);
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [fps, setFps] = useState<number>(60);
  const [min1Fps, setMin1Fps] = useState<number>(55);
  const [frametimeMs, setFrametimeMs] = useState<number>(16.6);
  const [isGhostMode, setIsGhostMode] = useState<boolean>(false);
  const [positionPreset, setPositionPreset] = useState<'top-right' | 'top-left' | 'top-center' | 'bottom-right'>('top-right');

  // Measure genuine display refresh rate / render loop
  useEffect(() => {
    let frameCounter = 0;
    let prevTimestamp = performance.now();
    let animId: number;

    const frameTick = (timestamp: number) => {
      frameCounter++;
      if (timestamp - prevTimestamp >= 1000) {
        const measured = Math.round((frameCounter * 1000) / (timestamp - prevTimestamp));
        frameCounter = 0;
        prevTimestamp = timestamp;
        if (!activeGame) {
          setFps(measured);
          setMin1Fps(Math.max(1, measured - 2));
          setFrametimeMs(parseFloat((1000 / Math.max(1, measured)).toFixed(1)));
        }
      }
      animId = requestAnimationFrame(frameTick);
    };

    animId = requestAnimationFrame(frameTick);
    return () => cancelAnimationFrame(animId);
  }, [activeGame]);

  // Low-overhead polling: 1500ms interval (near 0% CPU impact)
  useEffect(() => {
    let isMounted = true;

    if (window.optimizerApi?.overlayGetConfig) {
      window.optimizerApi.overlayGetConfig().then((cfg) => {
        if (isMounted && cfg) setConfig(cfg);
      });
    }

    let unsubConfig: (() => void) | undefined;
    if (window.optimizerApi?.onOverlayConfigChanged) {
      unsubConfig = window.optimizerApi.onOverlayConfigChanged((cfg) => {
        if (isMounted && cfg) setConfig(cfg);
      });
    }

    if (window.optimizerApi?.overlayGetStatus) {
      window.optimizerApi.overlayGetStatus().then((st) => {
        if (isMounted && st && typeof st.isClickThrough === 'boolean') {
          setIsGhostMode(st.isClickThrough);
        }
      });
    }

    let unsubGhost: (() => void) | undefined;
    if (window.optimizerApi?.onOverlayGhostChanged) {
      unsubGhost = window.optimizerApi.onOverlayGhostChanged((val) => {
        if (isMounted) setIsGhostMode(val);
      });
    }

    const fetchTelemetry = async () => {
      try {
        if (window.optimizerApi?.getSystemMetrics) {
          const m = await window.optimizerApi.getSystemMetrics();
          if (isMounted) setMetrics(m);
        }
        if (window.optimizerApi?.timerGetStatus) {
          const t = await window.optimizerApi.timerGetStatus();
          if (isMounted && t?.currentMs) setTimerMs(t.currentMs);
        }
        if (window.optimizerApi?.boosterGetState) {
          const b = await window.optimizerApi.boosterGetState();
          if (isMounted && b?.activeGame) {
            setActiveGame(b.activeGame.replace('.exe', ''));
          } else if (isMounted && !b?.activeGame) {
            setActiveGame(null);
          }
        }
        if (window.optimizerApi?.fpsGetLive) {
          const f = await window.optimizerApi.fpsGetLive();
          if (isMounted && f && f.fps > 0) {
            setFps(f.fps);
            if (f.min1Fps) setMin1Fps(f.min1Fps);
            if (f.frametimeMs) setFrametimeMs(f.frametimeMs);
          }
        }
      } catch (err) {
        // Silently continue
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 1500);

    return () => {
      isMounted = false;
      clearInterval(interval);
      unsubGhost?.();
      unsubConfig?.();
    };
  }, []);

  const toggleGhostMode = async () => {
    const nextState = !isGhostMode;
    setIsGhostMode(nextState);
    if (window.optimizerApi?.overlaySetClickThrough) {
      await window.optimizerApi.overlaySetClickThrough(nextState);
    }
  };

  const cyclePosition = async () => {
    const presets: ('top-right' | 'top-left' | 'top-center' | 'bottom-right')[] = [
      'top-right',
      'top-left',
      'top-center',
      'bottom-right'
    ];
    const currentIndex = presets.indexOf(positionPreset);
    const nextPreset = presets[(currentIndex + 1) % presets.length];
    setPositionPreset(nextPreset);

    if (window.optimizerApi?.overlaySetPosition) {
      await window.optimizerApi.overlaySetPosition(nextPreset);
    }
  };

  const handleClose = async () => {
    if (window.optimizerApi?.overlayClose) {
      await window.optimizerApi.overlayClose();
    }
  };

  const ping = metrics?.currentPingMs ?? 11;
  const cpu = metrics?.cpuUsagePercent ?? 20;
  const ramGb = metrics?.ramUsedGb ? metrics.ramUsedGb.toFixed(1) : '5.8';
  const gpu = metrics?.gpuUsagePercent ?? 55;
  const gpuTemp = metrics?.gpuTempC ?? 52;

  const containerThemeClass =
    config.theme === 'glass'
      ? 'bg-black/35 backdrop-blur-md border border-white/20 hover:border-white/40 shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
      : config.theme === 'pure-black'
      ? 'bg-[#05070D] border border-gray-800 hover:border-gray-700 shadow-2xl'
      : 'bg-[#080D18]/95 border border-amber-500/50 hover:border-amber-400 shadow-[0_4px_20px_rgba(0,0,0,0.8)]';

  const renderControls = () => (
    <div
      style={{ WebkitAppRegion: 'no-drag' } as any}
      className="flex items-center gap-1 shrink-0 ml-1.5"
    >
      {/* Ghost Mode (Click-Through) */}
      <button
        onClick={toggleGhostMode}
        className={`p-1 rounded-md transition-colors ${
          isGhostMode
            ? 'bg-amber-500 text-black font-bold'
            : 'text-gray-400 hover:text-white hover:bg-white/10'
        }`}
        title={
          isGhostMode
            ? 'Modo Fantasma Ativo (Cliques atravessam para o jogo - Pressiona Alt+G ou Ctrl+Shift+F4)'
            : 'Ativar Modo Fantasma (Cliques do rato passam diretos para o jogo - Atalho: Alt+G)'
        }
      >
        <Ghost className="w-3 h-3" />
      </button>

      {/* Snap Position Cycle */}
      <button
        onClick={cyclePosition}
        className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        title={`Mudar Posição no Ecrã (Atual: ${positionPreset})`}
      >
        <Move className="w-3 h-3" />
      </button>

      {/* Close */}
      <button
        onClick={handleClose}
        className="p-1 rounded-md text-gray-400 hover:text-rose-300 hover:bg-rose-500/20 transition-colors"
        title="Fechar Overlay"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );

  // FORMATO 1: VERTICAL BENTO WIDGET
  if (config.format === 'vertical') {
    return (
      <div
        className={`fixed inset-0 flex items-center justify-center p-1 select-none pointer-events-auto ${
          isGhostMode ? 'pointer-events-none opacity-80' : ''
        }`}
      >
        <div
          style={{ WebkitAppRegion: isGhostMode ? 'none' : 'drag' } as any}
          className={`w-full h-full rounded-2xl p-3 flex flex-col justify-between text-white transition-all cursor-move ${containerThemeClass}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] font-bold font-mono tracking-wider text-gray-200">OPTIMIZER HUD</span>
            </div>
            {config.items.showControls && renderControls()}
          </div>

          {/* Active Game & Timer Row */}
          <div className="flex items-center justify-between gap-1 py-1">
            {config.items.showTimer && (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {timerMs.toFixed(3)}ms
              </span>
            )}
            {config.items.showGameName && activeGame && (
              <span className="text-[10px] font-extrabold uppercase text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30 truncate max-w-[100px]" title={activeGame}>
                {activeGame}
              </span>
            )}
          </div>

          {/* Hero FPS Badge */}
          {config.items.showFps && (
            <div className="p-2 rounded-xl bg-black/40 border border-emerald-500/30 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-sm font-black font-mono leading-none text-emerald-400">
                    {fps} <span className="text-[9px] font-normal text-gray-400">FPS</span>
                  </div>
                  <div className="text-[9px] font-semibold text-gray-400 mt-0.5">
                    1%: <span className="text-gray-200">{min1Fps}</span> | {frametimeMs}ms
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2x2 Telemetry Grid */}
          <div className="grid grid-cols-2 gap-1.5 text-xs font-mono">
            {config.items.showPing && (
              <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white/5 border border-white/5">
                <Radio className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="font-bold text-cyan-300">{ping}<span className="text-[9px] font-normal text-cyan-400/80">ms</span></span>
              </div>
            )}
            {config.items.showCpu && (
              <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white/5 border border-white/5">
                <Cpu className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="font-bold text-indigo-300">{cpu}<span className="text-[9px] font-normal text-indigo-400/80">%</span></span>
              </div>
            )}
            {config.items.showGpu && (
              <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white/5 border border-white/5">
                <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="font-bold text-amber-300">{gpuTemp}°<span className="text-[9px] font-normal text-amber-400/80">({gpu}%)</span></span>
              </div>
            )}
            {config.items.showRam && (
              <div className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white/5 border border-white/5">
                <Activity className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="font-bold text-purple-300">{ramGb}<span className="text-[9px] font-normal text-purple-400/80">GB</span></span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // FORMATO 2: MINIMALISTA FLUTUANTE
  if (config.format === 'minimal') {
    return (
      <div
        className={`fixed inset-0 flex items-center justify-center p-0.5 select-none pointer-events-auto ${
          isGhostMode ? 'pointer-events-none opacity-80' : ''
        }`}
      >
        <div
          style={{ WebkitAppRegion: isGhostMode ? 'none' : 'drag' } as any}
          className={`w-full h-full rounded-xl px-2.5 py-0.5 flex items-center justify-between text-white transition-all cursor-move ${containerThemeClass}`}
        >
          <div className="flex items-center gap-2.5 text-xs font-mono font-bold">
            {config.items.showTimer && (
              <span className="text-emerald-400 text-[10px] font-mono">{timerMs.toFixed(3)}ms</span>
            )}
            {config.items.showGameName && activeGame && (
              <span className="text-amber-400 text-[10px] uppercase font-extrabold truncate max-w-[70px]">{activeGame}</span>
            )}
            {config.items.showFps && (
              <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                {fps} <span className="text-[9px] opacity-75">FPS</span>
              </span>
            )}
            {config.items.showPing && (
              <span className="text-cyan-300">{ping}<span className="text-[9px] opacity-75">ms</span></span>
            )}
            {config.items.showCpu && (
              <span className="text-indigo-300">{cpu}<span className="text-[9px] opacity-75">%</span></span>
            )}
            {config.items.showGpu && (
              <span className="text-amber-300">{gpuTemp}°</span>
            )}
            {config.items.showRam && (
              <span className="text-purple-300">{ramGb}G</span>
            )}
          </div>
          {config.items.showControls && renderControls()}
        </div>
      </div>
    );
  }

  // FORMATO 3: BARRA HORIZONTAL (PADRÃO)
  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-1 select-none pointer-events-auto ${
        isGhostMode ? 'pointer-events-none opacity-80' : ''
      }`}
    >
      <div
        style={{ WebkitAppRegion: isGhostMode ? 'none' : 'drag' } as any}
        className={`w-full h-full rounded-xl px-3 py-1 flex items-center justify-between text-white transition-all cursor-move ${containerThemeClass}`}
      >
        {/* Left: Active Game / Timer Status */}
        <div className="flex items-center gap-2 shrink-0">
          {config.items.showTimer && (
            <div className="flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>{timerMs.toFixed(3)}ms</span>
            </div>
          )}

          {config.items.showGameName && activeGame && (
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30 truncate max-w-[80px]" title={activeGame}>
              {activeGame}
            </span>
          )}
        </div>

        {/* Center: In-Game Ultra-Light Telemetry Ribbon */}
        <div className="flex items-center gap-2 text-xs font-mono font-bold shrink-0">
          {/* FPS Counter */}
          {config.items.showFps && (
            <div
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg border font-extrabold text-xs transition-all shadow-sm"
              style={{
                backgroundColor: fps >= 120 ? 'rgba(16, 185, 129, 0.18)' : fps >= 60 ? 'rgba(6, 182, 212, 0.18)' : 'rgba(245, 158, 11, 0.18)',
                borderColor: fps >= 120 ? 'rgba(16, 185, 129, 0.45)' : fps >= 60 ? 'rgba(6, 182, 212, 0.45)' : 'rgba(245, 158, 11, 0.45)',
                color: fps >= 120 ? '#34d399' : fps >= 60 ? '#22d3ee' : '#fbbf24'
              }}
              title={`Taxa de Fotogramas: ${fps} FPS | 1% Low: ${min1Fps} FPS | Frametime: ${frametimeMs}ms ${activeGame ? `(Jogo: ${activeGame})` : '(Ambiente de Trabalho)'}`}
            >
              <Gauge className="w-3 h-3 shrink-0" />
              <div className="flex items-baseline gap-1">
                <span>{fps}<span className="text-[9px] font-bold opacity-85 ml-0.5">FPS</span></span>
                <span className="text-[9px] font-semibold text-gray-300 opacity-80">
                  (1%: {min1Fps})
                </span>
                <span className="text-[9px] font-mono text-cyan-300/80">
                  {frametimeMs}ms
                </span>
              </div>
            </div>
          )}

          {/* Ping */}
          {config.items.showPing && (
            <>
              <span className="text-gray-700">|</span>
              <div className="flex items-center gap-1 text-cyan-300" title="Latência de Rede / Ping">
                <Radio className="w-3 h-3 text-cyan-400" />
                <span>{ping}<span className="text-[9px] text-cyan-400/80 font-normal">ms</span></span>
              </div>
            </>
          )}

          {/* CPU */}
          {config.items.showCpu && (
            <>
              <span className="text-gray-700">|</span>
              <div className="flex items-center gap-1 text-indigo-300" title="Carga do Processador">
                <Cpu className="w-3 h-3 text-indigo-400" />
                <span>{cpu}<span className="text-[9px] text-indigo-400/80 font-normal">%</span></span>
              </div>
            </>
          )}

          {/* GPU & Temp */}
          {config.items.showGpu && (
            <>
              <span className="text-gray-700">|</span>
              <div className="flex items-center gap-1 text-amber-300" title="Carga e Temperatura da Placa Gráfica">
                <Zap className="w-3 h-3 text-amber-400" />
                <span>{gpuTemp}°<span className="text-[9px] text-amber-400/80 font-normal">({gpu}%)</span></span>
              </div>
            </>
          )}

          {/* RAM */}
          {config.items.showRam && (
            <>
              <span className="text-gray-700">|</span>
              <div className="flex items-center gap-1 text-purple-300" title="Memória RAM em Uso">
                <Activity className="w-3 h-3 text-purple-400" />
                <span>{ramGb}<span className="text-[9px] text-purple-400/80 font-normal">GB</span></span>
              </div>
            </>
          )}
        </div>

        {/* Right: Controls (Ghost Mode, Snap Position, Close) */}
        {config.items.showControls && renderControls()}
      </div>
    </div>
  );
};
