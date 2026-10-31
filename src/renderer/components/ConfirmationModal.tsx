import React from 'react';
import { AlertTriangle, X, Check, ShieldCheck } from 'lucide-react';
import { OptimizationItem } from '../../shared/types';

interface ConfirmationModalProps {
  item: OptimizationItem | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  item,
  onConfirm,
  onCancel
}) => {
  if (!item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#10172A] border border-[#2B3B60] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Confirmação de Alteração</h2>
              <span className="text-xs text-amber-400 font-semibold uppercase tracking-wider">
                Risco Moderado [M]
              </span>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-[#1E293B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item Details */}
        <div className="bg-[#141E33] border border-[#1E2C4A] rounded-xl p-4 space-y-3">
          <h3 className="font-semibold text-white text-sm">{item.name}</h3>
          <p className="text-xs text-gray-300 leading-relaxed">{item.description}</p>

          <div className="border-t border-[#223152] pt-2">
            <span className="text-[11px] text-gray-400 block font-medium mb-1">
              O que será alterado exatamente:
            </span>
            <code className="text-xs font-mono text-indigo-300 bg-[#0B101D] p-2 rounded block break-all border border-[#1B2742]">
              {item.exactChange}
            </code>
          </div>
        </div>

        {/* Safety Assurances */}
        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-lg">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>
            Um backup do valor original será guardado e a alteração pode ser revertida a qualquer momento.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-[#1E293B] border border-[#2B3B60] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-gray-950 transition-colors shadow-lg shadow-amber-500/20"
          >
            <Check className="w-4 h-4" />
            <span>Confirmar e Aplicar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
