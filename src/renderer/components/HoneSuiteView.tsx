import React, { useState, useEffect } from 'react';
import {
  Gamepad2,
  Zap,
  CheckCircle2,
  RefreshCw,
  FolderOpen,
  RotateCcw,
  Sparkles,
  Flame,
  ShieldCheck,
  Cpu,
  ArrowRight
} from 'lucide-react';

interface GameConfigItem {
  id: string;
  name: string;
  category: string;
  configPath: string | null;
  isFound: boolean;
  isOptimized: boolean;
  hasBackup: boolean;
  description: string;
  keyTweaks: string[];
}

interface HoneTweakItem {
  id: string;
  name: string;
  description: string;
  category: string;
  honeTier: string;
  isApplied: boolean;
  impactDescription: string;
}

interface HoneSuiteViewProps {
  onShowNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const HoneSuiteView: React.FC<HoneSuiteViewProps> = ({ onShowNotification }) => {
  const [configs, setConfigs] = useState<GameConfigItem[]>([]);
  const [tweaks, setTweaks] = useState<HoneTweakItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isApplyingSuite, setIsApplyingSuite] = useState(false);
  const [isBatchConfiguring, setIsBatchConfiguring] = useState(false);
  const [operatingGameId, setOperatingGameId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (window.optimizerApi?.gameConfigGetConfigs) {
        const c = await window.optimizerApi.gameConfigGetConfigs();
        setConfigs(c);
      }
      if (window.optimizerApi?.honeSuiteGetTweaks) {
        const t = await window.optimizerApi.honeSuiteGetTweaks();
        setTweaks(t);
      }
    } catch {} finally {
      setIsLoading(false);
    }
  };

  const handleApplyHoneSuite = async () => {
    setIsApplyingSuite(true);
    try {
      const res = await window.optimizerApi.honeSuiteApplyAll();
      onShowNotification(res.message, res.success ? 'success' : 'error');
      await loadData();
    } catch (e: any) {
      onShowNotification(e.message, 'error');
    } finally {
      setIsApplyingSuite(false);
    }
  };

  const handleOptimizeGame = async (game: GameConfigItem) => {
    setOperatingGameId(game.id);
    try {
      const res = await window.optimizerApi.gameConfigOptimize(game.id);
      onShowNotification(res.message, res.success ? 'success' : 'error');
      await loadData();
    } catch (e: any) {
      onShowNotification(e.message, 'error');
    } finally {
      setOperatingGameId(null);
    }
  };

  const handleRevertGame = async (game: GameConfigItem) => {
    setOperatingGameId(game.id);
    try {
      const res = await window.optimizerApi.gameConfigRevert(game.id);
      onShowNotification(res.message, res.success ? 'success' : 'error');
      await loadData();
    } catch (e: any) {
      onShowNotification(e.message, 'error');
    } finally {
      setOperatingGameId(null);
    }
  };

  const handleOptimizeAllConfigs = async () => {
    setIsBatchConfiguring(true);
    try {
      const res = await window.optimizerApi.gameConfigOptimizeAll();
      if (res.success) {
        onShowNotification(`Tuning Concluído: ${res.count} ficheiros de jogos otimizados para eSports!`, 'success');
        await loadData();
      }
    } catch (e: any) {
      onShowNotification(e.message, 'error');
    } finally {
      setIsBatchConfiguring(false);
    }
  };

  const detectedCount = configs.filter((c) => c.isFound).length;
  const optimizedCount = configs.filter((c) => c.isOptimized).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#10172A] border border-[#1E293B] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-orange-500/10 via-amber-500/5 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shrink-0 shadow-lg">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-white tracking-tight">Apex eSports & In-Game Config Tuner</h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-amber-300 border border-amber-500/30">
                  Apex Pro Latency Suite
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
                Otimizações profundas de baixa latência e precisão eSports, combinadas com o <strong>In-Game Config Tuner</strong> que ajusta diretamente os ficheiros de configuração interna dos teus jogos instalados para máxima taxa de quadros e menor latência.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
            <button
              onClick={handleApplyHoneSuite}
              disabled={isApplyingSuite}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-black shadow-orange-950/40"
            >
              <Zap className={`w-3.5 h-3.5 ${isApplyingSuite ? 'animate-spin' : ''}`} />
              <span>{isApplyingSuite ? 'A Aplicar Suite...' : '1-Clique: Aplicar Apex Pro Suite'}</span>
            </button>
            <button
              onClick={handleOptimizeAllConfigs}
              disabled={isBatchConfiguring || detectedCount === 0}
              className="px-3.5 py-2 rounded-xl bg-[#1E293B] hover:bg-[#334155] border border-amber-500/30 text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Otimizar Todos os Jogos ({detectedCount})</span>
            </button>
            <button
              onClick={loadData}
              disabled={isLoading}
              className="p-2 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-white transition-all"
              title="Atualizar"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-5 pt-4 border-t border-[#1E293B] grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[#0B0F19] rounded-xl p-3 border border-[#1E293B] flex items-center gap-3">
            <Gamepad2 className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold">Jogos Detetados no Teu PC</div>
              <div className="text-sm font-bold text-white font-mono">{detectedCount} Jogos Instalados ({optimizedCount} Otimizados)</div>
            </div>
          </div>

          <div className="bg-[#0B0F19] rounded-xl p-3 border border-[#1E293B] flex items-center gap-3">
            <Cpu className="w-5 h-5 text-orange-400 shrink-0" />
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold">Apex Pro Tweaks</div>
              <div className="text-sm font-bold text-emerald-400 font-mono">6 Tweaks de Alta Performance Prontos</div>
            </div>
          </div>

          <div className="bg-[#0B0F19] rounded-xl p-3 border border-[#1E293B] flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0" />
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold">Segurança de Configs</div>
              <div className="text-sm font-bold text-teal-300">Backups Automáticos (.backup)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: In-Game Config Tuner */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">Otimizador de Ficheiros de Configuração dos Jogos (In-Game Engine)</h3>
          </div>
          <span className="text-[11px] font-mono text-gray-400">Edição direta de .ini / .cfg / .txt</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {configs.map((game) => {
            const isBusy = operatingGameId === game.id;

            return (
              <div
                key={game.id}
                className={`rounded-2xl p-5 transition-all border ${
                  game.isOptimized
                    ? 'bg-[#10172A] border-emerald-500/40 shadow-[0_4px_20px_rgba(16,185,129,0.06)]'
                    : game.isFound
                    ? 'bg-[#10172A] border-[#1E293B] hover:border-gray-700'
                    : 'bg-[#10172A]/40 border-[#1E293B]/60 opacity-60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white truncate">{game.name}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#1E293B] text-gray-400">
                        {game.category}
                      </span>
                      {game.isFound ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Detetado no Disco
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gray-800 text-gray-500">
                          Não Instalado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      {game.description}
                    </p>
                  </div>
                </div>

                {/* Key Tweaks Preview */}
                <div className="mt-3.5 pt-3 border-t border-[#1E293B] space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-amber-400/90 tracking-wider">Ajustes In-Game Aplicados:</span>
                  <div className="space-y-1">
                    {game.keyTweaks.map((tweak, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 text-[11px] text-gray-300">
                        <ArrowRight className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="truncate">{tweak}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-[#1E293B] flex items-center justify-between gap-2">
                  <div className="text-[11px] font-mono text-gray-400">
                    {game.isOptimized ? (
                      <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Otimização Ativa
                      </span>
                    ) : (
                      <span>Estado Padrão</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {game.hasBackup && (
                      <button
                        onClick={() => handleRevertGame(game)}
                        disabled={isBusy}
                        className="px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-gray-300 text-xs font-medium transition-all flex items-center gap-1"
                        title="Restaurar backup original do jogo"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Restaurar</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleOptimizeGame(game)}
                      disabled={!game.isFound || isBusy}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
                        game.isFound
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black shadow-amber-950/40'
                          : 'bg-[#1E293B] text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Zap className={`w-3.5 h-3.5 ${isBusy ? 'animate-spin' : ''}`} />
                      <span>{isBusy ? 'A Otimizar...' : game.isOptimized ? 'Reaplicar Config' : 'Otimizar Jogo'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Hone Premium System Tweaks */}
      <div className="space-y-4 pt-4 border-t border-[#1E293B]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">Tweaks da Suite Apex Pro Latency</h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 font-semibold">Incluído no Optimizer</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {tweaks.map((tweak) => (
            <div
              key={tweak.id}
              className={`rounded-xl p-4 border transition-all ${
                tweak.isApplied
                  ? 'bg-[#10172A] border-emerald-500/30'
                  : 'bg-[#10172A]/70 border-[#1E293B]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-orange-500/10 text-orange-300 border border-orange-500/20">
                  {tweak.honeTier}
                </span>
                {tweak.isApplied ? (
                  <span className="text-emerald-400 flex items-center gap-1 text-[10px] font-mono font-bold">
                    <CheckCircle2 className="w-3 h-3" /> ATIVO
                  </span>
                ) : (
                  <span className="text-gray-500 text-[10px] font-mono">PENDENTE</span>
                )}
              </div>
              <h4 className="text-xs font-bold text-white mt-2">{tweak.name}</h4>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed line-clamp-2">
                {tweak.description}
              </p>
              <div className="mt-2 text-[10px] font-mono text-amber-300/90 font-medium">
                {tweak.impactDescription}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
