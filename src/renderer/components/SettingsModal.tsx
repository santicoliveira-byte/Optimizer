import React, { useState } from 'react';
import {
  Settings,
  X,
  Palette,
  Globe,
  Info,
  Check,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { useI18n, ACCENT_COLORS, ThemeAccent, Language } from '../i18n';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { language, setLanguage, accent, setAccent, t } = useI18n();
  const [activeTab, setActiveTab] = useState<'appearance' | 'language' | 'about'>('appearance');

  if (!isOpen) return null;

  const handleResetDefaults = () => {
    setAccent('indigo');
    setLanguage('pt');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-[#0B101D] border border-[#232F4D] rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
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

          {/* TAB 3: ABOUT */}
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
                    v1.2 PRO
                  </span>
                </div>

                <div className="space-y-2 text-xs text-gray-300">
                  <div className="flex items-center justify-between py-1 border-b border-[#172238]">
                    <span className="text-gray-400">{t('settings.author')}</span>
                    <strong className="text-white font-mono">santicoliveira-byte</strong>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b border-[#172238]">
                    <span className="text-gray-400">{t('settings.current_version')}</span>
                    <span className="font-mono text-emerald-400 font-bold">v1.2.0 (Portable)</span>
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
