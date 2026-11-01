import React, { useState, useEffect } from 'react';
import {
  Settings,
  X,
  Palette,
  Globe,
  Info,
  Check,
  RotateCcw,
  ExternalLink,
  Sparkles,
  Keyboard,
  Ghost,
  MousePointer,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Gauge,
  Radio,
  Cpu,
  Activity,
  Move,
  Layers,
  Sliders,
  BarChart2,
  Crosshair,
  Monitor,
  Play,
  Square,
  Power,
  Download,
  Trash2,
  TrendingUp,
  History,
  Crown,
  ShieldCheck,
  Key,
  Gamepad2
} from 'lucide-react';
import { useI18n, ACCENT_COLORS, ThemeAccent, Language } from '../i18n';
import { OverlayConfig, OverlayItemsConfig, OverlayFormat, OverlayTheme, BenchmarkSession, GsyncCapResult, StartupConfig, LicenseStatus } from '../../shared/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'appearance' | 'overlay' | 'gsync' | 'benchmark' | 'hotkeys' | 'language' | 'pro' | 'about';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, initialTab = 'appearance' }) => {
  const { language, setLanguage, accent, setAccent, t } = useI18n();
  const [activeTab, setActiveTab] = useState<'appearance' | 'overlay' | 'gsync' | 'benchmark' | 'hotkeys' | 'language' | 'pro' | 'about'>(initialTab);

  const [hotkeys, setHotkeys] = useState<any[]>([]);
  const [isGhostActive, setIsGhostActive] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isFullscreenOptimized, setIsFullscreenOptimized] = useState<boolean>(true);
  const [isOptimizingFullscreen, setIsOptimizingFullscreen] = useState<boolean>(false);

  // G-Sync & FreeSync State
  const [monitorHz, setMonitorHz] = useState<number>(144);
  const [recommendedCap, setRecommendedCap] = useState<number>(141);
  const [isApplyingGsync, setIsApplyingGsync] = useState<boolean>(false);

  // Benchmark State
  const [benchStatus, setBenchStatus] = useState<{ isRecording: boolean; elapsedSeconds: number; sampleCount: number; lastSession: BenchmarkSession | null }>({
    isRecording: false,
    elapsedSeconds: 0,
    sampleCount: 0,
    lastSession: null
  });
  const [benchHistory, setBenchHistory] = useState<BenchmarkSession[]>([]);

  // PRO License State
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus>({ isPro: false, plan: 'Free' });
  const [licenseKeyInput, setLicenseKeyInput] = useState<string>('');
  const [isActivatingLicense, setIsActivatingLicense] = useState<boolean>(false);

  // Windows Startup & Silent Mode State
  const [startupConfig, setStartupConfig] = useState<StartupConfig>({ enabled: false, isSilent: true });
  const [isSavingStartup, setIsSavingStartup] = useState<boolean>(false);

  const [overlayConfig, setOverlayConfig] = useState<OverlayConfig>({
    items: {
      showTimer: true,
      showGameName: true,
      showFps: true,
      showPing: true,
      showCpu: true,
      showGpu: true,
      showRam: true,
      showControls: true
    },
    format: 'horizontal',
    theme: 'dark-gamer',
    fontSize: 'compact',
    opacity: 95
  });

  useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      try {
        if (window.optimizerApi?.hotkeysGetList) {
          const list = await window.optimizerApi.hotkeysGetList();
          if (list) setHotkeys(list);
        }
        if (window.optimizerApi?.overlayGetStatus) {
          const status = await window.optimizerApi.overlayGetStatus();
          if (status && typeof status.isClickThrough === 'boolean') {
            setIsGhostActive(status.isClickThrough);
          }
        }
        if (window.optimizerApi?.overlayGetConfig) {
          const cfg = await window.optimizerApi.overlayGetConfig();
          if (cfg) setOverlayConfig(cfg);
        }
        if (window.optimizerApi?.overlayGetFullscreenSupport) {
          const fsRes = await window.optimizerApi.overlayGetFullscreenSupport();
          if (fsRes) setIsFullscreenOptimized(fsRes.enabled);
        }
        if (window.optimizerApi?.fpsGetLive) {
          const fpsData = await window.optimizerApi.fpsGetLive();
          if (fpsData && fpsData.refreshRate) {
            setMonitorHz(fpsData.refreshRate);
            if (window.optimizerApi?.gsyncCalculateCap) {
              const cap = await window.optimizerApi.gsyncCalculateCap(fpsData.refreshRate);
              setRecommendedCap(cap);
            }
          }
        }
        if (window.optimizerApi?.benchmarkGetStatus) {
          const bStatus = await window.optimizerApi.benchmarkGetStatus();
          if (bStatus) setBenchStatus(bStatus as any);
        }
        if (window.optimizerApi?.benchmarkGetHistory) {
          const hist = await window.optimizerApi.benchmarkGetHistory();
          if (hist) setBenchHistory(hist);
        }
        if (window.optimizerApi?.startupGetStatus) {
          const st = await window.optimizerApi.startupGetStatus();
          if (st) setStartupConfig(st);
        }
        if (window.optimizerApi?.licenseGetStatus) {
          const lic = await window.optimizerApi.licenseGetStatus();
          if (lic) setLicenseStatus(lic);
        }
      } catch {}
    };

    loadData();

    let unsubGhost: (() => void) | undefined;
    if (window.optimizerApi?.onOverlayGhostChanged) {
      unsubGhost = window.optimizerApi.onOverlayGhostChanged((isClickThrough) => {
        setIsGhostActive(isClickThrough);
      });
    }

    let unsubOverlayConfig: (() => void) | undefined;
    if (window.optimizerApi?.onOverlayConfigChanged) {
      unsubOverlayConfig = window.optimizerApi.onOverlayConfigChanged((cfg) => {
        setOverlayConfig(cfg);
      });
    }

    let unsubBench: (() => void) | undefined;
    if (window.optimizerApi?.onBenchmarkStatusChanged) {
      unsubBench = window.optimizerApi.onBenchmarkStatusChanged((st) => {
        setBenchStatus((prev) => ({
          ...prev,
          isRecording: st.isRecording,
          elapsedSeconds: st.elapsedSeconds
        }));
      });
    }

    return () => {
      unsubGhost?.();
      unsubOverlayConfig?.();
      unsubBench?.();
    };
  }, [isOpen]);

  // Clear feedback after 4 seconds
  useEffect(() => {
    if (!feedbackMsg) return;
    const timer = setTimeout(() => setFeedbackMsg(null), 4000);
    return () => clearTimeout(timer);
  }, [feedbackMsg]);

  if (!isOpen) return null;

  const handleResetDefaults = () => {
    setAccent('indigo');
    setLanguage('pt');
  };

  const handleDeactivateGhostNow = async () => {
    try {
      if (window.optimizerApi?.overlaySetClickThrough) {
        await window.optimizerApi.overlaySetClickThrough(false);
        setIsGhostActive(false);
        setFeedbackMsg({
          text: '✅ Modo Fantasma desativado! O rato voltou ao normal e o HUD é clicável.',
          type: 'success'
        });
      }
    } catch {
      setFeedbackMsg({ text: 'Erro ao desativar Modo Fantasma.', type: 'error' });
    }
  };

  const handleToggleGhost = async () => {
    try {
      if (window.optimizerApi?.overlayToggleGhost) {
        const res = await window.optimizerApi.overlayToggleGhost();
        setIsGhostActive(res.isClickThrough);
        setFeedbackMsg({
          text: res.isClickThrough
            ? '👻 Modo Fantasma ativado: os cliques passam para o jogo.'
            : '🖱️ Modo Fantasma desativado: controlo do rato restaurado.',
          type: 'success'
        });
      }
    } catch {}
  };

  const handleHotkeyChange = async (actionId: string, newAccelerator: string) => {
    try {
      if (window.optimizerApi?.hotkeyUpdate) {
        const res = await window.optimizerApi.hotkeyUpdate(actionId, newAccelerator);
        if (res.success) {
          const updated = await window.optimizerApi.hotkeysGetList();
          setHotkeys(updated);
          setFeedbackMsg({ text: 'Combinação de teclas atualizada e ativa!', type: 'success' });
        } else {
          setFeedbackMsg({ text: res.message || 'Erro ao registar atalho.', type: 'error' });
        }
      }
    } catch {
      setFeedbackMsg({ text: 'Falha na comunicação com o sistema.', type: 'error' });
    }
  };

  const handleResetHotkeys = async () => {
    try {
      if (window.optimizerApi?.hotkeysResetDefaults) {
        await window.optimizerApi.hotkeysResetDefaults();
        const updated = await window.optimizerApi.hotkeysGetList();
        setHotkeys(updated);
        setFeedbackMsg({ text: 'Atalhos restaurados para os valores padrão originais.', type: 'success' });
      }
    } catch {}
  };

  const handleToggleOverlayItem = async (key: keyof OverlayItemsConfig) => {
    const updatedItems = {
      ...overlayConfig.items,
      [key]: !overlayConfig.items[key]
    };
    const nextConfig = { ...overlayConfig, items: updatedItems };
    setOverlayConfig(nextConfig);
    if (window.optimizerApi?.overlayUpdateConfig) {
      await window.optimizerApi.overlayUpdateConfig({ items: updatedItems });
      setFeedbackMsg({ text: 'Métrica do Overlay atualizada no HUD!', type: 'success' });
    }
  };

  const handleEnableFullscreenSupport = async () => {
    setIsOptimizingFullscreen(true);
    try {
      if (window.optimizerApi?.overlayEnableFullscreenSupport) {
        const res = await window.optimizerApi.overlayEnableFullscreenSupport();
        if (res.success) {
          setIsFullscreenOptimized(true);
          setFeedbackMsg({ text: res.message, type: 'success' });
        } else {
          setFeedbackMsg({ text: res.message, type: 'error' });
        }
      }
    } catch {
      setFeedbackMsg({ text: 'Erro ao ativar suporte a tela cheia.', type: 'error' });
    } finally {
      setIsOptimizingFullscreen(false);
    }
  };

  const handleApplyGsync = async () => {
    setIsApplyingGsync(true);
    try {
      if (window.optimizerApi?.gsyncApplyCap) {
        const res = await window.optimizerApi.gsyncApplyCap(recommendedCap, monitorHz);
        if (res.success) {
          setFeedbackMsg({ text: res.message, type: 'success' });
        } else {
          setFeedbackMsg({ text: res.message, type: 'error' });
        }
      }
    } catch {
      setFeedbackMsg({ text: 'Erro ao aplicar teto G-Sync.', type: 'error' });
    } finally {
      setIsApplyingGsync(false);
    }
  };

  const handleToggleBenchmarkSession = async () => {
    try {
      if (window.optimizerApi?.benchmarkToggle) {
        const res = await window.optimizerApi.benchmarkToggle();
        if (res) {
          setFeedbackMsg({ text: res.message, type: 'success' });
          if (window.optimizerApi?.benchmarkGetStatus) {
            const updated = await window.optimizerApi.benchmarkGetStatus();
            if (updated) setBenchStatus(updated as any);
          }
          if (window.optimizerApi?.benchmarkGetHistory) {
            const hist = await window.optimizerApi.benchmarkGetHistory();
            if (hist) setBenchHistory(hist);
          }
        }
      }
    } catch {
      setFeedbackMsg({ text: 'Erro ao alternar benchmark.', type: 'error' });
    }
  };

  const handleClearHistory = async () => {
    try {
      if (window.optimizerApi?.benchmarkClearHistory) {
        await window.optimizerApi.benchmarkClearHistory();
        setBenchHistory([]);
        setFeedbackMsg({ text: 'Histórico de benchmarks limpo com sucesso.', type: 'success' });
      }
    } catch {
      setFeedbackMsg({ text: 'Erro ao limpar histórico.', type: 'error' });
    }
  };

  const handleExportCsv = async () => {
    try {
      if (window.optimizerApi?.benchmarkExportCsv) {
        const res = await window.optimizerApi.benchmarkExportCsv();
        if (res.success) {
          setFeedbackMsg({
            text: res.filePath ? `Relatório exportado para o Desktop: ${res.filePath.split('\\').pop()}` : 'Relatório CSV exportado com sucesso!',
            type: 'success'
          });
        }
      }
    } catch {
      setFeedbackMsg({ text: 'Erro ao exportar relatório CSV.', type: 'error' });
    }
  };

  const handleActivateLicense = async () => {
    if (!licenseKeyInput.trim()) {
      setFeedbackMsg({ text: 'Por favor, insere a tua chave de licença.', type: 'error' });
      return;
    }
    setIsActivatingLicense(true);
    try {
      if (window.optimizerApi?.licenseActivate) {
        const res = await window.optimizerApi.licenseActivate(licenseKeyInput.trim());
        if (res.success) {
          setLicenseStatus({
            isPro: true,
            plan: 'PRO',
            licenseKey: licenseKeyInput.trim().toUpperCase(),
            activatedAt: new Date().toLocaleDateString()
          });
          setFeedbackMsg({ text: res.message, type: 'success' });
          setLicenseKeyInput('');
        } else {
          setFeedbackMsg({ text: res.message, type: 'error' });
        }
      }
    } catch {
      setFeedbackMsg({ text: 'Falha na validação da licença.', type: 'error' });
    } finally {
      setIsActivatingLicense(false);
    }
  };

  const handleDeactivateLicense = async () => {
    try {
      if (window.optimizerApi?.licenseDeactivate) {
        const res = await window.optimizerApi.licenseDeactivate();
        if (res.success) {
          setLicenseStatus({ isPro: false, plan: 'Free' });
          setFeedbackMsg({ text: res.message, type: 'success' });
        }
      }
    } catch {
      setFeedbackMsg({ text: 'Erro ao desativar licença.', type: 'error' });
    }
  };

  const handleToggleStartup = async (nextEnabled: boolean) => {
    setIsSavingStartup(true);
    try {
      if (window.optimizerApi?.startupSetStatus) {
        const res = await window.optimizerApi.startupSetStatus(nextEnabled, true);
        if (res.success) {
          setStartupConfig({ enabled: nextEnabled, isSilent: true });
          setFeedbackMsg({ text: res.message, type: 'success' });
        } else {
          setFeedbackMsg({ text: res.message, type: 'error' });
        }
      }
    } catch {
      setFeedbackMsg({ text: 'Erro ao configurar arranque.', type: 'error' });
    } finally {
      setIsSavingStartup(false);
    }
  };

  const handleSetOverlayFormat = async (format: OverlayFormat) => {
    const nextConfig = { ...overlayConfig, format };
    setOverlayConfig(nextConfig);
    if (window.optimizerApi?.overlayUpdateConfig) {
      await window.optimizerApi.overlayUpdateConfig({ format });
      setFeedbackMsg({
        text: `Formato alterado para: ${
          format === 'horizontal'
            ? 'Barra Horizontal'
            : format === 'vertical'
            ? 'Widget Vertical'
            : 'Minimalista'
        }`,
        type: 'success'
      });
    }
  };

  const handleSetOverlayTheme = async (theme: OverlayTheme) => {
    const nextConfig = { ...overlayConfig, theme };
    setOverlayConfig(nextConfig);
    if (window.optimizerApi?.overlayUpdateConfig) {
      await window.optimizerApi.overlayUpdateConfig({ theme });
      setFeedbackMsg({ text: 'Tema visual do Overlay atualizado!', type: 'success' });
    }
  };

  const handleResetOverlayConfig = async () => {
    if (window.optimizerApi?.overlayResetConfig) {
      const def = await window.optimizerApi.overlayResetConfig();
      setOverlayConfig(def);
      setFeedbackMsg({ text: 'Configuração do Overlay reposta para os valores de fábrica.', type: 'success' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#0B101D] border border-[#232F4D] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#12192B] to-[#18233C] px-6 py-4 border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1A253F] border border-[#2B3B66] flex items-center justify-center text-indigo-400 shadow-inner">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                {t('settings.title')}
              </h3>
              <p className="text-xs text-gray-400">
                {t('settings.desc')}
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

        {/* Feedback Alert Toast */}
        {feedbackMsg && (
          <div
            className={`px-6 py-2.5 text-xs font-semibold flex items-center gap-2 border-b transition-all ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Sub-tabs Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-[#1E293B] bg-[#0E1526]/60 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'appearance'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>{t('settings.tab_appearance')}</span>
          </button>
          <button
            onClick={() => setActiveTab('overlay')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'overlay'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>{t('settings.tab_overlay')}</span>
          </button>
          <button
            onClick={() => setActiveTab('gsync')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'gsync'
                ? 'border-cyan-400 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
            <span>{t('settings.tab_gsync')}</span>
          </button>
          <button
            onClick={() => setActiveTab('benchmark')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'benchmark'
                ? 'border-rose-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5 text-rose-400" />
            <span>{t('settings.tab_benchmark')}</span>
          </button>
          <button
            onClick={() => setActiveTab('hotkeys')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'hotkeys'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>{t('settings.tab_hotkeys')}</span>
          </button>
          <button
            onClick={() => setActiveTab('language')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'language'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{t('settings.tab_language')}</span>
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'about'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>Arranque & Sobre</span>
          </button>
          <button
            onClick={() => setActiveTab('pro')}
            className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'pro'
                ? 'border-amber-400 text-amber-300'
                : 'border-transparent text-amber-400/80 hover:text-amber-300'
            }`}
          >
            <Crown className={`w-3.5 h-3.5 ${licenseStatus.isPro ? 'fill-amber-400 text-amber-400' : 'text-amber-400'}`} />
            <span>{licenseStatus.isPro ? '👑 PRO Ativo' : '👑 Licença PRO'}</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* TAB 1: APPEARANCE & ACCENT COLOR */}
          {activeTab === 'appearance' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Palette className="w-4 h-4 text-indigo-400" />
                  {t('settings.accent_color')}
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  {t('settings.accent_color_desc')}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {ACCENT_COLORS.map((col) => {
                  const isSelected = accent === col.id;
                  const nameLabel =
                    language === 'en' ? col.nameEn : language === 'es' ? col.nameEs : col.name;

                  return (
                    <button
                      key={col.id}
                      onClick={() => setAccent(col.id)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-[#151E33] border-indigo-500/80 shadow-md ring-1 ring-indigo-500/30'
                          : 'bg-[#0E1526] border-[#1E293B] hover:border-[#2C3B63] hover:bg-[#131C32]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 rounded-lg ${col.previewClass} shadow-md flex items-center justify-center shrink-0`}
                          style={{ backgroundColor: col.hex }}
                        >
                          {isSelected && <Check className="w-4 h-4 text-white drop-shadow" />}
                        </div>
                        <div>
                          <span className="text-xs font-bold text-white block leading-tight">
                            {nameLabel}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400 block mt-0.5">
                            {col.hex.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          Ativo
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Live Preview Box */}
              <div className="bg-[#0E1526] border border-[#1E293B] rounded-xl p-4 mt-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                  Pré-visualização do Tema
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm transition-all"
                    style={{ backgroundColor: ACCENT_COLORS.find((c) => c.id === accent)?.hex }}
                  >
                    Botão Ativo
                  </button>
                  <span
                    className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold border"
                    style={{
                      borderColor: ACCENT_COLORS.find((c) => c.id === accent)?.hex,
                      color: ACCENT_COLORS.find((c) => c.id === accent)?.hex
                    }}
                  >
                    Badge {accent.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-300 flex items-center gap-1.5 ml-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full animate-ping"
                      style={{ backgroundColor: ACCENT_COLORS.find((c) => c.id === accent)?.hex }}
                    />
                    Indicador em tempo real
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB: OVERLAY HUD CUSTOMIZATION */}
          {activeTab === 'overlay' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-indigo-400" />
                    {t('settings.overlay_title')}
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t('settings.overlay_desc')}
                  </p>
                </div>
                <button
                  onClick={handleResetOverlayConfig}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
                  title="Repor definições originais do overlay"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Repor</span>
                </button>
              </div>

              {/* Fullscreen Mode Optimization Card (DirectFlip MPO + Occlusion Bypass) */}
              <div className="bg-gradient-to-r from-emerald-950/40 via-cyan-950/20 to-black/60 border border-emerald-500/30 rounded-2xl p-4 space-y-3 shadow-lg">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-white font-bold text-xs">
                          Compatibilidade com Jogos em Tela Cheia
                        </strong>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                            isFullscreenOptimized
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          }`}
                        >
                          {isFullscreenOptimized ? 'DirectFlip Ativo (0ms Lag)' : 'Otimização Pendente'}
                        </span>
                      </div>
                      <p className="text-gray-300 text-[11px] leading-relaxed">
                        O Optimizer usa <strong>DirectFlip MPO por hardware</strong> e desativação da oclusão do Chromium para manter o HUD desenhado sobre jogos em <strong>Tela Cheia (Fullscreen)</strong> com taxa máxima de atualização e zero perda de FPS.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleEnableFullscreenSupport}
                    disabled={isOptimizingFullscreen}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 shadow-sm ${
                      isFullscreenOptimized
                        ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold'
                    } ${isOptimizingFullscreen ? 'opacity-50 cursor-wait' : ''}`}
                    title="Configura o registo do Windows para permitir overlays em Tela Cheia via DirectFlip"
                  >
                    {isOptimizingFullscreen ? (
                      <span>A ativar...</span>
                    ) : isFullscreenOptimized ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Otimizado ✅</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        <span>Ativar 1-Clique</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Ghost className="w-3.5 h-3.5 text-amber-400" />
                    Pressiona <strong className="text-white font-mono bg-white/10 px-1 py-0.5 rounded">Alt+G</strong> para os cliques do rato atravessarem diretamente para o jogo.
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono">
                    Atalho Overlay: Alt+O
                  </span>
                </div>
              </div>

              {/* Drag and Drop Memo Card */}
              <div className="bg-[#0E1526] border border-[#1E293B] rounded-2xl p-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 shrink-0">
                    <Move className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white text-xs block">Posicionamento Livre & Drag & Drop</strong>
                    <span className="text-gray-400 text-[11px] leading-tight block">
                      Arrasta o HUD diretamente com o rato para qualquer ponto do ecrã. As coordenadas (X, Y) são memorizadas automaticamente.
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-1 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold shrink-0">
                  Memória Ativa ✓
                </span>
              </div>

              {/* Real-time Mini Preview */}
              <div className="bg-[#080D1A] border border-[#1E293B] rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Pré-visualização em Tempo Real ({overlayConfig.format})
                  </span>
                  <span className="text-gray-500 font-mono">
                    Tema: {overlayConfig.theme}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/60 border border-white/5 flex items-center justify-center min-h-[58px]">
                  {/* Horizontal Preview */}
                  {overlayConfig.format === 'horizontal' && (
                    <div
                      className={`rounded-xl px-3 py-1 flex items-center gap-2 text-xs font-mono font-bold select-none border transition-all ${
                        overlayConfig.theme === 'glass'
                          ? 'bg-black/35 backdrop-blur-md border-white/20 text-white'
                          : overlayConfig.theme === 'pure-black'
                          ? 'bg-[#05070D] border-gray-800 text-white'
                          : 'bg-[#080D18]/95 border-amber-500/50 text-white shadow-md'
                      }`}
                    >
                      {overlayConfig.items.showTimer && (
                        <div className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          <span>0.500ms</span>
                        </div>
                      )}
                      {overlayConfig.items.showGameName && (
                        <span className="text-[10px] uppercase text-amber-300 bg-amber-500/15 px-1.5 py-0.5 rounded border border-amber-500/30 font-extrabold">
                          VALORANT
                        </span>
                      )}
                      {overlayConfig.items.showFps && (
                        <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-extrabold">
                          <Gauge className="w-3 h-3 text-emerald-400" />
                          <span>144 <span className="text-[9px] opacity-75">FPS</span></span>
                          <span className="text-[9px] text-gray-300 font-normal">(1%: 110)</span>
                          <span className="text-[9px] text-cyan-300 font-mono">6.9ms</span>
                        </div>
                      )}
                      {overlayConfig.items.showPing && (
                        <span className="text-cyan-300 flex items-center gap-1">
                          <Radio className="w-3 h-3 text-cyan-400" />
                          12<span className="text-[9px] font-normal">ms</span>
                        </span>
                      )}
                      {overlayConfig.items.showCpu && (
                        <span className="text-indigo-300 flex items-center gap-1">
                          <Cpu className="w-3 h-3 text-indigo-400" />
                          18%
                        </span>
                      )}
                      {overlayConfig.items.showGpu && (
                        <span className="text-amber-300 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-400" />
                          48°
                        </span>
                      )}
                      {overlayConfig.items.showRam && (
                        <span className="text-purple-300 flex items-center gap-1">
                          <Activity className="w-3 h-3 text-purple-400" />
                          5.4G
                        </span>
                      )}
                      {overlayConfig.items.showControls && (
                        <div className="flex items-center gap-1 text-gray-400 border-l border-white/10 pl-1.5">
                          <Ghost className="w-3 h-3 text-amber-400" />
                          <Move className="w-3 h-3 text-gray-400" />
                          <X className="w-3 h-3 text-gray-400" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Vertical Preview */}
                  {overlayConfig.format === 'vertical' && (
                    <div
                      className={`w-44 rounded-xl p-2.5 flex flex-col gap-1.5 text-xs font-mono font-bold select-none border transition-all ${
                        overlayConfig.theme === 'glass'
                          ? 'bg-black/35 backdrop-blur-md border-white/20 text-white'
                          : overlayConfig.theme === 'pure-black'
                          ? 'bg-[#05070D] border-gray-800 text-white'
                          : 'bg-[#080D18]/95 border-amber-500/50 text-white shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-1 border-b border-white/10 text-[9px] text-gray-300">
                        <span className="text-emerald-400 font-bold">OPTIMIZER HUD</span>
                        {overlayConfig.items.showControls && <Ghost className="w-3 h-3 text-amber-400" />}
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        {overlayConfig.items.showTimer && <span className="text-emerald-300">0.500ms</span>}
                        {overlayConfig.items.showGameName && <span className="text-amber-300">VALORANT</span>}
                      </div>
                      {overlayConfig.items.showFps && (
                        <div className="p-1 rounded bg-black/40 border border-emerald-500/30 text-emerald-400 flex items-center justify-between text-xs">
                          <span>144 FPS</span>
                          <span className="text-[9px] text-gray-400 font-normal">6.9ms</span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-1 text-[10px]">
                        {overlayConfig.items.showPing && <span className="text-cyan-300">📶 12ms</span>}
                        {overlayConfig.items.showCpu && <span className="text-indigo-300">💻 18%</span>}
                        {overlayConfig.items.showGpu && <span className="text-amber-300">🔥 48°</span>}
                        {overlayConfig.items.showRam && <span className="text-purple-300">🧠 5.4G</span>}
                      </div>
                    </div>
                  )}

                  {/* Minimal Preview */}
                  {overlayConfig.format === 'minimal' && (
                    <div
                      className={`rounded-lg px-2.5 py-1 flex items-center gap-2.5 text-xs font-mono font-bold select-none border transition-all ${
                        overlayConfig.theme === 'glass'
                          ? 'bg-black/35 backdrop-blur-md border-white/20 text-white'
                          : overlayConfig.theme === 'pure-black'
                          ? 'bg-[#05070D] border-gray-800 text-white'
                          : 'bg-[#080D18]/95 border-amber-500/50 text-white shadow-md'
                      }`}
                    >
                      {overlayConfig.items.showTimer && <span className="text-emerald-400 text-[10px]">0.500ms</span>}
                      {overlayConfig.items.showFps && <span className="text-emerald-400">144 FPS</span>}
                      {overlayConfig.items.showPing && <span className="text-cyan-300">12ms</span>}
                      {overlayConfig.items.showCpu && <span className="text-indigo-300">18%</span>}
                      {overlayConfig.items.showGpu && <span className="text-amber-300">48°</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 1: Format Selector */}
              <div>
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2">
                  Formato & Disposição do Painel
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      id: 'horizontal' as OverlayFormat,
                      name: 'Barra Horizontal',
                      desc: 'Fita clássica horizontal para o topo',
                      badge: 'Recomendado'
                    },
                    {
                      id: 'vertical' as OverlayFormat,
                      name: 'Widget Vertical',
                      desc: 'Mini-dashboard em cartão bento',
                      badge: 'Novo'
                    },
                    {
                      id: 'minimal' as OverlayFormat,
                      name: 'Minimalista',
                      desc: 'Flutuante discreto com números limpos',
                      badge: 'Ultra-Leve'
                    }
                  ].map((fmt) => {
                    const isSelected = overlayConfig.format === fmt.id;
                    return (
                      <button
                        key={fmt.id}
                        onClick={() => handleSetOverlayFormat(fmt.id)}
                        className={`p-3 rounded-xl border text-left transition-all relative ${
                          isSelected
                            ? 'bg-[#151E33] border-indigo-500/90 shadow-md ring-1 ring-indigo-500/40 text-white'
                            : 'bg-[#0E1526] border-[#1E293B] hover:border-[#2C3B63] hover:bg-[#131C32] text-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-white">{fmt.name}</span>
                          <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-white/10 text-gray-300">
                            {fmt.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 leading-snug">{fmt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Theme Selector */}
              <div>
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2">
                  Tema & Fundo Visual
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    {
                      id: 'dark-gamer' as OverlayTheme,
                      name: 'Dark Gamer',
                      desc: 'Fundo 95% com rebordo âmbar / neon'
                    },
                    {
                      id: 'glass' as OverlayTheme,
                      name: 'Vidro (Glass)',
                      desc: 'Transparência suave com desfoque'
                    },
                    {
                      id: 'pure-black' as OverlayTheme,
                      name: 'Preto Puro',
                      desc: 'Contraste máximo e fundo fosco'
                    }
                  ].map((thm) => {
                    const isSelected = overlayConfig.theme === thm.id;
                    return (
                      <button
                        key={thm.id}
                        onClick={() => handleSetOverlayTheme(thm.id)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? 'bg-[#151E33] border-indigo-500/90 shadow-md ring-1 ring-indigo-500/40 text-white'
                            : 'bg-[#0E1526] border-[#1E293B] hover:border-[#2C3B63] hover:bg-[#131C32] text-gray-300'
                        }`}
                      >
                        <span className="text-xs font-bold text-white block mb-0.5">{thm.name}</span>
                        <p className="text-[11px] text-gray-400 leading-snug">{thm.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Toggle de Abertura Automática */}
              <div
                onClick={async () => {
                  const newVal = !overlayConfig.autoOpenOnGameLaunch;
                  const nextConfig = { ...overlayConfig, autoOpenOnGameLaunch: newVal };
                  setOverlayConfig(nextConfig);
                  if (window.optimizerApi?.overlayUpdateConfig) {
                    await window.optimizerApi.overlayUpdateConfig({ autoOpenOnGameLaunch: newVal });
                    setFeedbackMsg({
                      text: newVal ? 'HUD abrirá automaticamente ao iniciar jogos!' : 'Abertura automática desativada (HUD apenas via atalho).',
                      type: 'success'
                    });
                  }
                }}
                className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  overlayConfig.autoOpenOnGameLaunch
                    ? 'bg-[#0E172A] border-indigo-500/40 hover:border-indigo-500/70'
                    : 'bg-[#0A0F1D] border-[#1E293B] opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <Gamepad2 className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Abrir HUD Automaticamente ao Detetar Jogo</span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">Inteligente</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-tight mt-0.5">
                      Se desativado, o HUD só aparece no ecrã quando premires o atalho configurado (ex: F11 ou Alt+O).
                    </p>
                  </div>
                </div>

                <div
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ml-3 ${
                    overlayConfig.autoOpenOnGameLaunch ? 'bg-indigo-600 justify-end' : 'bg-gray-700 justify-start'
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                </div>
              </div>

              {/* Section 3: Metric Toggle Switches (O que aparece no overlay) */}
              <div>
                <span className="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2">
                  Escolher o que aparece no Overlay
                </span>
                <div className="space-y-2">
                  {[
                    {
                      key: 'showFps' as keyof OverlayItemsConfig,
                      title: 'Contador de FPS (com 1% Low e Frametime)',
                      desc: 'Taxa instantânea de fotogramas por segundo, estabilidade e intervalo de ms.',
                      icon: <Gauge className="w-4 h-4 text-emerald-400" />
                    },
                    {
                      key: 'showTimer' as keyof OverlayItemsConfig,
                      title: 'Resolução do Temporizador (Timer)',
                      desc: 'Indica a latência de precisão do kernel travada (ex.: 0.500ms).',
                      icon: <Zap className="w-4 h-4 text-amber-400" />
                    },
                    {
                      key: 'showGameName' as keyof OverlayItemsConfig,
                      title: 'Nome do Jogo Ativo',
                      desc: 'Etiqueta com o nome do jogo em execução detetado pelo Game Sensor.',
                      icon: <Sparkles className="w-4 h-4 text-indigo-400" />
                    },
                    {
                      key: 'showPing' as keyof OverlayItemsConfig,
                      title: 'Latência de Rede / Ping (ms)',
                      desc: 'Medição em tempo real da conexão para monitorizar picos de lag.',
                      icon: <Radio className="w-4 h-4 text-cyan-400" />
                    },
                    {
                      key: 'showCpu' as keyof OverlayItemsConfig,
                      title: 'Carga do Processador (CPU %)',
                      desc: 'Percentagem de utilização dos núcleos do processador.',
                      icon: <Cpu className="w-4 h-4 text-indigo-400" />
                    },
                    {
                      key: 'showGpu' as keyof OverlayItemsConfig,
                      title: 'Temperatura & Carga da Placa Gráfica (GPU)',
                      desc: 'Temperatura em tempo real em °C e percentagem de carga do chip gráfico.',
                      icon: <Zap className="w-4 h-4 text-amber-400" />
                    },
                    {
                      key: 'showRam' as keyof OverlayItemsConfig,
                      title: 'Memória RAM em Uso (GB)',
                      desc: 'Quantidade de memória física ocupada em Gigabytes.',
                      icon: <Activity className="w-4 h-4 text-purple-400" />
                    },
                    {
                      key: 'showControls' as keyof OverlayItemsConfig,
                      title: 'Botões de Controlo Rápido (Fantasma, Posição e Fechar)',
                      desc: 'Atalhos no próprio HUD para alternar o rato, mudar o canto do ecrã ou fechar.',
                      icon: <Ghost className="w-4 h-4 text-amber-400" />
                    }
                  ].map((item) => {
                    const isEnabled = overlayConfig.items[item.key];
                    return (
                      <div
                        key={item.key}
                        onClick={() => handleToggleOverlayItem(item.key)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isEnabled
                            ? 'bg-[#0E172A] border-indigo-500/40 hover:border-indigo-500/70'
                            : 'bg-[#0A0F1D] border-[#1E293B] opacity-60 hover:opacity-90'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                            {item.icon}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              <span>{item.title}</span>
                            </div>
                            <p className="text-[11px] text-gray-400 leading-tight mt-0.5">{item.desc}</p>
                          </div>
                        </div>

                        {/* Modern Toggle Switch */}
                        <div
                          className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ml-3 ${
                            isEnabled ? 'bg-indigo-600 justify-end' : 'bg-gray-700 justify-start'
                          }`}
                        >
                          <div className="bg-white w-4 h-4 rounded-full shadow-md transform transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB: G-SYNC & FREESYNC ANTI-LAG OPTIMIZER */}
          {activeTab === 'gsync' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Crosshair className="w-4 h-4 text-cyan-400" />
                    Otimizador G-Sync / FreeSync (Anti-Input Lag)
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Calcula e sincroniza o teto ideal de FPS para eliminar atraso de frames e tearing.
                  </p>
                </div>
              </div>

              {/* Status & Calculation Hero Card */}
              <div className="bg-gradient-to-r from-cyan-950/40 via-[#0E1526] to-[#0A0F1D] border border-cyan-500/30 rounded-2xl p-5 space-y-4 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400">
                      <Monitor className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Monitor Principal Detetado</span>
                      <h3 className="text-lg font-black text-white font-mono">{monitorHz} Hz <span className="text-xs font-normal text-cyan-400 font-sans">(Frequência do Ecrã)</span></h3>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Teto Ideal Reflex</span>
                    <h3 className="text-xl font-black text-emerald-400 font-mono">{recommendedCap} FPS</h3>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 space-y-2 text-xs text-gray-300">
                  <p className="leading-relaxed">
                    <strong>Padrão eSports / Blur Busters:</strong> Limitar a taxa de quadros a <strong>{recommendedCap} FPS</strong> (frequência do monitor - 3) impede que o buffer de renderização do DirectX transborde, mantendo o G-Sync/FreeSync permanentemente ativo na zona de <strong>0ms de latência de entrada</strong>.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400">Hz:</span>
                    {[60, 120, 144, 165, 240, 360].map((hz) => (
                      <button
                        key={hz}
                        onClick={async () => {
                          setMonitorHz(hz);
                          if (window.optimizerApi?.gsyncCalculateCap) {
                            const cap = await window.optimizerApi.gsyncCalculateCap(hz);
                            setRecommendedCap(cap);
                          }
                        }}
                        className={`px-2 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                          monitorHz === hz
                            ? 'bg-cyan-500 text-black shadow-md'
                            : 'bg-white/5 hover:bg-white/10 text-gray-300'
                        }`}
                      >
                        {hz}Hz
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleApplyGsync}
                    disabled={isApplyingGsync}
                    className="px-4 py-2 rounded-xl text-xs font-extrabold bg-cyan-500 hover:bg-cyan-400 text-black flex items-center gap-2 shadow-lg transition-all"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>{isApplyingGsync ? 'A Aplicar...' : `Aplicar Teto de ${recommendedCap} FPS aos Jogos`}</span>
                  </button>
                </div>
              </div>

              {/* Supported Games List */}
              <div className="bg-[#0E1526] border border-[#1E293B] rounded-2xl p-4 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                  Jogos Sincronizados com 1-Clique:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-col">
                    <span className="text-white font-bold font-sans">CS2</span>
                    <span className="text-[10px] text-cyan-400 font-bold">fps_max {recommendedCap}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-col">
                    <span className="text-white font-bold font-sans">Apex Legends</span>
                    <span className="text-[10px] text-cyan-400 font-bold">+fps_max {recommendedCap}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-col">
                    <span className="text-white font-bold font-sans">Fortnite</span>
                    <span className="text-[10px] text-cyan-400 font-bold">FrameRateLimit {recommendedCap}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-col">
                    <span className="text-white font-bold font-sans">Roblox</span>
                    <span className="text-[10px] text-cyan-400 font-bold">TargetFps {recommendedCap}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: BENCHMARK DE JOGO & RELATÓRIO */}
          {activeTab === 'benchmark' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-rose-400" />
                    Sessão de Benchmark & Estabilidade de Frametime
                  </h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Grava em tempo real a fluidez do jogo e gera um relatório com FPS médio e 1% Low.
                  </p>
                </div>
                <span className="text-[11px] font-mono font-bold px-2 py-1 rounded bg-white/5 border border-white/10 text-gray-300">
                  Atalho: Alt + B
                </span>
              </div>

              {/* Recorder Live Card */}
              <div className="bg-[#0E1526] border border-[#1E293B] rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl ${benchStatus.isRecording ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-white/5 text-gray-400'}`}>
                    <BarChart2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">
                      {benchStatus.isRecording ? 'A Gravar Partida em Tempo Real...' : 'Nenhum Benchmark a Decorrer'}
                    </h5>
                    <p className="text-[11px] text-gray-400">
                      {benchStatus.isRecording
                        ? `Duração: ${benchStatus.elapsedSeconds}s | Amostras: ${benchStatus.sampleCount}`
                        : 'Pressiona o botão ou Alt+B durante a partida para iniciar a amostragem.'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleToggleBenchmarkSession}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    benchStatus.isRecording
                      ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold'
                  }`}
                >
                  {benchStatus.isRecording ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current" />
                      <span>Terminar Benchmark</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Iniciar Benchmark (Alt+B)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Latest Session Report */}
              {benchStatus.lastSession ? (
                <div className="bg-gradient-to-r from-emerald-950/25 via-[#0E1526] to-[#0A0F1D] border border-emerald-500/30 rounded-2xl p-5 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold font-mono uppercase text-gray-400 tracking-wider">Último Relatório de Partida</span>
                      <h4 className="text-base font-extrabold text-white flex items-center gap-2 mt-0.5">
                        {benchStatus.lastSession.gameName}
                        <span className="text-xs font-mono font-normal text-gray-400">({benchStatus.lastSession.durationSeconds} segundos)</span>
                      </h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">Classificação:</span>
                      <span className={`text-lg font-black font-mono px-3 py-1 rounded-xl border shadow-md ${
                        benchStatus.lastSession.rating === 'S+'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : benchStatus.lastSession.rating === 'A'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                          : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      }`}>
                        {benchStatus.lastSession.rating}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="bg-black/40 border border-white/5 rounded-xl p-3 text-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">FPS Médio</span>
                      <span className="text-lg font-black font-mono text-emerald-400">{benchStatus.lastSession.avgFps}</span>
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded-xl p-3 text-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">1% Low FPS</span>
                      <span className="text-lg font-black font-mono text-cyan-400">{benchStatus.lastSession.low1Percent}</span>
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded-xl p-3 text-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">Frametime</span>
                      <span className="text-lg font-black font-mono text-indigo-300">{benchStatus.lastSession.avgFrametimeMs}ms</span>
                    </div>
                    <div className="bg-black/40 border border-white/5 rounded-xl p-3 text-center">
                      <span className="text-[10px] font-bold text-gray-400 uppercase block">Estabilidade</span>
                      <span className="text-lg font-black font-mono text-amber-300">{benchStatus.lastSession.frametimeStabilityScore}%</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 rounded-2xl bg-[#0E1526]/40 border border-dashed border-[#1E293B] text-center space-y-1">
                  <BarChart2 className="w-8 h-8 text-gray-500 mx-auto opacity-50" />
                  <p className="text-xs text-gray-400">Nenhum relatório gravado nesta sessão ainda.</p>
                  <p className="text-[11px] text-gray-500">Pressiona Alt+B para começar uma gravação quando estiveres dentro de um jogo!</p>
                </div>
              )}

              {/* Before vs After Comparison Card */}
              {benchHistory.length >= 2 && (() => {
                const latest = benchHistory[0];
                const baseline = benchHistory[benchHistory.length - 1];
                const fpsDiff = latest.avgFps - baseline.avgFps;
                const fpsPercent = baseline.avgFps > 0 ? ((fpsDiff / baseline.avgFps) * 100).toFixed(1) : '0';
                const low1Diff = latest.low1Percent - baseline.low1Percent;
                const low1Percent = baseline.low1Percent > 0 ? ((low1Diff / baseline.low1Percent) * 100).toFixed(1) : '0';
                const stabDiff = latest.frametimeStabilityScore - baseline.frametimeStabilityScore;

                return (
                  <div className="bg-gradient-to-r from-indigo-950/40 via-[#0F172A] to-cyan-950/30 border border-indigo-500/30 rounded-2xl p-4 space-y-3 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                          Comparativo de Performance: Antes vs Depois
                        </h5>
                      </div>
                      <span className="text-[10px] text-gray-400 font-mono">
                        Base: {baseline.timestamp} → Atual: {latest.timestamp}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-black/40 border border-white/5 rounded-xl p-2.5 text-center">
                        <span className="text-[10px] text-gray-400 block">Ganho FPS Médio</span>
                        <span className={`text-base font-black font-mono ${fpsDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {fpsDiff >= 0 ? `+${fpsDiff}` : fpsDiff} FPS ({fpsDiff >= 0 ? `+${fpsPercent}%` : `${fpsPercent}%`})
                        </span>
                      </div>
                      <div className="bg-black/40 border border-white/5 rounded-xl p-2.5 text-center">
                        <span className="text-[10px] text-gray-400 block">Ganho 1% Low</span>
                        <span className={`text-base font-black font-mono ${low1Diff >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
                          {low1Diff >= 0 ? `+${low1Diff}` : low1Diff} FPS ({low1Diff >= 0 ? `+${low1Percent}%` : `${low1Percent}%`})
                        </span>
                      </div>
                      <div className="bg-black/40 border border-white/5 rounded-xl p-2.5 text-center">
                        <span className="text-[10px] text-gray-400 block">Estabilidade</span>
                        <span className={`text-base font-black font-mono ${stabDiff >= 0 ? 'text-amber-300' : 'text-rose-400'}`}>
                          {stabDiff >= 0 ? `+${stabDiff}%` : `${stabDiff}%`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Benchmark History Section */}
              <div className="space-y-3 pt-2 border-t border-[#1E293B]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-gray-400" />
                    <h5 className="text-xs font-bold text-white">
                      Histórico de Partidas Gravadas ({benchHistory.length})
                    </h5>
                  </div>

                  <div className="flex items-center gap-2">
                    {benchHistory.length > 0 && (
                      <>
                        <button
                          onClick={handleExportCsv}
                          className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-[#1E293B] hover:bg-[#2B3B66] text-gray-200 hover:text-white flex items-center gap-1.5 transition-all border border-[#2D3B55]"
                          title="Exportar dados para CSV no Ambiente de Trabalho"
                        >
                          <Download className="w-3 h-3 text-cyan-400" />
                          <span>Exportar CSV</span>
                        </button>
                        <button
                          onClick={handleClearHistory}
                          className="px-2 py-1.5 rounded-lg text-[11px] font-bold bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-300 flex items-center gap-1 transition-all"
                          title="Limpar histórico gravado"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {benchHistory.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                    {benchHistory.map((sess) => (
                      <div
                        key={sess.id}
                        className="bg-[#0E1526] border border-[#1E293B] hover:border-[#2D3B55] rounded-xl p-3 flex items-center justify-between transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-black font-mono text-xs border ${
                              sess.rating === 'S+'
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                : sess.rating === 'A'
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            }`}
                          >
                            {sess.rating}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              <span>{sess.gameName}</span>
                              <span className="text-[10px] font-normal text-gray-400">({sess.durationSeconds}s)</span>
                            </div>
                            <div className="text-[10px] text-gray-500 font-mono">
                              {sess.timestamp} • {sess.sampleCount} amostras
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <span className="text-[10px] text-gray-400 block">Méd / 1% Low</span>
                            <span className="text-xs font-mono font-bold text-emerald-400">
                              {sess.avgFps} <span className="text-gray-500 font-normal">/</span> {sess.low1Percent}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-400 block">Estabilidade</span>
                            <span className="text-xs font-mono font-bold text-amber-300">
                              {sess.frametimeStabilityScore}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-500 italic text-center py-2">
                    Nenhum registo persistido ainda. As sessões completas aparecerão aqui automaticamente.
                  </p>
                )}
              </div>
            </div>
          )}
          {activeTab === 'language' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-400" />
                  {t('settings.select_language')}
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  {t('settings.select_language_desc')}
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                {[
                  { id: 'pt' as Language, label: t('settings.lang_pt'), flag: '🇵🇹' },
                  { id: 'en' as Language, label: t('settings.lang_en'), flag: '🇬🇧' },
                  { id: 'es' as Language, label: t('settings.lang_es'), flag: '🇪🇸' }
                ].map((item) => {
                  const isSelected = language === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setLanguage(item.id)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'bg-[#151E33] border-indigo-500/80 shadow-md ring-1 ring-indigo-500/30'
                          : 'bg-[#0E1526] border-[#1E293B] hover:border-[#2C3B63] hover:bg-[#131C32]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <span className="text-2xl leading-none">{item.flag}</span>
                        <div>
                          <span className="text-sm font-bold text-white block">
                            {item.label}
                          </span>
                          <span className="text-[11px] text-gray-400 block mt-0.5">
                            {item.id === 'pt'
                              ? 'Idioma Nativo do Optimizer'
                              : item.id === 'en'
                              ? 'Standard English Localization'
                              : 'Localización completa en Español'}
                          </span>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white">
                          <Check className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-gray-700" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: KEYBOARD HOTKEYS & GHOST MODE RECOVERY */}
          {activeTab === 'hotkeys' && (
            <div className="space-y-5">
              {/* EMERGENCY GHOST MODE RECOVERY CARD */}
              <div
                className={`p-4 rounded-2xl border transition-all ${
                  isGhostActive
                    ? 'bg-amber-950/30 border-amber-500/70 shadow-lg ring-1 ring-amber-500/40'
                    : 'bg-[#0E1526] border-[#1E293B]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        isGhostActive
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
                          : 'bg-[#151E33] text-gray-400 border-[#232F4D]'
                      }`}
                    >
                      <Ghost className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        {t('settings.ghost_title')}
                        {isGhostActive ? (
                          <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-amber-500 text-black">
                            Ativo Agora
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Normal
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                        {t('settings.ghost_desc')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#1E293B] flex items-center gap-2.5 flex-wrap">
                  {isGhostActive ? (
                    <button
                      onClick={handleDeactivateGhostNow}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <MousePointer className="w-4 h-4" />
                      <span>{t('settings.ghost_deactivate_now')}</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleToggleGhost}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#151E33] hover:bg-[#1E2B4B] border border-[#232F4D] text-gray-300 hover:text-white text-xs font-semibold transition-all"
                    >
                      <Ghost className="w-3.5 h-3.5 text-amber-400" />
                      <span>{t('settings.ghost_activate_now')}</span>
                    </button>
                  )}
                  <span className="text-[11px] text-gray-400 font-mono">
                    (Ou pressiona <kbd className="px-1.5 py-0.5 rounded bg-gray-800 text-amber-300 border border-gray-700">Ctrl + Shift + F4</kbd> a qualquer altura)
                  </span>
                </div>
              </div>

              {/* HOTKEYS CONFIGURATION LIST */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <Keyboard className="w-4 h-4 text-indigo-400" />
                      {t('settings.hotkeys_title')}
                    </h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t('settings.hotkeys_desc')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        if (window.optimizerApi?.overlayToggle) {
                          await window.optimizerApi.overlayToggle();
                          setFeedbackMsg({ text: '🎮 HUD Overlay alternado no ecrã!', type: 'success' });
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-[11px] font-bold text-white transition-all shadow-sm"
                      title="Testa a abertura do HUD Overlay imediatamente"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Testar HUD</span>
                    </button>
                    <button
                      onClick={handleResetHotkeys}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#151E33] hover:bg-[#1E2B4B] border border-[#232F4D] text-[11px] font-semibold text-gray-300 hover:text-white transition-all"
                      title="Restaurar combinações padrão de fábrica"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>{t('settings.hotkeys_reset')}</span>
                    </button>
                  </div>
                </div>

                {/* Helpful Laptop / Game Tip Banner */}
                <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3 mb-3 text-xs text-indigo-200 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <strong className="text-white">Atalhos rápidos suportados:</strong> Podes premir <kbd className="px-1.5 py-0.5 bg-indigo-900 border border-indigo-600 rounded text-amber-300 font-mono text-[10px]">Ctrl + Shift + F3</kbd> ou o atalho de 1 mão <kbd className="px-1.5 py-0.5 bg-indigo-900 border border-indigo-600 rounded text-amber-300 font-mono text-[10px]">Alt + O</kbd> para abrir/fechar o HUD. Em portáteis sem tecla Fn ativa, o atalho <span className="font-mono text-amber-300 font-bold">Alt + O</span> funciona sem necessitar de premir a tecla Fn.
                  </div>
                </div>

                <div className="space-y-3">
                  {hotkeys.map((hk) => {
                    return (
                      <div
                        key={hk.id}
                        className="p-3.5 rounded-xl bg-[#0E1526] border border-[#1E293B] hover:border-[#2C3B63] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">
                              {hk.name}
                            </span>
                            {hk.id === 'toggle-ghost' && (
                              <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Emergência
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-400">
                            {hk.description}
                          </p>
                        </div>

                        {/* Dropdown Selector */}
                        <div className="shrink-0 flex items-center gap-2">
                          <select
                            value={hk.accelerator}
                            onChange={(e) => handleHotkeyChange(hk.id, e.target.value)}
                            className="bg-[#151E33] border border-[#2B3B66] text-amber-300 font-mono text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                          >
                            {hk.options?.map((opt: any) => (
                              <option key={opt.value} value={opt.value} className="bg-[#0B101D] text-gray-200">
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ABOUT */}
          {activeTab === 'about' && (
            <div className="space-y-4">
              <div className="bg-[#0E1526] border border-[#1E293B] rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-[#1E293B] pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-white">Optimizer PRO</h4>
                      <p className="text-xs text-gray-400">Windows Performance, Latency & Rig Suite</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                    v2.1.0 PRO
                  </span>
                </div>

                {/* Windows Startup & Silent Mode Toggle Card */}
                <div className="bg-[#121A2F] border border-[#232F4D] rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                        <Power className="w-4 h-4" />
                      </div>
                      <div>
                        <strong className="text-white text-xs block">Iniciar com o Windows (Modo Furtivo)</strong>
                        <span className="text-[11px] text-gray-400">Arranca minimizado no relógio (System Tray) com 0% de uso de CPU.</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleStartup(!startupConfig.enabled)}
                      disabled={isSavingStartup}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                        startupConfig.enabled
                          ? 'bg-emerald-500 text-black shadow-emerald-500/20'
                          : 'bg-white/10 hover:bg-white/15 text-gray-300'
                      }`}
                    >
                      {isSavingStartup ? '...' : startupConfig.enabled ? 'Ativo [✓]' : 'Desativado'}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-gray-300">
                  <div className="flex items-center justify-between py-1 border-b border-[#172238]">
                    <span className="text-gray-400">{t('settings.author')}</span>
                    <strong className="text-white font-mono">santicoliveira-byte</strong>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-[#172238]">
                    <span className="text-gray-400">{t('settings.current_version')}</span>
                    <span className="font-mono text-emerald-400 font-bold">v2.1.0 (Portable)</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-gray-400">Arquitetura:</span>
                    <span className="font-mono text-gray-200">Electron 34 + React 19 + TypeScript</span>
                  </div>
                </div>

                <a
                  href="https://github.com/santicoliveira-byte/Optimizer"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#151E33] hover:bg-[#1E2B4B] border border-[#232F4D] text-xs font-bold text-white transition-all shadow-md"
                >
                  <ExternalLink className="w-4 h-4 text-indigo-400" />
                  <span>{t('settings.repository')}</span>
                </a>
              </div>
            </div>
          )}

          {/* TAB: LICENÇA PRO & MONETIZAÇÃO */}
          {activeTab === 'pro' && (
            <div className="space-y-5">
              {licenseStatus.isPro ? (
                /* PRO ACTIVATED STATE */
                <div className="bg-gradient-to-r from-amber-950/40 via-[#181B2B] to-[#0D1222] border border-amber-500/50 rounded-2xl p-5 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-300 shadow-inner">
                        <Crown className="w-6 h-6 fill-amber-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-extrabold text-white">Optimizer PRO Ativado</h4>
                          <span className="text-[10px] font-bold uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500 text-black">
                            Vitalício
                          </span>
                        </div>
                        <p className="text-xs text-amber-200/80 mt-0.5">
                          Obrigado pelo teu apoio! Tens acesso irrestrito a todas as ferramentas e motores de jogo.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/40 border border-white/10 rounded-xl p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Chave de Licença:</span>
                      <span className="font-mono font-bold text-amber-300 tracking-wider">
                        {licenseStatus.licenseKey
                          ? `${licenseStatus.licenseKey.slice(0, 11)}••••-••••`
                          : 'OPT-PRO-••••-••••'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Ativado em:</span>
                      <span className="font-mono text-gray-200">{licenseStatus.activatedAt || 'Hoje'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Estado da Conta:</span>
                      <span className="font-bold text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Autenticado (Permanente)
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between">
                    <p className="text-[11px] text-gray-500">
                      Podes desativar para transferir a tua chave para outro PC quando quiseres.
                    </p>
                    <button
                      onClick={handleDeactivateLicense}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/5 hover:bg-rose-500/20 text-gray-400 hover:text-rose-300 border border-white/5 transition-all"
                    >
                      Desativar Licença
                    </button>
                  </div>
                </div>
              ) : (
                /* FREE EDITION / PRO UPGRADE STATE */
                <div className="space-y-4">
                  {/* Hero Upgrade Banner */}
                  <div className="bg-gradient-to-r from-amber-500/15 via-[#1A2035] to-[#10172A] border border-amber-500/30 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
                        <Crown className="w-5 h-5 fill-amber-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                          Desbloqueia a Edição PRO
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500 text-black font-black">
                            Vip
                          </span>
                        </h4>
                        <p className="text-xs text-gray-300 mt-0.5">
                          Potência máxima, frametimes consistentes e todas as funcionalidades de eSports.
                        </p>
                      </div>
                    </div>

                    {/* Features unlocked in PRO */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                      {[
                        'In-Game HUD Overlay com Modo Fantasma',
                        'Benchmark de FPS com 1% Lows & CSV',
                        'Auto Game Booster Daemon em Tray',
                        'Calculador G-Sync / FreeSync Anti-Lag',
                        'Process Lasso com Trava de P-Cores',
                        'Acesso vitalício sem mensalidades'
                      ].map((feat, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-gray-300 bg-black/30 px-2.5 py-1.5 rounded-lg border border-white/5">
                          <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* License Key Activation Card */}
                  <div className="bg-[#0E1526] border border-[#1E293B] rounded-2xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-amber-400" />
                      <strong className="text-xs text-white">Já tens uma Chave de Ativação?</strong>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={licenseKeyInput}
                        onChange={(e) => setLicenseKeyInput(e.target.value.toUpperCase())}
                        placeholder="OPT-PRO-XXXX-XXXX-XXXX"
                        className="flex-1 bg-[#151E33] border border-[#2B3B66] rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-white placeholder-gray-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 uppercase tracking-wider"
                      />
                      <button
                        onClick={handleActivateLicense}
                        disabled={isActivatingLicense}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-md transition-all whitespace-nowrap font-sans flex items-center gap-1.5"
                      >
                        <Crown className="w-3.5 h-3.5 fill-current" />
                        <span>{isActivatingLicense ? 'A Validar...' : 'Ativar Licença'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Buy License Button / External Link */}
                  <div className="bg-[#121A2E] border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <strong className="text-xs text-white block">Ainda não tens a tua chave?</strong>
                      <span className="text-[11px] text-gray-400">Adquire a tua licença vitalícia por apenas 2,00€ (pagamento único seguro via MB WAY, Cartão ou PayPal).</span>
                    </div>

                    <a
                      href="https://github.com/santicoliveira-byte/Optimizer#readme"
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Comprar PRO (2,00€)</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#090E1A] border-t border-[#1E293B] flex items-center justify-between">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('settings.reset')}</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 transition-all"
            style={{ backgroundColor: ACCENT_COLORS.find((c) => c.id === accent)?.hex }}
          >
            {t('settings.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
