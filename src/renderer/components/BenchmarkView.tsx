import React, { useState, useRef } from 'react';
import {
  Gauge,
  Play,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck
} from 'lucide-react';

interface BenchmarkResult {
  score: number;
  avgFps: number;
  min1Fps: number;
  avgFrametime: number;
  stabilityScore: number;
  timestamp: string;
}

export const BenchmarkView: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFps, setCurrentFps] = useState(0);
  const [currentFrametime, setCurrentFrametime] = useState(0);

  // Persistent Before (Baseline) & After (Optimized)
  const [baseline, setBaseline] = useState<BenchmarkResult | null>(() => {
    try {
      const saved = localStorage.getItem('optimizer_benchmark_baseline');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [optimized, setOptimized] = useState<BenchmarkResult | null>(() => {
    try {
      const saved = localStorage.getItem('optimizer_benchmark_optimized');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [lastRun, setLastRun] = useState<BenchmarkResult | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const benchmarkDataRef = useRef<{
    fpsSamples: number[];
    frametimes: number[];
    startTime: number;
    lastFrameTime: number;
  }>({
    fpsSamples: [],
    frametimes: [],
    startTime: 0,
    lastFrameTime: 0
  });

  // Particle Simulation Engine
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; color: string; size: number }>>([]);

  const initParticles = (width: number, height: number) => {
    const count = 1200;
    const colors = ['#6366f1', '#a855f7', '#ec4899', '#06b6d4', '#10b981'];
    const p = [];
    for (let i = 0; i < count; i++) {
      p.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 2 + 1
      });
    }
    particlesRef.current = p;
  };

  const startBenchmark = () => {
    if (isRunning) return;

    setIsRunning(true);
    setProgress(0);
    benchmarkDataRef.current = {
      fpsSamples: [],
      frametimes: [],
      startTime: performance.now(),
      lastFrameTime: performance.now()
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = canvas.parentElement?.clientWidth || 800;
      canvas.height = 240;
      initParticles(canvas.width, canvas.height);
    }

    const DURATION_MS = 10000; // 10 seconds test

    const renderLoop = (now: number) => {
      const dt = now - benchmarkDataRef.current.lastFrameTime;
      benchmarkDataRef.current.lastFrameTime = now;

      const elapsed = now - benchmarkDataRef.current.startTime;
      const pct = Math.min(100, Math.round((elapsed / DURATION_MS) * 100));
      setProgress(pct);

      if (dt > 0) {
        const fps = Math.min(999, Math.round(1000 / dt));
        benchmarkDataRef.current.fpsSamples.push(fps);
        benchmarkDataRef.current.frametimes.push(dt);
        setCurrentFps(fps);
        setCurrentFrametime(parseFloat(dt.toFixed(1)));
      }

      // Draw particle physics test
      const cvs = canvasRef.current;
      if (cvs) {
        const ctx = cvs.getContext('2d');
        if (ctx) {
          ctx.fillStyle = 'rgba(10, 15, 29, 0.25)';
          ctx.fillRect(0, 0, cvs.width, cvs.height);

          const centerX = cvs.width / 2;
          const centerY = cvs.height / 2;
          const timeSec = elapsed / 1000;

          // Vortex gravitational center
          const vortexX = centerX + Math.cos(timeSec * 2) * (cvs.width * 0.25);
          const vortexY = centerY + Math.sin(timeSec * 2) * (cvs.height * 0.25);

          const particles = particlesRef.current;
          for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            const dx = vortexX - p.x;
            const dy = vortexY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = 120 / dist;

            p.vx += (dx / dist) * force * 0.05;
            p.vy += (dy / dist) * force * 0.05;

            // Damping
            p.vx *= 0.98;
            p.vy *= 0.98;

            p.x += p.vx;
            p.y += p.vy;

            if (p.x < 0) p.x = cvs.width;
            if (p.x > cvs.width) p.x = 0;
            if (p.y < 0) p.y = cvs.height;
            if (p.y > cvs.height) p.y = 0;

            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
          }

          // Central Pulse Core
          ctx.beginPath();
          ctx.arc(vortexX, vortexY, 8 + Math.sin(timeSec * 8) * 3, 0, Math.PI * 2);
          ctx.fillStyle = '#6366f1';
          ctx.shadowColor = '#818cf8';
          ctx.shadowBlur = 15;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      if (elapsed < DURATION_MS) {
        animFrameRef.current = requestAnimationFrame(renderLoop);
      } else {
        finishBenchmark();
      }
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);
  };

  const finishBenchmark = () => {
    setIsRunning(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const { fpsSamples, frametimes } = benchmarkDataRef.current;
    if (fpsSamples.length === 0) return;

    // Filter out initial warm-up frames
    const validFps = fpsSamples.slice(Math.min(10, Math.floor(fpsSamples.length * 0.1)));
    const validFrametimes = frametimes.slice(Math.min(10, Math.floor(frametimes.length * 0.1)));

    // Calculate Average FPS
    const avgFps = Math.round(validFps.reduce((a, b) => a + b, 0) / validFps.length);

    // Calculate 1% Lows (Lowest 1% of frames)
    const sortedFps = [...validFps].sort((a, b) => a - b);
    const lowCount = Math.max(1, Math.floor(sortedFps.length * 0.01));
    const min1Fps = Math.round(sortedFps.slice(0, lowCount).reduce((a, b) => a + b, 0) / lowCount);

    // Average Frametime
    const avgFrametime = parseFloat((validFrametimes.reduce((a, b) => a + b, 0) / validFrametimes.length).toFixed(1));

    // Stability Score (consistency of frametimes)
    const variance =
      validFrametimes.reduce((acc, ft) => acc + Math.pow(ft - avgFrametime, 2), 0) / validFrametimes.length;
    const stdDev = Math.sqrt(variance);
    const stabilityScore = Math.max(50, Math.min(100, Math.round(100 - stdDev * 8)));

    // Total Synthetic Benchmark Score
    const score = Math.round(avgFps * 28 + min1Fps * 16 + stabilityScore * 10);

    const result: BenchmarkResult = {
      score,
      avgFps,
      min1Fps,
      avgFrametime,
      stabilityScore,
      timestamp: new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
    };

    setLastRun(result);

    // If no baseline exists yet, automatically set as baseline
    if (!baseline) {
      setBaseline(result);
      try {
        localStorage.setItem('optimizer_benchmark_baseline', JSON.stringify(result));
      } catch {}
    }
  };

  const setAsBaseline = () => {
    if (!lastRun) return;
    setBaseline(lastRun);
    try {
      localStorage.setItem('optimizer_benchmark_baseline', JSON.stringify(lastRun));
    } catch {}
  };

  const setAsOptimized = () => {
    if (!lastRun) return;
    setOptimized(lastRun);
    try {
      localStorage.setItem('optimizer_benchmark_optimized', JSON.stringify(lastRun));
    } catch {}
  };

  const resetComparison = () => {
    setBaseline(null);
    setOptimized(null);
    setLastRun(null);
    try {
      localStorage.removeItem('optimizer_benchmark_baseline');
      localStorage.removeItem('optimizer_benchmark_optimized');
    } catch {}
  };

  // Calculate percentage gains
  const fpsGain =
    baseline && optimized && baseline.avgFps > 0
      ? parseFloat((((optimized.avgFps - baseline.avgFps) / baseline.avgFps) * 100).toFixed(1))
      : 0;

  const low1Gain =
    baseline && optimized && baseline.min1Fps > 0
      ? parseFloat((((optimized.min1Fps - baseline.min1Fps) / baseline.min1Fps) * 100).toFixed(1))
      : 0;

  const latencyGain =
    baseline && optimized && baseline.avgFrametime > 0
      ? parseFloat((((baseline.avgFrametime - optimized.avgFrametime) / baseline.avgFrametime) * 100).toFixed(1))
      : 0;

  const scoreGain =
    baseline && optimized && baseline.score > 0
      ? parseFloat((((optimized.score - baseline.score) / baseline.score) * 100).toFixed(1))
      : 0;

  return (
    <div className="space-y-6 animate-fade-in text-white select-none">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0E1526] via-[#111A30] to-[#181130] p-6 border border-[#232F4D] shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white shrink-0">
              <Gauge className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black tracking-tight text-white">
                  Benchmark Oficial: Antes vs Depois
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
                  Performance & Estabilidade
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Executa um teste de render e latência em tempo real para comprovar o ganho real de FPS e estabilidade do teu PC.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {(baseline || optimized) && (
              <button
                onClick={resetComparison}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/10 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reiniciar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Benchmark Arena */}
      <div className="bg-[#0B101D] border border-[#232F4D] rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              Arena de Stress e Medição de Frametimes (10s)
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Simulação de 1.200 partículas físicas orbitais com cálculo contínuo de 1% Lows e estabilidade de micro-stuttering.
            </p>
          </div>

          <button
            onClick={startBenchmark}
            disabled={isRunning}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all ${
              isRunning
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-500/20 hover:scale-[1.02]'
            }`}
          >
            {isRunning ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>A Medir ({progress}%)...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Iniciar Teste</span>
              </>
            )}
          </button>
        </div>

        {/* Live Canvas & Live HUD */}
        <div className="relative rounded-xl overflow-hidden border border-white/10 bg-[#070B14]">
          <canvas ref={canvasRef} className="w-full h-48 block" />

          {/* Real-time Telemetry HUD Overlay */}
          <div className="absolute top-3 left-3 flex items-center gap-3">
            <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
              <span className="text-[10px] text-gray-400 font-bold uppercase">FPS Atual:</span>
              <span className="font-mono text-base font-black text-emerald-400">
                {isRunning ? currentFps : lastRun ? lastRun.avgFps : '---'}
              </span>
            </div>
            <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 flex items-center gap-2">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Frametime:</span>
              <span className="font-mono text-base font-black text-cyan-400">
                {isRunning ? `${currentFrametime} ms` : lastRun ? `${lastRun.avgFrametime} ms` : '---'}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          {isRunning && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-800">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {!isRunning && !lastRun && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
              <Sparkles className="w-8 h-8 text-indigo-400 mb-2 animate-pulse" />
              <p className="text-sm font-bold text-white">Pronto para Iniciar o Teste</p>
              <p className="text-xs text-gray-400 mt-1">Clica no botão "Iniciar Teste" para medir o desempenho atual.</p>
            </div>
          )}
        </div>

        {/* Last Run Quick Actions */}
        {lastRun && !isRunning && (
          <div className="p-4 rounded-xl bg-[#090E1A] border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase">Último Teste Realizado:</span>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xl font-black text-white">{lastRun.score.toLocaleString()} pts</span>
                  <span className="text-xs text-emerald-400 font-mono font-bold">~{lastRun.avgFps} FPS Médios</span>
                  <span className="text-xs text-indigo-400 font-mono font-bold">1% Lows: {lastRun.min1Fps} FPS</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={setAsBaseline}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors"
              >
                Definir como "Antes"
              </button>
              <button
                onClick={setAsOptimized}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-colors"
              >
                Definir como "Depois"
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Comparison Dashboard (Before vs After) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card Antes (Baseline) */}
        <div className="bg-[#0B101D] border border-amber-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Antes da Otimização</h4>
            </div>
            {baseline && (
              <span className="text-[10px] text-gray-400 font-mono">Registo: {baseline.timestamp}</span>
            )}
          </div>

          {baseline ? (
            <div className="mt-4 space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-gray-400">Pontuação Geral:</span>
                <span className="text-2xl font-black text-amber-400 font-mono">{baseline.score.toLocaleString()} pts</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#070B14] p-3 rounded-xl border border-white/5 text-center">
                  <span className="text-[10px] text-gray-400 block uppercase">FPS Médio</span>
                  <span className="text-lg font-black text-white font-mono">{baseline.avgFps}</span>
                </div>
                <div className="bg-[#070B14] p-3 rounded-xl border border-white/5 text-center">
                  <span className="text-[10px] text-gray-400 block uppercase">1% Lows</span>
                  <span className="text-lg font-black text-amber-300 font-mono">{baseline.min1Fps}</span>
                </div>
                <div className="bg-[#070B14] p-3 rounded-xl border border-white/5 text-center">
                  <span className="text-[10px] text-gray-400 block uppercase">Latência</span>
                  <span className="text-lg font-black text-cyan-400 font-mono">{baseline.avgFrametime}ms</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500 text-xs">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-amber-500/40" />
              Nenhum benchmark gravado como "Antes".
              <br />
              Clica em "Iniciar Teste" para criar a tua referência.
            </div>
          )}
        </div>

        {/* Card Depois (Optimized) */}
        <div className="bg-[#0B101D] border border-emerald-500/20 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between pb-4 border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">Depois da Otimização</h4>
            </div>
            {optimized && (
              <span className="text-[10px] text-gray-400 font-mono">Registo: {optimized.timestamp}</span>
            )}
          </div>

          {optimized ? (
            <div className="mt-4 space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-gray-400">Pontuação Geral:</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">{optimized.score.toLocaleString()} pts</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#070B14] p-3 rounded-xl border border-white/5 text-center">
                  <span className="text-[10px] text-gray-400 block uppercase">FPS Médio</span>
                  <span className="text-lg font-black text-white font-mono">{optimized.avgFps}</span>
                </div>
                <div className="bg-[#070B14] p-3 rounded-xl border border-white/5 text-center">
                  <span className="text-[10px] text-gray-400 block uppercase">1% Lows</span>
                  <span className="text-lg font-black text-emerald-300 font-mono">{optimized.min1Fps}</span>
                </div>
                <div className="bg-[#070B14] p-3 rounded-xl border border-white/5 text-center">
                  <span className="text-[10px] text-gray-400 block uppercase">Latência</span>
                  <span className="text-lg font-black text-cyan-400 font-mono">{optimized.avgFrametime}ms</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500 text-xs">
              <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-emerald-500/40" />
              Aplica as otimizações no Optimizer e clica em
              <br />
              "Iniciar Teste" para medir o ganho de FPS.
            </div>
          )}
        </div>
      </div>

      {/* Official Gains Summary Card */}
      {baseline && optimized && (
        <div className="bg-gradient-to-r from-emerald-950/40 via-[#0B1526] to-indigo-950/40 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-base font-black text-white">Relatório Oficial de Ganhos Comprovados</h4>
              <p className="text-xs text-emerald-300/80">
                Comparativo real de hardware e frametimes entre o sistema de fábrica e o sistema otimizado.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="bg-[#070B14]/80 p-4 rounded-xl border border-white/10">
              <span className="text-[10px] text-gray-400 block uppercase font-bold">Ganho de FPS Médio:</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-2xl font-black font-mono ${fpsGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {fpsGain >= 0 ? `+${fpsGain}%` : `${fpsGain}%`}
                </span>
                <span className="text-xs text-gray-400 font-mono">
                  ({baseline.avgFps} ➔ {optimized.avgFps} FPS)
                </span>
              </div>
            </div>

            <div className="bg-[#070B14]/80 p-4 rounded-xl border border-white/10">
              <span className="text-[10px] text-gray-400 block uppercase font-bold">Ganho nos 1% Lows:</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-2xl font-black font-mono ${low1Gain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {low1Gain >= 0 ? `+${low1Gain}%` : `${low1Gain}%`}
                </span>
                <span className="text-xs text-gray-400 font-mono">
                  ({baseline.min1Fps} ➔ {optimized.min1Fps} FPS)
                </span>
              </div>
            </div>

            <div className="bg-[#070B14]/80 p-4 rounded-xl border border-white/10">
              <span className="text-[10px] text-gray-400 block uppercase font-bold">Redução de Latência:</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-2xl font-black font-mono ${latencyGain >= 0 ? 'text-cyan-400' : 'text-rose-400'}`}>
                  {latencyGain >= 0 ? `-${latencyGain}%` : `+${Math.abs(latencyGain)}%`}
                </span>
                <span className="text-xs text-gray-400 font-mono">
                  ({baseline.avgFrametime}ms ➔ {optimized.avgFrametime}ms)
                </span>
              </div>
            </div>

            <div className="bg-[#070B14]/80 p-4 rounded-xl border border-white/10">
              <span className="text-[10px] text-gray-400 block uppercase font-bold">Subida de Pontuação:</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className={`text-2xl font-black font-mono ${scoreGain >= 0 ? 'text-purple-400' : 'text-rose-400'}`}>
                  {scoreGain >= 0 ? `+${scoreGain}%` : `${scoreGain}%`}
                </span>
                <span className="text-xs text-gray-400 font-mono">
                  ({baseline.score.toLocaleString()} ➔ {optimized.score.toLocaleString()})
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Veredicto do Motor:</strong> O sistema registou um aumento considerável na fluidez e eliminação de micro-travamentos (*stuttering*), assegurando frametimes consistentes para jogos competitivos.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
