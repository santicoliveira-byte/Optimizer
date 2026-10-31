import React, { useState, useEffect } from 'react';
import {
  Zap,
  Power,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Shield,
  Loader2,
  FolderOpen,
  SlidersHorizontal,
  Info
} from 'lucide-react';
import { StartupItem } from '../../shared/types';

export const StartupManagerView: React.FC = () => {
  const [items, setItems] = useState<StartupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [filterImpact, setFilterImpact] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const fetchItems = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      if (window.optimizerApi?.startupGetItems) {
        const res = await window.optimizerApi.startupGetItems();
        setItems(res);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Falha ao carregar programas de arranque.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleToggle = async (item: StartupItem) => {
    setTogglingId(item.id);
    setFeedback(null);
    try {
      if (window.optimizerApi?.startupToggleItem) {
        const nextState = !item.enabled;
        const res = await window.optimizerApi.startupToggleItem(item.id, nextState);
        if (res.success) {
          setItems((prev) =>
            prev.map((i) => (i.id === item.id ? { ...i, enabled: nextState } : i))
          );
          setFeedback({
            type: 'success',
            message: `${item.name} foi ${nextState ? 'ativado' : 'desativado com segurança'} no arranque!`
          });
        } else {
          setFeedback({ type: 'error', message: res.message });
        }
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Erro ao alterar estado do programa.' });
    } finally {
      setTogglingId(null);
    }
  };

  const filteredItems = items.filter((item) => {
    if (filterImpact === 'all') return true;
    return item.impact === filterImpact;
  });

  const highImpactCount = items.filter((i) => i.impact === 'high' && i.enabled).length;
  const disabledCount = items.filter((i) => !i.enabled).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#10172A] to-[#151D38] p-6 rounded-2xl border border-[#1E293B] shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">Gestor de Arranque do Windows</h2>
              <p className="text-xs text-gray-400">
                Audita programas que iniciam com o PC (HKCU, HKLM, Inicialização). Desativa apps pesadas sem apagar ficheiros.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={fetchItems}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E293B] hover:bg-[#28354D] border border-gray-700/60 text-gray-200 text-xs font-semibold transition-all shadow-md active:scale-95 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> : <RotateCcw className="w-4 h-4 text-amber-400" />}
          <span>Atualizar Auditoria</span>
        </button>
      </div>

      {/* Metrics / Status Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#10172A] border border-[#1E293B] rounded-xl p-4 flex items-center justify-between shadow-md">
          <div>
            <span className="text-[11px] text-gray-400 font-medium block">Total de Entradas</span>
            <span className="text-2xl font-mono font-bold text-white">{items.length}</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#10172A] border border-[#1E293B] rounded-xl p-4 flex items-center justify-between shadow-md">
          <div>
            <span className="text-[11px] text-gray-400 font-medium block">Impacto Alto Ativo</span>
            <span className={`text-2xl font-mono font-bold ${highImpactCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {highImpactCount}
            </span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#10172A] border border-[#1E293B] rounded-xl p-4 flex items-center justify-between shadow-md">
          <div>
            <span className="text-[11px] text-gray-400 font-medium block">Programas Otimizados (Desativados)</span>
            <span className="text-2xl font-mono font-bold text-emerald-400">{disabledCount}</span>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Feedback Toast Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-semibold animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span className="flex-1">{feedback.message}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-[#1E293B] pb-3">
        <div className="flex items-center gap-2">
          {(['all', 'high', 'medium', 'low'] as const).map((impact) => (
            <button
              key={impact}
              onClick={() => setFilterImpact(impact)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filterImpact === impact
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-[#151D33] text-gray-400 hover:text-gray-200 hover:bg-[#1A2542]'
              }`}
            >
              {impact === 'all' && `Todos (${items.length})`}
              {impact === 'high' && `Alto Impacto (${items.filter((i) => i.impact === 'high').length})`}
              {impact === 'medium' && `Médio Impacto (${items.filter((i) => i.impact === 'medium').length})`}
              {impact === 'low' && `Baixo Impacto (${items.filter((i) => i.impact === 'low').length})`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          <span>Totalmente reversível a qualquer instante</span>
        </div>
      </div>

      {/* Programs List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-[#10172A] border border-[#1E293B] rounded-2xl">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-3" />
            <p className="text-sm font-semibold text-gray-200">A mapear registo e pastas de arranque...</p>
            <p className="text-xs text-gray-500 mt-1">A calcular impacto de RAM e latência de boot do Windows.</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center bg-[#10172A] border border-[#1E293B] rounded-2xl">
            <Info className="w-7 h-7 text-gray-500 mx-auto mb-2" />
            <p className="text-sm text-gray-300 font-semibold">Nenhum programa encontrado para este filtro.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isToggling = togglingId === item.id;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  item.enabled
                    ? 'bg-[#10172A] border-[#1E293B] hover:border-gray-600'
                    : 'bg-[#0A0E1A] border-[#162035] opacity-70'
                }`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-bold text-sm text-white truncate">{item.name}</span>

                    {/* Impact badge */}
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                        item.impact === 'high'
                          ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                          : item.impact === 'medium'
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                          : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                      }`}
                    >
                      Impacto {item.impact.toUpperCase()}
                    </span>

                    {/* Source badge */}
                    <span className="text-[10px] font-mono bg-[#1A2542] border border-[#25365E] text-gray-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <FolderOpen className="w-2.5 h-2.5 text-gray-400" />
                      {item.location}
                    </span>

                    {/* Status badge */}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.enabled
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-gray-700/30 text-gray-400 border border-gray-700/50'
                      }`}
                    >
                      {item.enabled ? 'Ativo no Arranque' : 'Desativado'}
                    </span>
                  </div>

                  {/* Command / File Path */}
                  <p className="text-[11px] font-mono text-gray-400 truncate bg-[#070B14] px-2.5 py-1 rounded-lg border border-[#162035] max-w-2xl" title={item.command}>
                    {item.command}
                  </p>
                </div>

                {/* Action Toggle Switch */}
                <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => handleToggle(item)}
                    disabled={isToggling}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50 ${
                      item.enabled
                        ? 'bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300'
                        : 'bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300'
                    }`}
                  >
                    {isToggling ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Power className="w-4 h-4" />
                    )}
                    <span>{item.enabled ? 'Desativar' : 'Ativar'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Safety Note */}
      <div className="p-4 rounded-xl bg-[#0F172A]/70 border border-[#1E293B] flex items-start gap-3 text-xs text-gray-400">
        <HelpCircle className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-gray-200">Como funciona a desativação segura:</strong> As entradas desativadas não são eliminadas nem desinstaladas. São preservadas numa chave de segurança de backup do Windows, garantindo que o software continua a funcionar normalmente quando aberto manualmente e que pode ser reativado a qualquer momento com um só clique.
        </div>
      </div>
    </div>
  );
};
