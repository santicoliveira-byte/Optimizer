import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Sparkles,
  Flame,
  Activity
} from 'lucide-react';

interface ProcessTargetItem {
  name: string;
  displayName: string;
  pid: number | null;
  isRunning: boolean;
  priority: 'Normal' | 'AboveNormal' | 'High' | 'RealTime';
  ioPriority: 'Normal' | 'High';
  affinityMask: number;
  affinityCores: number[];
  totalCores: number;
  isCustom?: boolean;
}

interface ProcessLassoViewProps {
  onShowNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const ProcessLassoView: React.FC<ProcessLassoViewProps> = ({ onShowNotification }) => {
  const [processes, setProcesses] = useState<ProcessTargetItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [operatingProcess, setOperatingProcess] = useState<string | null>(null);
  const [customExeName, setCustomExeName] = useState('');
  const [selectedProcessForCores, setSelectedProcessForCores] = useState<ProcessTargetItem | null>(null);

  useEffect(() => {
    loadProcesses();
  }, []);

  const loadProcesses = async () => {
    setIsLoading(true);
    try {
      if (window.optimizerApi?.lassoGetTargets) {
        const targets = await window.optimizerApi.lassoGetTargets();
        setProcesses(targets);
        if (selectedProcessForCores) {
          const updated = targets.find((t: ProcessTargetItem) => t.name === selectedProcessForCores.name);
          if (updated) setSelectedProcessForCores(updated);
        }
      }
    } catch {} finally {
      setIsLoading(false);
    }
  };

  const handleApplyBoost = async (proc: ProcessTargetItem) => {
    setOperatingProcess(proc.name);
    try {
      const res = await window.optimizerApi.lassoApplyBoost(proc.name);
      onShowNotification(res.message, res.success ? 'success' : 'error');
      await loadProcesses();
    } catch (e: any) {
      onShowNotification(e.message, 'error');
    } finally {
      setOperatingProcess(null);
    }
  };

  const handleChangePriority = async (proc: ProcessTargetItem, newPriority: string) => {
    setOperatingProcess(proc.name);
    try {
      const res = await window.optimizerApi.lassoSetPriority(proc.name, newPriority);
      onShowNotification(res.message, res.success ? 'success' : 'error');
      await loadProcesses();
    } catch (e: any) {
      onShowNotification(e.message, 'error');
    } finally {
      setOperatingProcess(null);
    }
  };

  const handleToggleCore = async (coreIdx: number) => {
    if (!selectedProcessForCores) return;
    const current = selectedProcessForCores.affinityCores || [];
    let updated: number[];
    if (current.includes(coreIdx)) {
      if (current.length <= 1) {
        onShowNotification('O processo deve ter pelo menos 1 núcleo atribuído.', 'info');
        return;
      }
      updated = current.filter((c) => c !== coreIdx);
    } else {
      updated = [...current, coreIdx].sort((a, b) => a - b);
    }

    try {
      const res = await window.optimizerApi.lassoSetAffinity(selectedProcessForCores.name, updated);
      onShowNotification(res.message, res.success ? 'success' : 'error');
      await loadProcesses();
    } catch (e: any) {
      onShowNotification(e.message, 'error');
    }
  };

  const handleAddCustomProcess = async () => {
    if (!customExeName.trim()) return;
    try {
      const ok = await window.optimizerApi.lassoAddCustom(customExeName.trim());
      if (ok) {
        onShowNotification(`${customExeName} adicionado à lista de monitorização!`, 'success');
        setCustomExeName('');
        await loadProcesses();
      } else {
        onShowNotification('Executável já existe na lista.', 'info');
      }
    } catch (e: any) {
      onShowNotification(e.message, 'error');
    }
  };

  const handleRemoveCustomProcess = async (name: string) => {
    try {
      await window.optimizerApi.lassoRemoveCustom(name);
      onShowNotification(`${name} removido da monitorização.`, 'info');
      await loadProcesses();
    } catch (e: any) {
      onShowNotification(e.message, 'error');
    }
  };

  const runningCount = processes.filter((p) => p.isRunning).length;

  return (
    <div className="space-y-6">
      {/* Top Banner / Description */}
      <div className="bg-[#10172A] border border-[#1E293B] rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-gradient-to-l from-rose-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 shadow-lg">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-white tracking-tight">Gestor Dinâmico de Prioridades & P-Cores</h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Process Lasso Pro
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
                Garante que os teus jogos competitivos têm prioridade absoluta de execução no CPU e forçam o agendamento
                exclusivo em <strong>Performance Cores (P-Cores)</strong>, eliminando micro-gaguejos causados por E-Cores ou processos de fundo.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <div className="bg-[#0B0F19] px-3 py-1.5 rounded-xl border border-[#1E293B] text-xs font-mono text-gray-300 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${runningCount > 0 ? 'bg-emerald-400 animate-ping' : 'bg-gray-500'}`} />
              <span>{runningCount} Jogos Ativos</span>
            </div>
            <button
              onClick={loadProcesses}
              disabled={isLoading}
              className="px-3.5 py-1.5 rounded-xl bg-[#1E293B] hover:bg-[#334155] text-white text-xs font-medium transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Custom Executable Row */}
      <div className="bg-[#10172A] border border-[#1E293B] rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs font-medium text-gray-300">Adicionar Jogo ou App Personalizada:</span>
        </div>
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <input
            type="text"
            value={customExeName}
            onChange={(e) => setCustomExeName(e.target.value)}
            placeholder="Ex: FiveM.exe, osu!.exe, Valorant-Win64..."
            className="flex-1 bg-[#0B0F19] border border-[#1E293B] rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-rose-500"
            onKeyDown={(e) => e.key === 'Enter' && handleAddCustomProcess()}
          />
          <button
            onClick={handleAddCustomProcess}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-all flex items-center gap-1 shadow-md shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar</span>
          </button>
        </div>
      </div>

      {/* Target Processes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {processes.map((proc) => {
          const isSelected = selectedProcessForCores?.name === proc.name;
          const isBusy = operatingProcess === proc.name;

          return (
            <div
              key={proc.name}
              className={`rounded-2xl p-4 transition-all border ${
                proc.isRunning
                  ? 'bg-[#10172A] border-rose-500/40 shadow-[0_4px_20px_rgba(244,63,94,0.08)]'
                  : 'bg-[#10172A]/70 border-[#1E293B]'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      proc.isRunning
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-md'
                        : 'bg-[#1E293B] text-gray-400'
                    }`}
                  >
                    {proc.displayName.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white truncate">{proc.displayName}</h4>
                      {proc.isCustom && (
                        <button
                          onClick={() => handleRemoveCustomProcess(proc.name)}
                          className="text-gray-500 hover:text-rose-400 p-0.5 rounded transition-all"
                          title="Remover"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-gray-400 block truncate">{proc.name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {proc.isRunning ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      PID {proc.pid}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-gray-800 text-gray-400 border border-gray-700">
                      Inativo
                    </span>
                  )}
                </div>
              </div>

              {/* Priority & Affinity Controls */}
              <div className="mt-4 pt-3 border-t border-[#1E293B] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    Prioridade CPU:
                  </span>
                  <div className="flex items-center gap-1">
                    {(['Normal', 'AboveNormal', 'High', 'RealTime'] as const).map((prio) => (
                      <button
                        key={prio}
                        disabled={!proc.isRunning || isBusy}
                        onClick={() => handleChangePriority(proc, prio)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-all ${
                          proc.priority === prio
                            ? prio === 'High' || prio === 'RealTime'
                              ? 'bg-rose-500 text-white shadow-sm'
                              : 'bg-indigo-600 text-white'
                            : 'bg-[#0B0F19] text-gray-400 hover:text-white border border-[#1E293B]'
                        } ${!proc.isRunning ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        {prio === 'AboveNormal' ? 'Acima' : prio === 'RealTime' ? 'Tempo Real' : prio}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Cpu className="w-3.5 h-3.5 text-amber-400" />
                    Núcleos Atribuídos:
                  </span>
                  <button
                    onClick={() => setSelectedProcessForCores(isSelected ? null : proc)}
                    className="text-xs text-amber-400 hover:text-amber-300 font-mono font-medium underline"
                  >
                    {proc.affinityCores.length} de {proc.totalCores} Cores {isSelected ? '▲' : '▼'}
                  </button>
                </div>

                {/* 1-Click Process Lasso Boost Action */}
                <div className="pt-2 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleApplyBoost(proc)}
                    disabled={!proc.isRunning || isBusy}
                    className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md ${
                      proc.isRunning
                        ? 'bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white shadow-rose-950/40'
                        : 'bg-[#1E293B] text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Flame className={`w-3.5 h-3.5 ${isBusy ? 'animate-spin' : ''}`} />
                    <span>
                      {isBusy
                        ? 'A Alocar P-Cores...'
                        : proc.isRunning
                        ? 'Ativar Otimização P-Cores & Alta Prioridade'
                        : 'Inicia o Jogo para Ativar Boost'}
                    </span>
                  </button>
                </div>

                {/* Interactive Core Affinity Drawer */}
                {isSelected && (
                  <div className="mt-3 p-3 bg-[#0B0F19] border border-[#1E293B] rounded-xl space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-300">Afinidade de Núcleos do Processador:</span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {proc.affinityCores.length === proc.totalCores ? 'Todos os Núcleos' : 'Isolamento Ativo'}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                      {Array.from({ length: proc.totalCores }, (_, idx) => {
                        const isCoreActive = proc.affinityCores.includes(idx);
                        const isPCore = idx < Math.ceil(proc.totalCores * 0.75);

                        return (
                          <button
                            key={idx}
                            disabled={!proc.isRunning}
                            onClick={() => handleToggleCore(idx)}
                            className={`p-1.5 rounded-lg text-center transition-all border ${
                              isCoreActive
                                ? isPCore
                                  ? 'bg-rose-500/30 border-rose-500 text-rose-200'
                                  : 'bg-indigo-500/30 border-indigo-500 text-indigo-200'
                                : 'bg-[#10172A] border-[#1E293B] text-gray-500 hover:border-gray-500'
                            }`}
                          >
                            <div className="text-[10px] font-mono font-bold">C{idx}</div>
                            <div className="text-[8px] uppercase tracking-tighter opacity-70">
                              {isPCore ? 'P-Core' : 'E-Core'}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
