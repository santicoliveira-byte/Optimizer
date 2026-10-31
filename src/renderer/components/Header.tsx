import React from 'react';
import {
  Search,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  BookmarkPlus,
  Minus,
  Square,
  X
} from 'lucide-react';
import { useI18n } from '../i18n';
import { OptimizationRisk, OptimizationType } from '../../shared/types';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedRisk: 'all' | OptimizationRisk;
  onRiskChange: (r: 'all' | OptimizationRisk) => void;
  selectedType: 'all' | OptimizationType;
  onTypeChange: (t: 'all' | OptimizationType) => void;
  filterRecommended: boolean;
  onToggleRecommended: () => void;
  isDryRun: boolean;
  onToggleDryRun: () => void;
  onCreateRestorePoint: () => void;
  onRevertAll: () => void;
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
  selectedRisk,
  onRiskChange,
  selectedType,
  onTypeChange,
  filterRecommended,
  onToggleRecommended,
  isDryRun,
  onToggleDryRun,
  onCreateRestorePoint,
  onRevertAll,
  isTournamentMode = false,
  onToggleTournamentMode,
  timerResolutionMs = 1.0,
  onOpenUpdates,
  hasUpdateAvailable = false,
  currentAppVersion = '1.0'
}) => {
  const { t } = useI18n();

  return (
    <header
      className="bg-[#0D1322] border-b border-[#1E293B] px-5 py-2.5 select-none flex flex-col gap-2.5"
      style={{ WebkitAppRegion: 'drag' } as any}
      onDoubleClick={() => window.optimizerApi?.maximizeWindow?.()}
    >
      {/* Top action row */}
      <div className="flex items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('search.placeholder')}
            className="w-full bg-[#131B2E] border border-[#232F4D] rounded-lg pl-9 pr-4 py-1.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>

        {/* Global Controls, Tournament Mode & Timer Resolution */}
        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
          {/* Real-time Timer Resolution Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
              timerResolutionMs <= 0.55
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/10'
                : 'bg-[#151E33] border-[#232F4D] text-gray-400'
            }`}
            title="Resolução de Timer do Kernel do Windows (Tempo entre interrupções do sistema)"
          >
            <span className={`w-2 h-2 rounded-full ${timerResolutionMs <= 0.55 ? 'bg-emerald-400 animate-ping' : 'bg-gray-500'}`} />
            <span>⏱️ {timerResolutionMs.toFixed(3)} ms</span>
          </div>

          {/* 1-Click eSports Tournament Mode */}
          {onToggleTournamentMode && (
            <button
              onClick={onToggleTournamentMode}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-md ${
                isTournamentMode
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-amber-400 text-black shadow-amber-500/20 animate-pulse'
                  : 'bg-[#151E33] hover:bg-[#1E293B] border-[#232F4D] text-amber-400 hover:text-amber-300'
              }`}
              title="Ativa 0.5ms Timer + Purga RAM + Max Clocks GPU + QoS de Jogo simultaneamente"
            >
              <span>🏆</span>
              <span>{isTournamentMode ? t('header.tourney_active') : t('header.tourney_mode')}</span>
            </button>
          )}

          {/* Dry Run / Simulação Switch */}
          <div
            onClick={onToggleDryRun}
            className={`cursor-pointer flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              isDryRun
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 shadow-sm shadow-amber-500/10'
                : 'bg-[#151E33] border-[#232F4D] text-gray-400 hover:text-gray-200'
            }`}
          >
            <ShieldAlert className={`w-3.5 h-3.5 ${isDryRun ? 'text-amber-400' : 'text-gray-500'}`} />
            <span>{t('header.simulation')}</span>
            <div
              className={`w-7 h-4 rounded-full transition-colors relative flex items-center p-0.5 ${
                isDryRun ? 'bg-amber-500' : 'bg-gray-700'
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full bg-white transition-transform ${
                  isDryRun ? 'translate-x-3' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          {/* Create Restore Point */}
          <button
            onClick={onCreateRestorePoint}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#151E33] hover:bg-[#1C2844] border border-[#232F4D] text-gray-200 text-xs font-medium transition-all"
            title="Criar Ponto de Restauro do Windows imediatamente"
          >
            <BookmarkPlus className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">{t('header.restore_point')}</span>
          </button>

          {/* Revert All Button */}
          <button
            onClick={onRevertAll}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium transition-all"
            title="Restaura todas as alterações guardadas no histórico de backups"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('header.revert_all')}</span>
          </button>

          {/* Version / Updates Badge */}
          {onOpenUpdates && (
            <button
              onClick={onOpenUpdates}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                hasUpdateAvailable
                  ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-500/60 text-emerald-300 shadow-md shadow-emerald-500/10 animate-bounce'
                  : 'bg-[#151E33] hover:bg-[#1C2844] border-[#232F4D] text-gray-300 hover:text-white'
              }`}
              title="Verificar atualizações automáticas do Optimizer no GitHub"
            >
              <span className={`w-2 h-2 rounded-full ${hasUpdateAvailable ? 'bg-emerald-400 animate-ping' : 'bg-indigo-400'}`} />
              <span className="font-mono text-[11px]">v{currentAppVersion}</span>
              {hasUpdateAvailable ? (
                <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-1 py-0.5 rounded font-bold">
                  Novo!
                </span>
              ) : null}
            </button>
          )}

          {/* Window Control Buttons (Minimize, Maximize, Close) */}
          <div className="flex items-center ml-2 border-l border-[#1E293B] pl-2 gap-0.5">
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
      </div>

      {/* Filter row */}
      <div
        className="flex items-center gap-2 overflow-x-auto text-[11px] pb-0.5"
        style={{ WebkitAppRegion: 'no-drag' } as any}
      >
        <span className="text-gray-400 font-medium mr-1">{t('header.filters')}</span>

        {/* Risk filters */}
        <button
          onClick={() => onRiskChange('all')}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            selectedRisk === 'all'
              ? 'bg-indigo-600 text-white font-medium'
              : 'bg-[#151E33] text-gray-400 hover:text-white border border-[#232F4D]'
          }`}
        >
          {t('header.all_risks')}
        </button>

        <button
          onClick={() => onRiskChange('safe')}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            selectedRisk === 'safe'
              ? 'bg-emerald-600 text-white font-medium'
              : 'bg-[#151E33] text-gray-400 hover:text-emerald-300 border border-[#232F4D]'
          }`}
        >
          [{t('header.safe')}]
        </button>

        <button
          onClick={() => onRiskChange('moderate')}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            selectedRisk === 'moderate'
              ? 'bg-amber-600 text-white font-medium'
              : 'bg-[#151E33] text-gray-400 hover:text-amber-300 border border-[#232F4D]'
          }`}
        >
          [{t('header.moderate')}]
        </button>

        <div className="w-[1px] h-4 bg-[#1E293B] mx-1" />

        {/* Type filters */}
        <button
          onClick={() => onTypeChange('all')}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            selectedType === 'all'
              ? 'bg-indigo-600 text-white font-medium'
              : 'bg-[#151E33] text-gray-400 hover:text-white border border-[#232F4D]'
          }`}
        >
          {t('header.all_types')}
        </button>

        <button
          onClick={() => onTypeChange('alter')}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            selectedType === 'alter'
              ? 'bg-indigo-500 text-white font-medium'
              : 'bg-[#151E33] text-gray-400 hover:text-indigo-300 border border-[#232F4D]'
          }`}
        >
          {t('header.alters')}
        </button>

        <button
          onClick={() => onTypeChange('inform')}
          className={`px-2.5 py-1 rounded-md transition-colors ${
            selectedType === 'inform'
              ? 'bg-cyan-600 text-white font-medium'
              : 'bg-[#151E33] text-gray-400 hover:text-cyan-300 border border-[#232F4D]'
          }`}
        >
          {t('header.informs')}
        </button>

        <div className="w-[1px] h-4 bg-[#1E293B] mx-1" />

        {/* Recommended Toggle */}
        <button
          onClick={onToggleRecommended}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
            filterRecommended
              ? 'bg-indigo-600 text-white font-medium shadow-sm shadow-indigo-500/20'
              : 'bg-[#151E33] text-gray-400 hover:text-white border border-[#232F4D]'
          }`}
        >
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>{t('header.recommended_only')}</span>
        </button>
      </div>
    </header>
  );
};
