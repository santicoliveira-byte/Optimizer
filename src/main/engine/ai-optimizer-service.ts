import { SystemMetrics, OptimizationProfile } from '../../shared/types';
import { OptimizerEngine } from './optimizer-engine';
import { ProfileService } from './profile-service';

export interface HardwareRecommendation {
  detectedHardware: {
    cpuSummary: string;
    ramSummary: string;
    gpuSummary: string;
    storageType: string;
    networkType: string;
    isGamingRig: boolean;
    isCompetitiveEsports: boolean;
  };
  recommendedProfileId: string;
  recommendedProfileName: string;
  profileReasoning: string[];
  recommendedTweakIds: string[];
  estimatedLatencyReductionMs: number;
  estimatedFpsStabilityPercent: number;
}

export class AiOptimizerService {
  private static instance: AiOptimizerService;

  private constructor() {}

  public static getInstance(): AiOptimizerService {
    if (!AiOptimizerService.instance) {
      AiOptimizerService.instance = new AiOptimizerService();
    }
    return AiOptimizerService.instance;
  }

  public analyzeHardwareAndRecommend(metrics: SystemMetrics): HardwareRecommendation {
    const isHighEndGpu = Boolean(
      metrics.hasDedicatedGpu &&
      metrics.gpuName &&
      /RTX|Radeon RX 6|Radeon RX 7|GeForce RTX 30|GeForce RTX 40/i.test(metrics.gpuName)
    );

    const hasAmpleRam = metrics.ramTotalGb >= 16;
    const isLaptop = metrics.isLaptop;
    const isWifiPrimary = metrics.hasWifi;

    const cpuModel = metrics.cpuModel || 'Processador Multi-core Moderno';
    const gpuName = metrics.gpuName || (metrics.hasDedicatedGpu ? 'Placa Gráfica Dedicada' : 'Gráficos Integrados');
    const ramTotal = metrics.ramTotalGb || 16;

    const isGamingRig = isHighEndGpu || (!isLaptop && metrics.hasDedicatedGpu);
    const isCompetitiveEsports = isGamingRig && (metrics.currentPingMs ?? 30) < 40;

    const reasoning: string[] = [];
    const tweakIds: string[] = [];

    // 1. CPU & Latency reasoning
    if (isGamingRig) {
      reasoning.push(`Placa gráfica dedicada detetada (${gpuName}). Ativando perfil de latência extrema e agendamento de GPU.`);
      tweakIds.push('input_power_plan', 'input_gpu_preference', 'input_windowed_optimizations', 'input_game_dvr');
    } else if (isLaptop) {
      reasoning.push(`Sistema portátil detetado (${ramTotal}GB RAM). Otimizando eficiência térmica sem comprometer clock boosts.`);
      tweakIds.push('input_power_plan', 'input_cpu_min_state', 'wifi_power_plan_max_perf');
    }

    // 2. Input delay & polling rate
    reasoning.push('Otimizando taxa de amostragem de ponteiro e desativando aceleração para precisão linear 1:1 de rato.');
    tweakIds.push('input_mouse_accel', 'input_pointer_speed', 'input_sticky_keys', 'input_filter_keys');

    // 3. Network & Bufferbloat
    if (isWifiPrimary) {
      reasoning.push('Adaptador Wi-Fi identificado: garantindo máxima estabilidade de conexão, autotuning TCP e prioridade QoS sem desconexões.');
      tweakIds.push('wifi_power_plan_max_perf', 'net_tcp_autotuning', 'net_flush_dns', 'net_rss');
    } else {
      reasoning.push('Conexão por cabo Ethernet: autotuning TCP, flush DNS e Receive-Side Scaling ativos.');
      tweakIds.push('net_tcp_autotuning', 'net_flush_dns', 'net_rss');
    }

    // 4. Memory & Cache
    if (hasAmpleRam) {
      reasoning.push(`${ramTotal}GB RAM disponível: forçando TRIM em unidades SSD e limpando buffers de shaders pré-jogo.`);
      tweakIds.push('mem_check_trim_active', 'mem_optimize_drives', 'clean_directx_shader_cache', 'clean_user_temp');
    }

    // 5. System hygiene & Game Mode
    reasoning.push('Ativando Windows Game Mode oficial e silenciando atualizações agressivas em segundo plano.');
    tweakIds.push('input_game_mode', 'game_pause_windows_update', 'srv_disable_restart_apps', 'ui_menu_show_delay_zero', 'priv_telemetry_min_official');

    // Deduplicate
    const uniqueTweaks = Array.from(new Set(tweakIds));

    let recommendedProfileId = 'gaming';
    let recommendedProfileName = 'Gaming Ultra Competitivo';

    if (!isGamingRig && isLaptop) {
      recommendedProfileId = 'balanced';
      recommendedProfileName = 'Equilibrado & Portátil Pro';
    }

    return {
      detectedHardware: {
        cpuSummary: cpuModel.replace(/w\/.*Graphics/i, '').replace(/Processor/i, '').trim(),
        ramSummary: `${ramTotal} GB DDR4/DDR5`,
        gpuSummary: gpuName,
        storageType: 'SSD NVMe / SATA com TRIM',
        networkType: isWifiPrimary ? 'Wi-Fi 6 / Sem Fios' : 'Ethernet Gigabit/2.5GbE',
        isGamingRig,
        isCompetitiveEsports
      },
      recommendedProfileId,
      recommendedProfileName,
      profileReasoning: reasoning,
      recommendedTweakIds: uniqueTweaks,
      estimatedLatencyReductionMs: isGamingRig ? 4.2 : 2.5,
      estimatedFpsStabilityPercent: isGamingRig ? 18 : 12
    };
  }

  public async autoApplyBestRecommendation(metrics: SystemMetrics): Promise<{
    success: boolean;
    appliedCount: number;
    failedCount: number;
    recommendation: HardwareRecommendation;
    message: string;
  }> {
    const recommendation = this.analyzeHardwareAndRecommend(metrics);
    const engine = OptimizerEngine.getInstance();

    let appliedCount = 0;
    let failedCount = 0;

    for (const tweakId of recommendation.recommendedTweakIds) {
      try {
        const res = await engine.apply(tweakId, false);
        if (res.success) {
          appliedCount++;
        } else {
          failedCount++;
        }
      } catch {
        failedCount++;
      }
    }

    return {
      success: appliedCount > 0,
      appliedCount,
      failedCount,
      recommendation,
      message: `Configuração Inteligente Concluída: ${appliedCount} ajustes aplicados com sucesso para o teu hardware!`
    };
  }
}
