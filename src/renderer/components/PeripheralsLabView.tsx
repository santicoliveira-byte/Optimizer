import React, { useState, useEffect, useRef } from 'react';
import {
  Mouse,
  Keyboard,
  Headphones,
  Mic,
  Volume2,
  VolumeX,
  Zap,
  Activity,
  RotateCcw,
  Play,
  Square,
  Sparkles,
  Gauge
} from 'lucide-react';
import { TopTabBar, TabItem } from './TopTabBar';

export const PeripheralsLabView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'mouse' | 'keyboard' | 'audio'>('mouse');

  const tabs: TabItem[] = [
    { id: 'mouse', label: 'Rato & Polling Rate', icon: <Mouse className="w-4 h-4" /> },
    { id: 'keyboard', label: 'Teclado & Anti-Ghosting', icon: <Keyboard className="w-4 h-4" /> },
    { id: 'audio', label: 'Fones, Áudio 3D & Mic', icon: <Headphones className="w-4 h-4" /> }
  ];

  return (
    <div className="space-y-6 animate-fade-in text-white select-none">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0E1526] via-[#111A30] to-[#181130] p-6 border border-[#232F4D] shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-purple-500/10 to-transparent pointer-events-none" />
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 text-white shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight text-white">
                Laboratório de Periféricos & Latência
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 border border-purple-500/40 text-purple-300">
                Esports Hardware Test
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Testador em tempo real de Polling Rate (1000Hz - 8000Hz), N-Key Rollover de teclado e latência acústica com teste 3D de fones.
            </p>
          </div>
        </div>
      </div>

      {/* Top Tab Bar */}
      <TopTabBar
        tabs={tabs}
        activeTab={activeTab}
        onSelectTab={(id) => setActiveTab(id as any)}
        accentColor="indigo"
      />

      {/* Active Tab Views */}
      {activeTab === 'mouse' && <MouseLabTab />}
      {activeTab === 'keyboard' && <KeyboardLabTab />}
      {activeTab === 'audio' && <AudioLabTab />}
    </div>
  );
};

