import React, { useState } from 'react';
import {
  Check,
  Zap,
  Sliders
} from 'lucide-react';

import discordIcon from '../assets/icons/discord.svg';
import steamIcon from '../assets/icons/steam.svg';
import edgeIcon from '../assets/icons/microsoftedge.svg';
import epicIcon from '../assets/icons/epicgames.svg';
import nvidiaIcon from '../assets/icons/nvidia.svg';
import operaIcon from '../assets/icons/operagx.svg';
import razerIcon from '../assets/icons/razer.svg';
import logitechIcon from '../assets/icons/logitechg.svg';
import msiIcon from '../assets/icons/msi.svg';
import eaIcon from '../assets/icons/ea.svg';

interface TunableApp {
  id: string;
  name: string;
  icon: string;
  iconBg: string;
  category: string;
  status: 'optimized' | 'default';
  description: string;
  actions: string[];
}

const APPS_LIST: TunableApp[] = [
  {
    id: 'discord',
    name: 'Discord',
    icon: discordIcon,
    iconBg: 'bg-[#5865F2]',
    category: 'Comunicação & Chat',
    status: 'default',
    description: 'Desativa aceleração de hardware do Electron que causa micro-stutters, desativa telemetria excessiva e limpa cache de áudio e avatares.',
    actions: ['Desativar aceleração de hardware', 'Limpar cache web/GPU', 'Desativar arranque automático']
  },
  {
    id: 'steam',
    name: 'Steam',
    icon: steamIcon,
    iconBg: 'bg-[#171a21]',
    category: 'Launcher & Store',
    status: 'default',
    description: 'Desativa inicialização pesada em segundo plano, aceleração de GPU na biblioteca, desativa Steam Overlay inútil e limpa shader pre-caching.',
    actions: ['Otimizar arranque silencioso', 'Limpar cache de downloads/shaders', 'Aceleração web da biblioteca ajustada']
  },
  {
    id: 'edge',
    name: 'Microsoft Edge',
    icon: edgeIcon,
    iconBg: 'bg-[#0078D7]',
    category: 'Navegador Web',
    status: 'default',
    description: 'Desativa o arranque rápido permanente (Startup Boost) do Edge que consome RAM continuamente mesmo quando o browser está fechado.',
    actions: ['Desativar Startup Boost', 'Desativar extensões de fundo', 'Limpar cache de renderização']
  },
  {
    id: 'epic',
    name: 'Epic Games Launcher',
    icon: epicIcon,
    iconBg: 'bg-[#2b2b2b]',
    category: 'Launcher & Store',
    status: 'default',
    description: 'Impede o carregamento forçado com o Windows, reduz uso do motor Unreal CEF na loja e limpa centenas de MB de webcache acumulado.',
    actions: ['Remover do arranque', 'Limpar WebCache acumulado', 'Otimizar uso de CPU em repouso']
  },
  {
    id: 'nvidia',
    name: 'NVIDIA Control Panel & App',
    icon: nvidiaIcon,
    iconBg: 'bg-[#76B900]',
    category: 'Drivers Gráficos & GPU',
    status: 'default',
    description: 'Configura perfil global do driver para "Preferir desempenho máximo" de energia, Low Latency Mode Ultra e Shader Cache de 10GB.',
    actions: ['Power management: Prefer Maximum Performance', 'Low Latency Mode: Ultra', 'Shader Cache Size: 10GB']
  },
  {
    id: 'operagx',
    name: 'Opera GX',
    icon: operaIcon,
    iconBg: 'bg-[#FA1E4E]',
    category: 'Navegador Gaming',
    status: 'default',
    description: 'Limita consumo de RAM e CPU enquanto jogos estão abertos, desativa processos Chromium em segundo plano e limpa cache de shaders.',
    actions: ['Suspender background processes ao fechar', 'Ativar limitador de recursos', 'Limpar cache temporário']
  },
  {
    id: 'razer',
    name: 'Razer Synapse',
    icon: razerIcon,
    iconBg: 'bg-[#00A800]',
    category: 'Periféricos & RGB',
    status: 'default',
    description: 'Desativa serviços analíticos do Razer Game Manager e reduz telemetria contínua do Chroma SDK sem afetar a sensibilidade dos periféricos.',
    actions: ['Desativar Razer Game Manager analytics', 'Suspender módulos Chroma em jogos pesados', 'Impedir updates intrusivos']
  },
  {
    id: 'logitech',
    name: 'Logitech G HUB',
    icon: logitechIcon,
    iconBg: 'bg-[#00B8FC]',
    category: 'Periféricos & Gear',
    status: 'default',
    description: 'Persiste perfis diretamente na memória onboard dos dispositivos e desativa o envio contínuo de diagnósticos e telemetria.',
    actions: ['Desativar telemetria e analytics LGHUB', 'Ativar memória onboard', 'Reduzir impacto em background']
  },
  {
    id: 'msi',
    name: 'MSI Afterburner',
    icon: msiIcon,
    iconBg: 'bg-[#EB1C24]',
    category: 'GPU & Monitorização',
    status: 'default',
    description: 'Otimiza a taxa de polling dos sensores de hardware para eliminar micro-stutterings provocados por leituras em ciclo rápido.',
    actions: ['Ajustar polling dos sensores para 1000ms', 'Desativar logging desnecessário em disco', 'Garantir prioridade normal do processo']
  },
  {
    id: 'ea',
    name: 'EA App',
    icon: eaIcon,
    iconBg: 'bg-[#FF4747]',
    category: 'Launcher & Store',
    status: 'default',
    description: 'Impede a inicialização do EA Background Service no boot do Windows, desativa o overlay conflitante e limpa crash dumps antigos.',
    actions: ['Remover background service do arranque', 'Desativar overlay intrusivo no jogo', 'Limpar cache de logs e telemetria']
  }
];

