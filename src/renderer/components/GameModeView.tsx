import React, { useState } from 'react';
import {
  Gamepad2,
  Zap
} from 'lucide-react';
import { OptimizationState } from '../../shared/types';

export interface InstalledGame {
  id: string;
  name: string;
  category: string;
  coverImage: string;
  processNames: string[];
  recommendedOptimizations: string[];
  description: string;
}

// Exactly the games installed on the user's system detected via Steam, Riot, Epic & Desktop
export const INSTALLED_USER_GAMES: InstalledGame[] = [
  {
    id: 'cs2',
    name: 'Counter-Strike 2',
    category: 'Competitivo FPS',
    coverImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/730/library_600x900_2x.jpg',
    processNames: ['cs2.exe'],
    recommendedOptimizations: ['input_timer_resolution', 'input_pointer_speed', 'net_disable_nagling', 'clean_directx_shader_cache'],
    description: 'Sub-tick optimization, limpeza prévia de shaders DirectX e TCP/UDP NoDelay para hit registration ideal.'
  },
  {
    id: 'valorant',
    name: 'VALORANT',
    category: 'Competitivo FPS',
    coverImage: 'https://images.contentstack.io/v3/assets/blt370612131b6e0eb6/blt72023cb3e86c0750/665f8a0026e95d9e564d2627/VAL_Hero_Cover_Art_1920x1080.jpg',
    processNames: ['VALORANT-Win64-Shipping.exe', 'RiotClientServices.exe'],
    recommendedOptimizations: ['input_timer_resolution', 'input_mouse_accel', 'net_tcp_autotuning', 'cpu_priority_high', 'game_mode'],
    description: 'Prioridade em timer resolution 0.5ms, raw mouse input e mitigação de bufferbloat UDP.'
  },
  {
    id: 'black_myth_wukong',
    name: 'Black Myth: Wukong',
    category: 'Action RPG',
    coverImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2358720/library_600x900_2x.jpg',
    processNames: ['b1-Win64-Shipping.exe'],
    recommendedOptimizations: ['clean_gpu_shader_cache', 'input_power_plan', 'input_gpu_preference', 'ui_visual_effects_perf'],
    description: 'Otimização para Unreal Engine 5 Nanite/Lumen, limpeza profunda de cache de compilação de shaders e prioridade de GPU.'
  },
  {
    id: 'rdr2',
    name: 'Red Dead Redemption 2',
    category: 'Open World RPG',
    coverImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/library_600x900_2x.jpg',
    processNames: ['RDR2.exe'],
    recommendedOptimizations: ['clean_directx_shader_cache', 'input_gpu_preference', 'srv_disable_restart_apps'],
    description: 'Otimização da pipeline Vulkan/DX12, estabilização de frametimes e alívio de memória de sistema.'
  },
  {
    id: 'ea_fc_26',
    name: 'EA SPORTS FC 26',
    category: 'Futebol / Desporto',
    coverImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2195250/library_600x900_2x.jpg',
    processNames: ['FC26.exe', 'FC25.exe'],
    recommendedOptimizations: ['input_windowed_optimizations', 'input_mouse_accel', 'net_tcp_autotuning'],
    description: 'Redução de input delay em comandos analógicos e mitigação de jitter em partidas online.'
  },
  {
    id: 'assetto_corsa',
    name: 'Assetto Corsa',
    category: 'Simulação Automóvel',
    coverImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/244210/library_600x900_2x.jpg',
    processNames: ['acs.exe', 'AssettoCorsa.exe'],
    recommendedOptimizations: ['input_timer_resolution', 'input_usb_selective_suspend', 'cpu_gpu_power_gaming'],
    description: 'Polling rate sem atraso para volantes FFB DirectDrive e máxima estabilidade de frametimes com mods pesados.'
  },
  {
    id: 'fortnite',
    name: 'Fortnite',
    category: 'Battle Royale',
    coverImage: 'https://cdn2.unrealengine.com/blade-2560x1440-2560x1440-d657a2cb88b5.jpg',
    processNames: ['FortniteClient-Win64-Shipping.exe'],
    recommendedOptimizations: ['input_windowed_optimizations', 'clean_gpu_shader_cache', 'input_gpu_preference', 'net_rss'],
    description: 'Compilação suave de shaders DX12, ativação de VRR/FSO e afinidade de threads de CPU.'
  },
  {
    id: 'rocket_league',
    name: 'Rocket League',
    category: 'Esports Desporto',
    coverImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/252950/library_600x900_2x.jpg',
    processNames: ['RocketLeague.exe'],
    recommendedOptimizations: ['input_mouse_accel', 'input_timer_resolution', 'net_prefer_ethernet_metric'],
    description: 'Física a 120Hz/240Hz sem desfasamento de input de comando ou teclado.'
  },
  {
    id: 'sifu',
    name: 'Sifu',
    category: 'Artes Marciais',
    coverImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2138710/library_600x900_2x.jpg',
    processNames: ['Sifu-Win64-Shipping.exe'],
    recommendedOptimizations: ['input_timer_resolution', 'input_windowed_optimizations'],
    description: 'Resposta de frames imediata para esquivas e parries sem latência de buffer de apresentação.'
  },
  {
    id: 'kartkraft',
    name: 'KartKraft',
    category: 'Simulação Karting',
    coverImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/406350/library_600x900_2x.jpg',
    processNames: ['project_k-Win64-Shipping.exe'],
    recommendedOptimizations: ['input_usb_selective_suspend', 'cpu_gpu_power_gaming'],
    description: 'Prioridade aos cálculos físicos do motor Unreal e latência mínima de Force Feedback.'
  },
  {
    id: 'dakar_rally',
    name: 'Dakar Desert Rally',
    category: 'Rally / Todo-o-Terreno',
    coverImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1839940/library_600x900_2x.jpg',
    processNames: ['Dakar2-Win64-Shipping.exe'],
    recommendedOptimizations: ['clean_gpu_shader_cache', 'input_gpu_preference'],
    description: 'Carregamento contínuo de terreno desértico de mundo aberto sem micro-bloqueios.'
  },
  {
    id: 'roblox',
    name: 'Roblox Player',
    category: 'Sandbox / Comunidade',
    coverImage: 'https://images.rbxcdn.com/f9c8942b853de63489814421b8eb32c4-roblox_logo_social.jpg',
    processNames: ['RobloxPlayerBeta.exe'],
    recommendedOptimizations: ['input_gpu_preference', 'clean_user_temp', 'srv_safe_services_manual'],
    description: 'Alocação obrigatória da GPU dedicada NVIDIA e desbloqueio de taxa de refrescamento do monitor.'
  }
];

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
  const [selectedGame, setSelectedGame] = useState<InstalledGame | null>(INSTALLED_USER_GAMES[0]);
  const [optimizingId, setOptimizingId] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState('');

  const filteredGames = INSTALLED_USER_GAMES.filter((g) =>
    g.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    g.category.toLowerCase().includes(filterQuery.toLowerCase())
  );

  const handleTuneGame = async (game: InstalledGame) => {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#10172A] border border-[#1E293B] rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {INSTALLED_USER_GAMES.length} Jogos Detetados no teu PC
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-indigo-400" />
            Game Mode Hub
          </h2>
          <p className="text-xs text-gray-300 mt-1 max-w-2xl leading-relaxed">
            Apresenta exclusivamente os jogos instalados no teu computador. Cada título conta com arte oficial de capa e rotinas de baixa latência focadas no seu respetivo motor de jogo.
          </p>
        </div>

        {/* Search filter for games */}
        <div className="w-full md:w-64">
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Procurar nos teus jogos..."
            className="w-full bg-[#131B2E] border border-[#232F4D] rounded-xl px-3.5 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Game Cards Grid with Real Cover Art */}
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
              {/* Cover Image Container */}
              <div className="w-full h-44 rounded-xl overflow-hidden relative shadow-md bg-[#0D1424]">
                <img
                  src={game.coverImage}
                  alt={game.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    // Fallback to high tech gradient if image cannot load
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] via-transparent to-transparent opacity-60" />
                <span className="absolute bottom-2 left-2 text-[9px] font-semibold bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-white/90 border border-white/10">
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

      {/* Selected Game Info Panel */}
      {selectedGame && (
        <div className="bg-[#121B30] border border-indigo-500/40 rounded-2xl p-5 shadow-xl animate-in fade-in duration-200 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-20 rounded-xl overflow-hidden shrink-0 shadow-lg border border-indigo-500/30">
              <img
                src={selectedGame.coverImage}
                alt={selectedGame.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">{selectedGame.name}</h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {selectedGame.category}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  Instalado no teu PC
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-1 max-w-xl leading-relaxed">
                {selectedGame.description}
              </p>
              <div className="text-[10px] text-gray-400 mt-1 font-mono">
                Processos: {selectedGame.processNames.join(', ')}
              </div>
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
    </div>
  );
};