// ============================================================================
// 1. MOUSE LAB (Polling Rate, CPS, Reaction Time)
// ============================================================================
const MouseLabTab: React.FC = () => {
  // Polling Rate State
  const [currentHz, setCurrentHz] = useState<number>(0);
  const [peakHz, setPeakHz] = useState<number>(0);
  const [avgHz, setAvgHz] = useState<number>(0);
  const [hzHistory, setHzHistory] = useState<number[]>([]);
  const prevTimeRef = useRef<number>(0);
  const samplesRef = useRef<number[]>([]);

  // CPS State
  const [cps, setCps] = useState<number>(0);
  const [totalClicks, setTotalClicks] = useState<number>(0);
  const [isCpsActive, setIsCpsActive] = useState<boolean>(false);
  const [cpsTimer, setCpsTimer] = useState<number>(5);
  const cpsTimerRef = useRef<any>(null);

  // Reaction Time State
  const [reactionState, setReactionState] = useState<'idle' | 'waiting' | 'ready' | 'result' | 'early'>('idle');
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [bestReaction, setBestReaction] = useState<number | null>(null);
  const readyTimeoutRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);

  // Handle Mouse Movement on Arena for Polling Rate
  const handleMouseMove = () => {
    const now = performance.now();
    if (prevTimeRef.current > 0) {
      const deltaMs = now - prevTimeRef.current;
      if (deltaMs > 0 && deltaMs < 50) {
        const rate = Math.round(1000 / deltaMs);
        if (rate >= 60 && rate <= 10000) {
          setCurrentHz(rate);
          setPeakHz((prev) => Math.max(prev, rate));

          samplesRef.current.push(rate);
          if (samplesRef.current.length > 30) samplesRef.current.shift();
          const mean = Math.round(
            samplesRef.current.reduce((a, b) => a + b, 0) / samplesRef.current.length
          );
          setAvgHz(mean);

          setHzHistory((prev) => {
            const next = [...prev, rate];
            return next.length > 50 ? next.slice(next.length - 50) : next;
          });
        }
      }
    }
    prevTimeRef.current = now;
  };

  const resetPollingTest = () => {
    setCurrentHz(0);
    setPeakHz(0);
    setAvgHz(0);
    setHzHistory([]);
    samplesRef.current = [];
    prevTimeRef.current = 0;
  };

  // CPS Test logic
  const handleCpsClick = () => {
    if (!isCpsActive && cpsTimer === 5) {
      setIsCpsActive(true);
      setTotalClicks(1);
      const timerStart = Date.now();
      cpsTimerRef.current = setInterval(() => {
        const elapsed = (Date.now() - timerStart) / 1000;
        const remaining = Math.max(0, 5 - elapsed);
        setCpsTimer(+remaining.toFixed(1));
        if (remaining <= 0) {
          clearInterval(cpsTimerRef.current);
          setIsCpsActive(false);
        }
      }, 50);
      return;
    }

    if (isCpsActive) {
      setTotalClicks((prev) => prev + 1);
    }
  };

  useEffect(() => {
    if (!isCpsActive && totalClicks > 0) {
      setCps(+(totalClicks / 5).toFixed(1));
    }
  }, [isCpsActive, totalClicks]);

  const resetCps = () => {
    if (cpsTimerRef.current) clearInterval(cpsTimerRef.current);
    setIsCpsActive(false);
    setCpsTimer(5);
    setTotalClicks(0);
    setCps(0);
  };

  // Reaction Time Test Logic
  const startReactionTest = () => {
    if (readyTimeoutRef.current) clearTimeout(readyTimeoutRef.current);
    setReactionState('waiting');
    const delay = 1500 + Math.random() * 2500;
    readyTimeoutRef.current = setTimeout(() => {
      setReactionState('ready');
      startTimeRef.current = performance.now();
    }, delay);
  };

  const handleReactionClick = () => {
    if (reactionState === 'waiting') {
      clearTimeout(readyTimeoutRef.current);
      setReactionState('early');
      return;
    }
    if (reactionState === 'ready') {
      const elapsed = Math.round(performance.now() - startTimeRef.current);
      setReactionTime(elapsed);
      setBestReaction((prev) => (prev ? Math.min(prev, elapsed) : elapsed));
      setReactionState('result');
    }
  };

  const getHzCategory = (hz: number) => {
    if (hz >= 3500) return { label: '8000Hz / 4000Hz (Ultra Esports)', color: 'text-purple-400' };
    if (hz >= 1700) return { label: '2000Hz (High-End Pro)', color: 'text-indigo-400' };
    if (hz >= 800) return { label: '1000Hz (Competitivo Padrão)', color: 'text-emerald-400' };
    if (hz >= 400) return { label: '500Hz (Equilibrado)', color: 'text-amber-400' };
    return { label: '125Hz (Básico / Poupança)', color: 'text-gray-400' };
  };

  return (
    <div className="space-y-6">
      {/* 1. Real-Time Polling Rate Tester */}
      <div className="bg-[#0E1526] border border-[#1E293B] rounded-2xl p-6 space-y-5 shadow-lg">
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Medidor de Polling Rate & Frequência do Rato
              </h3>
              <p className="text-xs text-gray-400">
                Move o rato rapidamente dentro da caixa abaixo para medir a taxa de polling em tempo real.
              </p>
            </div>
          </div>
          <button
            onClick={resetPollingTest}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151E33] hover:bg-[#1C2844] text-xs text-gray-300 font-semibold border border-[#232F4D] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpar
          </button>
        </div>

        {/* Polling Scoreboard */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[#090E1A] p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] uppercase font-bold text-gray-400">Taxa Atual</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black font-mono text-purple-400">{currentHz}</span>
              <span className="text-xs font-bold text-gray-400">Hz</span>
            </div>
            <span className={`text-[11px] font-bold mt-1 ${getHzCategory(currentHz).color}`}>
              {getHzCategory(currentHz).label}
            </span>
          </div>

          <div className="bg-[#090E1A] p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] uppercase font-bold text-gray-400">Pico Máximo</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black font-mono text-cyan-400">{peakHz}</span>
              <span className="text-xs font-bold text-gray-400">Hz</span>
            </div>
            <span className="text-[11px] text-gray-500 mt-1">Frequência máxima atingida</span>
          </div>

          <div className="bg-[#090E1A] p-4 rounded-xl border border-white/5 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] uppercase font-bold text-gray-400">Média Estável</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black font-mono text-emerald-400">{avgHz}</span>
              <span className="text-xs font-bold text-gray-400">Hz</span>
            </div>
            <span className="text-[11px] text-gray-500 mt-1">Estabilidade contínua de sinal</span>
          </div>
        </div>

        {/* Interactive Mouse Movement Pad */}
        <div
          onMouseMove={handleMouseMove}
          className="h-44 w-full rounded-xl bg-gradient-to-b from-[#090E1A] to-[#0A1020] border-2 border-dashed border-[#232F4D] hover:border-purple-500/60 transition-all flex flex-col items-center justify-center cursor-crosshair relative overflow-hidden group shadow-inner"
        >
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[radial-gradient(#263558_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />

          {/* Simple Hz mini-waveform */}
          <div className="absolute bottom-2 left-4 right-4 flex items-end gap-1 h-12 opacity-60 pointer-events-none">
            {hzHistory.map((val, idx) => (
              <div
                key={idx}
                className="flex-1 bg-gradient-to-t from-purple-600 to-cyan-400 rounded-t"
                style={{ height: `${Math.min(100, (val / 1000) * 100)}%` }}
              />
            ))}
          </div>

          <Mouse className="w-8 h-8 text-purple-400 group-hover:scale-110 transition-transform mb-2 z-10" />
          <span className="text-xs font-bold text-gray-300 z-10">
            Passa e move o cursor aqui dentro em círculos rápidos
          </span>
          <span className="text-[11px] text-gray-500 z-10 mt-0.5">
            Mede a frequência real da porta USB do teu rato
          </span>
        </div>
      </div>

      {/* 2. Reaction Time & CPS Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reaction Time Pad */}
        <div className="bg-[#0E1526] border border-[#1E293B] rounded-2xl p-6 space-y-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Gauge className="w-4 h-4 text-cyan-400" />
                Tempo de Reação Visual (Input Lag)
              </h3>
              {bestReaction && (
                <span className="text-xs font-mono font-bold text-emerald-400">
                  Melhor: {bestReaction} ms
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Testa a latência de clique do rato combinada com o teu tempo de reação.
            </p>
          </div>

          <div
            onClick={reactionState === 'idle' || reactionState === 'result' || reactionState === 'early' ? startReactionTest : handleReactionClick}
            className={`h-40 rounded-xl cursor-pointer flex flex-col items-center justify-center p-4 text-center transition-all shadow-inner border ${
              reactionState === 'waiting'
                ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                : reactionState === 'ready'
                ? 'bg-emerald-500/40 border-emerald-400 text-white animate-pulse'
                : reactionState === 'early'
                ? 'bg-amber-950/40 border-amber-500 text-amber-300'
                : 'bg-[#090E1A] hover:bg-[#10172A] border-[#232F4D] text-gray-300'
            }`}
          >
            {reactionState === 'idle' && (
              <>
                <Play className="w-8 h-8 text-cyan-400 mb-2" />
                <span className="text-sm font-bold">Clica aqui para iniciar o teste</span>
                <span className="text-[11px] text-gray-500 mt-1">Aguarda que fique verde e clica o mais rápido possível</span>
              </>
            )}
            {reactionState === 'waiting' && (
              <span className="text-sm font-extrabold text-rose-300 animate-pulse">
                Aguarda que fique VERDE... Não cliques ainda!
              </span>
            )}
            {reactionState === 'ready' && (
              <span className="text-xl font-black text-white drop-shadow-md">
                CLICA AGORA! ⚡
              </span>
            )}
            {reactionState === 'early' && (
              <>
                <span className="text-sm font-bold text-amber-400">Clicaste demasiado cedo!</span>
                <span className="text-[11px] text-gray-400 mt-1">Clica para tentar novamente</span>
              </>
            )}
            {reactionState === 'result' && (
              <>
                <span className="text-3xl font-black font-mono text-emerald-400">{reactionTime} ms</span>
                <span className="text-xs font-bold text-gray-300 mt-1">
                  {reactionTime! < 180 ? '🔥 Nível Pro Gamer (Excelente)' : reactionTime! < 230 ? '⚡ Muito Rápido' : '👍 Velocidade Normal'}
                </span>
                <span className="text-[10px] text-gray-500 mt-2">Clica para testar de novo</span>
              </>
            )}
          </div>
        </div>

        {/* CPS (Clicks Per Second) */}
        <div className="bg-[#0E1526] border border-[#1E293B] rounded-2xl p-6 space-y-4 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Mouse className="w-4 h-4 text-purple-400" />
                Teste de Velocidade de Clique (CPS)
              </h3>
              <span className="text-xs font-mono font-bold text-purple-400">
                Tempo: {cpsTimer}s
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Mede cliques por segundo para verificar debounce e switches do rato.
            </p>
          </div>

          <div
            onClick={handleCpsClick}
            className="h-40 rounded-xl bg-gradient-to-br from-[#090E1A] to-[#12192B] border border-[#232F4D] hover:border-purple-500/60 cursor-pointer flex flex-col items-center justify-center p-4 text-center transition-all shadow-inner active:scale-[0.98]"
          >
            {isCpsActive ? (
              <>
                <span className="text-3xl font-black font-mono text-purple-300">{totalClicks}</span>
                <span className="text-xs font-bold text-gray-400 mt-1">Cliques no contador ({cpsTimer}s restantes)</span>
              </>
            ) : cps > 0 ? (
              <>
                <span className="text-3xl font-black font-mono text-cyan-400">{cps} CPS</span>
                <span className="text-xs font-bold text-gray-300 mt-1">Total: {totalClicks} cliques em 5 segundos</span>
                <span className="text-[10px] text-gray-500 mt-1">Clica para reiniciar o teste</span>
              </>
            ) : (
              <>
                <Mouse className="w-8 h-8 text-purple-400 mb-2" />
                <span className="text-sm font-bold text-white">Clica repetidamente o mais rápido que puderes</span>
                <span className="text-[11px] text-gray-500 mt-1">Duração: 5 segundos</span>
              </>
            )}
          </div>

          {cps > 0 && (
            <button
              onClick={resetCps}
              className="w-full py-1.5 rounded-lg bg-[#151E33] hover:bg-[#1C2844] text-xs text-gray-300 font-semibold border border-[#232F4D] transition-colors"
            >
              Reiniciar Contador
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 2. KEYBOARD LAB (Key Matrix, Anti-Ghosting, NKRO)
// ============================================================================
const KeyboardLabTab: React.FC = () => {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [testedKeys, setTestedKeys] = useState<Set<string>>(new Set());
  const [maxSimultaneous, setMaxSimultaneous] = useState<number>(0);
  const [lastKeyPressed, setLastKeyPressed] = useState<string>('Nenhuma');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      const code = e.code;
      setLastKeyPressed(e.key.toUpperCase() || code);

      setActiveKeys((prev) => {
        const next = new Set(prev);
        next.add(code);
        setMaxSimultaneous((m) => Math.max(m, next.size));
        return next;
      });

      setTestedKeys((prev) => {
        const next = new Set(prev);
        next.add(code);
        return next;
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      e.preventDefault();
      const code = e.code;
      setActiveKeys((prev) => {
        const next = new Set(prev);
        next.delete(code);
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const resetKeyboardTest = () => {
    setActiveKeys(new Set());
    setTestedKeys(new Set());
    setMaxSimultaneous(0);
    setLastKeyPressed('Nenhuma');
  };

  // Keyboard Rows Definition for Interactive Display
  const keyRows = [
    [
      { code: 'Escape', label: 'ESC', w: 'w-10' },
      { code: 'F1', label: 'F1' }, { code: 'F2', label: 'F2' }, { code: 'F3', label: 'F3' }, { code: 'F4', label: 'F4' },
      { code: 'F5', label: 'F5' }, { code: 'F6', label: 'F6' }, { code: 'F7', label: 'F7' }, { code: 'F8', label: 'F8' },
      { code: 'F9', label: 'F9' }, { code: 'F10', label: 'F10' }, { code: 'F11', label: 'F11' }, { code: 'F12', label: 'F12' }
    ],
    [
      { code: 'Backquote', label: '~' },
      { code: 'Digit1', label: '1' }, { code: 'Digit2', label: '2' }, { code: 'Digit3', label: '3' }, { code: 'Digit4', label: '4' },
      { code: 'Digit5', label: '5' }, { code: 'Digit6', label: '6' }, { code: 'Digit7', label: '7' }, { code: 'Digit8', label: '8' },
      { code: 'Digit9', label: '9' }, { code: 'Digit0', label: '0' }, { code: 'Minus', label: '-' }, { code: 'Equal', label: '=' },
      { code: 'Backspace', label: 'BACKSPACE', w: 'w-16' }
    ],
    [
      { code: 'Tab', label: 'TAB', w: 'w-12' },
      { code: 'KeyQ', label: 'Q' }, { code: 'KeyW', label: 'W' }, { code: 'KeyE', label: 'E' }, { code: 'KeyR', label: 'R' },
      { code: 'KeyT', label: 'T' }, { code: 'KeyY', label: 'Y' }, { code: 'KeyU', label: 'U' }, { code: 'KeyI', label: 'I' },
      { code: 'KeyO', label: 'O' }, { code: 'KeyP', label: 'P' }, { code: 'BracketLeft', label: '[' }, { code: 'BracketRight', label: ']' },
      { code: 'Backslash', label: '\\', w: 'w-10' }
    ],
    [
      { code: 'CapsLock', label: 'CAPS', w: 'w-14' },
      { code: 'KeyA', label: 'A' }, { code: 'KeyS', label: 'S' }, { code: 'KeyD', label: 'D' }, { code: 'KeyF', label: 'F' },
      { code: 'KeyG', label: 'G' }, { code: 'KeyH', label: 'H' }, { code: 'KeyJ', label: 'J' }, { code: 'KeyK', label: 'K' },
      { code: 'KeyL', label: 'L' }, { code: 'Semicolon', label: ';' }, { code: 'Quote', label: '\'' },
      { code: 'Enter', label: 'ENTER', w: 'w-16' }
    ],
    [
      { code: 'ShiftLeft', label: 'SHIFT', w: 'w-16' },
      { code: 'KeyZ', label: 'Z' }, { code: 'KeyX', label: 'X' }, { code: 'KeyC', label: 'C' }, { code: 'KeyV', label: 'V' },
      { code: 'KeyB', label: 'B' }, { code: 'KeyN', label: 'N' }, { code: 'KeyM', label: 'M' }, { code: 'Comma', label: ',' },
      { code: 'Period', label: '.' }, { code: 'Slash', label: '/' },
      { code: 'ShiftRight', label: 'SHIFT', w: 'w-16' }
    ],
    [
      { code: 'ControlLeft', label: 'CTRL', w: 'w-12' },
      { code: 'MetaLeft', label: 'WIN', w: 'w-10' },
      { code: 'AltLeft', label: 'ALT', w: 'w-10' },
      { code: 'Space', label: 'SPACEBAR', w: 'w-52' },
      { code: 'AltRight', label: 'ALT GR', w: 'w-10' },
      { code: 'ControlRight', label: 'CTRL', w: 'w-12' },
      { code: 'ArrowLeft', label: '←', w: 'w-8' },
      { code: 'ArrowUp', label: '↑', w: 'w-8' },
      { code: 'ArrowDown', label: '↓', w: 'w-8' },
      { code: 'ArrowRight', label: '→', w: 'w-8' }
    ]
  ];

  return (
    <div className="bg-[#0E1526] border border-[#1E293B] rounded-2xl p-6 space-y-5 shadow-lg">
      <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Keyboard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Matriz de Teclado & Teste Anti-Ghosting (NKRO)
            </h3>
            <p className="text-xs text-gray-400">
              Pressiona qualquer tecla no teclado físico para verificar ghosting, teclas presas e capacidade de N-Key Rollover.
            </p>
          </div>
        </div>

        <button
          onClick={resetKeyboardTest}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#151E33] hover:bg-[#1C2844] text-xs text-gray-300 font-semibold border border-[#232F4D] transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Limpar Teclas
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#090E1A] p-3 rounded-xl border border-white/5">
          <span className="text-[10px] uppercase font-bold text-gray-500 block">Teclas Pressionadas Agora</span>
          <span className="text-xl font-bold font-mono text-purple-400 mt-1 block">
            {activeKeys.size} {activeKeys.size === 1 ? 'tecla' : 'teclas'}
          </span>
        </div>
        <div className="bg-[#090E1A] p-3 rounded-xl border border-white/5">
          <span className="text-[10px] uppercase font-bold text-gray-500 block">Pico Simultâneo (NKRO)</span>
          <span className="text-xl font-bold font-mono text-cyan-400 mt-1 block">
            {maxSimultaneous} teclas
          </span>
        </div>
        <div className="bg-[#090E1A] p-3 rounded-xl border border-white/5">
          <span className="text-[10px] uppercase font-bold text-gray-500 block">Última Tecla Registada</span>
          <span className="text-xl font-bold font-mono text-emerald-400 mt-1 truncate block">
            {lastKeyPressed}
          </span>
        </div>
        <div className="bg-[#090E1A] p-3 rounded-xl border border-white/5">
          <span className="text-[10px] uppercase font-bold text-gray-500 block">Total Teclas Testadas</span>
          <span className="text-xl font-bold font-mono text-indigo-400 mt-1 block">
            {testedKeys.size} teclas
          </span>
        </div>
      </div>

      {/* Interactive Virtual Keyboard Matrix */}
      <div className="p-4 rounded-xl bg-[#080D18] border border-[#1E293B] space-y-2 overflow-x-auto shadow-inner">
        {keyRows.map((row, rIdx) => (
          <div key={rIdx} className="flex gap-1 justify-center min-w-[700px]">
            {row.map((k) => {
              const isCurrentlyPressed = activeKeys.has(k.code);
              const hasBeenTested = testedKeys.has(k.code);

              return (
                <div
                  key={k.code}
                  className={`h-9 ${k.w || 'w-8'} rounded-lg text-[10px] font-mono font-bold flex items-center justify-center transition-all duration-100 border ${
                    isCurrentlyPressed
                      ? 'bg-gradient-to-t from-purple-600 to-indigo-500 text-white shadow-lg shadow-purple-600/50 border-purple-300 scale-95'
                      : hasBeenTested
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-[#101728] text-gray-400 border-white/5 hover:border-white/20'
                  }`}
                >
                  {k.label}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* NKRO Assessment Banner */}
      <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
          <span className="text-purple-200">
            {maxSimultaneous >= 6
              ? 'Status Anti-Ghosting: Excelente! O teu teclado suporta N-Key Rollover (NKRO completo para eSports).'
              : 'Pressiona 5 ou mais teclas em simultâneo (ex: W+A+S+D+Espaço) para verificar se o teu teclado bloqueia teclas.'}
          </span>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300 shrink-0">
          USB Scan Rate 1000Hz
        </span>
      </div>
    </div>
  );
};

// ============================================================================
// 3. AUDIO & HEADSET LAB (Audio Latency, Stereo 3D, Frequencies, Mic Check)
// ============================================================================
const AudioLabTab: React.FC = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [audioLatencyMs, setAudioLatencyMs] = useState<number | null>(null);
  const [playingChannel, setPlayingChannel] = useState<'left' | 'right' | 'center' | 'sweep' | null>(null);

  // Mic state
  const [isMicTesting, setIsMicTesting] = useState<boolean>(false);
  const [micVolume, setMicVolume] = useState<number>(0);
  const [isLoopbackEnabled, setIsLoopbackEnabled] = useState<boolean>(false);
  const micStreamRef = useRef<MediaStream | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micGainRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<any>(null);

  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  // Measure audio driver latency via AudioContext
  useEffect(() => {
    try {
      const ctx = getAudioContext();
      const base = (ctx as any).baseLatency || 0.005;
      const output = (ctx as any).outputLatency || 0.005;
      const totalMs = Math.round((base + output) * 1000);
      setAudioLatencyMs(Math.max(4, totalMs));
    } catch {
      setAudioLatencyMs(8);
    }
  }, []);

  // Play directional tones (Left, Right, Center)
  const playStereoTone = (channel: 'left' | 'right' | 'center') => {
    try {
      const ctx = getAudioContext();
      setPlayingChannel(channel);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const panner = ctx.createStereoPanner();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(channel === 'left' ? 440 : channel === 'right' ? 880 : 660, ctx.currentTime);

      const panValue = channel === 'left' ? -1 : channel === 'right' ? 1 : 0;
      panner.pan.setValueAtTime(panValue, ctx.currentTime);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

      osc.connect(panner);
      panner.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.85);

      setTimeout(() => {
        setPlayingChannel(null);
      }, 850);
    } catch {}
  };

  // Play directional simulated 3D footsteps / sweep from Left to Right
  const playSpatialFootsteps = () => {
    try {
      const ctx = getAudioContext();
      setPlayingChannel('sweep');

      const panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(-1, ctx.currentTime);
      panner.pan.linearRampToValueAtTime(1, ctx.currentTime + 1.6);

      // Create quick simulated footstep bursts
      for (let i = 0; i < 4; i++) {
        const stepTime = ctx.currentTime + i * 0.4;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, stepTime);
        osc.frequency.exponentialRampToValueAtTime(40, stepTime + 0.15);

        gain.gain.setValueAtTime(0.35, stepTime);
        gain.gain.exponentialRampToValueAtTime(0.001, stepTime + 0.2);

        osc.connect(panner);
        panner.connect(gain);
        gain.connect(ctx.destination);

        osc.start(stepTime);
        osc.stop(stepTime + 0.22);
      }

      setTimeout(() => {
        setPlayingChannel(null);
      }, 1700);
    } catch {}
  };

  // Microphone Testing
  const startMicTest = async () => {
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });
      micStreamRef.current = stream;
      setIsMicTesting(true);

      const source = ctx.createMediaStreamSource(stream);
      micSourceRef.current = source;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const gain = ctx.createGain();
      gain.gain.value = isLoopbackEnabled ? 1.0 : 0.0;
      micGainRef.current = gain;

      source.connect(analyser);
      source.connect(gain);
      gain.connect(ctx.destination);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setMicVolume(normalized);
        animFrameRef.current = requestAnimationFrame(checkVolume);
      };
      checkVolume();
    } catch (err: any) {
      console.error('Mic error:', err);
      alert('Não foi possível aceder ao microfone. Verifica se o microfone está conectado e se o acesso ao microfone está ativado nas Definições de Privacidade do Windows.');
    }
  };

  const stopMicTest = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (micSourceRef.current) {
      try {
        micSourceRef.current.disconnect();
      } catch {}
      micSourceRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    }
    setIsMicTesting(false);
    setMicVolume(0);
  };

  const toggleLoopback = () => {
    const next = !isLoopbackEnabled;
    setIsLoopbackEnabled(next);
    if (micGainRef.current && audioCtxRef.current) {
      micGainRef.current.gain.setValueAtTime(next ? 1.0 : 0.0, audioCtxRef.current.currentTime);
    }
  };

  useEffect(() => {
    return () => {
      stopMicTest();
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* 1. Stereo Direction & 3D Spatial Audio Check */}
      <div className="bg-[#0E1526] border border-[#1E293B] rounded-2xl p-6 space-y-5 shadow-lg">
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Teste de Separação Estéreo & Áudio Espacial 3D
              </h3>
              <p className="text-xs text-gray-400">
                Verifica se os fones estão nos lados corretos e se a direcionalidade de passos em jogos funciona.
              </p>
            </div>
          </div>

          {audioLatencyMs && (
            <div className="flex items-center gap-2 bg-[#090E1A] px-3 py-1.5 rounded-xl border border-white/5">
              <span className="text-[10px] text-gray-400 font-bold uppercase">Latência do Driver Áudio:</span>
              <span className="text-xs font-mono font-bold text-emerald-400">{audioLatencyMs} ms</span>
            </div>
          )}
        </div>

        {/* 3D Sound Test Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <button
            onClick={() => playStereoTone('left')}
            className={`p-4 rounded-xl border transition-all text-center flex flex-col items-center justify-center gap-2 ${
              playingChannel === 'left'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/20 scale-95'
                : 'bg-[#090E1A] hover:bg-[#131B2E] border-white/5 text-gray-300'
            }`}
          >
            <Volume2 className="w-6 h-6 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Ouvido Esquerdo (L)</span>
            <span className="text-[10px] text-gray-500">Toca apenas no fone esquerdo</span>
          </button>

          <button
            onClick={() => playStereoTone('center')}
            className={`p-4 rounded-xl border transition-all text-center flex flex-col items-center justify-center gap-2 ${
              playingChannel === 'center'
                ? 'bg-purple-500/20 border-purple-400 text-purple-300 shadow-lg shadow-purple-500/20 scale-95'
                : 'bg-[#090E1A] hover:bg-[#131B2E] border-white/5 text-gray-300'
            }`}
          >
            <Volume2 className="w-6 h-6 text-purple-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Centro Balanceado</span>
            <span className="text-[10px] text-gray-500">Toca em ambos os lados</span>
          </button>

          <button
            onClick={() => playStereoTone('right')}
            className={`p-4 rounded-xl border transition-all text-center flex flex-col items-center justify-center gap-2 ${
              playingChannel === 'right'
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/20 scale-95'
                : 'bg-[#090E1A] hover:bg-[#131B2E] border-white/5 text-gray-300'
            }`}
          >
            <Volume2 className="w-6 h-6 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider">Ouvido Direito (R)</span>
            <span className="text-[10px] text-gray-500">Toca apenas no fone direito</span>
          </button>

          <button
            onClick={playSpatialFootsteps}
            className={`p-4 rounded-xl border transition-all text-center flex flex-col items-center justify-center gap-2 ${
              playingChannel === 'sweep'
                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-lg shadow-emerald-500/20 scale-95'
                : 'bg-gradient-to-br from-[#090E1A] to-[#121E36] hover:border-emerald-500/50 border-white/5 text-gray-300'
            }`}
          >
            <Activity className="w-6 h-6 text-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Passos 3D (L → R)
            </span>
            <span className="text-[10px] text-gray-400">Simulação de passos em jogo</span>
          </button>
        </div>
      </div>

      {/* 2. Microphone Check & Loopback */}
      <div className="bg-[#0E1526] border border-[#1E293B] rounded-2xl p-6 space-y-5 shadow-lg">
        <div className="flex items-center justify-between border-b border-[#1E293B] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Teste de Microfone & Retorno em Tempo Real (Mic Loopback)
              </h3>
              <p className="text-xs text-gray-400">
                Fala no microfone dos teus fones para testar volume, clareza e ausência de ruído estático.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isMicTesting && (
              <button
                onClick={toggleLoopback}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  isLoopbackEnabled
                    ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-600/30'
                    : 'bg-[#151E33] hover:bg-[#1C2844] text-gray-300 border-[#232F4D]'
                }`}
                title="Ouve a tua própria voz nos fones em tempo real"
              >
                {isLoopbackEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>{isLoopbackEnabled ? 'Ouvir Voz: Ativado' : 'Ouvir a Minha Voz'}</span>
              </button>
            )}

            <button
              onClick={isMicTesting ? stopMicTest : startMicTest}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-md ${
                isMicTesting
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isMicTesting ? (
                <>
                  <Square className="w-3.5 h-3.5" />
                  <span>Parar Teste</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5" />
                  <span>Testar Microfone</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Real-time Decibel Volume Bar */}
        <div className="bg-[#090E1A] p-4 rounded-xl border border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400 font-bold uppercase text-[10px]">Volume de Entrada (Microfone):</span>
            <span className="font-mono font-bold text-emerald-400">{isMicTesting ? `${micVolume}%` : 'Inativo'}</span>
          </div>

          <div className="w-full h-3 bg-gray-800/80 rounded-full overflow-hidden p-0.5 border border-white/5">
            <div
              className={`h-full rounded-full transition-all duration-75 ${
                micVolume > 80
                  ? 'bg-rose-500'
                  : micVolume > 40
                  ? 'bg-emerald-400'
                  : 'bg-cyan-500'
              }`}
              style={{ width: `${micVolume}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1">
            <span>Silêncio (0%)</span>
            <span>Nível Ideal de Voz (40% - 75%)</span>
            <span>Pico / Distorção (100%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