interface AppTunerViewProps {
  onApplyTune: (appName: string, actionDesc: string) => Promise<void>;
  isOperating: boolean;
}

export const AppTunerView: React.FC<AppTunerViewProps> = ({
  onApplyTune,
  isOperating
}) => {
  const [apps, setApps] = useState<TunableApp[]>(APPS_LIST);
  const [runningAppId, setRunningAppId] = useState<string | null>(null);

  const handleTune = async (app: TunableApp) => {
    setRunningAppId(app.id);
    try {
      await onApplyTune(app.name, app.description);
      setApps((prev) =>
        prev.map((a) => (a.id === app.id ? { ...a, status: 'optimized' } : a))
      );
    } finally {
      setRunningAppId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#10172A] border border-[#1E293B] rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              Otimização de Terceiros & Launchers
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            App Tuner
          </h2>
          <p className="text-xs text-gray-300 mt-1 max-w-2xl leading-relaxed">
            Ajuste e limpe aplicações populares como Discord, Steam, Epic Games, browsers e drivers para que não roubem FPS, ciclos de CPU nem memória RAM em segundo plano.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">
            {apps.filter((a) => a.status === 'optimized').length} de {apps.length} otimizadas
          </span>
        </div>
      </div>

      {/* Grid of Apps */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {apps.map((app) => {
          const isOptimized = app.status === 'optimized';
          const isBusy = runningAppId === app.id;

          return (
            <div
              key={app.id}
              className={`rounded-2xl border p-5 transition-all flex flex-col justify-between ${
                isOptimized
                  ? 'bg-[#121D33] border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                  : 'bg-[#121B2E] border-[#1E293B] hover:border-[#2C3B5E]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl ${app.iconBg} flex items-center justify-center p-2.5 shadow-md shrink-0`}>
                      <img src={app.icon} alt={app.name} className="w-full h-full object-contain pointer-events-none" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">{app.name}</h4>
                      <span className="text-[10px] text-gray-400">{app.category}</span>
                    </div>
                  </div>

                  {isOptimized ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      <Check className="w-3 h-3" />
                      Otimizado
                    </span>
                  ) : (
                    <span className="text-[10px] text-gray-400 font-mono">Padrão</span>
                  )}
                </div>

                <p className="text-xs text-gray-300 leading-relaxed mb-3">
                  {app.description}
                </p>

                <div className="space-y-1 mb-4">
                  {app.actions.map((act, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] text-gray-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                      <span>{act}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                disabled={isOperating || isBusy}
                onClick={() => handleTune(app)}
                className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  isOptimized
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30'
                    : 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-md shadow-cyan-600/20'
                } disabled:opacity-50`}
              >
                {isBusy ? (
                  <span>A Otimizar...</span>
                ) : isOptimized ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Re-aplicar Otimização</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>Otimizar {app.name}</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
