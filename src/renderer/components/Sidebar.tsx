import React from 'react';
import appLogo from '../assets/logo.png';
import {
  LayoutDashboard,
  Gamepad2,
  Network,
  Cpu,
  Mouse,
  Wrench,
  Settings,
  Gauge
} from 'lucide-react';
import { useI18n, ACCENT_COLORS } from '../i18n';
import { APP_VERSION, getDisplayVersion } from '../utils/version';

export type MainSection =
  | 'dashboard'
  | 'gaming'
  | 'bottleneck'
  | 'cpuz'
  | 'network'
  | 'peripherals'
  | 'benchmark'
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
  onOpenSettings?: () => void;
  appVersion?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  sectionStats,
  onOpenSettings,
  appVersion
}) => {
  const { t, accent } = useI18n();

  // 5 Essential Hubs
  const sections: {
    id: MainSection;
    name: string;
    description: string;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      id: 'dashboard',
      name: t('nav.dashboard'),
      description: t('nav.dashboard.desc'),
      icon: <LayoutDashboard className="w-4 h-4" />,
      color: 'text-indigo-400'
    },
    {
      id: 'gaming',
      name: t('nav.gaming'),
      description: t('nav.gaming.desc'),
      icon: <Gamepad2 className="w-4 h-4" />,
      color: 'text-rose-400'
    },
    {
      id: 'cpuz',
      name: t('nav.hardware'),
      description: t('nav.hardware.desc'),
      icon: <Cpu className="w-4 h-4" />,
      color: 'text-amber-400'
    },
    {
      id: 'network',
      name: t('nav.network'),
      description: t('nav.network.desc'),
      icon: <Network className="w-4 h-4" />,
      color: 'text-cyan-400'
    },
    {
      id: 'peripherals',
      name: t('nav.peripherals'),
      description: t('nav.peripherals.desc'),
      icon: <Mouse className="w-4 h-4" />,
      color: 'text-purple-400'
    },
    {
      id: 'benchmark',
      name: t('nav.benchmark'),
      description: t('nav.benchmark.desc'),
      icon: <Gauge className="w-4 h-4" />,
      color: 'text-amber-400'
    },
    {
      id: 'maintenance',
      name: t('nav.maintenance'),
      description: t('nav.maintenance.desc'),
      icon: <Wrench className="w-4 h-4" />,
      color: 'text-emerald-400'
    }
  ];

  const currentAccentConfig = ACCENT_COLORS.find((c) => c.id === accent) || ACCENT_COLORS[0];

  return (
    <aside className="w-64 bg-[#0B0F19] border-r border-[#1E293B] flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div
        className="p-4 border-b border-[#1E293B] flex items-center justify-between cursor-move"
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#12192B] border border-white/10 overflow-hidden shrink-0 transition-shadow"
            style={{ boxShadow: `0 4px 14px ${currentAccentConfig.hex}40` }}
          >
            <img src={appLogo} alt="Optimizer Logo" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              Optimizer <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">PRO</span>
            </h1>
            <p className="text-[10px] text-gray-400 font-medium">{t('brand.subtitle')}</p>
          </div>
        </div>

        {/* Settings button */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            style={{ WebkitAppRegion: 'no-drag' } as any}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#151E33] border border-transparent hover:border-[#232F4D] transition-colors"
            title={t('settings.title')}
          >
            <Settings className="w-4 h-4 hover:rotate-45 transition-transform" />
          </button>
        )}
      </div>

      {/* Main Navigation - 5 Sleek Hubs */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
        <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
          {t('nav.main_modules')}
        </div>

        {sections.map((sec) => {
          // Check active section (supports legacy alias redirects)
          const isActive =
            currentSection === sec.id ||
            (sec.id === 'cpuz' && currentSection === 'bottleneck') ||
            (sec.id === 'maintenance' && currentSection === 'system');

          const stats = sectionStats[sec.id];

          return (
            <button
              key={sec.id}
              onClick={() => onSelectSection(sec.id)}
              className={`w-full text-left p-2.5 rounded-xl transition-all duration-200 border relative group ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600/20 to-indigo-900/10 border-indigo-500/60 shadow-lg shadow-indigo-500/10 text-white'
                  : 'bg-transparent hover:bg-[#12192B] border-transparent hover:border-[#1E293B] text-gray-400 hover:text-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-1.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30'
                        : 'bg-[#151E33] text-gray-400 group-hover:text-white'
                    }`}
                  >
                    {sec.icon}
                  </div>
                  <div>
                    <span className="text-xs font-bold block leading-tight">{sec.name}</span>
                    <span className="text-[10px] text-gray-400 block leading-tight mt-0.5">
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

      {/* Sleek Safety Status Footer */}
      <div className="p-3.5 border-t border-[#1E293B] bg-[#080D1A]/70 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-emerald-300 text-[11px] tracking-wide">100% Seguro & Reversível</span>
        </div>
        <span className="text-[10px] font-mono text-gray-400 bg-[#121A2F] px-1.5 py-0.5 rounded border border-[#1E293B]">
          {getDisplayVersion(appVersion || APP_VERSION)}
        </span>
      </div>
    </aside>
  );
};
