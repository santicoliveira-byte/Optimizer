import React from 'react';
import { OptimizationState } from '../../shared/types';
import { OptimizationCard } from './OptimizationCard';
import { Filter, Layers } from 'lucide-react';

interface CategoryViewProps {
  title: string;
  description: string;
  states: OptimizationState[];
  onApply: (id: string) => void;
  onRevert: (id: string) => void;
  isOperating: boolean;
}

export const CategoryView: React.FC<CategoryViewProps> = ({
  title,
  description,
  states,
  onApply,
  onRevert,
  isOperating
}) => {
  const alterItems = states.filter((s) => s.item.type === 'alter');
  const appliedCount = alterItems.filter((s) => s.status === 'applied').length;
  const progressPercent = alterItems.length > 0 ? Math.round((appliedCount / alterItems.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Category Header */}
      <div className="bg-[#10172A] border border-[#1E293B] rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            {title}
          </h2>
          <p className="text-xs text-gray-300 mt-1 max-w-2xl leading-relaxed">
            {description}
          </p>
        </div>

        {/* Progress bar widget */}
        {alterItems.length > 0 && (
          <div className="bg-[#141E33] border border-[#202E52] rounded-xl p-3 min-w-[200px] text-right">
            <div className="flex items-center justify-between text-xs font-semibold mb-1">
              <span className="text-gray-400">Progresso</span>
              <span className="text-indigo-400">{appliedCount} / {alterItems.length} ({progressPercent}%)</span>
            </div>
            <div className="w-full bg-[#0D1424] rounded-full h-2 overflow-hidden border border-[#223154]">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Optimization Cards Grid */}
      {states.length === 0 ? (
        <div className="bg-[#10172A] border border-[#1E293B] rounded-2xl p-12 text-center text-gray-400 flex flex-col items-center justify-center gap-3">
          <Filter className="w-8 h-8 text-gray-400" />
          <p className="text-sm">Nenhuma otimização encontrada com os filtros selecionados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {states.map((st) => (
            <OptimizationCard
              key={st.item.id}
              state={st}
              onApply={onApply}
              onRevert={onRevert}
              isOperating={isOperating}
            />
          ))}
        </div>
      )}
    </div>
  );
};
