import React, { useState } from 'react';
import {
  Download,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  X,
  ArrowUpCircle
} from 'lucide-react';

interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releaseNotes: string;
  downloadUrl: string;
  assetName: string;
  assetSize: number;
  publishedAt: string;
  htmlUrl: string;
}

interface AutoUpdaterModalProps {
  isOpen: boolean;
  onClose: () => void;
  updateInfo: UpdateInfo | null;
  onCheckUpdates: () => Promise<void>;
  isChecking: boolean;
}

export const AutoUpdaterModal: React.FC<AutoUpdaterModalProps> = ({
  isOpen,
  onClose,
  updateInfo,
  onCheckUpdates,
  isChecking
}) => {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  if (!isOpen) return null;

  const handleDownloadAndInstall = async () => {
    if (!updateInfo?.downloadUrl) return;

    setDownloading(true);
    setProgress(15);
    setDownloadStatus('A iniciar download da nova versão...');
    setErrorMsg('');

    try {
      // Simulate progress progression while file downloads in main process
      const interval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 10 : prev));
      }, 400);

      const res = await window.optimizerApi.updaterDownloadInstall(updateInfo.downloadUrl);
      clearInterval(interval);

      if (res.success) {
        setProgress(100);
        setDownloadStatus('Download concluído! A reiniciar aplicação com a nova versão...');
      } else {
        setDownloading(false);
        setErrorMsg(res.error || 'Falha ao descarregar a atualização.');
      }
    } catch (err: any) {
      setDownloading(false);
      setErrorMsg(err.message || 'Erro inesperado.');
    }
  };

  const formattedDate = updateInfo?.publishedAt
    ? new Date(updateInfo.publishedAt).toLocaleDateString('pt-PT', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#0B101D] border border-[#232F4D] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-950/60 to-purple-950/60 px-6 py-4 border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <ArrowUpCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Central de Atualizações
                {updateInfo?.hasUpdate && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 border border-emerald-500/40 text-emerald-300">
                    Nova Versão
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-400">
                Sincronização direta com os Releases oficiais do GitHub
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Version status box */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#12192B] border border-[#1E293B] rounded-xl p-3.5">
              <span className="text-[11px] font-medium text-gray-400 block mb-1">Versão Instalada</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold font-mono text-white">
                  v{updateInfo?.currentVersion || '1.0'}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700">
                  Local
                </span>
              </div>
            </div>

            <div className={`border rounded-xl p-3.5 ${
              updateInfo?.hasUpdate
                ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
                : 'bg-[#12192B] border-[#1E293B] text-gray-300'
            }`}>
              <span className="text-[11px] font-medium text-gray-400 block mb-1">Última Versão no GitHub</span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold font-mono text-emerald-400">
                  v{updateInfo?.latestVersion || updateInfo?.currentVersion || '1.0'}
                </span>
                {updateInfo?.hasUpdate ? (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                    Disponível
                  </span>
                ) : (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    Mais Recente
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Up to date state */}
          {!updateInfo?.hasUpdate && !isChecking && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-emerald-300">O seu Optimizer está atualizado!</h4>
                <p className="text-xs text-emerald-400/80 mt-1">
                  Está a executar a versão mais recente com todas as 166 otimizações, suite CPU-Z, calculador de gargalo e ferramentas de manutenção.
                </p>
              </div>
            </div>
          )}

          {/* Update Available State */}
          {updateInfo?.hasUpdate && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-emerald-500/15 to-indigo-500/15 border border-emerald-500/40 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>{updateInfo.releaseName || `Optimizer v${updateInfo.latestVersion}`}</span>
                  </div>
                  {formattedDate && (
                    <span className="text-[11px] text-gray-400">{formattedDate}</span>
                  )}
                </div>

                {updateInfo.releaseNotes && (
                  <div className="mt-3 bg-[#0E1526]/80 border border-[#1E293B] rounded-lg p-3 text-xs text-gray-300 font-sans max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                    {updateInfo.releaseNotes}
                  </div>
                )}

                {updateInfo.assetSize > 0 && (
                  <div className="mt-2 text-[11px] text-gray-400">
                    Tamanho do executável: ~{(updateInfo.assetSize / (1024 * 1024)).toFixed(1)} MB
                  </div>
                )}
              </div>

              {/* Progress bar during download */}
              {downloading && (
                <div className="bg-[#12192B] border border-[#1E293B] rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-300 font-semibold">{downloadStatus}</span>
                    <span className="font-mono text-indigo-400 font-bold">{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-300 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-center gap-2 text-rose-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-[#090E1A] border-t border-[#1E293B] flex items-center justify-between gap-3">
          <button
            onClick={onCheckUpdates}
            disabled={isChecking || downloading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-[#131B2E] hover:bg-[#1A253D] border border-[#232F4D] text-gray-300 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-indigo-400' : ''}`} />
            <span>{isChecking ? 'A verificar...' : 'Verificar Agora'}</span>
          </button>

          <div className="flex items-center gap-2">
            {updateInfo?.htmlUrl && (
              <a
                href={updateInfo.htmlUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#131B2E] hover:bg-[#1A253D] border border-[#232F4D] text-gray-300 hover:text-white transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Ver no GitHub</span>
              </a>
            )}

            {updateInfo?.hasUpdate ? (
              <button
                onClick={handleDownloadAndInstall}
                disabled={downloading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                <Download className="w-4 h-4 text-black" />
                <span>{downloading ? 'A Descarregar...' : 'Atualizar com 1 Clique'}</span>
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                Fechar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
