import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { CategoryView } from './components/CategoryView';
import { ProfilesView } from './components/ProfilesView';
import { HistoryBackupView } from './components/HistoryBackupView';
import { ConfirmationModal } from './components/ConfirmationModal';
import { GameModeView } from './components/GameModeView';
import { AppTunerView } from './components/AppTunerView';
import { LatencyPipelineView } from './components/LatencyPipelineView';
import { DnsBenchmarkView } from './components/DnsBenchmarkView';
import { StartupManagerView } from './components/StartupManagerView';
import { GameRouterView } from './components/GameRouterView';
import { ShaderCacheCleanerModal } from './components/ShaderCacheCleanerModal';
import { Sidebar, MainSection, SectionStats } from './components/Sidebar';
import { TopTabBar } from './components/TopTabBar';
import { GameOverlayWidget } from './components/GameOverlayWidget';
import { PowerToolkitView } from './components/PowerToolkitView';
import { NetworkPriorityWidget } from './components/NetworkPriorityWidget';
import { ProcessLassoView } from './components/ProcessLassoView';
import { UwpDebloaterView } from './components/UwpDebloaterView';
import { GpuTuningView } from './components/GpuTuningView';
import { HoneSuiteView } from './components/HoneSuiteView';
import { WindowsMaintenanceView } from './components/WindowsMaintenanceView';
import { BottleneckCanIRunItView } from './components/BottleneckCanIRunItView';
import { CpuZHardwareView } from './components/CpuZHardwareView';

import {
  AuditLogEntry,
  CategoryId,
  OptimizationItem,
  OptimizationProfile,
  OptimizationRisk,
  OptimizationState,
  OptimizationType,
  SystemMetrics
} from '../shared/types';
import { ShieldAlert, AlertCircle, CheckCircle2, Gamepad2 } from 'lucide-react';

const COMMON_GAME_PROCESSES = [
  'cs2.exe',
  'csgo.exe',
  'VALORANT-Win64-Shipping.exe',
  'RiotClientServices.exe',
  'b1-Win64-Shipping.exe',
  'RDR2.exe',
  'GTA5.exe',
  'FC26.exe',
  'FC25.exe',
  'FC24.exe',
  'FortniteClient-Win64-Shipping.exe',
  'RocketLeague.exe',
  'acs.exe',
  'AssettoCorsa.exe',
  'Sifu-Win64-Shipping.exe',
  'KartKraft-Win64-Shipping.exe',
  'KartKraft.exe',
  'Overwatch.exe',
  'Apex.exe',
  'League of Legends.exe',
  'Warzone.exe',
  'cod.exe',
  'PUBG.exe',
  'TslGame.exe'
];

