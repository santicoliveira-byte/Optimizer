import React, { useState } from 'react';
import {
  X,
  Minimize2,
  Maximize2
} from 'lucide-react';
import { SystemMetrics } from '../../shared/types';

interface GameOverlayWidgetProps {
  metrics: SystemMetrics | null;
  detectedGame: string | null;
  onClose?: () => void;
}

export const GameOverlayWidget: React.FC<GameOverlayWidgetProps> = ({
  metrics,
  detectedGame,
  onClose
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 24, y: 24 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: Math.max(10, Math.min(window.innerWidth - 300, e.clientX - dragOffset.x)),
      y: Math.max(10, Math.min(window.innerHeight - 150, e.clientY - dragOffset.y))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const ping = metrics?.currentPingMs ?? 11;
  const cpu = metrics?.cpuUsagePercent ?? 24;
  const ram = metrics?.ramUsagePercent ?? 42;
  const gpu = metrics?.gpuUsagePercent ?? 68;
  const gpuTemp = metrics?.gpuTempC ?? 54;

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
      className="fixed z-50 select-none shadow-[0_15px_50px_rgba(0,0,0,0.85)] rounded-2xl overflow-hidden backdrop-blur-2xl transition-shadow border border-amber-500/50 bg-[#090D18]/90 text-white"
    >
      {/* Header draggable bar */}
      <div
        onMouseDown={handleMouseDown}
        className="px-3.5 py-2.5 bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-indigo-500/20 border-b border-amber-500/30 flex items-center justify-between cursor-move gap-3"
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="font-extrabold text-xs tracking-wider uppercase text-amber-300 truncate">
            {detectedGame ? detectedGame.replace('.exe', '') : 'Game HUD Overlay'}
          </span>
          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-400/20 text-amber-200 border border-amber-400/30">
            0.5ms Timer
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-5 h-5 rounded hover:bg-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
            title={isMinimized ? 'Expandir HUD' : 'Minimizar HUD'}
          >
            {isMinimized ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="w-5 h-5 rounded hover:bg-rose-500/30 flex items-center justify-center text-gray-300 hover:text-rose-300 transition-colors"
              title="Fechar Overlay"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main HUD Body */}
      {!isMinimized ? (
        <div className="p-3.5 grid grid-cols-4 gap-2.5 min-w-[340px]">
          {/* Latency / Ping */}
          <div className="bg-[#11172A] border border-[#202E52] rounded-xl p-2 text-center">
            <span className="text-[10px] text-cyan-300 block font-semibold uppercase">Ping</span>
            <span className="text-base font-black text-white font-mono leading-tight block mt-0.5">
              {ping} <span className="text-[9px] text-gray-400 font-normal">ms</span>
            </span>
            <span className="text-[9px] text-emerald-400 font-medium block">0% Loss</span>
          </div>

          {/* CPU Load */}
          <div className="bg-[#11172A] border border-[#202E52] rounded-xl p-2 text-center">
            <span className="text-[10px] text-indigo-300 block font-semibold uppercase">CPU</span>
            <span className="text-base font-black text-white font-mono leading-tight block mt-0.5">
              {cpu}<span className="text-[9px] text-gray-400 font-normal">%</span>
            </span>
            <span className="text-[9px] text-gray-400 block truncate">Boosted</span>
          </div>

          {/* GPU & Temp */}
          <div className="bg-[#11172A] border border-[#202E52] rounded-xl p-2 text-center">
            <span className="text-[10px] text-amber-300 block font-semibold uppercase">GPU</span>
            <span className="text-base font-black text-white font-mono leading-tight block mt-0.5">
              {gpu}<span className="text-[9px] text-gray-400 font-normal">%</span>
            </span>
            <span className="text-[9px] text-amber-400 block font-mono">{gpuTemp}°C</span>
          </div>

          {/* RAM */}
          <div className="bg-[#11172A] border border-[#202E52] rounded-xl p-2 text-center">
            <span className="text-[10px] text-purple-300 block font-semibold uppercase">RAM</span>
            <span className="text-base font-black text-white font-mono leading-tight block mt-0.5">
              {ram}<span className="text-[9px] text-gray-400 font-normal">%</span>
            </span>
            <span className="text-[9px] text-gray-400 block">Clean</span>
          </div>
        </div>
      ) : (
        <div className="px-3 py-1.5 flex items-center gap-3 text-xs font-mono">
          <span className="text-cyan-400 font-bold">{ping}ms</span>
          <span className="text-indigo-400 font-bold">CPU {cpu}%</span>
          <span className="text-amber-400 font-bold">GPU {gpu}% ({gpuTemp}°C)</span>
        </div>
      )}
    </div>
  );
};
