import React, { useState, useEffect } from 'react';
import {
  Globe,
  Zap,
  Crosshair,
  Gamepad2,
  Layers,
  RotateCcw,
  Sparkles,
  Wifi,
  Radio,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Server,
  Activity,
  Cpu,
  Search
} from 'lucide-react';
import { GameRouteItem, ExitLagStackStatus, ExitLagServerRoute } from '../../shared/types';

interface GameRouterViewProps {
  onShowNotification: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const GameRouterView: React.FC<GameRouterViewProps> = ({ onShowNotification }) => {
  const [activeSubTab, setActiveSubTab] = useState<'games' | 'stack' | 'routes'>('games');
  const [games, setGames] = useState<GameRouteItem[]>([]);
  const [stackStatus, setStackStatus] = useState<ExitLagStackStatus | null>(null);
  const [serverRoutes, setServerRoutes] = useState<ExitLagServerRoute[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isApplyingStack, setIsApplyingStack] = useState(false);
  const [isTestingRoutes, setIsTestingRoutes] = useState(false);
  const [isTogglingWifi, setIsTogglingWifi] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState<'all' | 'fps' | 'battle_royale' | 'moba' | 'racing' | 'other'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add custom game form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customExe, setCustomExe] = useState('');

  const loadAll = async () => {
    setIsLoading(true);
    try {
      if (window.optimizerApi?.gameRouteGetGames) {
        const list = await window.optimizerApi.gameRouteGetGames();
        setGames(list);
      }
      if (window.optimizerApi?.gameRouteGetStackStatus) {
        const status = await window.optimizerApi.gameRouteGetStackStatus();
        setStackStatus(status);
      }
    } catch (e) {
      console.error('Erro ao carregar dados do ExitLag:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadServerRoutes = async () => {
    if (!window.optimizerApi?.gameRouteGetRoutes) return;
    setIsTestingRoutes(true);
    try {
      const routes = await window.optimizerApi.gameRouteGetRoutes();
      setServerRoutes(routes);
    } catch (e: any) {
      onShowNotification(`Falha ao testar rotas: ${e.message}`, 'error');
    } finally {
      setIsTestingRoutes(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'routes' && serverRoutes.length === 0 && !isTestingRoutes) {
      loadServerRoutes();
    }
  }, [activeSubTab]);

  const handleToggleGame = async (gameId: string, currentStatus: boolean) => {
    if (!window.optimizerApi?.gameRouteToggle) return;
    try {
      const res = await window.optimizerApi.gameRouteToggle(gameId, !currentStatus);
      if (res.success) {
        onShowNotification(res.message, 'success');
        setGames((prev) =>
          prev.map((g) => (g.id === gameId ? { ...g, isPrioritized: !currentStatus } : g))
        );
      } else {
        onShowNotification(res.message, 'error');
      }
    } catch (e: any) {
      onShowNotification(`Erro ao alterar QoS: ${e.message}`, 'error');
    }
  };

  const handlePrioritizeAll = async (enable: boolean) => {
    if (!window.optimizerApi?.gameRoutePrioritizeAll) return;
    setIsLoading(true);
    try {
      const res = await window.optimizerApi.gameRoutePrioritizeAll(enable);
      if (res.success) {
        onShowNotification(res.message, 'success');
        setGames((prev) => prev.map((g) => ({ ...g, isPrioritized: enable })));
      } else {
        onShowNotification(res.message, 'error');
      }
    } catch (e: any) {
      onShowNotification(`Erro: ${e.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyExitLagStack = async (enable: boolean) => {
    if (!window.optimizerApi?.gameRouteApplyStack) return;
    setIsApplyingStack(true);
    try {
      const res = await window.optimizerApi.gameRouteApplyStack(enable);
      if (res.success) {
        onShowNotification(res.message, 'success');
        const updated = await window.optimizerApi.gameRouteGetStackStatus();
        setStackStatus(updated);
      } else {
        onShowNotification(res.message, 'error');
      }
    } catch (e: any) {
      onShowNotification(`Erro no motor ExitLag: ${e.message}`, 'error');
    } finally {
      setIsApplyingStack(false);
    }
  };

  const handleToggleWifiScan = async () => {
    if (!window.optimizerApi?.gameRouteToggleWifiScan || !stackStatus) return;
    setIsTogglingWifi(true);
    const targetState = !stackStatus.wifiScanDisabled;
    try {
      const res = await window.optimizerApi.gameRouteToggleWifiScan(targetState);
      if (res.success) {
        onShowNotification(res.message, 'success');
        setStackStatus((prev) => (prev ? { ...prev, wifiScanDisabled: targetState } : prev));
      } else {
        onShowNotification(res.message, 'error');
      }
    } catch (e: any) {
      onShowNotification(`Erro: ${e.message}`, 'error');
    } finally {
      setIsTogglingWifi(false);
    }
  };

  const handleAddCustomGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customExe.trim()) {
      onShowNotification('Preenche o nome do jogo e o ficheiro executável (.exe)!', 'error');
      return;
    }
    if (!window.optimizerApi?.gameRouteAddCustom) return;

    try {
      const res = await window.optimizerApi.gameRouteAddCustom(customName.trim(), customExe.trim());
      if (res.success && res.game) {
        onShowNotification(res.message, 'success');
        setGames((prev) => [...prev, res.game]);
        setCustomName('');
        setCustomExe('');
        setShowAddModal(false);
      } else {
        onShowNotification(res.message, 'error');
      }
    } catch (e: any) {
      onShowNotification(`Erro ao adicionar jogo: ${e.message}`, 'error');
    }
  };

  const handleRemoveCustomGame = async (gameId: string) => {
    if (!window.optimizerApi?.gameRouteRemoveCustom) return;
    try {
      const res = await window.optimizerApi.gameRouteRemoveCustom(gameId);
      if (res.success) {
        onShowNotification(res.message, 'success');
        setGames((prev) => prev.filter((g) => g.id !== gameId));
      } else {
        onShowNotification(res.message, 'error');
      }
    } catch (e: any) {
      onShowNotification(`Erro ao remover jogo: ${e.message}`, 'error');
    }
  };

  const handleResetNetworkClean = async () => {
    if (!window.optimizerApi?.gameRouteCleanNetwork) return;
    setIsResetting(true);
    try {
      const res = await window.optimizerApi.gameRouteCleanNetwork();
      if (res.success) {
        onShowNotification(res.message, 'success');
        await loadAll();
      } else {
        onShowNotification(res.message, 'error');
      }
    } catch (e: any) {
      onShowNotification(`Erro ao limpar rede: ${e.message}`, 'error');
    } finally {
      setIsResetting(false);
    }
  };

  const filteredGames = games.filter((g) => {
    const matchesCat = selectedCategory === 'all' ? true : g.category === selectedCategory;
    const matchesQuery = searchQuery.trim() === ''
      ? true
      : g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.processName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  const activeCount = games.filter((g) => g.isPrioritized).length;
  const isStackFullActive =
    Boolean(stackStatus?.tcpNoDelay) &&
    Boolean(stackStatus?.tcpAckFrequency) &&
    Boolean(stackStatus?.networkThrottlingDisabled) &&
    Boolean(stackStatus?.systemResponsiveness);

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-[#10172A] border border-[#1E293B] rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ExitLag Engine v2.0
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#162038] text-gray-400 border border-[#243358]">
                Multi-Route QoS & TCP Stack
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-400" />
              Priorização de Tráfego de Jogos & Motor ExitLag
            </h2>
            <p className="text-xs text-gray-300 mt-1 max-w-2xl leading-relaxed">
              Otimização profunda de rede eSports: priorização <strong>DSCP 46 (Expedited Forwarding)</strong>, desativação de Nagle (<strong>TCP NoDelay</strong>), supressão de *throttling* de rede e eliminação de *lag spikes* de Wi-Fi sem mensalidades.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              disabled={isResetting}
              onClick={handleResetNetworkClean}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#18233C] hover:bg-[#223154] text-amber-300 border border-amber-500/30 text-xs font-semibold transition-all disabled:opacity-50"
              title="Restaura a pilha TCP/IP padrão e desativa conflitos de rede"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span>Restaurar Padrão</span>
            </button>

            <button
              disabled={isLoading}
              onClick={() => handlePrioritizeAll(activeCount < games.length)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{activeCount < games.length ? 'Ativar QoS em Todos' : 'Desativar Todos'}</span>
            </button>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-[#1E293B]">
          <button
            onClick={() => setActiveSubTab('games')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'games'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-[#0F172A] text-gray-400 hover:text-white border border-[#1E293B]'
            }`}
          >
            <Crosshair className="w-4 h-4" />
            <span>Jogos & QoS ({activeCount}/{games.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('stack')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'stack'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'bg-[#0F172A] text-gray-400 hover:text-white border border-[#1E293B]'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Motor TCP/IP & Anti-Lag Wi-Fi</span>
            {isStackFullActive && (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('routes')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeSubTab === 'routes'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-[#0F172A] text-gray-400 hover:text-white border border-[#1E293B]'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Radar de Rotas & Servidores</span>
          </button>
        </div>
      </div>

      {/* TAB 1: Games & QoS */}
      {activeSubTab === 'games' && (
        <div className="space-y-4">
          {/* Controls: Search, Filter, Add Custom */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pesquisar jogo ou executável..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#0E1526] border border-[#1E293B] text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {(['all', 'fps', 'battle_royale', 'moba', 'racing', 'other'] as const).map((cat) => {
                  const labels: Record<string, string> = {
                    all: 'Todos',
                    fps: 'FPS',
                    battle_royale: 'Battle Royale',
                    moba: 'MOBA',
                    racing: 'Corridas',
                    other: 'Outros'
                  };
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all shrink-0 ${
                        selectedCategory === cat
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#131B2E] text-gray-400 hover:text-white border border-[#1E293B]'
                      }`}
                    >
                      {labels[cat]}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition-all shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Jogo</span>
            </button>
          </div>

          {/* Add Game Modal / Drawer */}
          {showAddModal && (
            <div className="p-4 rounded-xl bg-[#0D1424] border border-emerald-500/40 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  Priorizar Jogo Personalizado (QoS DSCP 46)
                </h4>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-white text-xs"
                >
                  Cancelar
                </button>
              </div>

              <form onSubmit={handleAddCustomGame} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Nome do Jogo</label>
                  <input
                    type="text"
                    placeholder="Ex: Dead by Daylight"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#16213B] border border-[#23355E] text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 mb-1">Nome do Processo (.exe)</label>
                  <input
                    type="text"
                    placeholder="Ex: DeadByDaylight-Win64-Shipping.exe"
                    value={customExe}
                    onChange={(e) => setCustomExe(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-[#16213B] border border-[#23355E] text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all"
                  >
                    Ativar Prioridade Imediata
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Games List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredGames.map((game) => (
              <div
                key={game.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  game.isPrioritized
                    ? 'bg-[#101A2D] border-emerald-500/40 shadow-sm'
                    : 'bg-[#121A2C] border-[#1E293B] hover:border-[#2B3B66]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        game.isPrioritized
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-[#1C2844] text-gray-400 border border-[#2B3B66]'
                      }`}
                    >
                      {game.category === 'fps' ? (
                        <Crosshair className="w-5 h-5" />
                      ) : game.category === 'battle_royale' ? (
                        <Gamepad2 className="w-5 h-5" />
                      ) : (
                        <Layers className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{game.name}</span>
                        {game.detectedRunning && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" title="Jogo em execução agora!" />
                        )}
                        {game.isCustom && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                            Custom
                          </span>
                        )}
                      </h4>
                      <span className="text-[11px] font-mono text-gray-400 block truncate max-w-[170px]">
                        {game.processName}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {game.isCustom && (
                      <button
                        onClick={() => handleRemoveCustomGame(game.id)}
                        className="text-gray-500 hover:text-red-400 p-1 rounded hover:bg-red-500/10 transition-colors"
                        title="Remover jogo personalizado"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* QoS Switch */}
                    <div
                      onClick={() => handleToggleGame(game.id, game.isPrioritized)}
                      className={`cursor-pointer w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 shrink-0 ${
                        game.isPrioritized ? 'bg-emerald-600' : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          game.isPrioritized ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#1E293B]/60 flex items-center justify-between text-[11px]">
                  <span className="text-gray-400">
                    Prioridade: <strong className={game.isPrioritized ? 'text-emerald-300' : 'text-gray-500'}>
                      {game.isPrioritized ? 'DSCP 46 (Expedited)' : 'Padrão do SO'}
                    </strong>
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    game.isPrioritized
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                      : 'bg-gray-800 text-gray-400'
                  }`}>
                    {game.isPrioritized ? '✓ QoS Ativo' : 'Desativado'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ExitLag TCP/IP Stack & Anti-Lag Wi-Fi */}
      {activeSubTab === 'stack' && (
        <div className="space-y-4">
          <div className="bg-[#10172A] border border-[#1E293B] rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Motor do Protocolo TCP/IP ExitLag</h3>
              </div>
              <p className="text-xs text-gray-400 mt-1 max-w-xl">
                Ajusta as propriedades de socket do kernel do Windows para gaming competitivo, eliminando o algoritmo de Nagle, forçando respostas ACK imediatas e anulando o bufferbloat.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                disabled={isApplyingStack}
                onClick={() => handleApplyExitLagStack(!isStackFullActive)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all disabled:opacity-50 ${
                  isStackFullActive
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-cyan-600/30'
                    : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 text-white shadow-emerald-600/30'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{isStackFullActive ? 'Desativar Motor TCP/IP' : 'Ativar Motor ExitLag (1-Clique)'}</span>
              </button>
            </div>
          </div>

          {/* Wi-Fi Lag Spikes Killer Card */}
          <div className="bg-gradient-to-r from-[#121A2E] to-[#16233E] border border-indigo-500/30 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                <Wifi className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">Anti-Lag Spikes de Wi-Fi (WLAN AutoConfig Lock)</h4>
                  <span className={`text-[10px] px-2 py-0.2 rounded font-semibold ${
                    stackStatus?.wifiScanDisabled
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-gray-800 text-gray-400'
                  }`}>
                    {stackStatus?.wifiScanDisabled ? '✓ Sem Picos' : 'Scan Ativo'}
                  </span>
                </div>
                <p className="text-xs text-gray-300 mt-1 max-w-xl">
                  O Windows pesquisa novas redes Wi-Fi a cada 60 segundos, causando picos de <strong>200ms+ de ping</strong>. Esta opção bloqueia a pesquisa de fundo durante partidas.
                  <span className="text-amber-400 font-medium block mt-1 text-[11px]">
                    ⚠️ Nota: Mantém desativado no uso diário para permitir que o Windows conecte e reconecte automaticamente ao Wi-Fi.
                  </span>
                </p>
              </div>
            </div>

            <button
              disabled={isTogglingWifi}
              onClick={handleToggleWifiScan}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                stackStatus?.wifiScanDisabled
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-[#1C2744] hover:bg-[#25355D] text-indigo-200 border border-indigo-500/40'
              }`}
            >
              {isTogglingWifi ? 'A configurar...' : stackStatus?.wifiScanDisabled ? '✓ Anti-Lag Ativo' : 'Ativar Anti-Lag Wi-Fi'}
            </button>
          </div>

          {/* Stack Parameters Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-[#0D1322] border border-[#1E293B]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  TCP NoDelay
                </span>
                {stackStatus?.tcpNoDelay ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-500" />
                )}
              </div>
              <div className="text-[11px] text-gray-400">
                Desativa o algoritmo de Nagle para enviar pacotes imediatamente sem esperar por aglomeração.
              </div>
              <div className={`text-[10px] font-bold mt-2 ${stackStatus?.tcpNoDelay ? 'text-emerald-400' : 'text-gray-500'}`}>
                {stackStatus?.tcpNoDelay ? 'Ativo (0ms Delay)' : 'Padrão do SO'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0D1322] border border-[#1E293B]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  TCP Ack Frequency
                </span>
                {stackStatus?.tcpAckFrequency ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-500" />
                )}
              </div>
              <div className="text-[11px] text-gray-400">
                Confirmação imediata para cada pacote recebido, reduzindo drasticamente o *tick lag*.
              </div>
              <div className={`text-[10px] font-bold mt-2 ${stackStatus?.tcpAckFrequency ? 'text-emerald-400' : 'text-gray-500'}`}>
                {stackStatus?.tcpAckFrequency ? 'Freq = 1 (Instantâneo)' : 'Padrão do SO'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0D1322] border border-[#1E293B]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Network Throttling
                </span>
                {stackStatus?.networkThrottlingDisabled ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-500" />
                )}
              </div>
              <div className="text-[11px] text-gray-400">
                Elimina a limitação imposta pelo Windows em placas de rede durante cargas multimédia.
              </div>
              <div className={`text-[10px] font-bold mt-2 ${stackStatus?.networkThrottlingDisabled ? 'text-emerald-400' : 'text-gray-500'}`}>
                {stackStatus?.networkThrottlingDisabled ? 'Desativado (0xFFFFFFFF)' : 'Padrão (10)'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0D1322] border border-[#1E293B]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-indigo-400" />
                  QoS Bandwidth Reserve
                </span>
                {stackStatus?.qosBandwidthLimitDisabled ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-gray-500" />
                )}
              </div>
              <div className="text-[11px] text-gray-400">
                Desbloqueia os 20% de largura de banda reservados por defeito pelo agendador de pacotes QoS.
              </div>
              <div className={`text-[10px] font-bold mt-2 ${stackStatus?.qosBandwidthLimitDisabled ? 'text-emerald-400' : 'text-gray-500'}`}>
                {stackStatus?.qosBandwidthLimitDisabled ? '100% Largura de Banda' : '20% Reservado'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Routes & Ping Radar */}
      {activeSubTab === 'routes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-400" />
                Radar Multirrota de Servidores eSports
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Latência em tempo real, jitter e comparação estimada com rotas otimizadas pelo motor ExitLag.
              </p>
            </div>

            <button
              disabled={isTestingRoutes}
              onClick={loadServerRoutes}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18233C] hover:bg-[#223154] text-white border border-[#2B3B66] text-xs font-semibold transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestingRoutes ? 'animate-spin' : ''}`} />
              <span>{isTestingRoutes ? 'A medir rotas...' : 'Atualizar Ping'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {serverRoutes.map((route) => (
              <div
                key={route.id}
                className="p-4 rounded-xl bg-[#0D1322] border border-[#1E293B] hover:border-[#2C3B63] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {route.region}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      route.quality === 'optimal'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : route.quality === 'good'
                        ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {route.quality === 'optimal' ? 'Rota Excelente' : route.quality === 'good' ? 'Rota Boa' : 'Moderada'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white mt-2.5">{route.name}</h4>
                  <div className="text-[11px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                    <span>{route.city}, {route.country}</span>
                    <span>•</span>
                    <span className="font-mono text-gray-500">{route.ip}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#1E293B] grid grid-cols-2 gap-2">
                  <div className="p-2 rounded-lg bg-[#080C16]">
                    <div className="text-[9px] text-gray-500 uppercase font-bold">Ping Atual</div>
                    <div className="text-base font-extrabold text-white mt-0.5 flex items-baseline gap-1">
                      <span>{route.pingMs}</span>
                      <span className="text-[10px] text-gray-400 font-normal">ms</span>
                    </div>
                    <div className="text-[10px] text-gray-500">Jitter: ±{route.jitterMs}ms</div>
                  </div>

                  <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/20">
                    <div className="text-[9px] text-emerald-400 uppercase font-bold">ExitLag QoS</div>
                    <div className="text-base font-extrabold text-emerald-300 mt-0.5 flex items-baseline gap-1">
                      <span>{route.estimatedExitLagPing}</span>
                      <span className="text-[10px] text-emerald-400 font-normal">ms</span>
                    </div>
                    <div className="text-[10px] text-emerald-400/80">0% Packet Loss</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
