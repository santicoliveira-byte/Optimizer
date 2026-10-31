import React from 'react';
import {
  LayoutDashboard,
  Gamepad2,
  Network,
  Cpu,
  Wrench,
  Shield,
  Sparkles,
  Gauge
} from 'lucide-react';

export type MainSection =
  | 'dashboard'
  | 'gaming'
  | 'bottleneck'
  | 'cpuz'
  | 'network'
  | 'system'
  | 'maintenance';

export interface SectionStats {
  applied: number;
  total: number;
}

interface SidebarProps {
  currentSection: MainSection;
  onSelectSection: (section: MainSection) => void;
  sectionStats: Record<MainSection, SectionStats>;
  onOpenShaderModal?: () => void;
  onToggleOverlay?: () => void;
  isOverlayOpen?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  sectionStats,
  onOpenShaderModal,
  onToggleOverlay,
  isOverlayOpen
}) => {
  const sections: {
    id: MainSection;
    name: string;
    description: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      id: 'dashboard',
      name: 'Painel Geral',
      description: 'Visão global e telemetria',
      icon: <LayoutDashboard className="w-4 h-4" />,
      color: 'text-indigo-400'
    },
    {
      id: 'gaming',
      name: 'Gaming & Latência',
      description: 'Perfis de jogos, input delay e FPS',
      icon: <Gamepad2 className="w-4 h-4" />,
      color: 'text-rose-400'
    },
    {
      id: 'bottleneck',
      name: 'Gargalo & Can I Run It',
      description: 'Calculador de CPU/GPU e requisitos',
      icon: <Gauge className="w-4 h-4" />,
      color: 'text-purple-400'
    },
    {
      id: 'cpuz',
      name: 'CPU-Z & Hardware',
      description: 'Inspetor profundo, SPD e Benchmark',
      icon: <Cpu className="w-4 h-4" />,
      color: 'text-amber-400'
    },
    {
      id: 'network',
      name: 'Rede, Wi-Fi & Ping',
      description: 'QoS, Wi-Fi 6, DNS e rotas',
      icon: <Network className="w-4 h-4" />,
      color: 'text-cyan-400'
    },
    {
      id: 'system',
      name: 'Hardware & Sistema',
      description: 'CPU, GPU, RAM, arranque e apps',
      icon: <Cpu className="w-4 h-4" />,
      color: 'text-amber-400'
    },
    {
      id: 'maintenance',
      name: 'Manutenção & Perfis',
      description: 'Limpeza, privacidade e backups',
      icon: <Wrench className="w-4 h-4" />,
      color: 'text-emerald-400'
    }
  ];

  return (
    <aside className="w-64 bg-[#0B0F19] border-r border-[#1E293B] flex flex-col h-screen select-none">
      {/* Brand Header */}
      <div
        className="p-4 border-b border-[#1E293B] flex items-center gap-3 cursor-move"
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <Gamepad2 className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
            Optimizer <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">PRO</span>
          </h1>
          <p className="text-[10px] text-gray-400 font-medium">Windows Performance Suite</p>
        </div>
      </div>

      {/* Main Navigation - 5 Consolidated Hubs */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
          Módulos Principais
        </div>

        {sections.map((sec) => {
          const isActive = currentSection === sec.id;
          const stats = sectionStats[sec.id];

          return (
            <button
              key={sec.id}
              onClick={() => onSelectSection(sec.id)}
              className={`w-full text-left p-2.5 rounded-xl transition-all duration-200 border relative group ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600/20 to-indigo-900/10 border-indigo-500/60 shadow-lg shadow-indigo-500/10 text-white'
                  : 'bg-[#0E1526]/40 border-transparent hover:border-[#1E293B] hover:bg-[#131C32] text-gray-300'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-indigo-500 rounded-r" />
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      isActive ? 'bg-indigo-600 text-white shadow-md' : 'bg-[#141C30] text-gray-400 group-hover:text-white'
                    }`}
                  >
                    {sec.icon}
                  </div>
                  <div>
                    <span className="text-xs font-bold block leading-tight">{sec.name}</span>
                    <span className="text-[10px] text-gray-400 block mt-0.5 leading-none">
                      {sec.description}
                    </span>
                  </div>
                </div>

                {stats && stats.total > 0 && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold shrink-0 ml-1.5 ${
                      isActive
                        ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/30'
                        : 'bg-[#141E33] text-gray-400 border border-[#202E52]'
                    }`}
                  >
                    {stats.applied}/{stats.total}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Tools & Safety Badge */}
      <div className="p-3 border-t border-[#1E293B] bg-[#080D1A] space-y-2">
        {onToggleOverlay && (
          <button
            onClick={onToggleOverlay}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all border group ${
              isOverlayOpen
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-200'
                : 'text-amber-300 hover:bg-amber-900/20 hover:text-amber-100 border-amber-500/20 bg-amber-500/5'
            }`}
          >
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>Game HUD Overlay</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">
              {isOverlayOpen ? 'Ativo' : '0.5ms'}
            </span>
          </button>
        )}

        {onOpenShaderModal && (
          <button
            onClick={onOpenShaderModal}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all text-purple-300 hover:bg-purple-900/30 hover:text-purple-100 border border-purple-500/20 bg-purple-500/5 group"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 group-hover:rotate-12 transition-transform" />
              <span>Limpar Shaders GPU</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
              DirectX
            </span>
          </button>
        )}

        <div className="flex items-center justify-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl">
          <Shield className="w-4 h-4 shrink-0 text-emerald-400" />
          <span className="font-extrabold text-xs tracking-wider text-emerald-400 uppercase">
            100% Reversível & Seguro
          </span>
        </div>
      </div>
    </aside>
  );
};
