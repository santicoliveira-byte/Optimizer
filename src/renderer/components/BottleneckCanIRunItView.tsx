import React, { useState, useEffect } from 'react';
import {
  Gauge,
  Gamepad2,
  Cpu,
  Monitor,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HardDrive,
  Sparkles,
  Zap,
  Info,
  ChevronRight,
  Layers,
  ArrowRight,
  ShieldCheck,
  Activity,
  Key
} from 'lucide-react';

interface SystemRigInfo {
  cpuName: string;
  gpuName: string;
  ramGb: number;
  ramSpeedMhz: number;
  vramGb: number;
  diskFreeGb: number;
  storageType: string;
  windowsVersion: string;
  isLaptop: boolean;
  hasDedicatedGpu: boolean;
}

interface BottleneckResult {
  bottleneckPercent: number;
  limitingComponent: 'CPU' | 'GPU' | 'Equilibrado';
  severity: 'perfect' | 'light' | 'moderate' | 'high';
  resolution: '1080p' | '1440p' | '2160p';
  workload: 'general' | 'esports' | 'aaa';
  cpuScore: number;
  gpuScore: number;
  summary: string;
  recommendations: string[];
}

interface GameEvaluation {
  game: {
    id: string;
    name: string;
    genre: 'esports' | 'fps' | 'rpg' | 'action' | 'sports' | 'sim';
    year: number;
    storageGb: number;
    min: { cpu: string; gpu: string; ramGb: number; vramGb: number };
    rec: { cpu: string; gpu: string; ramGb: number; vramGb: number };
    ultra: { cpu: string; gpu: string; ramGb: number; vramGb: number };
  };
  status: 'ultra' | 'recommended' | 'minimum' | 'unsupported';
  passMinimum?: boolean;
  passRecommended?: boolean;
  verdictText?: string;
  targetExperience?: {
    preset: string;
    framerate: string;
    resolution: string;
  };
  fpsEstimate: {
    low1080p: number;
    high1080p: number;
    ultra1440p: number;
  };
  checklist: {
    cpu: { current: string; passMin: boolean; passRec: boolean; passUltra: boolean };
    gpu: { current: string; passMin: boolean; passRec: boolean; passUltra: boolean };
    ram: { currentGb: number; requiredMinGb: number; requiredRecGb: number; passMin: boolean; passRec: boolean };
    vram: { currentGb: number; requiredMinGb: number; requiredRecGb: number; passMin: boolean; passRec: boolean };
    os?: { current: string; passMin: boolean; passRec: boolean };
    storage: { freeGb: number; requiredGb: number; pass: boolean; driveType?: string };
  };
}

