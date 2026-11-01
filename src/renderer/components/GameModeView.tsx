import React, { useState, useEffect } from 'react';
import {
  Gamepad2,
  Zap,
  RefreshCw,
  Plus,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  Radio,
  Layers,
  Sparkles
} from 'lucide-react';
import { OptimizationState, DetectedGame } from '../../shared/types';

interface GameModeViewProps {
  states: OptimizationState[];
  onApplyProfile: (ids: string[]) => void;
  isOperating: boolean;
}

export const GameModeView: React.FC<GameModeViewProps> = ({
  states: _states,
  onApplyProfile,
  isOperating
}) => {
  const [games, setGames] = useState<DetectedGame[]>([]);
  const [isScanning, setIsScanning] = useState(true);
  const [selectedGame, setSelectedGame] = useState<DetectedGame | null>(null);
  const [optimizingId, setOptimizingId] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [newGameProcess, setNewGameProcess] = useState('');
  const [newGameCategory, setNewGameCategory] = useState('FPS Competitivo');
  const [lastScanCount, setLastScanCount] = useState<number>(0);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  // Scan games on mount using the native backend GameSensorService
  const scanGames = async () => {
    setIsScanning(true);
    try {
      if (window.optimizerApi?.gameSensorScan) {
        const detected = await window.optimizerApi.gameSensorScan();
        setGames(detected);
        setLastScanCount(detected.length);
        if (detected.length > 0 && !selectedGame) {
          setSelectedGame(detected[0]);
        }
      } else {
        // Fallback demo dataset if API is not available
        setGames([
          {
            id: 'cs2',
            name: 'Counter-Strike 2',
            category: 'Competitivo FPS',
            platform: 'Steam',
            coverImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/730/library_600x900_2x.jpg',
            processNames: ['cs2.exe'],
            recommendedOptimizations: ['input_timer_resolution', 'net_disable_nagling'],
            description: 'Sub-tick optimization, limpeza prévia de shaders DirectX e TCP/UDP NoDelay para hit registration ideal.'
          }
        ]);
      }
    } catch (e) {
      console.error('Erro ao sensorizar jogos:', e);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    scanGames();
  }, []);

  const handleTuneGame = async (game: DetectedGame) => {
    setOptimizingId(game.id);
    try {
      const targetIds = [
        'input_game_mode',
        'input_mouse_accel',
        'input_pointer_speed',
        'input_windowed_optimizations',
        'input_prevent_sleep_gaming',
        'input_gpu_preference',
        'net_flush_dns',
        'net_tcp_autotuning',
        'cpu_gpu_power_gaming',
        'game_silence_notifications',
        'clean_directx_shader_cache',
        'clean_gpu_shader_cache'
      ];
      await onApplyProfile(targetIds);
    } finally {
      setOptimizingId(null);
    }
  };

  const handleAddCustomGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGameName.trim() || !newGameProcess.trim()) return;

    try {
      let proc = newGameProcess.trim();
      if (!proc.toLowerCase().endsWith('.exe')) {
        proc += '.exe';
      }

      if (window.optimizerApi?.gameSensorAddCustom) {
        const added = await window.optimizerApi.gameSensorAddCustom({
          name: newGameName.trim(),
          processName: proc,
          category: newGameCategory
        });
        setGames((prev) => [added, ...prev]);
        setSelectedGame(added);
      }

      setNewGameName('');
      setNewGameProcess('');
      setShowAddModal(false);
    } catch (err) {
      console.error('Erro ao adicionar jogo personalizado:', err);
    }
  };

  const handleRemoveCustomGame = async (gameId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (window.optimizerApi?.gameSensorRemoveCustom) {
        await window.optimizerApi.gameSensorRemoveCustom(gameId);
      }
      setGames((prev) => prev.filter((g) => g.id !== gameId));
      if (selectedGame?.id === gameId) {
        setSelectedGame(null);
      }
    } catch (err) {
      console.error('Erro ao remover jogo:', err);
    }
  };

  const filteredGames = games.filter(
    (g) =>
      g.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      g.category.toLowerCase().includes(filterQuery.toLowerCase()) ||
      g.platform.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const getPlatformBadgeColor = (platform: string) => {
    switch (platform) {
      case 'Steam':
        return 'bg-blue-600/20 text-blue-300 border-blue-500/30';
      case 'Epic Games':
        return 'bg-zinc-700/40 text-zinc-200 border-zinc-600/40';
      case 'Riot Games':
        return 'bg-rose-600/20 text-rose-300 border-rose-500/30';
      case 'EA Desktop':
        return 'bg-orange-600/20 text-orange-300 border-orange-500/30';
      case 'Xbox / Microsoft':
        return 'bg-emerald-600/20 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-purple-600/20 text-purple-300 border-purple-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Sensor Hero Banner */}
      <div className="bg-[#10172A] border border-[#1E293B] rounded-2xl p-6 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1.5 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              Sensor de Jogos Ativo • {isScanning ? 'A analisar...' : `${games.length} Jogos Detetados`}
            </span>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Steam, Epic, Riot, EA, Xbox & Personalizados
            </span>
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-indigo-400" />
            Sensor & Central de Jogos Dinâmica
          </h2>
          <p className="text-xs text-gray-300 max-w-2xl leading-relaxed">
            O sensor analisa automaticamente as tuas unidades de disco (C:, D:, E:...) e plataformas instaladas. Se abrires esta aplicação noutro computador, a lista adapta-se de imediato aos jogos desse outro PC.
          </p>
        </div>

        {/* Toolbar: Rescan, Add Custom, Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto z-10">
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filtrar por nome ou plataforma..."
              className="w-full bg-[#131B2E] border border-[#232F4D] hover:border-indigo-500/60 focus:border-indigo-500 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-gray-400 focus:outline-none transition-all"
            />
          </div>

          <button
            onClick={scanGames}
            disabled={isScanning}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#151F38] hover:bg-[#1E2B4E] border border-[#23335A] text-xs font-semibold text-gray-200 hover:text-white transition-all disabled:opacity-50 shrink-0"
            title="Voltar a analisar todas as unidades à procura de jogos novos"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'A Sensorizar...' : 'Sensorizar'}</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all shrink-0"
            title="Adicionar um jogo manualmente através do executável .exe"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Jogo</span>
          </button>
        </div>
      </div>

      {/* Loading State during Sensor Scan */}
      {isScanning && games.length === 0 && (
        <div className="bg-[#0E1528] border border-[#1E293B] rounded-2xl p-12 text-center space-y-3">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <h3 className="text-sm font-bold text-white">Sensor a mapear jogos instalados...</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto">
            A inspecionar pastas de biblioteca do Steam, manifestos da Epic Games, Riot Games, EA e Xbox nas unidades de disco disponíveis.
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isScanning && filteredGames.length === 0 && (
        <div className="bg-[#0E1528] border border-[#1E293B] rounded-2xl p-12 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
            <Gamepad2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Nenhum jogo detetado {filterQuery ? 'com este filtro' : 'automaticamente'}</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-md mx-auto">
              {filterQuery
                ? 'Tenta remover o termo de pesquisa para ver todos os títulos.'
                : 'Podes clicar em "Sensorizar" para procurar novamente ou clicar em "Adicionar Jogo" para indicar o executável (.exe).'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={scanGames}
              className="px-4 py-2 rounded-xl bg-[#151F38] hover:bg-[#1E2B4E] border border-[#23335A] text-xs font-semibold text-gray-200"
            >
              🔄 Recarregar Sensor
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
            >
              ➕ Adicionar Manualmente
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Game Grid */}
      {filteredGames.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredGames.map((game) => {
            const isSelected = selectedGame?.id === game.id;
            const isThisOptimizing = optimizingId === game.id;

            return (
              <div
                key={game.id}
                onClick={() => setSelectedGame(game)}
                className={`group cursor-pointer rounded-2xl p-2.5 border transition-all flex flex-col justify-between select-none relative overflow-hidden ${
                  isSelected
                    ? 'bg-[#15203D] border-indigo-500 ring-2 ring-indigo-500/40 shadow-xl shadow-indigo-500/15'
                    : 'bg-[#121B2E] border-[#1E293B] hover:border-indigo-500/50 hover:bg-[#16233B]'
                }`}
              >
                {/* Platform Badge (Steam / Epic / Riot / Custom) */}
                <div className="absolute top-4 right-4 z-20 flex items-center gap-1">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border backdrop-blur-md shadow-md ${getPlatformBadgeColor(game.platform)}`}>
                    {game.platform}
                  </span>

                  {game.isCustom && (
                    <button
                      onClick={(e) => handleRemoveCustomGame(game.id, e)}
                      className="p-1 rounded bg-rose-950/80 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 transition-colors shadow-md"
                      title="Remover jogo personalizado"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>

                {/* Cover Image Container */}
                <div className="w-full h-44 rounded-xl overflow-hidden relative shadow-md bg-[#0D1424]">
                  {!failedImages[game.id] && game.coverImage ? (
                    <img
                      src={game.coverImage}
                      alt={game.name}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                      onError={() => {
                        setFailedImages((prev) => ({ ...prev, [game.id]: true }));
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-[#1C2640] via-[#10172A] to-[#0A0E1A] relative group-hover:scale-105 transition-transform duration-300 select-none">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600/25 border border-indigo-500/40 flex items-center justify-center text-indigo-300 font-black text-sm mb-2 shadow-lg shadow-indigo-600/20">
                        {game.name.substring(0, 3).toUpperCase()}
                      </div>
                      <span className="text-[11px] font-bold text-gray-200 line-clamp-2 leading-tight px-1 drop-shadow">
                        {game.name}
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-transparent to-transparent opacity-70 pointer-events-none" />
                  <span className="absolute bottom-2 left-2 text-[9px] font-semibold bg-black/75 backdrop-blur-md px-2 py-0.5 rounded text-white/90 border border-white/10 max-w-[85%] truncate">
                    {game.category}
                  </span>
                </div>

                {/* Title and Action */}
                <div className="mt-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate" title={game.name}>
                      {game.name}
                    </h4>
                  </div>

                  <button
                    disabled={isOperating}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTuneGame(game);
                    }}
                    className={`mt-2 w-full py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
                      isThisOptimizing
                        ? 'bg-amber-500 text-black'
                        : 'bg-[#1A2542] hover:bg-indigo-600 text-gray-200 hover:text-white border border-[#2B3B66]'
                    } disabled:opacity-50`}
                  >
                    {isThisOptimizing ? (
                      <span>A Otimizar...</span>
                    ) : (
                      <>
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span>Otimizar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Game Info Panel */}
      {selectedGame && (
        <div className="bg-[#121B30] border border-indigo-500/40 rounded-2xl p-5 shadow-xl animate-in fade-in duration-200 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-20 rounded-xl overflow-hidden shrink-0 shadow-lg border border-indigo-500/30 bg-[#0D1424]">
              <img
                src={selectedGame.coverImage}
                alt={selectedGame.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-white">{selectedGame.name}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPlatformBadgeColor(selectedGame.platform)}`}>
                  {selectedGame.platform}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {selectedGame.category}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Instalado neste Computador
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-1 max-w-xl leading-relaxed">
                {selectedGame.description}
              </p>
              <div className="text-[10px] text-gray-400 mt-1 font-mono">
                Processos Reconhecidos: {selectedGame.processNames.join(', ')}
              </div>
              {selectedGame.installDir && (
                <div className="text-[10px] text-gray-500 font-mono truncate max-w-lg mt-0.5" title={selectedGame.installDir}>
                  Diretório: {selectedGame.installDir}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button
              disabled={isOperating}
              onClick={() => handleTuneGame(selectedGame)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Ativar Otimização para {selectedGame.name}</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal: Add Custom Game */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#0C1222] border border-[#25355A] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
              <div className="flex items-center gap-2">
                <Gamepad2 className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Adicionar Jogo ao Sensor</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white text-xs font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomGame} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Nome do Jogo
                </label>
                <input
                  type="text"
                  required
                  value={newGameName}
                  onChange={(e) => setNewGameName(e.target.value)}
                  placeholder="Ex: GTA V, Minecraft, Call of Duty..."
                  className="w-full bg-[#131B2E] border border-[#232F4D] rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Nome do Executável do Jogo
                </label>
                <input
                  type="text"
                  required
                  value={newGameProcess}
                  onChange={(e) => setNewGameProcess(e.target.value)}
                  placeholder="Ex: GTA5.exe, javaw.exe, cod.exe..."
                  className="w-full bg-[#131B2E] border border-[#232F4D] rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-500 font-mono focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">
                  Usado pelo Game Booster para ativar 0.5ms de timer e P-Cores quando o jogo abre.
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Categoria / Género
                </label>
                <select
                  value={newGameCategory}
                  onChange={(e) => setNewGameCategory(e.target.value)}
                  className="w-full bg-[#131B2E] border border-[#232F4D] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="FPS Competitivo">FPS Competitivo</option>
                  <option value="Battle Royale">Battle Royale</option>
                  <option value="Action RPG">Action RPG</option>
                  <option value="Open World / Ação">Open World / Ação</option>
                  <option value="Simulação Automóvel">Simulação Automóvel</option>
                  <option value="Desporto / Futebol">Desporto / Futebol</option>
                  <option value="MOBA">MOBA</option>
                  <option value="Sandbox / Sobrevivência">Sandbox / Sobrevivência</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1E293B]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-[#162038]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md"
                >
                  Guardar e Sensorizar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
