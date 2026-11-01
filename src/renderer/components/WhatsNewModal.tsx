import React from 'react';
import {
  Sparkles,
  Zap,
  Wrench,
  ShieldCheck,
  ExternalLink,
  X,
  Flame,
  ArrowRight
} from 'lucide-react';
import { getDisplayVersion } from '../utils/version';

interface WhatsNewModalProps {
  isOpen: boolean;
  onClose: () => void;
  version: string;
}

export interface ChangelogItem {
  type: 'feature' | 'fix' | 'improvement';
  title: string;
  description: string;
}

export interface ReleaseChangelog {
  version: string;
  title: string;
  date: string;
  highlights: ChangelogItem[];
}

export const RELEASES_CHANGELOG: ReleaseChangelog[] = [
  {
    version: '2.2.9',
    title: 'Atualizações em 1-Clique, Versão Dinâmica & Estabilidade',
    date: 'Novembro 2026',
    highlights: [
      {
        type: 'feature',
        title: 'Atualizações em 1-Clique sem Desinstalar',
        description: 'Atualiza o Optimizer com um clique direto dentro da app. O executável é atualizado e reiniciado automaticamente sem precisares de ir ao navegador.'
      },
      {
        type: 'feature',
        title: 'Ecrã de Boas-Vindas & Novidades',
        description: 'Após cada atualização, o Optimizer mostra-te automaticamente o resumo das novidades, melhorias e correções feitas.'
      },
      {
        type: 'feature',
        title: 'Versão 100% Dinâmica em Toda a App',
        description: 'O número de versão na barra lateral, cabeçalho e definições atualiza-se em tempo real a partir do motor principal.'
      },
      {
        type: 'fix',
        title: 'Eliminado Overlay Duplicado',
        description: 'Removido o widget antigo embutido na app; agora existe apenas o HUD flutuante real de alta performance com DirectFlip MPO.'
      },
      {
        type: 'improvement',
        title: 'Atalho Overlay Inteligente (Alt+O / F11)',
        description: 'Quando fechas o overlay com o atalho, ele permanece oculto durante toda a partida e não volta a abrir sozinho.'
      },
      {
        type: 'improvement',
        title: 'Novo Design das Definições',
        description: 'Navegação por pílulas modernas com suporte para scroll horizontal com a roda do rato (wheel scroll).'
      }
    ]
  },
  {
    version: '2.2.0',
    title: 'In-Game HUD Overlay, DirectFlip MPO & Modo Fantasma',
    date: 'Outubro 2026',
    highlights: [
      {
        type: 'feature',
        title: 'Overlay Flutuante de Latência Zero (0ms Lag)',
        description: 'HUD com telemetria em tempo real (FPS, 0.500ms Timer, RAM, CPU, GPU e Ping) desenhado diretamente sobre jogos em Tela Cheia.'
      },
      {
        type: 'feature',
        title: 'Modo Fantasma (Alt+G)',
        description: 'Atravessamento total dos cliques do rato para o jogo para nunca perderes o controlo da mira.'
      },
      {
        type: 'feature',
        title: 'Licença PRO Vitalícia a 2,00€',
        description: 'Desbloqueio vitalício de temporizador 0.500ms, afinidade P-Core Process Lasso e perfis de eSports.'
      }
    ]
  }
];

export const WhatsNewModal: React.FC<WhatsNewModalProps> = ({
  isOpen,
  onClose,
  version
}) => {
  if (!isOpen) return null;

  const currentChangelog = RELEASES_CHANGELOG[0];
  const displayVer = getDisplayVersion(version);

  const getBadgeStyle = (type: ChangelogItem['type']) => {
    switch (type) {
      case 'feature':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'fix':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'improvement':
      default:
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
    }
  };

  const getBadgeLabel = (type: ChangelogItem['type']) => {
    switch (type) {
      case 'feature':
        return 'Novo';
      case 'fix':
        return 'Correção';
      case 'improvement':
      default:
        return 'Melhoria';
    }
  };

  const getIcon = (type: ChangelogItem['type']) => {
    switch (type) {
      case 'feature':
        return <Zap className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'fix':
        return <Wrench className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'improvement':
      default:
        return <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-[#0B101D] border border-[#232F4D] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#121B33] via-[#1A2544] to-[#0F172A] px-6 py-5 border-b border-[#1E293B] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500/30 to-purple-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300 shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-tight">
                  Novidades da Versão {displayVer}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Atualizado 🎉
                </span>
              </div>
              <p className="text-xs text-gray-300 mt-0.5">
                A tua aplicação foi atualizada com sucesso! Vê as novidades e correções abaixo:
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Highlights */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between text-xs pb-1 border-b border-white/5">
            <span className="font-bold text-gray-300 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400" />
              Destaques desta Versão:
            </span>
            <span className="font-mono text-gray-400 text-[11px]">{currentChangelog.date}</span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {currentChangelog.highlights.map((item, idx) => (
              <div
                key={idx}
                className="bg-[#0E1526]/90 border border-[#1E293B] hover:border-[#2C3B5E] rounded-xl p-3.5 transition-all flex items-start gap-3"
              >
                <div className="p-2 rounded-lg bg-white/5 shrink-0 mt-0.5">
                  {getIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <strong className="text-xs font-bold text-white tracking-wide">
                      {item.title}
                    </strong>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider font-mono px-1.5 py-0.2 rounded border ${getBadgeStyle(
                        item.type
                      )}`}
                    >
                      {getBadgeLabel(item.type)}
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Value callout box */}
          <div className="bg-gradient-to-r from-indigo-950/40 to-purple-950/30 border border-indigo-500/30 rounded-xl p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-gray-300">
                Todas as tuas configurações anteriores e estado de ativação PRO foram mantidos intactos.
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 shrink-0">
              Pronto a Usar
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#080D1A] border-t border-[#1E293B] flex items-center justify-between">
          <a
            href="https://github.com/santicoliveira-byte/Optimizer/releases"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Ver notas completas no GitHub</span>
          </a>

          <button
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02]"
          >
            <span>Continuar para o Optimizer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
