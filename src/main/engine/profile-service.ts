import fs from 'fs';
import path from 'path';
import os from 'os';
import { OptimizationProfile } from '../../shared/types';

export class ProfileService {
  private static instance: ProfileService;
  private profilesPath: string;
  private profiles: Map<string, OptimizationProfile> = new Map();

  private defaultProfiles: OptimizationProfile[] = [
    {
      id: 'gaming',
      name: 'Gaming',
      description: 'Prioriza latência mínima de entrada, modo de jogo, resolução de timer e estabilidade de taxa de fotogramas.',
      icon: 'Gamepad2',
      itemIds: [
        'input_power_plan',
        'input_game_mode',
        'input_mouse_accel',
        'input_pointer_speed',
        'input_sticky_keys',
        'input_filter_keys',
        'input_toggle_keys',
        'input_game_dvr',
        'input_windowed_optimizations',
        'input_usb_selective_suspend',
        'input_pcie_link_state',
        'input_cpu_min_state',
        'input_prevent_sleep_gaming',
        'input_focus_assist',
        'input_gpu_preference',
        'net_flush_dns',
        'net_tcp_autotuning',
        'net_rss',
        'net_delivery_opt_p2p',
        'net_limit_wu_bandwidth',
        'wifi_power_plan_max_perf',
        'srv_disable_restart_apps',
        'srv_safe_services_manual',
        'mem_check_trim_active',
        'mem_optimize_drives',
        'mem_enable_storage_sense',
        'cpu_gpu_power_gaming',
        'game_pause_windows_update',
        'game_silence_notifications',
        'game_before_playing_checklist',
        'ui_visual_effects_perf',
        'ui_disable_window_animations',
        'ui_disable_transparency',
        'ui_menu_show_delay_zero',
        'ui_disable_web_search_start',
        'priv_telemetry_min_official',
        'clean_user_temp',
        'clean_windows_temp',
        'clean_directx_shader_cache',
        'clean_gpu_shader_cache'
      ],
      isBuiltIn: true
    },
    {
      id: 'work',
      name: 'Trabalho & Produtividade',
      description: 'Foco na estabilidade máxima, privacidade, arranque limpo e libertação de espaço em disco sem alterações agressivas.',
      icon: 'Briefcase',
      itemIds: [
        'input_mouse_accel',
        'input_pointer_speed',
        'input_sticky_keys',
        'input_filter_keys',
        'net_flush_dns',
        'net_tcp_autotuning',
        'net_rss',
        'net_delivery_opt_p2p',
        'srv_disable_restart_apps',
        'mem_check_trim_active',
        'mem_optimize_drives',
        'mem_enable_storage_sense',
        'mem_index_user_library',
        'cpu_gpu_power_balanced',
        'ui_disable_window_animations',
        'ui_menu_show_delay_zero',
        'ui_disable_web_search_start',
        'ui_disable_tips_suggestions',
        'priv_telemetry_min_official',
        'priv_disable_advertising_id',
        'priv_disable_tailored_experiences',
        'priv_disable_activity_history',
        'priv_reduce_feedback_frequency',
        'clean_user_temp',
        'clean_windows_temp',
        'clean_thumbnail_cache',
        'clean_old_windows_logs'
      ],
      isBuiltIn: true
    },
    {
      id: 'balanced',
      name: 'Equilibrado',
      description: 'Equilíbrio padrão ideal entre poupança de energia, agilidade do sistema e segurança das definições da Microsoft.',
      icon: 'Scale',
      itemIds: [
        'input_mouse_accel',
        'input_pointer_speed',
        'input_game_mode',
        'net_flush_dns',
        'net_tcp_autotuning',
        'srv_disable_restart_apps',
        'mem_check_trim_active',
        'cpu_gpu_power_balanced',
        'ui_menu_show_delay_zero',
        'priv_telemetry_min_official',
        'clean_user_temp',
        'clean_windows_temp'
      ],
      isBuiltIn: true
    }
  ];

  private constructor() {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    this.profilesPath = path.join(appData, 'Optimizer', 'profiles', 'custom-profiles.json');
    this.loadProfiles();
  }

  public static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  private loadProfiles() {
    for (const p of this.defaultProfiles) {
      this.profiles.set(p.id, p);
    }

    try {
      if (fs.existsSync(this.profilesPath)) {
        const raw = fs.readFileSync(this.profilesPath, 'utf-8');
        const list: OptimizationProfile[] = JSON.parse(raw);
        for (const item of list) {
          this.profiles.set(item.id, item);
        }
      }
    } catch (e) {
      console.error('Erro ao ler perfis personalizados:', e);
    }
  }

  public getProfiles(): OptimizationProfile[] {
    return Array.from(this.profiles.values());
  }

  public getProfile(id: string): OptimizationProfile | undefined {
    return this.profiles.get(id);
  }

  public saveProfile(profile: OptimizationProfile): void {
    this.profiles.set(profile.id, profile);
    this.persistCustomProfiles();
  }

  public deleteProfile(id: string): boolean {
    const p = this.profiles.get(id);
    if (!p || p.isBuiltIn) return false;
    this.profiles.delete(id);
    this.persistCustomProfiles();
    return true;
  }

  private persistCustomProfiles() {
    try {
      const custom = Array.from(this.profiles.values()).filter((p) => !p.isBuiltIn);
      const dir = path.dirname(this.profilesPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(this.profilesPath, JSON.stringify(custom, null, 2), 'utf-8');
    } catch (e) {
      console.error('Erro ao persistir perfis:', e);
    }
  }
}
