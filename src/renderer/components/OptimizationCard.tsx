import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Cpu,
  Monitor,
  Info,
  Check,
  Copy
} from 'lucide-react';
import { OptimizationState } from '../../shared/types';

interface OptimizationCardProps {
  state: OptimizationState;
  onApply: (id: string) => void;
  onRevert: (id: string) => void;
  isOperating: boolean;
}

export const OptimizationCard: React.FC<OptimizationCardProps> = ({
  state,
  onApply,
  onRevert,
  isOperating
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const { item, status, infoValue } = state;

  const isApplied = status === 'applied';
  const isSafe = item.risk === 'safe';
  const isAlter = item.type === 'alter';

  return (
    <div
      className={`rounded-xl border transition-all duration-200 ${
        isApplied
          ? 'bg-[#121B30] border-indigo-500/40 shadow-sm shadow-indigo-500/10'
          : 'bg-[#131B2E] border-[#1E293B] hover:border-[#2C3B5E]'
      }`}
    >
      <div className="p-4 flex flex-col gap-3">
        {/* Top row: Badges, Item Number, and Action Button */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Item number badge */}
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#1B2642] text-gray-300 border border-[#26355C]">
              #{item.itemNumber}
            </span>

            {/* Risk Badge */}
            {isSafe ? (
              <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3" />
                [Seguro]
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                <AlertTriangle className="w-3 h-3" />
                [M] Moderado
              </span>
            )}

            {/* Type Badge: Altera vs Informa */}
            {isAlter ? (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                Altera
              </span>
            ) : (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                Informa
              </span>
            )}

            {/* Reboot badge if required */}
            {item.requiresReboot && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                Requer Reinício
              </span>
            )}

            {/* Admin badge */}
            {item.requiresAdmin && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-700/50 text-gray-300">
                Admin
              </span>
            )}
          </div>

          {/* Action Button / Switch */}
          <div className="flex items-center gap-2 shrink-0">
            {isAlter ? (
              <>
                {/* Apply/Toggle Button */}
                <button
                  disabled={isOperating}
                  onClick={() => (isApplied ? onRevert(item.id) : onApply(item.id))}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isApplied
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30'
                  } disabled:opacity-50`}
                >
                  {isApplied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Ativo</span>
                    </>
                  ) : (
                    <span>Aplicar</span>
                  )}
                </button>

                {/* Individual Revert button if applied */}
                {isApplied && (
                  <button
                    disabled={isOperating}
                    onClick={() => onRevert(item.id)}
                    className="p-1.5 rounded-lg bg-[#1B2642] hover:bg-[#253459] text-gray-300 hover:text-white border border-[#2A3B66] text-xs transition-colors"
                    title="Reverter para o valor original antes da otimização"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </>
            ) : (
              /* Diagnostic / Informative button */
              <button
                disabled={isOperating}
                onClick={() => onApply(item.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1A2642] hover:bg-[#23335A] text-cyan-300 border border-cyan-500/30 text-xs font-medium transition-colors"
              >
                <Info className="w-3.5 h-3.5" />
                <span>Verificar</span>
              </button>
            )}
          </div>
        </div>

        {/* Content: Title & Simple Description */}
        <div>
          <h3 className="text-sm font-semibold text-white tracking-tight mb-1">
            {item.name}
          </h3>
          <p className="text-xs text-gray-300 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Live Info Value read from system */}
        {infoValue && (
          <div className="bg-[#0B101D] border border-[#1E293B] rounded-lg px-3 py-2 text-xs flex items-center gap-2 text-indigo-300">
            <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="font-mono text-[11px]">{infoValue}</span>
          </div>
        )}

        {/* Accordion Toggle for Technical Details */}
        <div className="border-t border-[#1E293B] pt-2 flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[11px] text-gray-400 hover:text-indigo-400 flex items-center gap-1 transition-colors"
          >
            <span>{isExpanded ? 'Ocultar detalhes técnicos' : 'Ver o que muda exatamente'}</span>
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {/* Compatibility Badges */}
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <div className="flex items-center gap-1">
              <Monitor className="w-3 h-3" />
              <span>{item.compat.win11 ? 'Win10/11' : 'Win10'}</span>
            </div>
            {item.compat.requiresDedicatedGpu && (
              <div className="flex items-center gap-1 text-purple-400">
                <Cpu className="w-3 h-3" />
                <span>GPU Dedicada</span>
              </div>
            )}
          </div>
        </div>

        {/* Expanded Technical Details Box */}
        {isExpanded && (
          <div className="bg-[#0A0E1A] border border-[#1F2C4C] rounded-lg p-3 text-[11px] space-y-2 mt-1">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-400 font-semibold">O que muda exatamente no sistema:</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(item.exactChange);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded transition-all font-mono ${
                    copied
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copiar alteração</span>
                    </>
                  )}
                </button>
              </div>
              <p className="font-mono text-gray-300 bg-[#121A2E] p-2.5 rounded border border-[#1A2542] break-all select-text">
                {item.exactChange}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 text-gray-400">
              <div>
                <span className="font-medium text-gray-400">Identificador:</span>{' '}
                <code className="text-indigo-400 select-text">{item.id}</code>
              </div>
              <div>
                <span className="font-medium text-gray-400">Reversível:</span>{' '}
                <span className="text-emerald-400 font-medium">Sim (100% via backup seguro)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
