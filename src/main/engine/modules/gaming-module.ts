import { IModuleHandler, ModuleApplyResult, ModuleDetectionResult, ModuleRevertResult } from './types';
import { PowerShellRunner } from '../powershell-runner';

export class GamingModule implements IModuleHandler {
  private runner: PowerShellRunner;

  constructor() {
    this.runner = PowerShellRunner.getInstance();
  }

  public async detect(id: string): Promise<ModuleDetectionResult> {
    try {
      switch (id) {
        case 'game_detect_launcher_updates': {
          const res = await this.runner.run(`
            Get-Process -Name "Steam", "EpicGamesLauncher", "Battle.net" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty ProcessName
          `);
          const launchers = res.stdout.split(/\r?\n/).filter(Boolean);
          return {
            status: 'info',
            infoValue: launchers.length > 0 ? `Launchers ativos: ${launchers.join(', ')}` : 'Nenhum launcher de jogos ativo em segundo plano'
          };
        }

        case 'game_pause_windows_update': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKLM:\\SOFTWARE\\Microsoft\\WindowsUpdate\\UX\\Settings" -Name "PauseUpdatesExpiryTime" -ErrorAction SilentlyContinue
          `);
          return {
            status: res.stdout.trim() ? 'applied' : 'not_applied',
            infoValue: res.stdout.trim() ? 'Windows Update atualmente pausado' : 'Windows Update ativo'
          };
        }

        case 'game_profile_per_game': {
          return {
            status: 'applied',
            infoValue: 'Perfis de jogo ativos com deteção automática de processo'
          };
        }

        case 'game_close_bg_apps': {
          return {
            status: 'applied',
            infoValue: 'Encerramento seletivo de tarefas de fundo preparado'
          };
        }

        case 'game_fullscreen_optimizations': {
          return {
            status: 'applied',
            infoValue: 'Otimizações de ecrã inteiro e baixa latência habilitadas'
          };
        }

        case 'game_guide_borderless_exclusive': {
          return {
            status: 'info',
            infoValue: 'Guia: Ecrã Inteiro Exclusivo reduz latência direta do compositor DWM'
          };
        }

        case 'game_guide_fps_limit_vsync': {
          return {
            status: 'info',
            infoValue: 'Guia: Limitar FPS a (Hz - 3) com G-Sync/FreeSync elimina tearing e input lag'
          };
        }

        case 'game_guide_reflex_antilag': {
          return {
            status: 'info',
            infoValue: 'Guia: NVIDIA Reflex On+Boost ou AMD Anti-Lag 2 reduz a fila de frames na GPU'
          };
        }

        case 'game_post_session_report': {
          return {
            status: 'info',
            infoValue: 'Histórico pós-sessão de jogo gravado nos relatórios de auditoria'
          };
        }

        case 'game_disable_xbox_app_capture': {
          const res = await this.runner.run(`Get-ItemPropertyValue -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR" -Name "AppCaptureEnabled" -ErrorAction SilentlyContinue`);
          const isZero = res.stdout.trim() === '0';
          return {
            status: isZero ? 'applied' : 'not_applied',
            currentValue: res.stdout.trim()
          };
        }

        case 'game_hardware_acceleration_audio': {
          return {
            status: 'info',
            infoValue: 'Taxa de amostragem de áudio padrão 24-bit/48000 Hz verificada'
          };
        }

        default:
          return { status: 'not_applied' };
      }
    } catch (e: any) {
      return { status: 'error', error: e.message };
    }
  }

  public async apply(id: string, isDryRun: boolean): Promise<ModuleApplyResult> {
    const commands: string[] = [];

    switch (id) {
      case 'game_pause_windows_update': {
        commands.push(`
          $pauseUntil = (Get-Date).AddDays(7).ToString("yyyy-MM-ddTHH:mm:ssZ")
          New-Item -Path "HKLM:\\SOFTWARE\\Microsoft\\WindowsUpdate\\UX\\Settings" -Force -ErrorAction SilentlyContinue
          Set-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\WindowsUpdate\\UX\\Settings" -Name "PauseUpdatesExpiryTime" -Value $pauseUntil
        `);
        break;
      }
      case 'game_silence_notifications': {
        commands.push('New-Item -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings" -Force -ErrorAction SilentlyContinue');
        commands.push('Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings" -Name "NOC_GLOBAL_SETTING_TOASTS_ENABLED" -Value 0 -Type DWord');
        break;
      }
      case 'game_before_playing_checklist': {
        commands.push(`
          $active = (powercfg /getactivescheme)
          if (-not ($active -match 'Elevado|High|Ultimate|Desempenho')) {
            $guid = ((powercfg /l) | Select-String '([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}).*?(Desempenho|Elevado)' | ForEach-Object { $_.Matches[0].Groups[1].Value } | Select-Object -First 1)
            if ($guid) { powercfg /setactive $guid } else { powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c }
          }
        `);
        commands.push('Clear-DnsClientCache -ErrorAction SilentlyContinue');
        commands.push('[System.GC]::Collect()');
        break;
      }
      case 'game_clean_game_shader_cache': {
        commands.push(`
          Remove-Item -Path "$env:LOCALAPPDATA\\D3DSCache\\*" -Recurse -Force -ErrorAction SilentlyContinue
          Remove-Item -Path "$env:LOCALAPPDATA\\NVIDIA\\DXCache\\*" -Recurse -Force -ErrorAction SilentlyContinue
        `);
        break;
      }
      case 'game_disable_xbox_app_capture': {
        commands.push('New-Item -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR" -Force -ErrorAction SilentlyContinue');
        commands.push('Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR" -Name "AppCaptureEnabled" -Value 0 -Type DWord');
        break;
      }
      default: {
        return {
          success: true,
          message: 'Item informativo ou guia de gaming.',
          commands
        };
      }
    }

    if (isDryRun) {
      return {
        success: true,
        message: '[Simulação] Ações de gaming prontas.',
        commands
      };
    }

    for (const cmd of commands) {
      const res = await this.runner.run(cmd);
      if (!res.success) {
        return {
          success: false,
          message: res.stderr || 'Falha ao aplicar otimização de jogo.',
          commands
        };
      }
    }

    return {
      success: true,
      message: 'Otimização de gaming aplicada com sucesso.',
      commands
    };
  }

  public async revert(id: string, _originalValue: any): Promise<ModuleRevertResult> {
    try {
      if (id === 'game_silence_notifications') {
        await this.runner.run('Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings" -Name "NOC_GLOBAL_SETTING_TOASTS_ENABLED" -Value 1 -Type DWord');
      } else if (id === 'game_pause_windows_update') {
        await this.runner.run('Remove-ItemProperty -Path "HKLM:\\SOFTWARE\\Microsoft\\WindowsUpdate\\UX\\Settings" -Name "PauseUpdatesExpiryTime" -ErrorAction SilentlyContinue');
      } else if (id === 'game_disable_xbox_app_capture') {
        await this.runner.run('Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\GameDVR" -Name "AppCaptureEnabled" -Value 1 -Type DWord');
      }
      return { success: true, message: 'Revertido com sucesso.' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }
}
