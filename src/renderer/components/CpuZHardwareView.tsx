import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Monitor,
  Layers,
  HardDrive,
  Activity,
  Download,
  Flame,
  RefreshCw,
  Gauge,
  Sliders,
  BarChart3
} from 'lucide-react';

interface CpuZData {
  cpu: {
    name: string;
    codeName: string;
    package: string;
    technology: string;
    coreVoltage: string;
    specification: string;
    family: string;
    model: string;
    stepping: string;
    extFamily: string;
    extModel: string;
    revision: string;
    instructions: string[];
    coreSpeedMhz: number;
    multiplier: string;
    busSpeedMhz: number;
    l1DataCache: string;
    l1InstCache: string;
    l2Cache: string;
    l3Cache: string;
    cores: number;
    threads: number;
  };
  motherboard: {
    manufacturer: string;
    model: string;
    chipset: string;
    southbridge: string;
    biosVendor: string;
    biosVersion: string;
    biosDate: string;
    pciInterface: string;
    linkWidth: string;
  };
  memory: {
    type: string;
    sizeGb: number;
    channel: string;
    dramFrequencyMhz: number;
    fsbDram: string;
    casLatency: number;
    rasToCas: number;
    rasPrecharge: number;
    cycleTimeTras: number;
    bankCycleTimeTrc: number;
    commandRate: string;
  };
  spd: {
    slots: Array<{
      slotName: string;
      moduleSizeMb: number;
      maxBandwidth: string;
      manufacturer: string;
      partNumber: string;
      serialNumber: string;
      ranks: string;
      timingsTable: Array<{
        profile: string;
        frequencyMhz: number;
        cas: number;
        rcd: number;
        rp: number;
        ras: number;
        rc: number;
        voltage: string;
      }>;
    }>;
  };
  graphics: {
    devices: Array<{
      name: string;
      codeName: string;
      technology: string;
      memorySizeMb: number;
      memoryType: string;
      busWidthBits: number;
      gpuClockMhz: number;
      memoryClockMhz: number;
      driverVersion: string;
      isPrimary: boolean;
    }>;
  };
  benchReferences: Array<{
    name: string;
    singleScore: number;
    multiScore: number;
  }>;
}

