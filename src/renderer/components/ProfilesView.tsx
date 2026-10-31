import React, { useState, useMemo } from 'react';
import {
  Gamepad2,
  Briefcase,
  Scale,
  Check,
  Play,
  RotateCcw,
  Sparkles,
  Search,
  Code2,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  X,
  ArrowRight,
  Zap,
  Info
} from 'lucide-react';
import { OptimizationProfile, OptimizationState } from '../../shared/types';

interface ProfilesViewProps {
  profiles: OptimizationProfile[];
  states: OptimizationState[];
  onApplyProfile: (profile: OptimizationProfile) => void;
  onRevertProfile: (profile: OptimizationProfile) => void;
  isOperating: boolean;
}

const categoryLabels: Record<string, string> = {
  input_latency: 'Input Delay & Latência',
  network_internet: 'Rede & Internet',
  wifi: 'Wi-Fi & Conexões',
  startup_services: 'Serviços & Arranque',
  memory_storage: 'Memória & Armazenamento',
  cpu_gpu_power: 'CPU, GPU & Energia',
  gaming: 'Gaming & Desempenho',
  visual_ui: 'Efeitos Visuais',
  privacy_telemetry: 'Privacidade & Telemetria',
  safe_cleanup: 'Limpeza Segura',
  maintenance_diag: 'Diagnóstico & Manutenção'
};