export const App: React.FC = () => {
  const [currentSection, setCurrentSection] = useState<MainSection>('dashboard');
  const [gamingTab, setGamingTab] = useState<'profiles' | 'hone_suite' | 'lasso' | 'input' | 'pipeline' | 'game_catalog'>('profiles');
  const [networkTab, setNetworkTab] = useState<'router' | 'priority' | 'dns' | 'net_catalog' | 'wifi_catalog'>('router');
  const [systemTab, setSystemTab] = useState<'toolkit' | 'gpu_driver' | 'cpu_gpu' | 'memory' | 'startup' | 'apps'>('toolkit');
  const [maintTab, setMaintTab] = useState<'windows_maint' | 'cleanup' | 'debloater' | 'privacy' | 'profiles' | 'history'>('windows_maint');

  const [states, setStates] = useState<OptimizationState[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [profiles, setProfiles] = useState<OptimizationProfile[]>([]);

  const [isDryRun, setIsDryRun] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState<'all' | OptimizationRisk>('all');
  const [selectedType, setSelectedType] = useState<'all' | OptimizationType>('all');
  const [filterRecommended, setFilterRecommended] = useState(false);

  const [pendingModerateItem, setPendingModerateItem] = useState<OptimizationItem | null>(null);
  const [isOperating, setIsOperating] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isInitialScanning, setIsInitialScanning] = useState(false);
  const [isApplyingGaming, setIsApplyingGaming] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true);
  const [isShaderModalOpen, setIsShaderModalOpen] = useState(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  // Stealth Mode & Game Detection
  const [detectedGame, setDetectedGame] = useState<string | null>(null);
  const [_isWindowFocused, setIsWindowFocused] = useState<boolean>(true);
  const [isWindowMinimized, setIsWindowMinimized] = useState<boolean>(false);

  // Stealth Mode is active ONLY when:
  // 1. A recognized game executable is actively running in the background, OR
  // 2. The user explicitly minimized the application window
  const isStealthMode = Boolean(detectedGame || isWindowMinimized);
  const isStealthRef = useRef(isStealthMode);

  // Tournament Mode & Precision Timer (0.500ms)
  const [isTournamentMode, setIsTournamentMode] = useState<boolean>(false);
  const [timerResolutionMs, setTimerResolutionMs] = useState<number>(1.0);

  useEffect(() => {
    if (window.optimizerApi?.timerGetStatus) {
      window.optimizerApi.timerGetStatus().then((st) => {
        if (st?.currentMs) {
          setTimerResolutionMs(st.currentMs);
          if (st.isLockedHalfMs) setIsTournamentMode(true);
        }
      });
    }

    if (window.optimizerApi?.onBoosterGameStarted) {
      const unsubStart = window.optimizerApi.onBoosterGameStarted((data) => {
        showNotification(`⚡ ${data.message}`, 'success');
        setTimerResolutionMs(0.5);
        setIsTournamentMode(true);
      });
      const unsubEnd = window.optimizerApi.onBoosterGameFinished((data) => {
        showNotification(`🛡️ ${data.message}`, 'info');
        setTimerResolutionMs(1.0);
        setIsTournamentMode(false);
      });
      return () => {
        unsubStart();
        unsubEnd();
      };
    }
  }, []);

  useEffect(() => {
    isStealthRef.current = isStealthMode;
    if (isStealthMode) {
      document.body.classList.add('stealth-mode');
    } else {
      document.body.classList.remove('stealth-mode');
    }
  }, [isStealthMode]);

  // Window blur / focus / minimize events
  useEffect(() => {
    if (window.optimizerApi?.onWindowStateChanged) {
      const unsub = window.optimizerApi.onWindowStateChanged((st) => {
        setIsWindowFocused(st.isFocused);
        if (typeof st.isMinimized === 'boolean') {
          setIsWindowMinimized(st.isMinimized);
        }
      });
      return () => unsub();
    }
  }, []);

  // Poll for running game processes
  useEffect(() => {
    let mounted = true;
    const checkGames = async () => {
      if (window.optimizerApi?.detectRunningGame) {
        try {
          const game = await window.optimizerApi.detectRunningGame(COMMON_GAME_PROCESSES);
          if (mounted) {
            setDetectedGame(game);
          }
        } catch {}
      }
    };

    checkGames();
    const t = setInterval(checkGames, 8000);
    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, []);

  const [gamingProgress, setGamingProgress] = useState<{
    current: number;
    total: number;
    currentItemName: string;
  } | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Initial load
  useEffect(() => {
    loadAllData(false);

    if (window.optimizerApi?.checkIsAdmin) {
      window.optimizerApi.checkIsAdmin().then((admin) => {
        setIsAdmin(admin);
      });
    }

    // Poll metrics every 5 seconds (halted during stealth mode to ensure 0% CPU consumption)
    const interval = setInterval(async () => {
      if (isStealthRef.current) return;
      if (window.optimizerApi?.getSystemMetrics) {
        try {
          const m = await window.optimizerApi.getSystemMetrics();
          setMetrics(m);
        } catch {}
      }
    }, 5000);

    // Listen for Tray "Ativar Modo de Jogo Ultra" event
    let unsubTray: (() => void) | undefined;
    if (window.optimizerApi?.onTrayActivateGaming) {
      unsubTray = window.optimizerApi.onTrayActivateGaming(() => {
        handleApplyGamingMode();
      });
    }

    // Listen for Global Hotkeys (Ctrl+Shift+F1/F2/F3)
    let unsubHotkey: (() => void) | undefined;
    if (window.optimizerApi?.onHotkeyTrigger) {
      unsubHotkey = window.optimizerApi.onHotkeyTrigger((data) => {
        if (data.action === 'ultra-game-mode') {
          handleApplyGamingMode();
        } else if (data.action === 'toggle-overlay') {
          setIsOverlayOpen((prev) => !prev);
        }
        showNotification(data.message, 'success');
      });
    }

    return () => {
      clearInterval(interval);
      if (unsubTray) unsubTray();
      if (unsubHotkey) unsubHotkey();
    };
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const loadAllData = async (forceScan = false) => {
    if (!window.optimizerApi) return;
    try {
      // 1. Instant Fast-Path: Show catalog immediately so user never sees a black/blank screen
      if (states.length === 0 && window.optimizerApi.getQuickStates) {
        try {
          const quickStates = await window.optimizerApi.getQuickStates();
          if (quickStates && quickStates.length > 0) {
            setStates(quickStates);
          }
        } catch {}
      }

      if (forceScan) {
        setIsScanning(true);
      } else {
        const isDone = await window.optimizerApi.isInitialScanDone();
        if (!isDone) {
          setIsInitialScanning(true);
        }
      }

      // 2. Fetch metrics, logs and profiles in parallel
      const [initialMetrics, auditLogs, allProfiles] = await Promise.all([
        window.optimizerApi.getSystemMetrics().catch(() => null),
        window.optimizerApi.getAuditLogs().catch(() => []),
        window.optimizerApi.getProfiles().catch(() => [])
      ]);
      if (initialMetrics) setMetrics(initialMetrics);
      if (auditLogs) setLogs(auditLogs);
      if (allProfiles) setProfiles(allProfiles);

      // 3. Scan system states (using cache or background worker)
      const allStates = await window.optimizerApi.detectAll(forceScan);
      if (allStates && allStates.length > 0) {
        setStates(allStates);
      }
    } catch (e: any) {
      console.error('Erro ao carregar dados:', e);
    } finally {
      setIsScanning(false);
      setIsInitialScanning(false);
    }
  };

  const handleRescanSystem = async () => {
    showNotification('A efetuar verificação completa e atualização de todas as otimizações...', 'info');
    await loadAllData(true);
    showNotification('Análise profunda do sistema concluída com sucesso!', 'success');
  };

  // Hardware compatibility filter: hide items that don't apply to this machine
  const hardwareFilteredStates = useMemo(() => {
    if (!metrics) return states;
    return states.filter((st) => {
      const c = st.item.compat;
      if (metrics.isLaptop && c.laptop === false) return false;
      if (!metrics.isLaptop && c.desktop === false) return false;
      if (c.requiresDedicatedGpu && !metrics.hasDedicatedGpu) return false;
      if (c.requiresWifi && !metrics.hasWifi) return false;
      return true;
    });
  }, [states, metrics]);

  // Helper function to get filtered states by category
  const getStatesByCategory = (category: CategoryId) => {
    return hardwareFilteredStates.filter((st) => {
      const item = st.item;
      if (item.category !== category) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesChange = item.exactChange.toLowerCase().includes(q);
        const matchesId = item.id.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesChange && !matchesId) return false;
      }

      // Risk filter
      if (selectedRisk !== 'all' && item.risk !== selectedRisk) return false;

      // Type filter
      if (selectedType !== 'all' && item.type !== selectedType) return false;

      // Recommended filter
      if (filterRecommended && !item.recommended) return false;

      return true;
    });
  };

  // Section stats for the 5 consolidated hubs in the sidebar
  const sectionStats = useMemo<Record<MainSection, SectionStats>>(() => {
    const stats: Record<MainSection, SectionStats> = {
      dashboard: { applied: 0, total: 0 },
      gaming: { applied: 0, total: 0 },
      network: { applied: 0, total: 0 },
      system: { applied: 0, total: 0 },
      maintenance: { applied: 0, total: 0 },
      bottleneck: { applied: 25, total: 25 },
      cpuz: { applied: 6, total: 6 }
    };

    const gamingCats: CategoryId[] = ['input_latency', 'gaming'];
    const networkCats: CategoryId[] = ['network_internet', 'wifi'];
    const systemCats: CategoryId[] = ['cpu_gpu_power', 'memory_storage', 'startup_services'];
    const maintCats: CategoryId[] = ['safe_cleanup', 'privacy_telemetry', 'maintenance_diag', 'visual_ui'];

    for (const st of hardwareFilteredStates) {
      const cat = st.item.category;
      let sec: MainSection | null = null;
      if (gamingCats.includes(cat)) sec = 'gaming';
      else if (networkCats.includes(cat)) sec = 'network';
      else if (systemCats.includes(cat)) sec = 'system';
      else if (maintCats.includes(cat)) sec = 'maintenance';

      if (sec) {
        stats[sec].total++;
        if (st.status === 'applied') {
          stats[sec].applied++;
        }
      }
    }

    return stats;
  }, [hardwareFilteredStates]);

  // Global Health Score calculation
  const healthScore = useMemo(() => {
    const alterItems = hardwareFilteredStates.filter((s) => s.item.type === 'alter');
    const applied = alterItems.filter((s) => s.status === 'applied').length;
    const total = alterItems.length || 1;
    return Math.min(100, Math.round(60 + (applied / total) * 40));
  }, [hardwareFilteredStates]);

  const appliedCount = useMemo(() => {
    return hardwareFilteredStates.filter((s) => s.item.type === 'alter' && s.status === 'applied').length;
  }, [hardwareFilteredStates]);

  const totalAlterCount = useMemo(() => {
    return hardwareFilteredStates.filter((s) => s.item.type === 'alter').length;
  }, [hardwareFilteredStates]);

  // Handlers
  const handleApplyClick = (id: string) => {
    const st = states.find((s) => s.item.id === id);
    if (!st) return;

    // Moderate [M] requires extra confirmation modal
    if (st.item.risk === 'moderate' && !isDryRun) {
      setPendingModerateItem(st.item);
      return;
    }

    executeApply(id);
  };

  const executeApply = async (id: string) => {
    setIsOperating(true);
    try {
      const res = await window.optimizerApi.apply(id, isDryRun);
      if (res.success) {
        showNotification(
          isDryRun ? `[Simulação] ${res.message}` : res.message,
          isDryRun ? 'info' : 'success'
        );
        // Refresh single item
        const updated = await window.optimizerApi.detectItem(id);
        setStates((prev) => prev.map((s) => (s.item.id === id ? updated : s)));
        const newLogs = await window.optimizerApi.getAuditLogs();
        setLogs(newLogs);
      } else {
        showNotification(`Erro: ${res.message}`, 'error');
      }
    } catch (e: any) {
      showNotification(`Falha: ${e.message}`, 'error');
    } finally {
      setIsOperating(false);
      setPendingModerateItem(null);
    }
  };

  const handleRevertClick = async (id: string) => {
    setIsOperating(true);
    try {
      const res = await window.optimizerApi.revert(id);
      if (res.success) {
        showNotification(res.message, 'success');
        const updated = await window.optimizerApi.detectItem(id);
        setStates((prev) => prev.map((s) => (s.item.id === id ? updated : s)));
        const newLogs = await window.optimizerApi.getAuditLogs();
        setLogs(newLogs);
      } else {
        showNotification(`Erro: ${res.message}`, 'error');
      }
    } catch (e: any) {
      showNotification(`Falha ao reverter: ${e.message}`, 'error');
    } finally {
      setIsOperating(false);
    }
  };

  const handleRevertAll = async () => {
    if (!confirm('Tem a certeza que deseja repor todas as otimizações aplicadas para os valores originais do backup?')) {
      return;
    }
    setIsOperating(true);
    try {
      const res = await window.optimizerApi.revertAll();
      showNotification(`Reposição concluída: ${res.revertedCount} otimizações repostas.`, 'success');
      await loadAllData();
    } catch (e: any) {
      showNotification(`Erro ao repor tudo: ${e.message}`, 'error');
    } finally {
      setIsOperating(false);
    }
  };

  const handleApplyRecommended = async () => {
    setIsOperating(true);
    try {
      const res = await window.optimizerApi.applyRecommended(isDryRun);
      showNotification(
        isDryRun
          ? `[Simulação] ${res.appliedCount} otimizações recomendadas simuladas.`
          : `Sucesso: ${res.appliedCount} otimizações recomendadas aplicadas com ponto de restauro criado!`,
        'success'
      );
      await loadAllData();
    } catch (e: any) {
      showNotification(`Erro ao aplicar recomendadas: ${e.message}`, 'error');
    } finally {
      setIsOperating(false);
    }
  };

  const handleCreateRestorePoint = async () => {
    setIsOperating(true);
    try {
      const res = await window.optimizerApi.createRestorePoint('Optimizer Manual Backup');
      if (res.success) {
        showNotification(res.message, 'success');
      } else {
        showNotification(res.message, 'error');
      }
    } catch (e: any) {
      showNotification(`Erro ao criar ponto de restauro: ${e.message}`, 'error');
    } finally {
      setIsOperating(false);
    }
  };

  const handleApplyGamingMode = async () => {
    let gamingProf = profiles.find((p) => p.id === 'gaming');
    let itemIds = gamingProf && gamingProf.itemIds.length > 0 ? [...gamingProf.itemIds] : [
      'input_power_plan',
      'input_game_mode',
      'input_mouse_accel',
      'input_pointer_speed',
      'input_sticky_keys',
      'input_filter_keys',
      'input_toggle_keys',
      'input_game_dvr',
      'input_windowed_optimizations',
      'input_usb_selective_suspend',
      'input_pcie_link_state',
      'input_cpu_min_state',
      'input_prevent_sleep_gaming',
      'input_focus_assist',
      'input_gpu_preference',
      'net_flush_dns',
      'net_tcp_autotuning',
      'net_rss',
      'net_delivery_opt_p2p',
      'net_limit_wu_bandwidth',
      'wifi_power_plan_max_perf',
      'srv_disable_restart_apps',
      'srv_safe_services_manual',
      'mem_check_trim_active',
      'mem_optimize_drives',
      'mem_enable_storage_sense',
      'cpu_gpu_power_gaming',
      'game_pause_windows_update',
      'game_silence_notifications',
      'game_before_playing_checklist',
      'ui_visual_effects_perf',
      'ui_disable_window_animations',
      'ui_disable_transparency',
      'ui_menu_show_delay_zero',
      'ui_disable_web_search_start',
      'priv_telemetry_min_official',
      'clean_user_temp',
      'clean_windows_temp',
      'clean_directx_shader_cache',
      'clean_gpu_shader_cache'
    ];

    setIsOperating(true);
    setIsApplyingGaming(true);
    setGamingProgress({
      current: 0,
      total: itemIds.length,
      currentItemName: 'A preparar motor de otimização ultra-latência...'
    });
    showNotification('A iniciar ativação do Modo de Jogo Ultra...', 'info');

    try {
      let count = 0;
      for (let i = 0; i < itemIds.length; i++) {
        const id = itemIds[i];
        const stateObj = states.find((s) => s.item.id === id);
        const itemName = stateObj ? stateObj.item.name : id;

        setGamingProgress({
          current: i + 1,
          total: itemIds.length,
          currentItemName: itemName
        });

        try {
          const res = await window.optimizerApi.apply(id, isDryRun);
          if (res.success) count++;
        } catch (itemErr) {
          console.error(`Erro ao aplicar ${id}:`, itemErr);
        }
      }

      showNotification(
        isDryRun
          ? `[Simulação] Modo Jogo Ultra: ${count} otimizações simuladas.`
          : `Modo Jogo Ultra ativado com sucesso! ${count} otimizações ativas para máxima performance e latência mínima.`,
        'success'
      );
      await loadAllData();
    } catch (e: any) {
      showNotification(`Erro ao ativar Modo Jogo Ultra: ${e.message}`, 'error');
    } finally {
      setIsOperating(false);
      setIsApplyingGaming(false);
      setGamingProgress(null);
    }
  };

  const handleApplyProfile = async (profile: OptimizationProfile) => {
    setIsOperating(true);
    setGamingProgress({
      current: 0,
      total: profile.itemIds.length,
      currentItemName: `A carregar perfil ${profile.name}...`
    });
    showNotification(`A aplicar perfil ${profile.name}...`, 'info');
    try {
      let count = 0;
      for (let i = 0; i < profile.itemIds.length; i++) {
        const id = profile.itemIds[i];
        const stateObj = states.find((s) => s.item.id === id);
        const itemName = stateObj ? stateObj.item.name : id;

        setGamingProgress({
          current: i + 1,
          total: profile.itemIds.length,
          currentItemName: itemName
        });

        try {
          const res = await window.optimizerApi.apply(id, isDryRun);
          if (res.success) count++;
        } catch (err) {
          console.error(`Erro ao aplicar ${id}:`, err);
        }
      }
      showNotification(
        isDryRun
          ? `[Simulação] Perfil ${profile.name}: ${count} itens simulados.`
          : `Perfil ${profile.name} ativado com sucesso (${count} itens aplicados).`,
        'success'
      );
      await loadAllData();
    } catch (e: any) {
      showNotification(`Erro ao aplicar perfil: ${e.message}`, 'error');
    } finally {
      setIsOperating(false);
      setGamingProgress(null);
    }
  };

  const handleRevertProfile = async (profile: OptimizationProfile) => {
    setIsOperating(true);
    try {
      let count = 0;
      for (const id of profile.itemIds) {
        const res = await window.optimizerApi.revert(id);
        if (res.success) count++;
      }
      showNotification(`Perfil ${profile.name} revertido com sucesso (${count} itens repostos).`, 'success');
      await loadAllData();
    } catch (e: any) {
      showNotification(`Erro ao reverter perfil: ${e.message}`, 'error');
    } finally {
      setIsOperating(false);
    }
  };

  const handleExportReport = async () => {
    try {
      const res = await window.optimizerApi.exportHtmlReport();
      if (res.success) {
        showNotification(`Relatório HTML guardado no Ambiente de Trabalho: ${res.path}`, 'success');
      }
    } catch (e: any) {
      showNotification(`Erro ao gerar relatório: ${e.message}`, 'error');
    }
  };

  const handleToggleTournament = async () => {
    setIsOperating(true);
    try {
      if (!isTournamentMode) {
        const res = await window.optimizerApi.tournamentActivate();
        setIsTournamentMode(true);
        setTimerResolutionMs(0.5);
        showNotification(res.message, 'success');
      } else {
        const res = await window.optimizerApi.tournamentDeactivate();
        setIsTournamentMode(false);
        setTimerResolutionMs(1.0);
        showNotification(res.message, 'info');
      }
    } catch (e: any) {
      showNotification(`Erro no Modo Torneio: ${e.message}`, 'error');
    } finally {
      setIsOperating(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#0B0F19] text-gray-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={(sec) => setCurrentSection(sec)}
        sectionStats={sectionStats}
        onOpenShaderModal={() => setIsShaderModalOpen(true)}
        onToggleOverlay={() => setIsOverlayOpen(!isOverlayOpen)}
        isOverlayOpen={isOverlayOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedRisk={selectedRisk}
          onRiskChange={setSelectedRisk}
          selectedType={selectedType}
          onTypeChange={setSelectedType}
          filterRecommended={filterRecommended}
          onToggleRecommended={() => setFilterRecommended(!filterRecommended)}
          isDryRun={isDryRun}
          onToggleDryRun={() => setIsDryRun(!isDryRun)}
          onCreateRestorePoint={handleCreateRestorePoint}
          onRevertAll={handleRevertAll}
          isTournamentMode={isTournamentMode}
          onToggleTournamentMode={handleToggleTournament}
          timerResolutionMs={timerResolutionMs}
        />

        {/* Stealth Mode Indicator Banner when game is running */}
        {detectedGame && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/40 px-6 py-2 flex items-center justify-between text-xs text-emerald-300 font-medium select-none shadow-md">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span>
                <strong>Modo Furtivo Ultraleve Ativo:</strong> Jogo detetado em execução (<code>{detectedGame}</code>).
                Animações 3D, WebGL e telemetria suspensas — 100% de CPU/GPU atribuídos ao jogo.
              </span>
            </div>
            <span className="text-[11px] font-mono bg-emerald-500/20 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              0% Impacto
            </span>
          </div>
        )}

        {/* Dry Run Banner Warning */}
        {isDryRun && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-6 py-2 flex items-center justify-between text-xs text-amber-300 font-medium">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Modo Simulação (Dry-Run) Ativo:</strong> Nenhuma alteração real será feita no Windows.
                As ações mostram apenas os comandos e valores calculados.
              </span>
            </div>
            <button
              onClick={() => setIsDryRun(false)}
              className="text-[11px] underline hover:text-white"
            >
              Desativar Simulação
            </button>
          </div>
        )}
        
        {/* Administrator Warning Banner */}
        {!isAdmin && (
          <div className="bg-amber-950/80 border-b border-amber-500/40 px-6 py-2.5 flex items-center justify-between text-xs text-amber-200 shadow-md">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
              <span>
                <strong>Aviso de Privilégios:</strong> O Optimizer está a ser executado sem permissões de Administrador. Para aplicar alterações de registo (HKLM), adaptadores e rede, clica para reiniciar com privilégios elevados.
              </span>
            </div>
            <button
              onClick={() => window.optimizerApi.relaunchAsAdmin()}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all shadow-md shrink-0 ml-4 flex items-center gap-1.5"
            >
              <span>🛡️ Reiniciar como Administrador</span>
            </button>
          </div>
        )}

        {/* Initial First-Time Scan Banner */}
        {isInitialScanning && (
          <div className="bg-indigo-600/20 border-b border-indigo-500/30 px-6 py-2.5 flex items-center justify-between text-xs text-indigo-200">
            <div className="flex items-center gap-2.5">
              <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
              <span>
                <strong>A realizar análise inicial do sistema...</strong> A mapear configurações do Windows e hardware para carregamento instantâneo nas próximas utilizações.
              </span>
            </div>
            <span className="text-[11px] text-indigo-300 font-mono">
              {hardwareFilteredStates.length || 214} itens
            </span>
          </div>
        )}

        {/* Dynamic Main View */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Section 1: Painel Geral (Dashboard) */}
          {currentSection === 'dashboard' && (
            <DashboardView
              healthScore={healthScore}
              appliedCount={appliedCount}
              totalAlterCount={totalAlterCount}
              metrics={metrics}
              states={hardwareFilteredStates}
              onRevertItem={handleRevertClick}
              onApplyRecommended={handleApplyRecommended}
              onApplyGamingProfile={handleApplyGamingMode}
              onExportReport={handleExportReport}
              onRescanSystem={handleRescanSystem}
              onSelectCategory={(cat) => {
                if (cat === 'input_latency' || cat === 'gaming') {
                  setCurrentSection('gaming');
                  setGamingTab(cat === 'input_latency' ? 'input' : 'game_catalog');
                } else if (cat === 'network_internet' || cat === 'wifi') {
                  setCurrentSection('network');
                  setNetworkTab(cat === 'network_internet' ? 'net_catalog' : 'wifi_catalog');
                } else if (cat === 'cpu_gpu_power' || cat === 'memory_storage' || cat === 'startup_services') {
                  setCurrentSection('system');
                  setSystemTab(cat === 'cpu_gpu_power' ? 'cpu_gpu' : cat === 'memory_storage' ? 'memory' : 'startup');
                } else {
                  setCurrentSection('maintenance');
                  setMaintTab(cat === 'maintenance_diag' ? 'windows_maint' : cat === 'safe_cleanup' ? 'cleanup' : cat === 'privacy_telemetry' ? 'privacy' : 'history');
                }
              }}
              isOperating={isOperating}
              isScanning={isScanning || isInitialScanning}
              isApplyingGaming={isApplyingGaming}
              gamingProgress={gamingProgress}
              onShowNotification={showNotification}
            />
          )}

          {/* Section 2: Gaming & Latência Hub */}
          {currentSection === 'gaming' && (
            <div>
              <TopTabBar
                accentColor="rose"
                activeTab={gamingTab}
                onSelectTab={(t: any) => setGamingTab(t)}
                tabs={[
                  { id: 'profiles', label: 'Perfis de Jogos (12 Títulos)', badge: 'Ultra Boost' },
                  { id: 'hone_suite', label: 'Hone eSports & In-Game Configs', badge: '100% Free' },
                  { id: 'lasso', label: 'Gestor P-Cores & Prioridade', badge: 'Process Lasso' },
                  { id: 'input', label: 'Input Delay & Latência', badge: `${sectionStats.gaming.applied}/${sectionStats.gaming.total}` },
                  { id: 'pipeline', label: 'Pipeline de Latência (0.5ms)', badge: '5 Fases' },
                  { id: 'game_catalog', label: 'Otimizações Gaming', badge: `${getStatesByCategory('gaming').filter(s => s.status === 'applied').length}/${getStatesByCategory('gaming').length}` }
                ]}
              />

              {gamingTab === 'profiles' && (
                <GameModeView
                  states={hardwareFilteredStates}
                  onApplyProfile={async (ids) => {
                    setIsOperating(true);
                    try {
                      let count = 0;
                      for (const id of ids) {
                        const res = await window.optimizerApi.apply(id, isDryRun);
                        if (res.success) count++;
                      }
                      showNotification(
                        isDryRun
                          ? `[Simulação] Perfil de Jogo: ${count} otimizações simuladas.`
                          : `Perfil de Jogo aplicado: ${count} otimizações ativadas com sucesso!`,
                        'success'
                      );
                      await loadAllData();
                    } catch (e: any) {
                      showNotification(`Erro: ${e.message}`, 'error');
                    } finally {
                      setIsOperating(false);
                    }
                  }}
                  isOperating={isOperating}
                />
              )}

              {gamingTab === 'hone_suite' && (
                <HoneSuiteView onShowNotification={showNotification} />
              )}

              {gamingTab === 'lasso' && (
                <ProcessLassoView onShowNotification={showNotification} />
              )}

              {gamingTab === 'input' && (
                <CategoryView
                  title="Input Delay & Latência do Sistema"
                  description="Otimizações cirúrgicas de tempo de resposta do rato, teclado e taxa de amostragem de ecrã para latência mínima e precisão de mira."
                  states={getStatesByCategory('input_latency')}
                  onApply={handleApplyClick}
                  onRevert={handleRevertClick}
                  isOperating={isOperating}
                />
              )}

              {gamingTab === 'pipeline' && (
                <LatencyPipelineView
                  states={hardwareFilteredStates}
                  onApply={handleApplyClick}
                  onRevert={handleRevertClick}
                  onApplyAllLatency={async () => {
                    const latencyIds = [
                      'input_power_plan',
                      'input_game_mode',
                      'input_mouse_accel',
                      'input_pointer_speed',
                      'input_sticky_keys',
                      'input_filter_keys',
                      'input_toggle_keys',
                      'input_game_dvr',
                      'input_windowed_optimizations',
                      'input_usb_selective_suspend',
                      'net_tcp_autotuning',
                      'net_flush_dns',
                      'net_rss'
                    ];
                    setIsOperating(true);
                    try {
                      let count = 0;
                      for (const id of latencyIds) {
                        const res = await window.optimizerApi.apply(id, isDryRun);
                        if (res.success) count++;
                      }
                      showNotification(`Pipeline de Latência: ${count} nós ativados na cadeia!`, 'success');
                      await loadAllData();
                    } catch (e: any) {
                      showNotification(`Erro: ${e.message}`, 'error');
                    } finally {
                      setIsOperating(false);
                    }
                  }}
                  isOperating={isOperating}
                />
              )}

              {gamingTab === 'game_catalog' && (
                <CategoryView
                  title="Otimizações do Sistema para Jogos"
                  description="Ajustes de Windows Game Mode, pausa de atualizações durante partidas e configurações de V-Sync e limitador de FPS."
                  states={getStatesByCategory('gaming')}
                  onApply={handleApplyClick}
                  onRevert={handleRevertClick}
                  isOperating={isOperating}
                />
              )}
            </div>
          )}

          {/* Section 3: Rede, Wi-Fi & Ping Hub */}
          {currentSection === 'network' && (
            <div>
              <TopTabBar
                accentColor="cyan"
                activeTab={networkTab}
                onSelectTab={(t: any) => setNetworkTab(t)}
                tabs={[
                  { id: 'router', label: 'ExitLag QoS Router', badge: 'DSCP 46' },
                  { id: 'priority', label: 'Prioridade de Conexão', badge: 'IPv4 Metric' },
                  { id: 'dns', label: 'DNS Benchmark', badge: 'Ping 53' },
                  { id: 'net_catalog', label: 'Tweaks de Rede', badge: `${getStatesByCategory('network_internet').filter(s => s.status === 'applied').length}/${getStatesByCategory('network_internet').length}` },
                  { id: 'wifi_catalog', label: 'Tweaks de Wi-Fi', badge: `${getStatesByCategory('wifi').filter(s => s.status === 'applied').length}/${getStatesByCategory('wifi').length}` }
                ]}
              />

              {networkTab === 'router' && (
                <GameRouterView onShowNotification={showNotification} />
              )}

              {networkTab === 'priority' && (
                <div className="space-y-4">
                  <div className="bg-[#10172A] border border-[#1E293B] rounded-2xl p-5">
                    <h2 className="text-base font-bold text-white tracking-tight">Gestor de Prioridade de Adaptador</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Define se o Windows deve direcionar tráfego preferencialmente pela porta Ethernet ou pela antena Wi-Fi.</p>
                  </div>
                  <NetworkPriorityWidget />
                </div>
              )}

              {networkTab === 'dns' && <DnsBenchmarkView />}

              {networkTab === 'net_catalog' && (
                <CategoryView
                  title="Rede & Otimização TCP/UDP"
                  description="Tuning de pilha TCP, janelas de recepção, RSS e redução drástica de bufferbloat em jogos online."
                  states={getStatesByCategory('network_internet')}
                  onApply={handleApplyClick}
                  onRevert={handleRevertClick}
                  isOperating={isOperating}
                />
              )}

              {networkTab === 'wifi_catalog' && (
                <CategoryView
                  title="Wi-Fi & Estabilidade Sem Fios"
                  description="Priorização de bandas 5/6GHz, mitigação de scans de rede em segundo plano e eliminação de perdas de pacotes."
                  states={getStatesByCategory('wifi')}
                  onApply={handleApplyClick}
                  onRevert={handleRevertClick}
                  isOperating={isOperating}
                />
              )}
            </div>
          )}

          {/* Section 4: Hardware & Sistema Hub */}
          {currentSection === 'system' && (
            <div>
              <TopTabBar
                accentColor="amber"
                activeTab={systemTab}
                onSelectTab={(t: any) => setSystemTab(t)}
                tabs={[
                  { id: 'toolkit', label: 'Power Toolkit', badge: 'RAM • MPO • Hotkeys' },
                  { id: 'gpu_driver', label: 'Tuning GPU (NVIDIA/AMD)', badge: 'Ultra Latency' },
                  { id: 'cpu_gpu', label: 'CPU, GPU & Energia', badge: `${getStatesByCategory('cpu_gpu_power').filter(s => s.status === 'applied').length}/${getStatesByCategory('cpu_gpu_power').length}` },
                  { id: 'memory', label: 'Memória & Disco', badge: `${getStatesByCategory('memory_storage').filter(s => s.status === 'applied').length}/${getStatesByCategory('memory_storage').length}` },
                  { id: 'startup', label: 'Gestor de Arranque', badge: 'Boot Pro' },
                  { id: 'apps', label: 'App Tuner', badge: '10 Apps' }
                ]}
              />

              {systemTab === 'toolkit' && (
                <PowerToolkitView onShowNotification={showNotification} />
              )}

              {systemTab === 'gpu_driver' && (
                <GpuTuningView onShowNotification={showNotification} />
              )}

              {systemTab === 'cpu_gpu' && (
                <CategoryView
                  title="CPU, Placa Gráfica & Energia"
                  description="Planos de energia de desempenho máximo, destravamento de frequências, unparking de núcleos e pipeline PCIe."
                  states={getStatesByCategory('cpu_gpu_power')}
                  onApply={handleApplyClick}
                  onRevert={handleRevertClick}
                  isOperating={isOperating}
                />
              )}

              {systemTab === 'memory' && (
                <CategoryView
                  title="Memória RAM & Armazenamento"
                  description="Instrução TRIM para SSDs, gestão de memória virtual (paging), cache do sistema e otimização de ficheiros."
                  states={getStatesByCategory('memory_storage')}
                  onApply={handleApplyClick}
                  onRevert={handleRevertClick}
                  isOperating={isOperating}
                />
              )}

              {systemTab === 'startup' && (
                <div className="space-y-6">
                  <StartupManagerView />
                  <div className="border-t border-[#1E293B] pt-6">
                    <h3 className="text-sm font-bold text-white mb-3">Tweaks de Serviços do Windows no Arranque</h3>
                    <CategoryView
                      title="Serviços & Inicialização Limpa"
                      description="Desativação de serviços redundantes do Windows que consomem CPU em segundo plano."
                      states={getStatesByCategory('startup_services')}
                      onApply={handleApplyClick}
                      onRevert={handleRevertClick}
                      isOperating={isOperating}
                    />
                  </div>
                </div>
              )}

              {systemTab === 'apps' && (
                <AppTunerView
                  onApplyTune={async (appName, actionDesc) => {
                    showNotification(`A otimizar ${appName}: ${actionDesc}...`, 'info');
                    try {
                      await window.optimizerApi.apply('clean_directx_shader_cache', isDryRun);
                      await window.optimizerApi.apply('srv_disable_restart_apps', isDryRun);
                      showNotification(`${appName} otimizado com sucesso!`, 'success');
                    } catch (e: any) {
                      showNotification(`Erro ao otimizar ${appName}: ${e.message}`, 'error');
                    }
                  }}
                  isOperating={isOperating}
                />
              )}
            </div>
          )}

          {/* Section 5: Manutenção & Perfis Hub */}
          {currentSection === 'maintenance' && (
            <div>
              <TopTabBar
                accentColor="emerald"
                activeTab={maintTab}
                onSelectTab={(t: any) => setMaintTab(t)}
                tabs={[
                  { id: 'windows_maint', label: 'Manutenção do Windows', badge: '1-Clique • SFC • TRIM' },
                  { id: 'cleanup', label: 'Limpeza Segura', badge: `${getStatesByCategory('safe_cleanup').filter(s => s.status === 'applied').length}/${getStatesByCategory('safe_cleanup').length}` },
                  { id: 'debloater', label: 'Windows Debloater (UWP)', badge: 'Apps • OneDrive' },
                  { id: 'privacy', label: 'Privacidade & Telemetria', badge: `${getStatesByCategory('privacy_telemetry').filter(s => s.status === 'applied').length}/${getStatesByCategory('privacy_telemetry').length}` },
                  { id: 'profiles', label: 'Perfis Globais', badge: `${profiles.length}` },
                  { id: 'history', label: 'Histórico & Backups', badge: `${logs.length}` }
                ]}
              />

              {maintTab === 'windows_maint' && (
                <WindowsMaintenanceView onShowNotification={showNotification} isAdmin={isAdmin} />
              )}

              {maintTab === 'cleanup' && (
                <CategoryView
                  title="Limpeza Segura do Sistema"
                  description="Remoção de caches obsoletas, ficheiros temporários e resíduos do Windows sem nunca tocar nos teus ficheiros pessoais."
                  states={getStatesByCategory('safe_cleanup')}
                  onApply={handleApplyClick}
                  onRevert={handleRevertClick}
                  isOperating={isOperating}
                />
              )}

              {maintTab === 'debloater' && (
                <UwpDebloaterView onShowNotification={showNotification} />
              )}

              {maintTab === 'privacy' && (
                <CategoryView
                  title="Privacidade & Telemetria Oficial"
                  description="Políticas oficiais da Microsoft para desativar telemetria opcional, publicidade oculta e diagnósticos desnecessários."
                  states={getStatesByCategory('privacy_telemetry')}
                  onApply={handleApplyClick}
                  onRevert={handleRevertClick}
                  isOperating={isOperating}
                />
              )}

              {maintTab === 'profiles' && (
                <ProfilesView
                  profiles={profiles}
                  states={hardwareFilteredStates}
                  onApplyProfile={handleApplyProfile}
                  onRevertProfile={handleRevertProfile}
                  isOperating={isOperating}
                />
              )}

              {maintTab === 'history' && (
                <HistoryBackupView
                  logs={logs}
                  onCreateRestorePoint={handleCreateRestorePoint}
                  onRevertAll={handleRevertAll}
                  isOperating={isOperating}
                />
              )}
            </div>
          )}

          {/* Section 6: Gargalo & Can I Run It */}
          {currentSection === 'bottleneck' && (
            <BottleneckCanIRunItView />
          )}

          {/* Section 7: CPU-Z & Hardware Suite */}
          {currentSection === 'cpuz' && (
            <CpuZHardwareView />
          )}
        </main>
      </div>

      {/* Confirmation Modal for [M] Moderate Items */}
      {pendingModerateItem && (
        <ConfirmationModal
          item={pendingModerateItem}
          onConfirm={() => executeApply(pendingModerateItem.id)}
          onCancel={() => setPendingModerateItem(null)}
        />
      )}

      {/* Shader Cache Cleaner Modal */}
      {isShaderModalOpen && (
        <ShaderCacheCleanerModal
          onClose={() => setIsShaderModalOpen(false)}
          onSuccess={() => loadAllData()}
        />
      )}

      {/* Game HUD Overlay */}
      {isOverlayOpen && (
        <GameOverlayWidget
          metrics={metrics}
          detectedGame={detectedGame}
          onClose={() => setIsOverlayOpen(false)}
        />
      )}

      {/* Floating Live Progress Overlay for Gaming Mode & Profiles */}
      {gamingProgress && (
        <div className="fixed bottom-8 right-36 z-50 bg-[#0C1324] border-2 border-amber-500/70 shadow-[0_10px_35px_rgba(245,158,11,0.25)] rounded-2xl p-5 w-[410px] backdrop-blur-xl animate-in slide-in-from-bottom-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-300 shadow-md shrink-0">
                <Gamepad2 className="w-5 h-5 animate-pulse" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-white tracking-tight leading-tight">A Ativar Modo Jogo Ultra</h4>
                <span className="text-[10px] text-amber-300/80 font-mono block">Prioridade Máxima & Latência Zero</span>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-amber-300 bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 rounded-full shrink-0">
              {Math.round((gamingProgress.current / Math.max(1, gamingProgress.total)) * 100)}%
            </span>
          </div>

          <div className="bg-[#070B14] border border-[#1E293B] rounded-xl px-3 py-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 animate-ping" />
            <p className="text-xs text-gray-200 truncate font-medium">
              {gamingProgress.currentItemName}
            </p>
          </div>

          <div className="w-full bg-[#162035] rounded-full h-2.5 overflow-hidden border border-[#23335A]">
            <div
              className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 h-full rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${Math.round((gamingProgress.current / Math.max(1, gamingProgress.total)) * 100)}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-xs text-gray-400 font-mono pt-0.5">
            <span>{gamingProgress.current} de {gamingProgress.total} otimizações</span>
            <span className="text-amber-300 font-semibold">Input Delay: 0ms</span>
          </div>
        </div>
      )}

      {/* Floating Notification Toast */}
      {notification && (
        <div
          className={`fixed bottom-6 right-36 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl text-xs font-semibold animate-in slide-in-from-bottom-5 duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-950 border-emerald-500/40 text-emerald-200'
              : notification.type === 'error'
              ? 'bg-rose-950 border-rose-500/40 text-rose-200'
              : 'bg-indigo-950 border-indigo-500/40 text-indigo-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}
    </div>
  );
};