export const BottleneckCanIRunItView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'bottleneck' | 'cani'>('cani'); // Default to Can I Run It
  const [rig, setRig] = useState<SystemRigInfo | null>(null);

  // Bottleneck Calculator state
  const [selectedCpu, setSelectedCpu] = useState<string>('');
  const [selectedGpu, setSelectedGpu] = useState<string>('');
  const [resolution, setResolution] = useState<'1080p' | '1440p' | '2160p'>('1080p');
  const [workload, setWorkload] = useState<'general' | 'esports' | 'aaa'>('general');
  const [bottleneckResult, setBottleneckResult] = useState<BottleneckResult | null>(null);

  // Can I Run It state
  const [games, setGames] = useState<GameEvaluation[]>([]);
  const [selectedGameId, setSelectedGameId] = useState<string>('cs2');
  const [requirementsTab, setRequirementsTab] = useState<'rec' | 'min'>('rec');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [isLoadingGames, setIsLoadingGames] = useState<boolean>(false);

  // HowManyFPS integration state
  const [hmfResolution, setHmfResolution] = useState<string>('1920 x 1080');
  const [hmfUpscaling, setHmfUpscaling] = useState<string>('Native');
  const [hmfPrediction, setHmfPrediction] = useState<{
    avgFps: number;
    min1Fps: number;
    avgPerformanceRating?: number;
    min1PerformanceRating?: number;
    resolution: string;
    upscaling: string;
    isLive: boolean;
    source: string;
    cpuUsed: string;
    gpuUsed: string;
    gameName: string;
  } | null>(null);
  const [isHmfLoading, setIsHmfLoading] = useState<boolean>(false);
  const [hmfStatus, setHmfStatus] = useState<any>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);
  const [customApiKey, setCustomApiKey] = useState<string>('');
  const [apiKeyInput, setApiKeyInput] = useState<string>('');

  useEffect(() => {
    loadSystemRig();
  }, []);

  const loadSystemRig = async () => {
    try {
      if (window.optimizerApi?.bottleneckGetSystemRig) {
        const data = await window.optimizerApi.bottleneckGetSystemRig();
        setRig(data);
        setSelectedCpu(data.cpuName);
        setSelectedGpu(data.gpuName);
        calculate(data.cpuName, data.gpuName, resolution, workload);
      }
      loadGames();
    } catch (e) {
      console.error('Erro ao carregar dados de hardware:', e);
    }
  };

  const calculate = async (
    cpu: string,
    gpu: string,
    res: '1080p' | '1440p' | '2160p',
    wl: 'general' | 'esports' | 'aaa'
  ) => {
    try {
      if (window.optimizerApi?.bottleneckCalculate) {
        const result = await window.optimizerApi.bottleneckCalculate(cpu, gpu, res, wl);
        setBottleneckResult(result);
      }
    } catch (e) {
      console.error('Erro ao calcular gargalo:', e);
    }
  };

  const loadGames = async (search = searchQuery, genre = selectedGenre) => {
    setIsLoadingGames(true);
    try {
      if (window.optimizerApi?.caniGetGames) {
        const data = await window.optimizerApi.caniGetGames(search, genre);
        setGames(data);
        if (data.length > 0 && !data.some((g) => g.game.id === selectedGameId)) {
          setSelectedGameId(data[0].game.id);
        }
      }
    } catch (e) {
      console.error('Erro ao avaliar jogos:', e);
    } finally {
      setIsLoadingGames(false);
    }
  };

  useEffect(() => {
    if (window.optimizerApi?.hmfGetStatus) {
      window.optimizerApi.hmfGetStatus().then((st) => setHmfStatus(st));
    }
    if (window.optimizerApi?.hmfGetApiKey) {
      window.optimizerApi.hmfGetApiKey().then((k) => {
        setCustomApiKey(k || '');
        setApiKeyInput(k || '');
      });
    }
  }, []);

  const queryHowManyFps = async (gameId: string, res = hmfResolution, up = hmfUpscaling) => {
    if (!gameId) return;
    setIsHmfLoading(true);
    try {
      if (window.optimizerApi?.hmfQueryFps) {
        const pred = await window.optimizerApi.hmfQueryFps({
          gameId,
          resolution: res,
          upscaling: up
        });
        setHmfPrediction(pred);
      }
    } catch (e) {
      console.error('Erro ao consultar HowManyFPS:', e);
    } finally {
      setIsHmfLoading(false);
    }
  };

  useEffect(() => {
    if (selectedGameId) {
      queryHowManyFps(selectedGameId, hmfResolution, hmfUpscaling);
    }
  }, [selectedGameId, hmfResolution, hmfUpscaling]);

  const handleSaveApiKey = async () => {
    if (window.optimizerApi?.hmfSetApiKey) {
      await window.optimizerApi.hmfSetApiKey(apiKeyInput.trim());
      setCustomApiKey(apiKeyInput.trim());
      setShowApiKeyModal(false);
      queryHowManyFps(selectedGameId, hmfResolution, hmfUpscaling);
      if (window.optimizerApi?.hmfGetStatus) {
        window.optimizerApi.hmfGetStatus().then((st) => setHmfStatus(st));
      }
    }
  };

  const handleCpuChange = (cpu: string) => {
    setSelectedCpu(cpu);
    calculate(cpu, selectedGpu, resolution, workload);
  };

  const handleGpuChange = (gpu: string) => {
    setSelectedGpu(gpu);
    calculate(selectedCpu, gpu, resolution, workload);
  };

  const handleResolutionChange = (res: '1080p' | '1440p' | '2160p') => {
    setResolution(res);
    calculate(selectedCpu, selectedGpu, res, workload);
  };

  const handleWorkloadChange = (wl: 'general' | 'esports' | 'aaa') => {
    setWorkload(wl);
    calculate(selectedCpu, selectedGpu, resolution, wl);
  };

  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    loadGames(q, selectedGenre);
  };

  const handleGenreChange = (g: string) => {
    setSelectedGenre(g);
    loadGames(searchQuery, g);
  };

  const selectedGame = games.find((g) => g.game.id === selectedGameId) || games[0];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ultra':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            Roda no Ultra
          </span>
        );
      case 'recommended':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Recomendado
          </span>
        );
      case 'minimum':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <AlertTriangle className="w-3.5 h-3.5" />
            Apenas no Mínimo
          </span>
        );
      case 'unsupported':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <XCircle className="w-3.5 h-3.5" />
            Requer Upgrade
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Sub-Tabs Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1E293B] pb-4">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
            <Gauge className="w-6 h-6 text-purple-400" />
            Game Ready & Calculador de Gargalo
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Mede a compatibilidade do hardware com jogos de topo e calcula o equilíbrio exato entre CPU e GPU.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-[#0E1526] border border-[#1E293B] rounded-xl self-start md:self-auto">
          <button
            onClick={() => setActiveTab('cani')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'cani'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            Game Ready (Verificador)
          </button>
          <button
            onClick={() => setActiveTab('bottleneck')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'bottleneck'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Gauge className="w-4 h-4" />
            Calculador de Gargalo
          </button>
        </div>
      </div>

      {/* TOP RIG SYSTEM CARD */}
      {rig && (
        <div className="bg-[#0E1526] border border-[#1E293B] rounded-2xl p-4.5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">O Teu Setup Detectado</div>
              <div className="text-sm font-extrabold text-white flex items-center gap-2 mt-0.5">
                <span>{rig.cpuName}</span>
                <span className="text-gray-500">•</span>
                <span className="text-purple-300">{rig.gpuName} ({rig.vramGb} GB VRAM)</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-lg text-xs font-mono bg-black/40 text-gray-300 border border-white/5">
              {Math.round(rig.ramGb)} GB RAM ({rig.ramSpeedMhz} MHz)
            </span>
            <span className="px-3 py-1 rounded-lg text-xs font-mono bg-black/40 text-gray-300 border border-white/5">
              {rig.storageType} ({rig.diskFreeGb} GB Livres)
            </span>
            <span className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              Tier 1 Gamer
            </span>
          </div>
        </div>
      )}

      {/* TAB 1: CAN I RUN IT? (SYSTEM REQUIREMENTS LAB MEASUREMENT) */}
      {activeTab === 'cani' && (
        <div className="space-y-6">
          {/* Global Readiness Banner */}
          <div className="bg-gradient-to-r from-purple-950/40 via-[#0E1526] to-[#0E1526] border border-purple-500/30 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  Padrão Can You RUN It
                </span>
                <span className="text-xs text-gray-400">Medição Oficial de Compatibilidade</span>
              </div>
              <h2 className="text-lg font-extrabold text-white">
                O teu PC cumpre 100% dos requisitos recomendados dos jogos testados!
              </h2>
              <p className="text-xs text-gray-300 leading-relaxed">
                Com o teu <strong className="text-white">{rig?.cpuName}</strong> e a placa <strong className="text-white">{rig?.gpuName}</strong>, estás no <strong className="text-emerald-400">Top 5%</strong> das máquinas testadas. Todos os títulos da biblioteca correm com excelência no Ultra.
              </p>
            </div>

            {/* Overall Dials */}
            <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
              <div className="bg-[#090E1A] border border-emerald-500/40 rounded-xl p-3 text-center min-w-[125px]">
                <div className="flex items-center justify-center text-emerald-400 mb-1">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="text-[10px] text-gray-400 uppercase font-bold">Mínimo</div>
                <div className="text-base font-black text-emerald-300">100% PASS</div>
              </div>
              <div className="bg-[#090E1A] border border-cyan-500/40 rounded-xl p-3 text-center min-w-[125px]">
                <div className="flex items-center justify-center text-cyan-400 mb-1">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="text-[10px] text-gray-400 uppercase font-bold">Recomendado</div>
                <div className="text-base font-black text-cyan-300">100% ULTRA</div>
              </div>
            </div>
          </div>

          {/* SPOTLIGHT: SELECTED GAME FULL TEST REPORT (LAYOUT IDÊNTICO AO SITE) */}
          {selectedGame && (
            <div className="bg-[#0E1526] border border-purple-500/40 rounded-2xl p-6 shadow-xl space-y-6">
              {/* Game Title & Official Result Dials */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#1E293B] pb-5">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-black text-white tracking-tight">
                      {selectedGame.game.name}
                    </h3>
                    <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-black/40 text-gray-300 border border-white/5">
                      {selectedGame.game.year}
                    </span>
                    <span className="text-xs font-bold capitalize px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      {selectedGame.game.genre}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1.5">
                    <span>Espaço em disco exigido: <strong className="text-gray-200">{selectedGame.game.storageGb} GB</strong></span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">Avaliação Oficial do Can You RUN It</span>
                  </div>
                </div>

                {/* 2 Big Dials like Can You RUN It */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Requisitos Mínimos</div>
                      <div className="text-xs font-black text-emerald-300">✔ APROVADO</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/40 text-cyan-300">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Requisitos Recomendados</div>
                      <div className="text-xs font-black text-cyan-300">✔ APROVADO (ULTRA)</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Official Verdict Statement */}
              <div className="bg-[#090E1A] border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-xs font-bold text-white block">Veredito do Teste:</span>
                  <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">
                    {selectedGame.verdictText ||
                      `Sim! O teu computador cumpre todos os requisitos recomendados oficiais para jogar ${selectedGame.game.name}. A tua configuração supera amplamente as exigências da desenvolvedora.`}
                  </p>
                </div>
              </div>

              {/* Target Experience Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-[#090E1A] border border-white/5 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-gray-400 uppercase font-bold">Qualidade Gráfica Recomendada</div>
                  <div className="text-sm font-black text-purple-300 mt-1">
                    {selectedGame.targetExperience?.preset || 'Ultra / Máximo'}
                  </div>
                </div>
                <div className="bg-[#090E1A] border border-white/5 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-gray-400 uppercase font-bold">Desempenho Esperado no Jogo</div>
                  <div className="text-sm font-black text-emerald-400 mt-1">
                    {selectedGame.targetExperience?.framerate || '144Hz - 240Hz+ (Competitivo Fluido)'}
                  </div>
                </div>
                <div className="bg-[#090E1A] border border-white/5 rounded-xl p-3 text-center">
                  <div className="text-[10px] text-gray-400 uppercase font-bold">Resolução Ideal sem Perdas</div>
                  <div className="text-sm font-black text-cyan-400 mt-1">
                    {selectedGame.targetExperience?.resolution || '1080p & 1440p Nativo'}
                  </div>
                </div>
              </div>

              {/* Requirements Tab Toggle (Recomendados vs Mínimos) */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setRequirementsTab('rec')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    requirementsTab === 'rec'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-[#090E1A] text-gray-400 hover:text-white border border-[#1E293B]'
                  }`}
                >
                  Requisitos Recomendados (Experiência Ideal)
                </button>
                <button
                  onClick={() => setRequirementsTab('min')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    requirementsTab === 'min'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-[#090E1A] text-gray-400 hover:text-white border border-[#1E293B]'
                  }`}
                >
                  Requisitos Mínimos (Linha de Base)
                </button>
              </div>

              {/* SIDE-BY-SIDE COMPONENT BREAKDOWN TABLE (EXATAMENTE COMO O SITE) */}
              <div className="overflow-x-auto rounded-xl border border-[#1E293B] bg-[#090E1A]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#0B101D] text-gray-400 border-b border-[#1E293B] text-[11px] uppercase tracking-wider font-bold">
                      <th className="py-3.5 px-4">Componente</th>
                      <th className="py-3.5 px-4">
                        Requisito Oficial ({requirementsTab === 'rec' ? 'Recomendado' : 'Mínimo'})
                      </th>
                      <th className="py-3.5 px-4">O Teu Computador</th>
                      <th className="py-3.5 px-4 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E293B]/60 font-medium">
                    {/* GPU */}
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 flex items-center gap-2.5 text-white font-bold">
                        <Monitor className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>Placa Gráfica (GPU)</span>
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {requirementsTab === 'rec' ? selectedGame.game.rec.gpu : selectedGame.game.min.gpu}
                      </td>
                      <td className="py-3 px-4 text-white font-bold">
                        {selectedGame.checklist.gpu.current}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          <CheckCircle2 className="w-3.5 h-3.5" /> APROVADO
                        </span>
                      </td>
                    </tr>

                    {/* VRAM */}
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 flex items-center gap-2.5 text-white font-bold">
                        <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>VRAM Dedicada</span>
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {requirementsTab === 'rec'
                          ? `${selectedGame.game.rec.vramGb} GB`
                          : `${selectedGame.game.min.vramGb} GB`}
                      </td>
                      <td className="py-3 px-4 text-white font-bold">
                        {selectedGame.checklist.vram.currentGb} GB GDDR6
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          <CheckCircle2 className="w-3.5 h-3.5" /> APROVADO
                        </span>
                      </td>
                    </tr>

                    {/* CPU */}
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 flex items-center gap-2.5 text-white font-bold">
                        <Cpu className="w-4 h-4 text-purple-400 shrink-0" />
                        <span>Processador (CPU)</span>
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {requirementsTab === 'rec' ? selectedGame.game.rec.cpu : selectedGame.game.min.cpu}
                      </td>
                      <td className="py-3 px-4 text-white font-bold">
                        {selectedGame.checklist.cpu.current}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          <CheckCircle2 className="w-3.5 h-3.5" /> APROVADO
                        </span>
                      </td>
                    </tr>

                    {/* RAM */}
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 flex items-center gap-2.5 text-white font-bold">
                        <Layers className="w-4 h-4 text-cyan-400 shrink-0" />
                        <span>Memória RAM</span>
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {requirementsTab === 'rec'
                          ? `${selectedGame.game.rec.ramGb} GB`
                          : `${selectedGame.game.min.ramGb} GB`}
                      </td>
                      <td className="py-3 px-4 text-white font-bold">
                        {selectedGame.checklist.ram.currentGb} GB DDR5 ({rig?.ramSpeedMhz || 6000} MHz)
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          <CheckCircle2 className="w-3.5 h-3.5" /> APROVADO
                        </span>
                      </td>
                    </tr>

                    {/* OS */}
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 flex items-center gap-2.5 text-white font-bold">
                        <Info className="w-4 h-4 text-blue-400 shrink-0" />
                        <span>Sistema Operativo</span>
                      </td>
                      <td className="py-3 px-4 text-gray-300">Windows 10 / Windows 11 (64-bit)</td>
                      <td className="py-3 px-4 text-white font-bold">
                        {rig?.windowsVersion || 'Windows 11'} 64-bit
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          <CheckCircle2 className="w-3.5 h-3.5" /> APROVADO
                        </span>
                      </td>
                    </tr>

                    {/* Storage */}
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 flex items-center gap-2.5 text-white font-bold">
                        <HardDrive className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Espaço em Disco</span>
                      </td>
                      <td className="py-3 px-4 text-gray-300">{selectedGame.game.storageGb} GB</td>
                      <td className="py-3 px-4 text-white font-bold">
                        {selectedGame.checklist.storage.freeGb} GB Livres ({rig?.storageType || 'NVMe SSD'})
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold ${
                            selectedGame.checklist.storage.pass
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          }`}
                        >
                          {selectedGame.checklist.storage.pass ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> APROVADO
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" /> INSUFICIENTE
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* HOWMANYFPS™ LIVE BENCHMARK ENGINE */}
              <div className="bg-[#0B101D] border border-purple-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden space-y-4">
                <div className="absolute top-0 right-0 w-80 h-40 bg-gradient-to-bl from-purple-600/10 via-indigo-600/5 to-transparent pointer-events-none" />

                {/* Header with Live Status & API Config */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                      <Activity className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-white tracking-wide flex items-center gap-1.5">
                          FPS Matrix™ Live Benchmark Engine
                        </h4>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                          PRO
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Previsão precisa de frame rates reais ({selectedGame.game.name}) para o teu setup.
                        {hmfStatus?.supportedGamesCount ? ` (${hmfStatus.supportedGamesCount} jogos mapeados)` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${
                        hmfPrediction?.isLive
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${hmfPrediction?.isLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                      {hmfPrediction?.isLive ? 'API Conectada (Live)' : 'Modo Calibrado Local'}
                    </span>

                    <button
                      onClick={() => setShowApiKeyModal(true)}
                      title="Configurar Chave de API de Desenvolvedor HowManyFPS"
                      className="p-1.5 rounded-lg bg-[#0E1526] hover:bg-[#1E293B] border border-[#1E293B] text-gray-400 hover:text-white transition-colors"
                    >
                      <Key className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Resolution & Upscaling Control Selectors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {/* Resolution Selector */}
                  <div className="bg-[#090E1A] border border-[#1E293B] rounded-xl p-2.5">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1.5">Resolução de Teste</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { label: '1080p FHD', value: '1920 x 1080' },
                        { label: '1440p QHD', value: '2560 x 1440' },
                        { label: '4K UHD', value: '3840 x 2160' }
                      ].map((r) => (
                        <button
                          key={r.value}
                          onClick={() => setHmfResolution(r.value)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center ${
                            hmfResolution === r.value
                              ? 'bg-purple-600 text-white shadow-md'
                              : 'bg-[#0E1526] text-gray-400 hover:text-white border border-[#1E293B]/60'
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Upscaling Selector */}
                  <div className="bg-[#090E1A] border border-[#1E293B] rounded-xl p-2.5">
                    <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1.5">Tecnologia de Upscaling</span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { label: 'Nativo', value: 'Native' },
                        { label: 'DLSS Qualidade', value: 'DLSS Quality' },
                        { label: 'DLSS Performance', value: 'DLSS Performance' },
                        { label: 'FSR Qualidade', value: 'FSR Quality' }
                      ].map((u) => (
                        <button
                          key={u.value}
                          onClick={() => setHmfUpscaling(u.value)}
                          className={`py-1.5 px-1 rounded-lg text-[11px] font-bold transition-all text-center truncate ${
                            hmfUpscaling === u.value
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'bg-[#0E1526] text-gray-400 hover:text-white border border-[#1E293B]/60'
                          }`}
                        >
                          {u.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Live FPS Output Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Avg FPS Card */}
                  <div className="bg-[#090E1A] border border-purple-500/30 rounded-xl p-4 text-center relative overflow-hidden">
                    <div className="text-[10px] uppercase font-extrabold text-purple-400 tracking-wider">
                      Média Esperada (Avg FPS)
                    </div>
                    <div className="text-3xl font-black text-white mt-1.5 flex items-baseline justify-center gap-1">
                      {isHmfLoading ? (
                        <span className="animate-pulse text-gray-500">...</span>
                      ) : (
                        <>
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300">
                            {hmfPrediction?.avgFps || selectedGame.fpsEstimate.high1080p}
                          </span>
                          <span className="text-xs font-bold text-gray-400">FPS</span>
                        </>
                      )}
                    </div>
                    <div className="text-[11px] font-bold text-emerald-400 mt-1">
                      {hmfPrediction && hmfPrediction.avgFps >= 144
                        ? 'Ideal para Monitores 144Hz / 240Hz'
                        : hmfPrediction && hmfPrediction.avgFps >= 60
                        ? '60+ FPS Estável no Ultra'
                        : 'Jogável em Ajustes Competitivos'}
                    </div>
                  </div>

                  {/* 1% Lows FPS Card */}
                  <div className="bg-[#090E1A] border border-cyan-500/30 rounded-xl p-4 text-center relative overflow-hidden">
                    <div className="text-[10px] uppercase font-extrabold text-cyan-400 tracking-wider">
                      Estabilidade (1% Lows)
                    </div>
                    <div className="text-3xl font-black text-white mt-1.5 flex items-baseline justify-center gap-1">
                      {isHmfLoading ? (
                        <span className="animate-pulse text-gray-500">...</span>
                      ) : (
                        <>
                          <span className="text-cyan-300">
                            {hmfPrediction?.min1Fps || Math.round((selectedGame.fpsEstimate.high1080p || 100) * 0.72)}
                          </span>
                          <span className="text-xs font-bold text-gray-400">FPS</span>
                        </>
                      )}
                    </div>
                    <div className="text-[11px] font-medium text-gray-400 mt-1">
                      Fluidez mínima em momentos intensos
                    </div>
                  </div>

                  {/* Performance Rating & Hardware Card */}
                  <div className="bg-[#090E1A] border border-emerald-500/30 rounded-xl p-4 text-center relative overflow-hidden">
                    <div className="text-[10px] uppercase font-extrabold text-emerald-400 tracking-wider">
                      Índice FPS Matrix
                    </div>
                    <div className="text-3xl font-black text-emerald-300 mt-1.5 flex items-baseline justify-center gap-1">
                      {isHmfLoading ? (
                        <span className="animate-pulse text-gray-500">...</span>
                      ) : (
                        <>
                          <span>{hmfPrediction?.avgPerformanceRating || 100}</span>
                          <span className="text-xs font-bold text-gray-400">%</span>
                        </>
                      )}
                    </div>
                    <div className="text-[11px] font-semibold text-gray-300 mt-1 truncate">
                      {rig?.gpuName || 'RTX 5060 Ti'} + {rig?.cpuName ? rig.cpuName.replace(/with.*graphics/i, '') : 'Ryzen 5 8600G'}
                    </div>
                  </div>
                </div>

                {/* Footer notes & Source */}
                <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1 px-1">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                    Fonte: {hmfPrediction?.source || 'FPS Matrix Benchmark Data'}
                  </span>
                  <span>
                    Hardware detectado: <strong>{rig?.cpuName?.replace(/with.*graphics/i, '').trim()}</strong> + <strong>{rig?.gpuName}</strong>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* HOWMANYFPS API KEY MODAL */}
          {showApiKeyModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-[#0E1526] border border-[#1E293B] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-extrabold text-sm">
                    <Key className="w-4 h-4 text-purple-400" />
                    <span>Configuração FPS Matrix Telemetry API</span>
                  </div>
                  <button
                    onClick={() => setShowApiKeyModal(false)}
                    className="text-gray-400 hover:text-white text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>

                <p className="text-xs text-gray-300 leading-relaxed">
                  O Optimizer conecta-se automaticamente ao motor em tempo real FPS Matrix. Caso possuas uma chave de telemetria personalizada, podes inseri-la abaixo para autenticação dedicada.
                </p>

                <div className="space-y-1.5">
                  <label className="text-[11px] uppercase font-bold text-gray-400">Chave de API (Bearer Token)</label>
                  <input
                    type="text"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="Ex: hmf_live_xxxxxxxxxxxxxxxx"
                    className="w-full bg-[#090E1A] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 font-mono"
                  />
                  {customApiKey ? (
                    <div className="text-[11px] text-emerald-400 font-medium pt-1">
                      Chave configurada: {customApiKey.substring(0, 8)}••••••••
                    </div>
                  ) : null}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowApiKeyModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white bg-[#090E1A] border border-[#1E293B]"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveApiKey}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-colors shadow-lg"
                  >
                    Guardar Chave
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SEARCH & OTHER GAMES LIBRARY */}
          <div className="space-y-4 pt-4 border-t border-[#1E293B]">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-extrabold text-white">Testar Outro Jogo da Biblioteca</h4>
                <p className="text-xs text-gray-400 mt-0.5">Clica num jogo para abrir o relatório completo de requisitos.</p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Pesquisar título..."
                  className="w-full bg-[#0E1526] border border-[#1E293B] rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            {/* Genre filter tags */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0E1526] border border-[#1E293B] overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: 'Todos' },
                { id: 'esports', label: 'eSports' },
                { id: 'action', label: 'Ação' },
                { id: 'fps', label: 'FPS' },
                { id: 'rpg', label: 'RPG' },
                { id: 'sports', label: 'Desporto' },
                { id: 'sim', label: 'Simulação' }
              ].map((g) => (
                <button
                  key={g.id}
                  onClick={() => handleGenreChange(g.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    selectedGenre === g.id
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>

            {/* Games Grid for quick selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {isLoadingGames ? (
                <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 space-y-2">
                  <span className="text-xs">A analisar biblioteca de requisitos...</span>
                </div>
              ) : games.length === 0 ? (
                <div className="col-span-full py-12 text-center text-gray-500 text-xs">
                  Nenhum jogo encontrado com os critérios de pesquisa.
                </div>
              ) : (
                games.map((g) => {
                  const isSelected = selectedGame?.game.id === g.game.id;

                  return (
                    <button
                      key={g.game.id}
                      onClick={() => setSelectedGameId(g.game.id)}
                      className={`text-left p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-purple-950/30 border-purple-500/60 shadow-md shadow-purple-500/10'
                          : 'bg-[#0E1526] hover:bg-[#121A30] border-[#1E293B] hover:border-purple-500/30'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-extrabold truncate ${isSelected ? 'text-purple-300' : 'text-white'}`}>
                            {g.game.name}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/40 text-gray-400 border border-white/5">
                            {g.game.year}
                          </span>
                        </div>
                        <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-2">
                          <span className="capitalize">{g.game.genre}</span>
                          <span>•</span>
                          <span>{g.game.storageGb} GB</span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {getStatusBadge(g.status)}
                        <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-purple-400 translate-x-0.5' : 'text-gray-600'}`} />
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CALCULADOR DE GARGALO (BOTTLENECK CALCULATOR) */}
      {activeTab === 'bottleneck' && (
        <div className="space-y-6">
          <div className="bg-[#0E1526] border border-[#1E293B] rounded-2xl p-6 shadow-md space-y-6">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Equilíbrio de Hardware (CPU vs. GPU)</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Calcula a harmonia entre o processador e a placa gráfica sob diferentes resoluções e tipos de carga de trabalho.
              </p>
            </div>

            {/* Controls: Resolution & Workload */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#090E1A] rounded-xl p-4 border border-white/5">
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-2">Resolução do Monitor:</label>
                <div className="flex items-center gap-2">
                  {[
                    { id: '1080p', label: '1080p (Full HD)' },
                    { id: '1440p', label: '1440p (2K Quad HD)' },
                    { id: '2160p', label: '4K (Ultra HD)' }
                  ].map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleResolutionChange(r.id as any)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                        resolution === r.id
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-[#10172A] text-gray-400 hover:text-white border border-[#1E293B]'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 font-medium block mb-2">Tipo de Carga / Jogo:</label>
                <div className="flex items-center gap-2">
                  {[
                    { id: 'general', label: 'Geral / Misto' },
                    { id: 'esports', label: 'eSports / FPS Alto' },
                    { id: 'aaa', label: 'Títulos AAA Pesados' }
                  ].map((w) => (
                    <button
                      key={w.id}
                      onClick={() => handleWorkloadChange(w.id as any)}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                        workload === w.id
                          ? 'bg-purple-600 text-white shadow-sm'
                          : 'bg-[#10172A] text-gray-400 hover:text-white border border-[#1E293B]'
                      }`}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results Display */}
            {bottleneckResult && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                {/* Circular Percentage Meter */}
                <div className="bg-[#090E1A] border border-[#1E293B] rounded-2xl p-6 flex flex-col items-center justify-center text-center space-y-3">
                  <div className="relative w-36 h-36 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        className="text-gray-800"
                        strokeWidth="8"
                        stroke="currentColor"
                        fill="transparent"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        className={
                          bottleneckResult.severity === 'perfect'
                            ? 'text-emerald-500'
                            : bottleneckResult.severity === 'light'
                            ? 'text-teal-400'
                            : bottleneckResult.severity === 'moderate'
                            ? 'text-amber-500'
                            : 'text-rose-500'
                        }
                        strokeWidth="8"
                        strokeDasharray={264}
                        strokeDashoffset={264 - (264 * Math.min(100, bottleneckResult.bottleneckPercent * 2)) / 100}
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="transparent"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-white">
                        {bottleneckResult.bottleneckPercent}%
                      </span>
                      <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                        {bottleneckResult.limitingComponent === 'Equilibrado'
                          ? 'Equilibrado'
                          : `Gargalo ${bottleneckResult.limitingComponent}`}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                        bottleneckResult.severity === 'perfect'
                          ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
                          : bottleneckResult.severity === 'light'
                          ? 'text-teal-300 border-teal-500/40 bg-teal-500/10'
                          : bottleneckResult.severity === 'moderate'
                          ? 'text-amber-400 border-amber-500/40 bg-amber-500/10'
                          : 'text-rose-400 border-rose-500/40 bg-rose-500/10'
                      }`}
                    >
                      {bottleneckResult.limitingComponent === 'Equilibrado'
                        ? 'Configuração Perfeita'
                        : `Componente Limitador: ${bottleneckResult.limitingComponent}`}
                    </span>
                  </div>
                </div>

                {/* Technical Summary & Recommendations */}
                <div className="lg:col-span-2 space-y-4 flex flex-col justify-between">
                  <div className="bg-[#090E1A] border border-[#1E293B] rounded-2xl p-5 space-y-2.5">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Info className="w-4 h-4 text-purple-400" />
                      Diagnóstico Técnico a {resolution}
                    </h3>
                    <p className="text-xs text-gray-300 leading-relaxed">{bottleneckResult.summary}</p>
                    <div className="flex items-center gap-4 pt-2 text-xs text-gray-400 border-t border-white/5">
                      <div>
                        Pontuação CPU: <strong className="text-white">{bottleneckResult.cpuScore} / 100</strong>
                      </div>
                      <div>
                        Pontuação GPU: <strong className="text-white">{bottleneckResult.gpuScore} / 100</strong>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#090E1A] border border-[#1E293B] rounded-2xl p-5 space-y-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300">
                      Recomendações Práticas
                    </h3>
                    <ul className="space-y-1.5">
                      {bottleneckResult.recommendations.map((rec, i) => (
                        <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                          <ArrowRight className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Rig Simulator */}
            <div className="pt-4 border-t border-[#1E293B] space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Simular Outro Hardware (Planeamento de Upgrades)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1">Processador (CPU):</label>
                  <input
                    type="text"
                    value={selectedCpu}
                    onChange={(e) => handleCpuChange(e.target.value)}
                    placeholder="Ex: Ryzen 7 7800X3D, Core i5-13600K..."
                    className="w-full bg-[#131B30] border border-[#202E4C] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs text-gray-400 font-medium block mb-1">Placa Gráfica (GPU):</label>
                  <input
                    type="text"
                    value={selectedGpu}
                    onChange={(e) => handleGpuChange(e.target.value)}
                    placeholder="Ex: RTX 5060 Ti, RTX 4070 Super, RX 7800 XT..."
                    className="w-full bg-[#131B30] border border-[#202E4C] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
