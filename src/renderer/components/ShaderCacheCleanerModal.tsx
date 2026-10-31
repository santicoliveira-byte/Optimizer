import React, { useState, useEffect } from 'react';
import {
  Zap,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles
} from 'lucide-react';
import { ShaderCacheCategory } from '../../shared/types';

export const ShaderCacheCleanerModal: React.FC<{
  isOpen?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}> = ({
  isOpen = true,
  onClose,
  onSuccess: _onSuccess
}) => {
  const [caches, setCaches] = useState<ShaderCacheCategory[]>([]);
  const [_isLoading, setIsLoading] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadCaches = async () => {
    setIsLoading(true);
    setFeedback(null);
    try {
      if (window.optimizerApi?.shaderCacheGetStatus) {
        const data = await window.optimizerApi.shaderCacheGetStatus();
        setCaches(data);
      }
    } catch {}
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadCaches();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalBytes = caches.reduce((acc, c) => acc + c.sizeBytes, 0);
  const totalFiles = caches.reduce((acc, c) => acc + c.fileCount, 0);
  const totalMb = (totalBytes / (1024 * 1024)).toFixed(1);

  const handleClean = async (id?: string) => {
    setIsCleaning(true);
    setFeedback(null);
    try {
      if (window.optimizerApi?.shaderCacheClean) {
        const res = await window.optimizerApi.shaderCacheClean(id);
        setFeedback({
          type: res.success ? 'success' : 'error',
          message: res.message
        });
        await loadCaches();
      }
    } catch (e: any) {
      setFeedback({ type: 'error', message: e?.message || 'Erro ao limpar cache.' });
    } finally {
      setIsCleaning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#0C1222] border border-[#202E52] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Limpador de Cache de Shaders (GPU)</h3>
              <p className="text-xs text-gray-400">Elimina ficheiros de shaders corrompidos do DirectX e drivers de vídeo</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-lg font-bold p-1">
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Summary Box */}
          <div className="bg-gradient-to-r from-[#17192C] to-[#121935] border border-indigo-500/30 rounded-xl p-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block">
                Espaço Ocupado por Shaders
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-2xl font-black text-amber-400">{totalMb} MB</span>
                <span className="text-xs text-gray-400">({totalFiles} ficheiros de cache)</span>
              </div>
            </div>
            <button
              onClick={() => handleClean()}
              disabled={isCleaning || totalFiles === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-md shadow-amber-400/20 disabled:opacity-50"
            >
              {isCleaning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>Limpar Todas as Caches</span>
            </button>
          </div>

          {/* Feedback */}
          {feedback && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2.5 text-xs ${
                feedback.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Cache Locations List */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block px-1">
              Diretórios de Cache Detetados
            </span>
            {caches.map((c) => {
              const mb = (c.sizeBytes / (1024 * 1024)).toFixed(1);
              return (
                <div
                  key={c.id}
                  className="bg-[#090F1E] border border-[#18233C] rounded-xl p-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block">{c.name}</span>
                    <span className="text-[10px] text-gray-400 truncate block mt-0.5" title={c.path}>
                      {c.path}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-amber-300 block">{mb} MB</span>
                      <span className="text-[9px] text-gray-400">{c.fileCount} ficheiros</span>
                    </div>
                    {c.fileCount > 0 && (
                      <button
                        onClick={() => handleClean(c.id)}
                        disabled={isCleaning}
                        className="px-2.5 py-1 text-[11px] font-semibold text-gray-300 hover:text-white bg-[#152038] hover:bg-rose-600/80 rounded-lg transition-colors border border-[#23355A]"
                        title="Limpar apenas esta cache"
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-xl text-[11px] text-indigo-300 flex items-start gap-2">
            <Sparkles className="w-4 h-4 shrink-0 text-indigo-400 mt-0.5" />
            <span>
              <strong>Dica de Otimização:</strong> Limpar a cache de shaders obriga o jogo a recompilar shaders limpos na primeira execução, resolvendo travamentos causados por ficheiros de versões antigas do driver da placa gráfica.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1E293B] bg-[#090F1C] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-300 hover:text-white bg-[#151E33] hover:bg-[#1E2B48] transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