export const ProfilesView: React.FC<ProfilesViewProps> = ({
  profiles,
  states,
  onApplyProfile,
  onRevertProfile,
  isOperating
}) => {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>('gaming');
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'applied'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const stateMap = useMemo(() => new Map(states.map((s) => [s.item.id, s])), [states]);

  const getProfileIcon = (iconName: string) => {
    switch (iconName) {
      case 'Gamepad2':
        return <Gamepad2 className="w-6 h-6 text-indigo-400" />;
      case 'Briefcase':
        return <Briefcase className="w-6 h-6 text-cyan-400" />;
      default:
        return <Scale className="w-6 h-6 text-emerald-400" />;
    }
  };

  const selectedProfile = useMemo(
    () => profiles.find((p) => p.id === selectedProfileId) || null,
    [profiles, selectedProfileId]
  );

  // Items for the selected profile with live state
  const selectedProfileItems = useMemo(() => {
    if (!selectedProfile) return [];
    return selectedProfile.itemIds
      .map((id) => stateMap.get(id))
      .filter((st): st is OptimizationState => !!st);
  }, [selectedProfile, stateMap]);

  // Filtered items based on tab & search query
  const filteredProfileItems = useMemo(() => {
    return selectedProfileItems.filter((st) => {
      const isApplied = st.status === 'applied';

      // Tab filter
      if (filterMode === 'pending' && isApplied) return false;
      if (filterMode === 'applied' && !isApplied) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = st.item.name.toLowerCase().includes(q);
        const matchDesc = st.item.description.toLowerCase().includes(q);
        const matchChange = (st.item.exactChange || '').toLowerCase().includes(q);
        const matchCategory = (categoryLabels[st.item.category] || '').toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchChange && !matchCategory) return false;
      }

      return true;
    });
  }, [selectedProfileItems, filterMode, searchQuery]);

  // Counts for selected profile
  const pendingCount = useMemo(
    () => selectedProfileItems.filter((st) => st.status !== 'applied').length,
    [selectedProfileItems]
  );

  const appliedCount = useMemo(
    () => selectedProfileItems.filter((st) => st.status === 'applied').length,
    [selectedProfileItems]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#10172A] border border-[#1E293B] rounded-2xl p-6 shadow-md">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-400" />
          Perfis de Otimização do Sistema
        </h2>
        <p className="text-xs text-gray-300 mt-1 max-w-2xl leading-relaxed">
          Clica num dos perfis abaixo para veres em detalhe <strong className="text-white">todas as definições e registos exatos que ele vai alterar no Windows</strong> antes de aplicar.
        </p>
      </div>

      {/* Profiles Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {profiles.map((profile) => {
          const totalItems = profile.itemIds.length;
          const appliedInProfile = profile.itemIds.filter((id) => {
            const st = stateMap.get(id);
            return st && st.status === 'applied';
          }).length;

          const isFullyApplied = appliedInProfile === totalItems && totalItems > 0;
          const percent = totalItems > 0 ? Math.round((appliedInProfile / totalItems) * 100) : 0;
          const isSelected = selectedProfileId === profile.id;
          const pendingInProfile = totalItems - appliedInProfile;

          return (
            <div
              key={profile.id}
              onClick={() => setSelectedProfileId(isSelected ? null : profile.id)}
              className={`cursor-pointer rounded-2xl border p-6 flex flex-col justify-between transition-all duration-200 select-none relative ${
                isSelected
                  ? 'bg-[#15203D] border-indigo-500 shadow-2xl shadow-indigo-500/20 ring-2 ring-indigo-500/80 scale-[1.01]'
                  : isFullyApplied
                  ? 'bg-[#121B32] border-indigo-500/40 hover:border-indigo-400/60 shadow-lg'
                  : 'bg-[#131B2E] border-[#1E293B] hover:border-[#2D3E6B] hover:bg-[#16213B]'
              }`}
            >
              {/* Selected Badge */}
              {isSelected && (
                <div className="absolute -top-3 right-5 bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md border border-indigo-400 flex items-center gap-1">
                  <span>A ver alterações</span>
                  <ChevronDown className="w-3 h-3" />
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-indigo-600/30 border-indigo-400' : 'bg-[#1A2542] border-[#27375E]'
                  }`}>
                    {getProfileIcon(profile.icon)}
                  </div>
                  {isFullyApplied ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      <Check className="w-3 h-3" /> 100% Ativo
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {pendingInProfile} por alterar
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">{profile.name}</h3>
                  <p className="text-xs text-gray-300 mt-1 leading-relaxed">{profile.description}</p>
                </div>

                {/* Progress bar */}
                <div className="bg-[#0C1222] border border-[#1E2C4A] rounded-xl p-3">
                  <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                    <span className="text-gray-400">Itens Ativos</span>
                    <span className="text-indigo-300 font-mono">
                      {appliedInProfile} / {totalItems} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full bg-[#18233C] rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>

                {/* Clickable Inspection Hint */}
                <div className={`flex items-center justify-between text-xs pt-1 ${
                  isSelected ? 'text-indigo-300 font-semibold' : 'text-gray-400'
                }`}>
                  <span className="flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5" />
                    {isSelected ? 'Ocultar lista de alterações' : `Ver o que vai mudar (${pendingInProfile} itens)`}
                  </span>
                  {isSelected ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-5 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  disabled={isOperating}
                  onClick={() => onApplyProfile(profile)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isFullyApplied
                      ? 'bg-[#1C2844] text-gray-300 hover:bg-[#25355A]'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                  } disabled:opacity-50`}
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{isFullyApplied ? 'Reaplicar Perfil' : 'Ativar Perfil'}</span>
                </button>

                {appliedInProfile > 0 && (
                  <button
                    disabled={isOperating}
                    onClick={() => onRevertProfile(profile)}
                    className="p-2.5 rounded-xl bg-[#1C2844] hover:bg-[#25355A] text-gray-300 hover:text-white border border-[#2B3B66] text-xs transition-colors"
                    title="Reverter itens deste perfil para os valores originais"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded Detailed Inspection Section: "O Que Este Perfil Vai Mudar" */}
      {selectedProfile && (
        <div className="bg-[#0C1222] border border-[#202E52] rounded-2xl p-6 shadow-2xl space-y-5 animate-in fade-in duration-200">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1E293B]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center">
                {getProfileIcon(selectedProfile.icon)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    O Que o Perfil &ldquo;{selectedProfile.name}&rdquo; Vai Mudar
                  </h3>
                  <span className="text-xs text-indigo-300 bg-indigo-500/15 px-2.5 py-0.5 rounded-full border border-indigo-500/30 font-medium">
                    {selectedProfileItems.length} otimizações totais
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Lista detalhada de cada chave de registo, serviço e definição de sistema afetada por este perfil.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={isOperating}
                onClick={() => onApplyProfile(selectedProfile)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Ativar Perfil ({pendingCount} pendentes)</span>
              </button>

              {appliedCount > 0 && (
                <button
                  disabled={isOperating}
                  onClick={() => onRevertProfile(selectedProfile)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#18233C] hover:bg-[#202E4E] text-gray-300 hover:text-white border border-[#25355A] text-xs font-medium transition-colors disabled:opacity-50"
                  title="Reverter todas as alterações deste perfil"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reverter</span>
                </button>
              )}

              <button
                onClick={() => setSelectedProfileId(null)}
                className="p-2 rounded-xl hover:bg-[#1A2542] text-gray-400 hover:text-white transition-colors"
                title="Fechar detalhes"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filters Bar: Tabs & Search */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-[#131B2E] p-1 rounded-xl border border-[#1E293B]">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  filterMode === 'all'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Todas ({selectedProfileItems.length})
              </button>
              <button
                onClick={() => setFilterMode('pending')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all ${
                  filterMode === 'pending'
                    ? 'bg-amber-600 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>O que vai mudar ({pendingCount})</span>
              </button>
              <button
                onClick={() => setFilterMode('applied')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-all ${
                  filterMode === 'applied'
                    ? 'bg-emerald-600 text-white shadow'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Já Ativas ({appliedCount})</span>
              </button>
            </div>

            {/* Search Box */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Pesquisar definição ou registo..."
                className="w-full bg-[#131B2E] border border-[#1E293B] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Items List */}
          {filteredProfileItems.length === 0 ? (
            <div className="text-center py-12 bg-[#090E1A] rounded-xl border border-[#162038]">
              <Info className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-300">Nenhuma otimização encontrada</p>
              <p className="text-xs text-gray-500 mt-1">
                {filterMode === 'pending'
                  ? 'Todas as otimizações deste perfil já se encontram ativas!'
                  : 'Tenta alterar o termo de pesquisa ou os filtros acima.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 max-h-[520px] overflow-y-auto pr-1">
              {filteredProfileItems.map((st) => {
                const isApplied = st.status === 'applied';
                const catName = categoryLabels[st.item.category] || st.item.category;

                return (
                  <div
                    key={st.item.id}
                    className={`rounded-xl border p-4 transition-all ${
                      isApplied
                        ? 'bg-[#10192E] border-[#1D2947]'
                        : 'bg-[#121A30] border-[#223158] hover:border-amber-500/40'
                    }`}
                  >
                    {/* Top Row: Badges & Name */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        {isApplied ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Já Ativo
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                            <Zap className="w-3 h-3" /> Vai Mudar
                          </span>
                        )}

                        <span className="text-[10px] font-medium text-gray-400 bg-[#162038] px-2 py-0.5 rounded-md border border-[#23335A]">
                          {catName}
                        </span>

                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${
                          st.item.risk === 'safe'
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                        }`}>
                          {st.item.risk === 'safe' ? 'Seguro' : 'Moderado'}
                        </span>

                        {st.item.requiresReboot && (
                          <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Requer Reinício
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] font-mono text-gray-500">
                        #{st.item.itemNumber} {st.item.id}
                      </span>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <h4 className="text-sm font-semibold text-white tracking-tight">{st.item.name}</h4>
                      <p className="text-xs text-gray-300 mt-1 leading-relaxed">{st.item.description}</p>
                    </div>

                    {/* Exact Windows Modification Box */}
                    <div className="mt-3 bg-[#080D17] border border-[#19243E] rounded-lg p-2.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold text-indigo-300 uppercase tracking-wider mb-1">
                        <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>O que vai ser modificado no Windows (Registo / Comando):</span>
                      </div>
                      <div className="font-mono text-[11px] text-emerald-400/90 break-all select-all bg-[#050810] p-2 rounded border border-[#141E33]">
                        {st.item.exactChange || 'Modificação de parâmetros avançados do sistema'}
                      </div>

                      {/* Current vs Target status footer */}
                      <div className="flex items-center justify-between text-[11px] text-gray-400 mt-2 pt-1 border-t border-[#152038]">
                        <span className="truncate">
                          Estado Atual: <strong className={isApplied ? 'text-emerald-400' : 'text-amber-400'}>
                            {isApplied ? 'Otimizado (Ativo)' : (st.currentValue ? String(st.currentValue) : 'Padrão do Windows')}
                          </strong>
                        </span>
                        <span className="text-indigo-300 flex items-center gap-1 font-medium">
                          Ação: {isApplied ? 'Manter otimização' : 'Aplicar valor ideal'}
                          <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
