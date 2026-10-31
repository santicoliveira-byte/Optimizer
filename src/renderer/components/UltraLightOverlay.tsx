import React, { useState, useEffect } from 'react';
import {
  X,
  Ghost,
  Move,
  Zap,
  Activity,
  Cpu,
  Radio
} from 'lucide-react';
import { SystemMetrics } from '../../shared/types';

export const UltraLightOverlay: React.FC = () => {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [timerMs, setTimerMs] = useState<number>(0.5);
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [isGhostMode, setIsGhostMode] = useState<boolean>(false);
  const [positionPreset, setPositionPreset] = useState<'top-right' | 'top-left' | 'top-center' | 'bottom-right'>('top-right');

  // Low-overhead polling: 1500ms interval (near 0% CPU impact)
  useEffect(() => {
    let isMounted = true;

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

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center p-1 select-none pointer-events-auto ${
        isGhostMode ? 'pointer-events-none opacity-80' : ''
      }`}
    >
      <div
        style={{ WebkitAppRegion: isGhostMode ? 'none' : 'drag' } as any}
        className="w-full h-full bg-[#080D18]/95 border border-amber-500/50 hover:border-amber-400 rounded-xl px-3 py-1 flex items-center justify-between text-white shadow-[0_4px_20px_rgba(0,0,0,0.8)] transition-all cursor-move"
      >
        {/* Left: Active Game / Timer Status */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>{timerMs.toFixed(3)}ms</span>
          </div>

          {activeGame && (
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30 truncate max-w-[80px]" title={activeGame}>
              {activeGame}
            </span>
          )}
        </div>

        {/* Center: In-Game Ultra-Light Telemetry Ribbon */}
        <div className="flex items-center gap-2.5 text-xs font-mono font-bold shrink-0">
          {/* Ping */}
          <div className="flex items-center gap-1 text-cyan-300" title="Latência de Rede / Ping">
            <Radio className="w-3 h-3 text-cyan-400" />
            <span>{ping}<span className="text-[9px] text-cyan-400/80 font-normal">ms</span></span>
          </div>

          <span className="text-gray-700">|</span>

          {/* CPU */}
          <div className="flex items-center gap-1 text-indigo-300" title="Carga do Processador">
            <Cpu className="w-3 h-3 text-indigo-400" />
            <span>{cpu}<span className="text-[9px] text-indigo-400/80 font-normal">%</span></span>
          </div>

          <span className="text-gray-700">|</span>

          {/* GPU & Temp */}
          <div className="flex items-center gap-1 text-amber-300" title="Carga e Temperatura da Placa Gráfica">
            <Zap className="w-3 h-3 text-amber-400" />
            <span>{gpuTemp}°<span className="text-[9px] text-amber-400/80 font-normal">({gpu}%)</span></span>
          </div>

          <span className="text-gray-700">|</span>

          {/* RAM */}
          <div className="flex items-center gap-1 text-purple-300" title="Memória RAM em Uso">
            <Activity className="w-3 h-3 text-purple-400" />
            <span>{ramGb}<span className="text-[9px] text-purple-400/80 font-normal">GB</span></span>
          </div>
        </div>

        {/* Right: Controls (Ghost Mode, Snap Position, Close) */}
        <div
          style={{ WebkitAppRegion: 'no-drag' } as any}
          className="flex items-center gap-1 shrink-0 ml-2"
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
                ? 'Modo Fantasma Ativo (Cliques atravessam para o jogo - Pressiona Ctrl+Shift+F4 ou usa as Definições para sair)'
                : 'Ativar Modo Fantasma (Cliques do rato passam diretos para o jogo - Atalho: Ctrl+Shift+F4)'
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
      </div>
    </div>
  );
};
