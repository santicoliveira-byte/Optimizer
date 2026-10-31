import React, { useState, useEffect } from 'react';
import {
  Globe,
  Zap,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  Loader2,
  RotateCcw
} from 'lucide-react';
import { DnsServerItem } from '../../shared/types';

export const DnsBenchmarkView: React.FC = () => {
  const [servers, setServers] = useState<DnsServerItem[]>([]);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const runBenchmark = async () => {
    setIsBenchmarking(true);
    setFeedback(null);
    try {
      if (window.optimizerApi?.dnsBenchmarkAll) {
        const results = await window.optimizerApi.dnsBenchmarkAll();
        setServers(results);
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Falha no teste DNS.' });
    } finally {
      setIsBenchmarking(false);
    }
  };

  useEffect(() => {
    runBenchmark();
  }, []);

  const handleApplyDns = async (server: DnsServerItem) => {
    setApplyingId(server.id);
    setFeedback(null);
    try {
      if (window.optimizerApi?.dnsApply) {
        const res = await window.optimizerApi.dnsApply(server.primaryIp, server.secondaryIp);
        if (res.success) {
          setFeedback({ type: 'success', message: `${server.name} aplicado com sucesso! Cache DNS limpa.` });
        } else {
          setFeedback({ type: 'error', message: res.message });
        }
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Erro ao aplicar DNS.' });
    } finally {
      setApplyingId(null);
    }
  };

  const handleResetDns = async () => {
    setFeedback(null);
    try {
      if (window.optimizerApi?.dnsReset) {
        const res = await window.optimizerApi.dnsReset();
        if (res.success) {
          setFeedback({ type: 'success', message: 'DNS restaurado para automático (DHCP).' });
        } else {
          setFeedback({ type: 'error', message: res.message });
        }
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Erro ao restaurar DNS.' });
    }
  };

  const fastestServer = servers.length > 0 ? servers[0] : null;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-[#10172A] border border-[#1E293B] rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner shrink-0">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">DNS Benchmark & Seletor de Latência</h2>
              <span className="px-2 py-0.5 text-[10px] font-mono font-bold uppercase rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Port 53 TCP Ping
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-1 max-w-2xl leading-relaxed">
              Mede a latência em tempo real para os servidores DNS globais mais rápidos e aplica o melhor para reduzir o jitter e o atraso de lookup em jogos online.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleResetDns}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-300 bg-[#162035] hover:bg-[#1C2945] border border-[#233559] transition-all"
            title="Restaurar DNS do router / operador (DHCP)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Repor DHCP</span>
          </button>
          <button
            onClick={runBenchmark}
            disabled={isBenchmarking}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isBenchmarking ? 'animate-spin' : ''}`} />
            <span>{isBenchmarking ? 'A testar pings...' : 'Re-testar Latências'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="flex-1 font-medium">{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="text-gray-400 hover:text-white font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Fastest Pick Recommendation Card */}
      {fastestServer && fastestServer.pingMs && fastestServer.pingMs < 900 && (
        <div className="bg-gradient-to-r from-[#0C1B2B] to-[#121B30] border border-cyan-500/40 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500 text-slate-950 font-black flex items-center justify-center shrink-0">
              #1
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                <Zap className="w-3 h-3" /> Recomendação de Menor Latência
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                {fastestServer.name} ({fastestServer.pingMs} ms)
              </h3>
              <p className="text-xs text-gray-400">
                IPs: {fastestServer.primaryIp} • {fastestServer.secondaryIp}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleApplyDns(fastestServer)}
            disabled={applyingId === fastestServer.id}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-all shadow-md shadow-cyan-400/20"
          >
            {applyingId === fastestServer.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            <span>Aplicar DNS Mais Rápido</span>
          </button>
        </div>
      )}

      {/* DNS Servers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {servers.map((server, idx) => {
          const isBest = idx === 0 && (server.pingMs ?? 999) < 900;
          return (
            <div
              key={server.id}
              className={`rounded-2xl p-5 border flex flex-col justify-between transition-all duration-200 relative overflow-hidden ${
                isBest
                  ? 'bg-[#101F33] border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                  : 'bg-[#121A2C] border-[#1C2843] hover:border-indigo-500/40 hover:bg-[#162137]'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white">{server.name}</h4>
                    <span className="text-xs text-gray-400">{server.provider}</span>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-lg font-mono font-black ${
                        isBest
                          ? 'text-cyan-300'
                          : (server.pingMs ?? 999) < 25
                          ? 'text-emerald-400'
                          : (server.pingMs ?? 999) < 60
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {server.pingMs !== undefined && server.pingMs < 900 ? `${server.pingMs} ms` : 'Falha'}
                    </span>
                  </div>
                </div>

                <div className="bg-[#090F1C] border border-[#1A2640] rounded-xl p-3 text-xs font-mono space-y-1 mb-4">
                  <div className="flex justify-between text-gray-400">
                    <span>Primário:</span>
                    <span className="text-gray-200">{server.primaryIp}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Secundário:</span>
                    <span className="text-gray-200">{server.secondaryIp}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleApplyDns(server)}
                disabled={applyingId === server.id || isBenchmarking}
                className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                  isBest
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md font-bold'
                    : 'bg-[#18233C] hover:bg-indigo-600 hover:text-white text-gray-300 border border-[#23355A]'
                }`}
              >
                {applyingId === server.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ArrowRight className="w-3.5 h-3.5" />
                )}
                <span>{applyingId === server.id ? 'A aplicar...' : 'Ativar este DNS'}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
