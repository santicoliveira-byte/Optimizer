import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Trash2, 
  Cpu, 
  Layers, 
  Keyboard, 
  PackageCheck, 
  Download, 
  RefreshCw, 
  Sliders, 
  CheckCircle2, 
  XCircle,
  Clock
} from 'lucide-react';

export interface PowerToolkitViewProps {
  onShowNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const PowerToolkitView: React.FC<PowerToolkitViewProps> = ({ onShowNotification }) => {
  const [isCleaningRam, setIsCleaningRam] = useState(false);
  const [ramResult, setRamResult] = useState<string | null>(null);

  const [mpoDisabled, setMpoDisabled] = useState<boolean>(false);
  const [isTogglingMpo, setIsTogglingMpo] = useState(false);

  const [runtimes, setRuntimes] = useState<any[]>([]);
  const [isLoadingRuntimes, setIsLoadingRuntimes] = useState(false);
  const [installingRuntime, setInstallingRuntime] = useState<string | null>(null);

  const [hotkeys, setHotkeys] = useState<any[]>([]);

  const [msiDevices, setMsiDevices] = useState<any[]>([]);
  const [isLoadingMsi, setIsLoadingMsi] = useState(false);
  const [togglingMsiId, setTogglingMsiId] = useState<string | null>(null);

  const [timerStatus, setTimerStatus] = useState<any>(null);
  const [isTogglingTimer, setIsTogglingTimer] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      if (window.optimizerApi?.runtimesGetMpo) {
        const mpo = await window.optimizerApi.runtimesGetMpo();
        setMpoDisabled(mpo);
      }
      if (window.optimizerApi?.hotkeysGetList) {
        const hk = await window.optimizerApi.hotkeysGetList();
        setHotkeys(hk);
      }
      if (window.optimizerApi?.timerGetStatus) {
        const ts = await window.optimizerApi.timerGetStatus();
        setTimerStatus(ts);
      }
      refreshRuntimes();
      refreshMsiDevices();
    } catch {}
  };

  const handleToggleTimer = async () => {
    setIsTogglingTimer(true);
    const target = !(timerStatus?.isLockedHalfMs);
    try {
      const res = await window.optimizerApi.timerSetPrecision(target);
      onShowNotification(res.message, res.success ? 'success' : 'error');
      if (window.optimizerApi?.timerGetStatus) {
        const ts = await window.optimizerApi.timerGetStatus();
        setTimerStatus(ts);
      }
    } catch (e: any) {
      onShowNotification(e.message, 'error');
    } finally {
      setIsTogglingTimer(false);
    }
  };

  const refreshMsiDevices = async () => {
    setIsLoadingMsi(true);
    try {
      if (window.optimizerApi?.msiGetDevices) {
        const devs = await window.optimizerApi.msiGetDevices();
        setMsiDevices(devs);
      }
    } catch {} finally {
      setIsLoadingMsi(false);
    }
  };

  const handleToggleMsi = async (dev: any) => {
    setTogglingMsiId(dev.id);
    const targetStatus = !dev.msiEnabled;
    try {
      const res = await window.optimizerApi.msiSetDevice(dev.deviceInstanceId, targetStatus, 'High');
      onShowNotification(res.message, res.success ? 'success' : 'error');
      await refreshMsiDevices();
    } catch (e: any) {
      onShowNotification(e.message, 'error');
    } finally {
      setTogglingMsiId(null);
    }
  };

  const refreshRuntimes = async () => {
    setIsLoadingRuntimes(true);
    try {
      if (window.optimizerApi?.runtimesGetStatus) {
        const r = await window.optimizerApi.runtimesGetStatus();
        setRuntimes(r);
      }
    } catch {} finally {
      setIsLoadingRuntimes(false);
    }
  };

  const handleCleanRam = async () => {
    setIsCleaningRam(true);
    try {
      const res = await window.optimizerApi.ramClean();
      if (res.success) {
        setRamResult(`~${res.freedEstimateMB} MB libertados da Standby List & Working Sets`);
        onShowNotification(`RAM Otimizada! ${res.freedEstimateMB}MB libertados com sucesso.`, 'success');
      } else {
        onShowNotification('Falha ao purgar RAM.', 'error');
      }
    } catch (e: any) {
      onShowNotification(e.message, 'error');
    } finally {
      setIsCleaningRam(false);
    }
  };

  const handleToggleMpo = async () => {
    setIsTogglingMpo(true);
    const target = !mpoDisabled;
    try {
      const res = await window.optimizerApi.runtimesSetMpo(target);
      if (res.success) {
        setMpoDisabled(target);
        onShowNotification(res.message, 'success');
      } else {
        onShowNotification(res.message, 'error');
      }
    } catch (e: any) {
      onShowNotification(e.message, 'error');
    } finally {
      setIsTogglingMpo(false);
    }
  };

  const handleInstallRuntime = async (item: any) => {
    setInstallingRuntime(item.name);
    try {
      const res = await window.optimizerApi.runtimesInstall(item);
      onShowNotification(res.message, res.success ? 'success' : 'info');
      await refreshRuntimes();
    } catch (e: any) {
      onShowNotification(e.message, 'error');
    } finally {
      setInstallingRuntime(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Auto-RAM & Standby-List Purger */}
      <div className="bg-[#10172A] border border-[#1E293B] rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl mt-1">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Purga Instantânea de Standby-List & Cache de RAM</h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                  Win32 PSAPI
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-2xl">
                O Windows 10/11 retém gigabytes de ficheiros obsoletos na Standby List (memória em espera) que causam micro-travamentos (*stuttering*) em jogos pesados quando a memória livre se esgota. Esta rotina esvazia os working sets e devolve a RAM ao sistema sem fechar os teus programas.
              </p>
              {ramResult && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-xs font-semibold text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {ramResult}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={handleCleanRam}
            disabled={isCleaningRam}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Trash2 className={`w-4 h-4 ${isCleaningRam ? 'animate-spin' : ''}`} />
            {isCleaningRam ? 'A Purgar Memória...' : 'Limpar Standby-List Agora'}
          </button>
        </div>
      </div>

      {/* 2. Precision Timer Resolution (0.500 ms Microsecond Precision) */}
      <div className="bg-[#10172A] border border-[#1E293B] rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-xl mt-1">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Resolução de Timer de Alta Precisão (0.500 ms)</h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full">
                  NtSetTimerResolution
                </span>
                {timerStatus?.isLockedHalfMs ? (
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                    Travado a 0.500 ms
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-mono bg-gray-800 text-gray-400 border border-gray-700 rounded-full">
                    {timerStatus?.currentMs ? `${timerStatus.currentMs.toFixed(3)} ms` : '1.000 ms'}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-2xl">
                O Windows normalmente roda com uma taxa de interrupções de 15.6ms ou 1.0ms. Ao cravar a resolução do timer do kernel em <strong>0.500 ms exatos</strong>, o tempo de resposta entre o processamento do rato, teclado e a chamada de renderização de cada frame é reduzido ao mínimo absoluto suportado pelo hardware.
              </p>
              <div className="mt-2 text-[11px] font-mono text-gray-400 flex items-center gap-4">
                <span>Resolução Atual: <strong className="text-cyan-300 font-bold">{timerStatus?.currentMs ? `${timerStatus.currentMs.toFixed(3)} ms` : '1.000 ms'}</strong></span>
                <span>Mínimo Hardware: <strong className="text-white">0.500 ms</strong></span>
                <span>Padrão Windows: <strong className="text-gray-500">15.625 ms</strong></span>
              </div>
            </div>
          </div>
          <button
            onClick={handleToggleTimer}
            disabled={isTogglingTimer}
            className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-xs shadow-lg transition-all cursor-pointer disabled:opacity-50 shrink-0 ${
              timerStatus?.isLockedHalfMs
                ? 'bg-[#1E293B] hover:bg-[#334155] border border-cyan-500/30 text-cyan-300'
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-500/20'
            }`}
          >
            <Clock className={`w-4 h-4 ${isTogglingTimer ? 'animate-spin' : ''}`} />
            {isTogglingTimer
              ? 'A Aplicar...'
              : timerStatus?.isLockedHalfMs
              ? 'Desativar 0.5ms (Repor Padrão)'
              : 'Travar a 0.500 ms Agora'}
          </button>
        </div>
      </div>

      {/* 3. MPO (Multi-Plane Overlay) Fix & Discord/Browser Stutter */}
      <div className="bg-[#10172A] border border-[#1E293B] rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl mt-1">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">Correção MPO (Multi-Plane Overlay) - Anti-Stutter GPU</h3>
                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${mpoDisabled ? 'bg-purple-500/10 text-purple-400 border-purple-500/30' : 'bg-gray-800 text-gray-400 border-gray-700'}`}>
                  {mpoDisabled ? 'MPO Desativado (Recomendado)' : 'Padrão do Windows'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-2xl">
                O Multi-Plane Overlay do Windows DWM causa frequentemente ecrãs pretos momentâneos, gaguejos e travamentos ao jogar com Discord ou Chrome abertos em GPUs NVIDIA GeForce e AMD Radeon. Desativar o MPO é a correção universal recomendada pela NVIDIA.
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleMpo}
            disabled={isTogglingMpo}
            className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-bold text-xs border transition-all cursor-pointer disabled:opacity-50 shrink-0 ${
              mpoDisabled
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300 hover:bg-purple-500/30'
                : 'bg-[#1E293B] border-gray-700 text-white hover:bg-purple-600/30 hover:border-purple-500/40'
            }`}
          >
            <Sliders className="w-4 h-4" />
            {isTogglingMpo ? 'A Aplicar...' : mpoDisabled ? 'MPO Desativado (Reverter)' : 'Desativar MPO (Fix Stutter)'}
          </button>
        </div>
      </div>

      {/* 3. Global In-Game Hotkeys */}
      <div className="bg-[#10172A] border border-[#1E293B] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl">
            <Keyboard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Atalhos Globais em Jogo (Global Hotkeys)</h3>
            <p className="text-xs text-gray-400 mt-0.5">Controla os modos de otimização instantaneamente em qualquer jogo com combinações de teclas registadas no Windows.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {hotkeys.map((hk) => (
            <div key={hk.id} className="p-4 rounded-xl bg-[#0B0F19] border border-[#1E293B] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-1 text-xs font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded-lg">
                    {hk.shortcut}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Ativo" />
                </div>
                <h4 className="text-xs font-bold text-white mb-1">{hk.name}</h4>
                <p className="text-[11px] text-gray-400 leading-normal">{hk.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Visual C++ & DirectX Runtime Checker */}
      <div className="bg-[#10172A] border border-[#1E293B] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl">
              <PackageCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Diagnóstico de Runtimes & Pacotes de Jogos</h3>
              <p className="text-xs text-gray-400 mt-0.5">Verifica se o Windows possui todas as bibliotecas necessárias para evitar erros de arranque e DLLs em falta.</p>
            </div>
          </div>
          <button
            onClick={refreshRuntimes}
            disabled={isLoadingRuntimes}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-xs font-medium text-gray-300 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRuntimes ? 'animate-spin' : ''}`} />
            Verificar
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {runtimes.map((rt) => (
            <div key={rt.name} className="p-4 rounded-xl bg-[#0B0F19] border border-[#1E293B] flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white truncate">{rt.name}</span>
                  {rt.installed ? (
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Instalado
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Não Detetado
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 mt-1">
                  {rt.version ? `Versão detetada: ${rt.version}` : 'Recomendado para jogos Unreal Engine e Unity'}
                </p>
              </div>

              {!rt.installed && (
                <button
                  onClick={() => handleInstallRuntime(rt)}
                  disabled={installingRuntime === rt.name}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  {installingRuntime === rt.name ? 'A Instalar...' : 'Instalar'}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 5. MSI Mode Utility v3 (Message Signaled Interrupts & DPC Latency) */}
      <div className="bg-[#10172A] border border-[#1E293B] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-xl">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">MSI Mode Utility v3 (Interrupções de Hardware por Mensagem)</h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 rounded-full">
                  Zero DPC Jitter
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Substitui interrupções partilhadas (Line-Based IRQ) por Message Signaled Interrupts (MSI) diretos na GPU e placa de rede. Elimina gaguejos de micro-latência causados por filas de DPC.
              </p>
            </div>
          </div>
          <button
            onClick={refreshMsiDevices}
            disabled={isLoadingMsi}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1E293B] hover:bg-[#334155] text-xs font-medium text-gray-300 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingMsi ? 'animate-spin' : ''}`} />
            Atualizar Dispositivos
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {msiDevices.map((dev) => (
            <div key={dev.id} className="p-4 rounded-xl bg-[#0B0F19] border border-[#1E293B] flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                    dev.category === 'gpu' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    dev.category === 'network' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                    'bg-gray-800 text-gray-300'
                  }`}>
                    {dev.category === 'gpu' ? 'Placa Gráfica' : dev.category === 'network' ? 'Rede / Internet' : 'Dispositivo'}
                  </span>

                  <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                    dev.msiEnabled
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}>
                    {dev.msiEnabled ? 'Modo MSI Ativo' : 'Line-Based (Legado)'}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-white truncate" title={dev.name}>{dev.name}</h4>
                <p className="text-[10px] font-mono text-gray-500 truncate mt-0.5">{dev.deviceInstanceId}</p>
              </div>

              <div className="pt-2 border-t border-[#1E293B] flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-gray-400">Prioridade:</span>
                  <span className="text-[11px] font-bold text-white bg-[#1E293B] px-2 py-0.5 rounded">
                    {dev.interruptPriority || 'High'}
                  </span>
                </div>

                <button
                  onClick={() => handleToggleMsi(dev)}
                  disabled={togglingMsiId === dev.id}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50 ${
                    dev.msiEnabled
                      ? 'bg-[#1E293B] hover:bg-gray-700 text-gray-300'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20'
                  }`}
                >
                  {togglingMsiId === dev.id ? 'A aplicar...' : dev.msiEnabled ? 'Desativar MSI' : 'Ativar MSI (Alta Prioridade)'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