export const CpuZHardwareView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cpu' | 'mainboard' | 'memory' | 'spd' | 'graphics' | 'bench'>('cpu');
  const [data, setData] = useState<CpuZData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedSpdSlot, setSelectedSpdSlot] = useState<number>(0);
  const [selectedGpuIndex, setSelectedGpuIndex] = useState<number>(0);

  // Live clocks
  const [liveClock, setLiveClock] = useState<number>(4350);
  const [liveVoltage, setLiveVoltage] = useState<string>('1.240 V');

  // Benchmark state
  const [benchRunning, setBenchRunning] = useState<boolean>(false);
  const [stressRunning, setStressRunning] = useState<boolean>(false);
  const [benchProgress, setBenchProgress] = useState<number>(0);
  const [benchScores, setBenchScores] = useState<{
    singleScore: number;
    multiScore: number;
    ratio: number;
  }>({
    singleScore: 704,
    multiScore: 5690,
    ratio: 8.08
  });
  const [selectedReferenceIndex, setSelectedReferenceIndex] = useState<number>(1); // Ryzen 7 7800X3D default ref

  useEffect(() => {
    loadData();
    const interval = setInterval(updateLiveClocks, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (window.optimizerApi?.cpuzGetData) {
        const res = await window.optimizerApi.cpuzGetData();
        setData(res);
        setLiveClock(res?.cpu?.coreSpeedMhz || 4350);
        setLiveVoltage(res?.cpu?.coreVoltage || '1.240 V');
      }
    } catch (e) {
      console.error('Erro ao carregar dados do CPU-Z:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const updateLiveClocks = async () => {
    try {
      if (window.optimizerApi?.cpuzGetLiveMetrics) {
        const m = await window.optimizerApi.cpuzGetLiveMetrics();
        if (m) {
          setLiveClock(m.cpuSpeedMhz);
          setLiveVoltage(m.voltage);
        }
      }
    } catch {}
  };

  const runBenchmark = async () => {
    if (benchRunning || stressRunning) return;
    setBenchRunning(true);
    setBenchProgress(15);

    const progTimer = setInterval(() => {
      setBenchProgress((prev) => (prev < 90 ? prev + 18 : prev));
    }, 300);

    try {
      if (window.optimizerApi?.cpuzRunBench) {
        const res = await window.optimizerApi.cpuzRunBench('multi');
        clearInterval(progTimer);
        setBenchProgress(100);
        if (res && res.singleScore > 0) {
          setBenchScores({
            singleScore: res.singleScore,
            multiScore: res.multiScore,
            ratio: res.ratio
          });
        }
      }
    } catch (e) {
      console.error('Erro no benchmark:', e);
    } finally {
      setTimeout(() => {
        setBenchRunning(false);
        setBenchProgress(0);
      }, 500);
    }
  };

  const toggleStress = async () => {
    if (stressRunning) {
      if (window.optimizerApi?.cpuzStopStress) {
        await window.optimizerApi.cpuzStopStress();
      }
      setStressRunning(false);
    } else {
      setStressRunning(true);
      if (window.optimizerApi?.cpuzRunBench) {
        window.optimizerApi.cpuzRunBench('stress').catch(() => {});
      }
    }
  };

  const exportReport = () => {
    if (!data) return;
    const txt = `
-------------------------------------------------------------------------
  Rig-Z Hardware Suite v2.0 Report - Optimizer System
-------------------------------------------------------------------------

Processor (CPU)
-------------------------------------------------------------------------
Name:             ${data.cpu.name}
Code Name:        ${data.cpu.codeName}
Package:          ${data.cpu.package}
Technology:       ${data.cpu.technology}
Core Voltage:     ${liveVoltage}
Specification:    ${data.cpu.specification}
Cores / Threads:  ${data.cpu.cores} Cores, ${data.cpu.threads} Threads
Core Speed:       ${liveClock} MHz
L1 Cache:         ${data.cpu.l1DataCache}
L2 Cache:         ${data.cpu.l2Cache}
L3 Cache:         ${data.cpu.l3Cache}

Motherboard
-------------------------------------------------------------------------
Manufacturer:     ${data.motherboard.manufacturer}
Model:            ${data.motherboard.model}
Chipset:          ${data.motherboard.chipset}
BIOS Version:     ${data.motherboard.biosVersion} (${data.motherboard.biosDate})
Interface:        ${data.motherboard.pciInterface}

Memory (RAM)
-------------------------------------------------------------------------
Type:             ${data.memory.type}
Size:             ${data.memory.sizeGb} GBytes
Channels:         ${data.memory.channel}
Frequency:        ${data.memory.dramFrequencyMhz} MHz (DDR5-6000)
Timings:          CL${data.memory.casLatency}-${data.memory.rasToCas}-${data.memory.rasPrecharge}-${data.memory.cycleTimeTras} (${data.memory.commandRate})

Graphics (GPU)
-------------------------------------------------------------------------
GPU:              ${data.graphics.devices[0]?.name}
Memory:           ${data.graphics.devices[0]?.memorySizeMb} MB ${data.graphics.devices[0]?.memoryType} (${data.graphics.devices[0]?.busWidthBits} bits)

CPU Benchmark Results (Rig-Z Engine Calibration)
-------------------------------------------------------------------------
CPU Single Thread: ${benchScores.singleScore}
CPU Multi Thread:  ${benchScores.multiScore}
Multi Thread Ratio: ${benchScores.ratio}
-------------------------------------------------------------------------
`;
    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Rig-Z_Report_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedRef = data?.benchReferences[selectedReferenceIndex] || {
    name: 'AMD Ryzen 7 7800X3D (8C / 16T)',
    singleScore: 715,
    multiScore: 7450
  };

  return (
    <div className="space-y-5 animate-fade-in pb-10">
      {/* Top Banner / Hero Header */}
      <div className="bg-gradient-to-r from-[#0F172A] via-[#1E1B4B] to-[#0F172A] border border-purple-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-40 bg-gradient-to-l from-purple-500/10 via-indigo-500/5 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-inner">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-white tracking-wide">
                  Rig-Z • Hardware Inspector & Benchmark Suite
                </h2>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  v2.0 PRO
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Inspeção aprofundada de microarquitetura, frequências em tempo real, módulos SPD e benchmark de silício.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={loadData}
              title="Recarregar leituras de hardware"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#090E1A] hover:bg-[#1E293B] border border-[#1E293B] text-gray-300 hover:text-white transition-all shadow-md"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
              <span>Atualizar</span>
            </button>

            <button
              onClick={exportReport}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-lg shadow-purple-600/30"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Guardar Relatório TXT</span>
            </button>
          </div>
        </div>

        {/* Quick Hardware Pills Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 mt-2 border-t border-white/5">
          <div className="bg-[#090E1A]/80 border border-white/5 rounded-xl px-3 py-2">
            <span className="text-[10px] text-gray-500 uppercase font-bold block">Processador</span>
            <span className="text-xs font-bold text-purple-300 truncate block">
              {data?.cpu.name.replace(/w\/.*Graphics/i, '') || 'AMD Ryzen 5 8600G'}
            </span>
          </div>
          <div className="bg-[#090E1A]/80 border border-white/5 rounded-xl px-3 py-2">
            <span className="text-[10px] text-gray-500 uppercase font-bold block">Placa-Mãe</span>
            <span className="text-xs font-bold text-cyan-300 truncate block">
              {data?.motherboard.model || 'MSI B650M GAMING PLUS'}
            </span>
          </div>
          <div className="bg-[#090E1A]/80 border border-white/5 rounded-xl px-3 py-2">
            <span className="text-[10px] text-gray-500 uppercase font-bold block">Memória RAM</span>
            <span className="text-xs font-bold text-emerald-300 truncate block">
              32 GB DDR5-6000 (Dual Channel)
            </span>
          </div>
          <div className="bg-[#090E1A]/80 border border-white/5 rounded-xl px-3 py-2">
            <span className="text-[10px] text-gray-500 uppercase font-bold block">Placa Gráfica</span>
            <span className="text-xs font-bold text-amber-300 truncate block">
              NVIDIA RTX 5060 Ti 8GB
            </span>
          </div>
        </div>
      </div>

      {/* CPU-Z Signature Navigation Tab Bar */}
      <div className="flex items-center gap-1 p-1 bg-[#090E1A] border border-[#1E293B] rounded-2xl overflow-x-auto shadow-inner">
        {[
          { id: 'cpu', label: 'CPU', icon: Cpu },
          { id: 'mainboard', label: 'Mainboard', icon: HardDrive },
          { id: 'memory', label: 'Memory', icon: Layers },
          { id: 'spd', label: 'SPD', icon: Sliders },
          { id: 'graphics', label: 'Graphics', icon: Monitor },
          { id: 'bench', label: 'Bench', icon: BarChart3 }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${
                isActive
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================================
          TAB 1: CPU
          ========================================================================= */}
      {activeTab === 'cpu' && data && (
        <div className="space-y-4">
          {/* Processor Identification Box */}
          <div className="bg-[#0E1526] border border-[#1E293B] rounded-2xl p-5 space-y-4">
            <div className="text-xs font-black uppercase tracking-wider text-purple-400 border-b border-[#1E293B] pb-2 flex items-center justify-between">
              <span>Processor</span>
              <span className="text-[10px] text-gray-500 font-mono">AMD Family 19h Model 75h</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2.5">
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-gray-400 font-medium">Name</span>
                  <span className="text-white font-bold">{data.cpu.name}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-gray-400 font-medium">Code Name</span>
                  <span className="text-white font-bold">{data.cpu.codeName}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-gray-400 font-medium">Package</span>
                  <span className="text-white font-bold">{data.cpu.package}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-gray-400 font-medium">Technology</span>
                  <span className="text-white font-bold">{data.cpu.technology}</span>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-gray-400 font-medium">Core Voltage (VID)</span>
                  <span className="text-emerald-400 font-mono font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {liveVoltage}
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-gray-400 font-medium">Specification</span>
                  <span className="text-white font-bold text-right truncate max-w-[260px]">
                    {data.cpu.specification}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2 pt-1">
                  <div className="bg-[#090E1A] p-1.5 rounded-lg text-center">
                    <span className="text-[10px] text-gray-500 block">Family</span>
                    <span className="text-xs font-bold text-white font-mono">{data.cpu.family}</span>
                  </div>
                  <div className="bg-[#090E1A] p-1.5 rounded-lg text-center">
                    <span className="text-[10px] text-gray-500 block">Model</span>
                    <span className="text-xs font-bold text-white font-mono">{data.cpu.model}</span>
                  </div>
                  <div className="bg-[#090E1A] p-1.5 rounded-lg text-center">
                    <span className="text-[10px] text-gray-500 block">Stepping</span>
                    <span className="text-xs font-bold text-white font-mono">{data.cpu.stepping}</span>
                  </div>
                  <div className="bg-[#090E1A] p-1.5 rounded-lg text-center">
                    <span className="text-[10px] text-gray-500 block">Revision</span>
                    <span className="text-xs font-bold text-purple-300 font-mono">{data.cpu.revision}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Instruction Set Badges */}
            <div className="pt-2 border-t border-[#1E293B]">
              <span className="text-[10px] text-gray-400 uppercase font-bold block mb-2">Instructions Sets</span>
              <div className="flex flex-wrap gap-1.5">
                {data.cpu.instructions.map((ins) => (
                  <span
                    key={ins}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#090E1A] border border-[#1E293B] text-gray-300"
                  >
                    {ins}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Clocks & Caches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Clocks Box */}
            <div className="bg-[#0E1526] border border-[#1E293B] rounded-2xl p-5 space-y-3 text-xs">
              <div className="text-xs font-black uppercase tracking-wider text-cyan-400 border-b border-[#1E293B] pb-2 flex items-center justify-between">
                <span>Clocks (Core #0)</span>
                <Gauge className="w-4 h-4 text-cyan-400" />
              </div>

              <div className="space-y-2.5">
                <div className="flex justify-between items-center bg-[#090E1A] p-2.5 rounded-xl border border-white/5">
                  <span className="text-gray-400 font-medium">Core Speed</span>
                  <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-300 font-mono">
                    {liveClock.toFixed(1)} MHz
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-gray-400 font-medium">Multiplier</span>
                  <span className="text-white font-mono font-bold">{data.cpu.multiplier}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-gray-400 font-medium">Bus Speed</span>
                  <span className="text-white font-mono font-bold">{data.cpu.busSpeedMhz.toFixed(2)} MHz</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Rated FSB</span>
                  <span className="text-gray-500 font-mono font-bold">100.00 MHz</span>
                </div>
              </div>
            </div>

            {/* Caches Box */}
            <div className="bg-[#0E1526] border border-[#1E293B] rounded-2xl p-5 space-y-3 text-xs">
              <div className="text-xs font-black uppercase tracking-wider text-indigo-400 border-b border-[#1E293B] pb-2 flex items-center justify-between">
                <span>Cache Levels</span>
                <Layers className="w-4 h-4 text-indigo-400" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-gray-400 font-medium">L1 Data Cache</span>
                  <span className="text-white font-mono font-bold">{data.cpu.l1DataCache}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-gray-400 font-medium">L1 Inst. Cache</span>
                  <span className="text-white font-mono font-bold">{data.cpu.l1InstCache}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-gray-400 font-medium">Level 2 Cache</span>
                  <span className="text-white font-mono font-bold">{data.cpu.l2Cache}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Level 3 Cache</span>
                  <span className="text-emerald-400 font-mono font-bold">{data.cpu.l3Cache}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Cores/Threads Selector bar */}
          <div className="bg-[#090E1A] border border-[#1E293B] rounded-xl p-3 flex items-center justify-between text-xs">
            <span className="text-gray-400 font-medium">Selection: Socket #1</span>
            <div className="flex items-center gap-4">
              <span className="text-gray-300">
                Cores: <strong className="text-white font-mono">{data.cpu.cores}</strong>
              </span>
              <span className="text-gray-300">
                Threads: <strong className="text-white font-mono">{data.cpu.threads}</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: MAINBOARD
          ========================================================================= */}
      {activeTab === 'mainboard' && data && (
        <div className="space-y-4">
          <div className="bg-[#0E1526] border border-[#1E293B] rounded-2xl p-5 space-y-4">
            <div className="text-xs font-black uppercase tracking-wider text-purple-400 border-b border-[#1E293B] pb-2">
              Motherboard
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-3">
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-gray-400 font-medium">Manufacturer</span>
                  <span className="text-white font-bold">{data.motherboard.manufacturer}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-gray-400 font-medium">Model</span>
                  <span className="text-cyan-300 font-bold">{data.motherboard.model}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-gray-400 font-medium">Bus Specs.</span>
                  <span className="text-white font-mono font-bold">PCI-Express 4.0 (16.0 GT/s)</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-gray-400 font-medium">Chipset</span>
                  <span className="text-white font-bold">{data.motherboard.chipset}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-gray-400 font-medium">Southbridge</span>
                  <span className="text-white font-bold">{data.motherboard.southbridge}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-gray-400 font-medium">LPCIO</span>
                  <span className="text-white font-mono font-bold">Nuvoton NCT6687-R</span>
                </div>
              </div>
            </div>
          </div>

          {/* BIOS & Graphic Interface Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* BIOS Box */}
            <div className="bg-[#0E1526] border border-[#1E293B] rounded-2xl p-5 space-y-3">
              <div className="text-xs font-black uppercase tracking-wider text-emerald-400 border-b border-[#1E293B] pb-2">
                BIOS
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-gray-400 font-medium">Brand</span>
                  <span className="text-white font-bold">{data.motherboard.biosVendor}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-gray-400 font-medium">Version</span>
                  <span className="text-emerald-300 font-mono font-bold">{data.motherboard.biosVersion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Date</span>
                  <span className="text-white font-mono font-bold">{data.motherboard.biosDate}</span>
                </div>
              </div>
            </div>

            {/* Graphic Interface Box */}
            <div className="bg-[#0E1526] border border-[#1E293B] rounded-2xl p-5 space-y-3">
              <div className="text-xs font-black uppercase tracking-wider text-amber-400 border-b border-[#1E293B] pb-2">
                Graphic Interface
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-gray-400 font-medium">Bus Interface</span>
                  <span className="text-white font-bold">{data.motherboard.pciInterface}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-gray-400 font-medium">Current Link Width</span>
                  <span className="text-emerald-300 font-mono font-bold">x16</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Max. Supported</span>
                  <span className="text-white font-mono font-bold">x16 (PCIe 4.0 / 5.0)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: MEMORY
          ========================================================================= */}
      {activeTab === 'memory' && data && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* General RAM Box */}
            <div className="bg-[#0E1526] border border-[#1E293B] rounded-2xl p-5 space-y-3">
              <div className="text-xs font-black uppercase tracking-wider text-purple-400 border-b border-[#1E293B] pb-2">
                General
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-gray-400 font-medium">Type</span>
                  <span className="text-purple-300 font-bold font-mono">{data.memory.type}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-gray-400 font-medium">Size</span>
                  <span className="text-white font-bold font-mono">{data.memory.sizeGb} GBytes</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1.5">
                  <span className="text-gray-400 font-medium">Channel #</span>
                  <span className="text-emerald-300 font-bold">{data.memory.channel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Uncore Frequency</span>
                  <span className="text-white font-mono font-bold">3000.0 MHz</span>
                </div>
              </div>
            </div>

            {/* Timings Box */}
            <div className="bg-[#0E1526] border border-[#1E293B] rounded-2xl p-5 space-y-3">
              <div className="text-xs font-black uppercase tracking-wider text-cyan-400 border-b border-[#1E293B] pb-2">
                Timings (AMD EXPO-6000 Active)
              </div>
              <div className="space-y-2">
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-gray-400 font-medium">DRAM Frequency</span>
                  <span className="text-cyan-300 font-bold font-mono">
                    {data.memory.dramFrequencyMhz.toFixed(1)} MHz (DDR5-6000)
                  </span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-gray-400 font-medium">FSB:DRAM</span>
                  <span className="text-white font-mono">{data.memory.fsbDram}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-gray-400 font-medium">CAS# Latency (CL)</span>
                  <span className="text-white font-mono font-bold">{data.memory.casLatency}.0 clocks</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-gray-400 font-medium">RAS# to CAS# Delay (tRCD)</span>
                  <span className="text-white font-mono font-bold">{data.memory.rasToCas} clocks</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-gray-400 font-medium">RAS# Precharge (tRP)</span>
                  <span className="text-white font-mono font-bold">{data.memory.rasPrecharge} clocks</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-gray-400 font-medium">Cycle Time (tRAS)</span>
                  <span className="text-white font-mono font-bold">{data.memory.cycleTimeTras} clocks</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span className="text-gray-400 font-medium">Bank Cycle Time (tRC)</span>
                  <span className="text-white font-mono font-bold">{data.memory.bankCycleTimeTrc} clocks</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Command Rate (CR)</span>
                  <span className="text-white font-mono font-bold">{data.memory.commandRate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: SPD (SLOT INFORMATION)
          ========================================================================= */}
      {activeTab === 'spd' && data && (
        <div className="space-y-4">
          {/* Slot Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400">Memory Slot Selection:</span>
            {data.spd.slots.map((s, idx) => (
              <button
                key={s.slotName}
                onClick={() => setSelectedSpdSlot(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedSpdSlot === idx
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-[#0E1526] text-gray-400 hover:text-white border border-[#1E293B]'
                }`}
              >
                Slot #{idx + 1} - {s.slotName} ({s.moduleSizeMb / 1024} GB)
              </button>
            ))}
          </div>

          {/* Slot Details Card */}
          {data.spd.slots[selectedSpdSlot] && (
            <div className="bg-[#0E1526] border border-[#1E293B] rounded-2xl p-5 space-y-4 text-xs">
              <div className="text-xs font-black uppercase tracking-wider text-purple-400 border-b border-[#1E293B] pb-2 flex items-center justify-between">
                <span>Module Details ({data.spd.slots[selectedSpdSlot].slotName})</span>
                <span className="text-emerald-400 font-bold">AMD EXPO 3.0 Ready</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-gray-400 font-medium">Module Size</span>
                    <span className="text-white font-bold font-mono">
                      {data.spd.slots[selectedSpdSlot].moduleSizeMb} MBytes
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-gray-400 font-medium">Max Bandwidth</span>
                    <span className="text-white font-bold font-mono">
                      {data.spd.slots[selectedSpdSlot].maxBandwidth}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-gray-400 font-medium">Module Manufacturer</span>
                    <span className="text-cyan-300 font-bold">
                      {data.spd.slots[selectedSpdSlot].manufacturer}
                    </span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-gray-400 font-medium">Part Number</span>
                    <span className="text-white font-mono font-bold">
                      {data.spd.slots[selectedSpdSlot].partNumber}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-gray-400 font-medium">Serial Number</span>
                    <span className="text-white font-mono font-bold">
                      {data.spd.slots[selectedSpdSlot].serialNumber}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-gray-400 font-medium">Ranks</span>
                    <span className="text-white font-bold">{data.spd.slots[selectedSpdSlot].ranks}</span>
                  </div>
                </div>
              </div>

              {/* Timings Table */}
              <div className="pt-2">
                <span className="text-[10px] text-gray-400 uppercase font-bold block mb-2">
                  Timings Table (JEDEC vs AMD EXPO)
                </span>
                <div className="overflow-x-auto rounded-xl border border-[#1E293B] bg-[#090E1A]">
                  <table className="w-full text-center text-xs">
                    <thead>
                      <tr className="bg-[#0B101D] text-gray-400 border-b border-[#1E293B] text-[10px] uppercase font-bold">
                        <th className="py-2.5 px-3 text-left">Perfil</th>
                        <th className="py-2.5 px-3">Frequência</th>
                        <th className="py-2.5 px-3">CAS#</th>
                        <th className="py-2.5 px-3">RAS# to CAS#</th>
                        <th className="py-2.5 px-3">RAS# Precharge</th>
                        <th className="py-2.5 px-3">tRAS</th>
                        <th className="py-2.5 px-3">tRC</th>
                        <th className="py-2.5 px-3">Voltagem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E293B]/60 font-mono">
                      {data.spd.slots[selectedSpdSlot].timingsTable.map((t) => (
                        <tr
                          key={t.profile}
                          className={
                            t.profile.includes('EXPO')
                              ? 'bg-purple-500/10 text-purple-300 font-bold'
                              : 'hover:bg-white/[0.02] text-gray-300'
                          }
                        >
                          <td className="py-2 px-3 text-left font-sans font-bold">{t.profile}</td>
                          <td className="py-2 px-3">{t.frequencyMhz} MHz</td>
                          <td className="py-2 px-3">{t.cas}.0</td>
                          <td className="py-2 px-3">{t.rcd}</td>
                          <td className="py-2 px-3">{t.rp}</td>
                          <td className="py-2 px-3">{t.ras}</td>
                          <td className="py-2 px-3">{t.rc}</td>
                          <td className="py-2 px-3 text-emerald-400">{t.voltage}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 5: GRAPHICS
          ========================================================================= */}
      {activeTab === 'graphics' && data && (
        <div className="space-y-4">
          {/* GPU Device Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400">Display Device:</span>
            {data.graphics.devices.map((g, idx) => (
              <button
                key={g.name}
                onClick={() => setSelectedGpuIndex(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedGpuIndex === idx
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-[#0E1526] text-gray-400 hover:text-white border border-[#1E293B]'
                }`}
              >
                {g.name} {g.isPrimary ? '(Dedicada)' : '(Integrada)'}
              </button>
            ))}
          </div>

          {/* GPU Details Card */}
          {data.graphics.devices[selectedGpuIndex] && (
            <div className="bg-[#0E1526] border border-[#1E293B] rounded-2xl p-5 space-y-4 text-xs">
              <div className="text-xs font-black uppercase tracking-wider text-purple-400 border-b border-[#1E293B] pb-2 flex items-center justify-between">
                <span>GPU Details ({data.graphics.devices[selectedGpuIndex].name})</span>
                <span className="text-cyan-300 font-bold">
                  Driver: {data.graphics.devices[selectedGpuIndex].driverVersion}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2.5">
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-gray-400 font-medium">Name</span>
                    <span className="text-white font-bold">{data.graphics.devices[selectedGpuIndex].name}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-gray-400 font-medium">Code Name</span>
                    <span className="text-white font-bold">{data.graphics.devices[selectedGpuIndex].codeName}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-gray-400 font-medium">Technology</span>
                    <span className="text-white font-bold">{data.graphics.devices[selectedGpuIndex].technology}</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-gray-400 font-medium">Memory Size</span>
                    <span className="text-white font-mono font-bold">
                      {data.graphics.devices[selectedGpuIndex].memorySizeMb} MBytes
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-gray-400 font-medium">Memory Type</span>
                    <span className="text-emerald-300 font-bold">
                      {data.graphics.devices[selectedGpuIndex].memoryType}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-gray-400 font-medium">Bus Width</span>
                    <span className="text-white font-mono font-bold">
                      {data.graphics.devices[selectedGpuIndex].busWidthBits} bits
                    </span>
                  </div>
                </div>
              </div>

              {/* Clocks Section */}
              <div className="pt-2 border-t border-[#1E293B] grid grid-cols-2 gap-3">
                <div className="bg-[#090E1A] p-3 rounded-xl border border-white/5 text-center">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">GPU Core Clock</span>
                  <span className="text-base font-black text-amber-300 font-mono mt-0.5 block">
                    {data.graphics.devices[selectedGpuIndex].gpuClockMhz} MHz
                  </span>
                </div>
                <div className="bg-[#090E1A] p-3 rounded-xl border border-white/5 text-center">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">Memory Clock</span>
                  <span className="text-base font-black text-cyan-300 font-mono mt-0.5 block">
                    {data.graphics.devices[selectedGpuIndex].memoryClockMhz} MHz
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 6: BENCH (CPU-Z BENCHMARK & STRESS ENGINE)
          ========================================================================= */}
      {activeTab === 'bench' && data && (
        <div className="space-y-5">
          {/* Benchmark Actions Bar */}
          <div className="bg-[#0E1526] border border-[#1E293B] rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#1E293B] pb-4">
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span>Rig-Z Multi-Core Benchmark Engine</span>
                  <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full font-bold">
                    Calibrated Point Scale
                  </span>
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  Mede a velocidade pura por núcleo (Single Thread) e a capacidade computacional em paralelo (Multi Thread).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={runBenchmark}
                  disabled={benchRunning || stressRunning}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white transition-all shadow-lg shadow-purple-600/30 disabled:opacity-50"
                >
                  <Activity className={`w-4 h-4 ${benchRunning ? 'animate-spin' : ''}`} />
                  <span>{benchRunning ? 'A calcular...' : 'Bench CPU'}</span>
                </button>

                <button
                  onClick={toggleStress}
                  disabled={benchRunning}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-lg ${
                    stressRunning
                      ? 'bg-rose-600 text-white shadow-rose-600/40 animate-pulse'
                      : 'bg-[#090E1A] hover:bg-[#1E293B] text-gray-300 hover:text-white border border-[#1E293B]'
                  }`}
                >
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>{stressRunning ? 'Parar Carga' : 'Stress CPU'}</span>
                </button>
              </div>
            </div>

            {/* Progress Bar during benchmark */}
            {benchRunning && (
              <div className="space-y-1.5 animate-fade-in">
                <div className="flex justify-between text-[11px] text-gray-400 font-bold">
                  <span>A executar testes computacionais nos 12 threads...</span>
                  <span className="text-purple-300 font-mono">{benchProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#090E1A] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-300 rounded-full"
                    style={{ width: `${benchProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Stress Active Warning */}
            {stressRunning && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between text-xs text-amber-300">
                <span className="flex items-center gap-2">
                  <Flame className="w-4 h-4 animate-bounce text-amber-400" />
                  <span><strong>Stress CPU ativo:</strong> Todos os 12 threads em 100% de utilização. Monitoriza as temperaturas.</span>
                </span>
                <span className="font-mono font-bold text-white">{liveClock} MHz ({liveVoltage})</span>
              </div>
            )}

            {/* Reference CPU Comparator Selector */}
            <div className="flex items-center gap-3 pt-1">
              <span className="text-xs font-bold text-gray-400 whitespace-nowrap">Comparar com Referência:</span>
              <select
                value={selectedReferenceIndex}
                onChange={(e) => setSelectedReferenceIndex(Number(e.target.value))}
                className="bg-[#090E1A] border border-[#1E293B] rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500 font-bold"
              >
                {data.benchReferences.map((ref, idx) => (
                  <option key={ref.name} value={idx}>
                    {ref.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Side-by-side Score Bars */}
            <div className="space-y-4 pt-2">
              {/* Single Thread Score */}
              <div className="bg-[#090E1A] border border-[#1E293B] rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-300">CPU Single Thread</span>
                  <div className="flex items-center gap-4">
                    <span className="text-purple-300 font-mono font-black text-sm">
                      {benchScores.singleScore} <span className="text-[10px] text-gray-500">Este CPU</span>
                    </span>
                    <span className="text-gray-400 font-mono text-xs">
                      {selectedRef.singleScore} <span className="text-[10px] text-gray-500">Ref</span>
                    </span>
                  </div>
                </div>

                {/* Bars comparison */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-purple-400 font-bold w-16 truncate">O Teu CPU</span>
                    <div className="flex-1 h-3 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-purple-500 rounded-full"
                        style={{ width: `${Math.min(100, (benchScores.singleScore / 1000) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-400 font-bold w-16 truncate">Referência</span>
                    <div className="flex-1 h-3 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500/70 rounded-full"
                        style={{ width: `${Math.min(100, (selectedRef.singleScore / 1000) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Multi Thread Score */}
              <div className="bg-[#090E1A] border border-[#1E293B] rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-gray-300">CPU Multi Thread</span>
                  <div className="flex items-center gap-4">
                    <span className="text-cyan-300 font-mono font-black text-sm">
                      {benchScores.multiScore} <span className="text-[10px] text-gray-500">Este CPU</span>
                    </span>
                    <span className="text-gray-400 font-mono text-xs">
                      {selectedRef.multiScore} <span className="text-[10px] text-gray-500">Ref</span>
                    </span>
                  </div>
                </div>

                {/* Bars comparison */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-cyan-400 font-bold w-16 truncate">O Teu CPU</span>
                    <div className="flex-1 h-3 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded-full"
                        style={{ width: `${Math.min(100, (benchScores.multiScore / 18000) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-400 font-bold w-16 truncate">Referência</span>
                    <div className="flex-1 h-3 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-indigo-500/70 rounded-full"
                        style={{ width: `${Math.min(100, (selectedRef.multiScore / 18000) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Multi Thread Ratio Pill */}
              <div className="flex justify-between items-center p-3 rounded-xl bg-[#090E1A] border border-[#1E293B] text-xs">
                <span className="text-gray-400 font-medium">Multi Thread Ratio (Multi / Single)</span>
                <span className="text-emerald-400 font-black font-mono text-sm">{benchScores.ratio}x</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
