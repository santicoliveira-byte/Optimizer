import React from 'react';
import {
  Search,
  BookmarkPlus,
  Minus,
  Square,
  X,
  Radio
} from 'lucide-react';
import { useI18n } from '../i18n';
import { OptimizationRisk, OptimizationType } from '../../shared/types';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedRisk?: 'all' | OptimizationRisk;
  onRiskChange?: (r: 'all' | OptimizationRisk) => void;
  selectedType?: 'all' | OptimizationType;
  onTypeChange?: (t: 'all' | OptimizationType) => void;
  filterRecommended?: boolean;
  onToggleRecommended?: () => void;
  isDryRun?: boolean;
  onToggleDryRun?: () => void;
  onCreateRestorePoint: () => void;
  onRevertAll?: () => void;
  isTournamentMode?: boolean;
  onToggleTournamentMode?: () => void;
  timerResolutionMs?: number;
  onOpenUpdates?: () => void;
  hasUpdateAvailable?: boolean;
  currentAppVersion?: string;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onCreateRestorePoint,
  isTournamentMode = false,
  onToggleTournamentMode,
  timerResolutionMs = 1.0,
  onOpenUpdates,
  hasUpdateAvailable = false,
  currentAppVersion = '1.3'
}) => {
  const { t } = useI18n();

  return (
    <header
      className="bg-[#0D1322] border-b border-[#1E293B] px-5 py-2 select-none flex items-center justify-between gap-3 h-14 shrink-0"
      style={{ WebkitAppRegion: 'drag' } as any}
      onDoubleClick={() => window.optimizerApi?.maximizeWindow?.()}
    >
      {/* Search Input - Sleek & Focused */}
      <div className="relative flex-1 max-w-sm" style={{ WebkitAppRegion: 'no-drag' } as any}>
        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('search.placeholder')}
          className="w-full bg-[#131B2E] border border-[#232F4D] hover:border-[#33446E] focus:border-indigo-500 rounded-lg pl-8 pr-7 py-1.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs p-0.5"
            title="Limpar pesquisa"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Global Status & Quick Actions */}
      <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
        {/* Real-time Timer Resolution Badge */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
            timerResolutionMs <= 0.55
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/10'
              : 'bg-[#151E33] border-[#232F4D] text-gray-400'
          }`}
          title="Resolução de Timer do Kernel do Windows (0.5ms = Latência Mínima)"
        >
          <span className={`w-2 h-2 rounded-full ${timerResolutionMs <= 0.55 ? 'bg-emerald-400 animate-ping' : 'bg-gray-500'}`} />
          <span>⏱️ {timerResolutionMs.toFixed(3)} ms</span>
        </div>

        {/* 1-Click Gaming Mode */}
        {onToggleTournamentMode && (
          <button
            onClick={onToggleTournamentMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-sm ${
              isTournamentMode
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-400 text-black shadow-amber-500/20 animate-pulse'
                : 'bg-[#151E33] hover:bg-[#1E293B] border-[#232F4D] text-amber-400 hover:text-amber-300'
            }`}
            title="Modo Jogo Ultra: 0.5ms Timer + Max Clocks GPU + QoS DSCP 46"
          >
            <span>🏆</span>
            <span>{isTournamentMode ? t('header.tourney_active') : t('header.tourney_mode')}</span>
          </button>
        )}

        {/* In-Game Ultra-Light Overlay Toggle */}
        <button
          onClick={() => window.optimizerApi?.overlayToggle?.()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#151E33] hover:bg-[#1E293B] border border-[#232F4D] text-xs font-semibold text-amber-300 hover:text-white transition-all shadow-sm"
          title="Alternar Overlay Flutuante de Alto Desempenho (Atalho Global: Ctrl + Shift + F3)"
        >
          <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="hidden lg:inline">HUD Overlay</span>
        </button>

        {/* Create Restore Point */}
        <button
          onClick={onCreateRestorePoint}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#151E33] hover:bg-[#1C2844] border border-[#232F4D] text-gray-200 text-xs font-medium transition-all"
          title="Criar Ponto de Restauro do Windows imediatamente"
        >
          <BookmarkPlus className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline">{t('header.restore_point')}</span>
        </button>

        {/* Updates Badge */}
        {onOpenUpdates && (
          <button
            onClick={onOpenUpdates}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              hasUpdateAvailable
                ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-sm animate-bounce'
                : 'bg-[#151E33] hover:bg-[#1C2844] border-[#232F4D] text-gray-400 hover:text-white'
            }`}
            title="Verificar atualizações no GitHub"
          >
            <span className={`w-1.5 h-1.5 rounded-full ${hasUpdateAvailable ? 'bg-emerald-400 animate-ping' : 'bg-indigo-400'}`} />
            <span className="font-mono text-[11px]">v{currentAppVersion}</span>
          </button>
        )}

        {/* Window Controls */}
        <div className="flex items-center ml-1 border-l border-[#1E293B] pl-2 gap-0.5">
          <button
            onClick={() => window.optimizerApi?.minimizeWindow?.()}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#1C2844] text-gray-400 hover:text-white transition-colors"
            title="Minimizar"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => window.optimizerApi?.maximizeWindow?.()}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#1C2844] text-gray-400 hover:text-white transition-colors"
            title="Maximizar / Restaurar"
          >
            <Square className="w-3 h-3" />
          </button>
          <button
            onClick={() => window.optimizerApi?.closeWindow?.()}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-rose-600 hover:text-white text-gray-400 transition-colors"
            title="Fechar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
