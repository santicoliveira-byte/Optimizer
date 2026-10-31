import React, { useState, useEffect } from 'react';
import {
  Wrench,
  ShieldCheck,
  HardDrive,
  Archive,
  Activity,
  RefreshCw,
  Trash2,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Terminal,
  Loader2,
  Info
} from 'lucide-react';

export interface MaintenanceTask {
  id: string;
  name: string;
  description: string;
  category: 'repair' | 'storage' | 'system';
  icon: string;
  estimatedDuration: string;
  lastRun?: string;
  lastStatus?: 'idle' | 'running' | 'success' | 'warning' | 'error';
  lastOutput?: string;
}

interface WindowsMaintenanceViewProps {
  onShowNotification?: (message: string, type: 'success' | 'error' | 'info') => void;
  isAdmin?: boolean;
}

export const WindowsMaintenanceView: React.FC<WindowsMaintenanceViewProps> = ({
  onShowNotification,
  isAdmin = true
}) => {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [runningTaskId, setRunningTaskId] = useState<string | null>(null);
  const [isFullRunning, setIsFullRunning] = useState<boolean>(false);
  const [consoleLogs, setConsoleLogs] = useState<{ time: string; text: string; type: 'info' | 'success' | 'error' }[]>([]);
  const [activeCategory, setActiveCategory] = useState<'all' | 'repair' | 'storage' | 'system'>('all');

  useEffect(() => {
    loadTasks();
  }, []);

  const addLog = (text: string, type: 'info' | 'success' | 'error' = 'info') => {
    setConsoleLogs((prev) => [
      ...prev.slice(-40),
      { time: new Date().toLocaleTimeString(), text, type }
    ]);
  };

  const loadTasks = async () => {
    setIsLoading(true);
    try {
      if (window.optimizerApi?.maintGetTasks) {
        const data = await window.optimizerApi.maintGetTasks();
        setTasks(data);
      }
    } catch (e: any) {
      console.error('Erro ao carregar tarefas de manutenção:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunTask = async (task: MaintenanceTask) => {
    if (runningTaskId || isFullRunning) return;
    setRunningTaskId(task.id);
    addLog(`A iniciar: ${task.name}...`, 'info');

    try {
      if (window.optimizerApi?.maintRunTask) {
        const res = await window.optimizerApi.maintRunTask(task.id);
        if (res.output) {
          addLog(res.output, res.success ? 'success' : 'error');
        }
        addLog(`${task.name} concluído em ${Math.round(res.durationMs / 1000)}s`, res.success ? 'success' : 'error');

        if (onShowNotification) {
          onShowNotification(res.message, res.success ? 'success' : 'error');
        }
        await loadTasks();
      }
    } catch (e: any) {
      addLog(`Falha em ${task.name}: ${e.message}`, 'error');
      if (onShowNotification) {
        onShowNotification(`Erro ao executar tarefa: ${e.message}`, 'error');
      }
    } finally {
      setRunningTaskId(null);
    }
  };

  const handleRunFullMaintenance = async () => {
    if (runningTaskId || isFullRunning) return;
    if (!confirm('Deseja iniciar a Manutenção Geral Automática do Windows? Serão executadas as tarefas essenciais de integridade, TRIM de SSDs e limpeza profunda em sequência.')) {
      return;
    }

    setIsFullRunning(true);
    addLog('A iniciar Manutenção Geral Automática em 1-Clique...', 'info');

    try {
      if (window.optimizerApi?.maintRunFull) {
        const res = await window.optimizerApi.maintRunFull();
        if (res.results) {
          res.results.forEach((r) => {
            if (r.output) addLog(`[${r.taskId}] ${r.output}`, r.success ? 'success' : 'info');
          });
        }
        addLog(res.message, res.success ? 'success' : 'error');

        if (onShowNotification) {
          onShowNotification(res.message, res.success ? 'success' : 'info');
        }
        await loadTasks();
      }
    } catch (e: any) {
      addLog(`Erro na Manutenção Geral: ${e.message}`, 'error');
      if (onShowNotification) {
        onShowNotification(`Erro na Manutenção Geral: ${e.message}`, 'error');
      }
    } finally {
      setIsFullRunning(false);
    }
  };

  const getTaskIcon = (icon: string) => {
    switch (icon) {
      case 'HardDrive':
        return <HardDrive className="w-5 h-5 text-emerald-400" />;
      case 'Trash2':
        return <Trash2 className="w-5 h-5 text-teal-400" />;
      case 'ShieldCheck':
        return <ShieldCheck className="w-5 h-5 text-cyan-400" />;
      case 'Archive':
        return <Archive className="w-5 h-5 text-indigo-400" />;
      case 'Activity':
        return <Activity className="w-5 h-5 text-blue-400" />;
      case 'RefreshCw':
        return <RefreshCw className="w-5 h-5 text-amber-400" />;
      case 'Wrench':
      default:
        return <Wrench className="w-5 h-5 text-emerald-400" />;
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (activeCategory === 'all') return true;
    return t.category === activeCategory;
  });

  return (
    <div className="space-y-6">
      {!isAdmin && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex items-center gap-2.5 text-xs text-amber-300">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>Algumas tarefas de reparação avançadas (como SFC, DISM e CHKDSK) requerem permissões de Administrador para executar com êxito.</span>
        </div>
      )}

      {/* Hero 1-Click Full Maintenance Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0C1E26] via-[#112D38] to-[#0A1A24] border border-emerald-500/30 p-6 shadow-2xl">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Manutenção Oficial do Windows 10 & 11</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Manutenção Geral do Windows</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-emerald-300 border border-emerald-500/30">
                1-Clique
              </span>
            </h2>
            <p className="text-xs text-gray-300 leading-relaxed">
              Executa a reparação profunda de ficheiros corrompidos do sistema (<strong>SFC Scannow</strong>), repositório de componentes (<strong>DISM</strong>), otimização de blocos <strong>TRIM em SSDs</strong>, limpeza da pasta <strong>WinSxS</strong> e verificação da estrutura NTFS sem reiniciar o computador.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full lg:w-auto">
            <button
              disabled={isFullRunning || !!runningTaskId}
              onClick={handleRunFullMaintenance}
              className={`flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl font-black text-sm transition-all shadow-xl text-white ${
                isFullRunning
                  ? 'bg-emerald-700/80 cursor-wait'
                  : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 hover:scale-[1.02] shadow-emerald-600/25 ring-1 ring-white/20'
              } disabled:opacity-50`}
            >
              {isFullRunning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>A Executar Manutenção Completa...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>Iniciar Manutenção Geral</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Highlights Grid */}
        <div className="mt-6 pt-5 border-t border-emerald-500/20 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-black/20 border border-emerald-500/20">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-300 shrink-0">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">TRIM em SSDs</div>
              <div className="text-[10px] text-gray-400">Prevenção de desgaste e 0 degradação</div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-black/20 border border-emerald-500/20">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-300 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Reparação SFC & DISM</div>
              <div className="text-[10px] text-gray-400">Correção de ficheiros DLL/SYS corrompidos</div>
            </div>
          </div>

          <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-black/20 border border-emerald-500/20">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center text-teal-300 shrink-0">
              <Archive className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Limpeza WinSxS</div>
              <div className="text-[10px] text-gray-400">Recupera gigabytes de updates antigos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>Ferramentas de Manutenção e Reparação</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {tasks.length} Ferramentas
            </span>
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Podes executar individualmente cada rotina de diagnóstico ou manutenção quando pretenderes.
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0E1526] border border-[#1E293B]">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeCategory === 'all'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Todas ({tasks.length})
          </button>
          <button
            onClick={() => setActiveCategory('repair')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeCategory === 'repair'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Reparação ({tasks.filter((t) => t.category === 'repair').length})
          </button>
          <button
            onClick={() => setActiveCategory('storage')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeCategory === 'storage'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Armazenamento ({tasks.filter((t) => t.category === 'storage').length})
          </button>
          <button
            onClick={() => setActiveCategory('system')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeCategory === 'system'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Sistema ({tasks.filter((t) => t.category === 'system').length})
          </button>
        </div>
      </div>

      {/* Grid of Modular Tasks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
            <span className="text-xs">A carregar catálogo de ferramentas de manutenção...</span>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isRunning = runningTaskId === task.id || isFullRunning;
            const hasSucceeded = task.lastStatus === 'success';
            const hasError = task.lastStatus === 'error';
            const hasWarning = task.lastStatus === 'warning';

            return (
              <div
                key={task.id}
                className="bg-[#0E1526]/80 hover:bg-[#121B30] border border-[#1E293B] hover:border-emerald-500/40 rounded-xl p-5 flex flex-col justify-between transition-all duration-200 shadow-md group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-[#141E34] border border-[#233355] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      {getTaskIcon(task.icon)}
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-gray-400 border border-white/5 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {task.estimatedDuration}
                      </span>
                      {hasSucceeded && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          Concluído
                        </span>
                      )}
                      {hasWarning && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5" />
                          Avisos
                        </span>
                      )}
                      {hasError && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5" />
                          Erro
                        </span>
                      )}
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {task.name}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1.5 line-clamp-3 leading-relaxed">
                    {task.description}
                  </p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-[#1E293B]/60 flex items-center justify-between gap-2">
                  <div className="text-[10px] text-gray-500 truncate">
                    {task.lastRun ? `Última: ${task.lastRun}` : 'Nunca executado nesta sessão'}
                  </div>

                  <button
                    disabled={isRunning}
                    onClick={() => handleRunTask(task)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                      isRunning
                        ? 'bg-gray-800 text-gray-500 cursor-wait'
                        : 'bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 hover:border-emerald-500 shadow-sm'
                    }`}
                  >
                    {isRunning ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>A executar...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Executar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Real-Time Maintenance Console Log */}
      <div className="bg-[#0B0F19] border border-[#1E293B] rounded-xl p-4 shadow-inner">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1E293B]">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Consola de Diagnóstico & Saída de Comandos (PowerShell / DISM / SFC)</span>
          </div>
          {consoleLogs.length > 0 && (
            <button
              onClick={() => setConsoleLogs([])}
              className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
            >
              Limpar Consola
            </button>
          )}
        </div>

        <div className="font-mono text-[11px] text-gray-300 space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
          {consoleLogs.length === 0 ? (
            <div className="text-gray-600 italic py-2 flex items-center gap-2">
              <Info className="w-3.5 h-3.5" />
              <span>Nenhuma tarefa em execução. Clica em "Iniciar Manutenção Geral" ou num botão "Executar" para iniciar.</span>
            </div>
          ) : (
            consoleLogs.map((log, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2 leading-relaxed ${
                  log.type === 'error'
                    ? 'text-rose-400'
                    : log.type === 'success'
                    ? 'text-emerald-400'
                    : 'text-gray-300'
                }`}
              >
                <span className="text-gray-600 select-none shrink-0">[{log.time}]</span>
                <span className="break-all whitespace-pre-wrap">{log.text}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
