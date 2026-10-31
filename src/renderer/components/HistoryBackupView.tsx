import React from 'react';
import { History, RotateCcw, BookmarkPlus, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { AuditLogEntry } from '../../shared/types';

interface HistoryBackupViewProps {
  logs: AuditLogEntry[];
  onCreateRestorePoint: () => void;
  onRevertAll: () => void;
  isOperating: boolean;
}

export const HistoryBackupView: React.FC<HistoryBackupViewProps> = ({
  logs,
  onCreateRestorePoint,
  onRevertAll,
  isOperating
}) => {
  return (
    <div className="space-y-6">
      {/* Header and Quick Global Actions */}
      <div className="bg-[#10172A] border border-[#1E293B] rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            Histórico de Alterações & Backups
          </h2>
          <p className="text-xs text-gray-300 mt-1 max-w-2xl leading-relaxed">
            Registo auditável de todas as modificações efetuadas no sistema pelo Optimizer. Cada alteração preserva
            o valor anterior no registo e pode ser restaurada com integridade total.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            disabled={isOperating}
            onClick={onCreateRestorePoint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#18233C] hover:bg-[#223154] border border-[#2B3C66] text-gray-200 text-xs font-semibold transition-all"
          >
            <BookmarkPlus className="w-4 h-4 text-indigo-400" />
            <span>Criar Ponto de Restauro</span>
          </button>

          <button
            disabled={isOperating}
            onClick={onRevertAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Repor Tudo ao Original</span>
          </button>
        </div>
      </div>

      {/* Safety Notice Box */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-[#0D1424] border border-[#1F2E52] text-xs text-emerald-400">
        <Shield className="w-5 h-5 shrink-0" />
        <span>
          O Optimizer opera exclusivamente com parâmetros seguros e reversíveis. Caso restaures tudo, todas as chaves
          de registo e planos de energia voltam aos valores originais capturados no momento anterior à primeira aplicação.
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#10172A] border border-[#1E293B] rounded-2xl overflow-hidden shadow-md">
        <div className="p-4 border-b border-[#1E293B] flex items-center justify-between">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Registo de Auditoria ({logs.length} entradas)
          </h3>
        </div>

        {logs.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-xs">
            Nenhuma alteração registada até ao momento. O histórico será preenchido à medida que aplicares otimizações.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#131B2E] text-gray-400 font-semibold border-b border-[#1E293B]">
                <tr>
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-4">Otimização</th>
                  <th className="py-3 px-4">Ação</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1A253E] text-gray-300">
                {logs.map((log) => {
                  const isSuccess = log.status === 'success' || log.status === 'simulated';
                  const isSimulated = log.status === 'simulated';

                  return (
                    <tr key={log.id} className="hover:bg-[#141E33] transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-gray-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('pt-PT')}
                      </td>
                      <td className="py-3 px-4 font-medium text-white max-w-xs truncate">
                        {log.optimizationName}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                            log.action === 'apply'
                              ? 'bg-indigo-500/20 text-indigo-300'
                              : log.action === 'revert'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-gray-700/50 text-gray-300'
                          }`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 font-medium ${
                            isSimulated
                              ? 'text-amber-400'
                              : isSuccess
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {isSuccess ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5" />
                          )}
                          <span>{log.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-400 truncate max-w-sm">
                        {log.message}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
