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
  Zap
} from 'lucide-react';
import { useI18n, ACCENT_COLORS, ThemeAccent, Language } from '../i18n';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { language, setLanguage, accent, setAccent, t } = useI18n();
  const [activeTab, setActiveTab] = useState<'appearance' | 'language' | 'hotkeys' | 'about'>('appearance');

  const [hotkeys, setHotkeys] = useState<any[]>([]);
  const [isGhostActive, setIsGhostActive] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

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
      } catch {}
    };

    loadData();

    let unsubGhost: (() => void) | undefined;
    if (window.optimizerApi?.onOverlayGhostChanged) {
      unsubGhost = window.optimizerApi.onOverlayGhostChanged((isClickThrough) => {
        setIsGhostActive(isClickThrough);
      });
    }

    return () => {
      unsubGhost?.();
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
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-[#1E293B] bg-[#0E1526]/60">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'appearance'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>{t('settings.tab_appearance')}</span>
          </button>
          <button
            onClick={() => setActiveTab('language')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'language'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{t('settings.tab_language')}</span>
          </button>
          <button
            onClick={() => setActiveTab('hotkeys')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'hotkeys'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Keyboard className="w-3.5 h-3.5" />
            <span>{t('settings.tab_hotkeys')}</span>
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'about'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>{t('settings.tab_about')}</span>
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

          {/* TAB 2: LANGUAGE SELECTION */}
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
                  <button
                    onClick={handleResetHotkeys}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#151E33] hover:bg-[#1E2B4B] border border-[#232F4D] text-[11px] font-semibold text-gray-300 hover:text-white transition-all"
                    title="Restaurar combinações padrão de fábrica"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{t('settings.hotkeys_reset')}</span>
                  </button>
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
                    v1.7 PRO
                  </span>
                </div>

                <div className="space-y-2 text-xs text-gray-300">
                  <div className="flex items-center justify-between py-1 border-b border-[#172238]">
                    <span className="text-gray-400">{t('settings.author')}</span>
                    <strong className="text-white font-mono">santicoliveira-byte</strong>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-[#172238]">
                    <span className="text-gray-400">{t('settings.current_version')}</span>
                    <span className="font-mono text-emerald-400 font-bold">v1.7.0 (Portable)</span>
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
