import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
  icon?: React.ReactNode;
}

interface TopTabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  accentColor?: 'indigo' | 'rose' | 'cyan' | 'amber' | 'emerald';
}

export const TopTabBar: React.FC<TopTabBarProps> = ({
  tabs,
  activeTab,
  onSelectTab,
  accentColor = 'indigo'
}) => {
  const getActiveStyles = () => {
    switch (accentColor) {
      case 'rose':
        return 'bg-gradient-to-r from-rose-500/20 to-rose-600/10 text-rose-300 border-rose-500/60 shadow-lg shadow-rose-500/10';
      case 'cyan':
        return 'bg-gradient-to-r from-cyan-500/20 to-cyan-600/10 text-cyan-300 border-cyan-500/60 shadow-lg shadow-cyan-500/10';
      case 'amber':
        return 'bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-300 border-amber-500/60 shadow-lg shadow-amber-500/10';
      case 'emerald':
        return 'bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 text-emerald-300 border-emerald-500/60 shadow-lg shadow-emerald-500/10';
      case 'indigo':
      default:
        return 'bg-gradient-to-r from-indigo-500/20 to-indigo-600/10 text-indigo-300 border-indigo-500/60 shadow-lg shadow-indigo-500/10';
    }
  };

  return (
    <div className="flex items-center gap-2 pb-5 border-b border-[#1E293B] mb-6 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 border whitespace-nowrap ${
              isActive
                ? `${getActiveStyles()} ring-1 ring-white/10`
                : 'bg-[#0E1526]/60 border-[#1B263F] text-gray-400 hover:text-white hover:bg-[#141D34]'
            }`}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'bg-[#151F36] text-gray-400 border border-[#212E4F]'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
