import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  HardDrive,
  Cpu
} from 'lucide-react';

interface DebloatAppItem {
  id: string;
  name: string;
  description: string;
  category: 'telemetry' | 'bloatware' | 'storage_ram';
  packagePattern: string;
  isInstalled: boolean;
  isSafe: boolean;
  estimatedRamMb: number;
}

interface UwpDebloaterViewProps {
  onShowNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const UwpDebloaterView: React.FC<UwpDebloaterViewProps> = ({ onShowNotification }) => {
  const [apps, setApps] = useState<DebloatAppItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [operatingId, setOperatingId] = useState<string | null>(null);
  const [isBatchOperating, setIsBatchOperating] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    setIsLoading(true);
    try {
      if (window.optimizerApi?.debloatGetApps) {
        const data = await window.optimizerApi.debloatGetApps();
        setApps(data);
      }
    } catch {} finally {
      setIsLoading(false);
    }
  };

  const handleUninstall = async (app: DebloatAppItem) => {
    setOperatingId(app.id);
    try {
      const res = await window.optimizerApi.debloatUninstall(app.id);
      onShowNotification(res.message, res.success ? 'success' : 'error');
      await loadApps();
    } catch (e: any) {
      onShowNotification(e.message, 'error');
    } finally {
      setOperatingId(null);
    }
  };

  const handleRemoveOneDrive = async () => {
    setOperatingId('onedrive');
    try {
      const res = await window.optimizerApi.debloatRemoveOneDrive();
      onShowNotification(res.message, res.success ? 'success' : 'error');
      await loadApps();
    } catch (e: any) {
      onShowNotification(e.message, 'error');
    } finally {
      setOperatingId(null);
    }
  };

  const handleBatchRemove = async () => {
    setIsBatchOperating(true);
    try {
      const res = await window.optimizerApi.debloatBatchRecommended();
      if (res.success) {
        onShowNotification(
          `Limpeza Concluída: ${res.count} aplicações removidas. ~${res.freedRamMb} MB de memória RAM libertados!`,
          'success'
        );
        await loadApps();
      }
    } catch (e: any) {
      onShowNotification(e.message, 'error');
    } finally {
      setIsBatchOperating(false);
    }
  };

  const installedApps = apps.filter((a) => a.isInstalled);
  const totalRamSavable = installedApps.reduce((acc, a) => acc + a.estimatedRamMb, 0);

  const filteredApps = apps.filter(
    (a) =>
      a.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
      a.description.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#10172A] border border-[#1E293B] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-lg">
              <Trash2 className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-white tracking-tight">Windows 10/11 Debloater (Apps UWP)</h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Limpeza Nativa
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
                Desinstalação cirúrgica de bloatware de fábrica, aplicações promocionais da Microsoft Store e processos
                ocultos que realizam telemetria e consomem memória RAM permanente em computadores e portáteis.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={handleBatchRemove}
              disabled={isBatchOperating || installedApps.length === 0}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg ${
                installedApps.length > 0
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-950/40'
                  : 'bg-[#1E293B] text-gray-500 cursor-not-allowed'
              }`}
            >
              <Trash2 className={`w-3.5 h-3.5 ${isBatchOperating ? 'animate-spin' : ''}`} />
              <span>{isBatchOperating ? 'A Remover Bloatware...' : '1-Clique: Desinstalar Recomendadas'}</span>
            </button>
            <button
              onClick={loadApps}
              disabled={isLoading}
              className="px-3.5 py-2 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-white text-xs font-medium transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Verificar</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-5 pt-4 border-t border-[#1E293B] grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[#0B0F19] rounded-xl p-3 border border-[#1E293B] flex items-center gap-3">
            <HardDrive className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold">Instaladas no Sistema</div>
              <div className="text-base font-bold text-white font-mono">{installedApps.length} de {apps.length} detetadas</div>
            </div>
          </div>

          <div className="bg-[#0B0F19] rounded-xl p-3 border border-[#1E293B] flex items-center gap-3">
            <Cpu className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold">Potencial de RAM Livre</div>
              <div className="text-base font-bold text-emerald-400 font-mono">~{totalRamSavable} MB recuperáveis</div>
            </div>
          </div>

          <div className="bg-[#0B0F19] rounded-xl p-3 border border-[#1E293B] flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-teal-400 shrink-0" />
            <div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold">Segurança de Desinstalação</div>
              <div className="text-base font-bold text-teal-300">100% Reversível / Seguro</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Pesquisar bloatware (Cortana, OneDrive, Bing, Xbox...)"
            className="w-full bg-[#10172A] border border-[#1E293B] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Apps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredApps.map((app) => {
          const isBusy = operatingId === app.id;

          return (
            <div
              key={app.id}
              className={`rounded-2xl p-4 transition-all border ${
                app.isInstalled
                  ? 'bg-[#10172A] border-[#1E293B] hover:border-gray-700'
                  : 'bg-[#10172A]/50 border-emerald-500/20 opacity-80'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      app.isInstalled
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {app.isInstalled ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white truncate">{app.name}</h4>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">
                        ~{app.estimatedRamMb} MB
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {app.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  {app.isInstalled ? (
                    <button
                      onClick={() => (app.id === 'onedrive' ? handleRemoveOneDrive() : handleUninstall(app))}
                      disabled={isBusy}
                      className="px-3 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Trash2 className={`w-3.5 h-3.5 ${isBusy ? 'animate-spin' : ''}`} />
                      <span>{isBusy ? 'A Remover...' : 'Desinstalar'}</span>
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 rounded-xl text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Removido
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
