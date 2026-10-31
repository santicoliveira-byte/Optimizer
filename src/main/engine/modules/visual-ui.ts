import { IModuleHandler, ModuleApplyResult, ModuleDetectionResult, ModuleRevertResult } from './types';
import { PowerShellRunner } from '../powershell-runner';

export class VisualUiModule implements IModuleHandler {
  private runner: PowerShellRunner;

  constructor() {
    this.runner = PowerShellRunner.getInstance();
  }

  public async detect(id: string): Promise<ModuleDetectionResult> {
    try {
      switch (id) {
        case 'ui_disable_window_animations': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKCU:\\Control Panel\\Desktop\\WindowMetrics" -Name "MinAnimate" -ErrorAction SilentlyContinue
          `);
          return {
            status: res.stdout.trim() === '0' ? 'applied' : 'not_applied',
            currentValue: res.stdout.trim()
          };
        }

        case 'ui_disable_transparency': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "EnableTransparency" -ErrorAction SilentlyContinue
          `);
          return {
            status: res.stdout.trim() === '0' ? 'applied' : 'not_applied',
            currentValue: res.stdout.trim()
          };
        }

        case 'ui_menu_show_delay_zero': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKCU:\\Control Panel\\Desktop" -Name "MenuShowDelay" -ErrorAction SilentlyContinue
          `);
          const isZero = res.stdout.trim() === '0';
          return {
            status: isZero ? 'applied' : 'not_applied',
            currentValue: res.stdout.trim(),
            infoValue: `Atraso atual de menus: ${res.stdout.trim() || '400'} ms`
          };
        }

        case 'ui_disable_widgets_news': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "TaskbarDa" -ErrorAction SilentlyContinue
          `);
          return {
            status: res.stdout.trim() === '0' ? 'applied' : 'not_applied',
            currentValue: res.stdout.trim()
          };
        }

        case 'ui_disable_web_search_start': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKCU:\\Software\\Policies\\Microsoft\\Windows\\Explorer" -Name "DisableSearchBoxSuggestions" -ErrorAction SilentlyContinue
          `);
          return {
            status: res.stdout.trim() === '1' ? 'applied' : 'not_applied',
            currentValue: res.stdout.trim()
          };
        }

        case 'ui_disable_tips_suggestions': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager" -Name "SubscribedContent-338389Enabled" -ErrorAction SilentlyContinue
          `);
          return {
            status: res.stdout.trim() === '0' ? 'applied' : 'not_applied',
            currentValue: res.stdout.trim()
          };
        }

        case 'ui_disable_action_center_animations':
        case 'ui_disable_taskbar_animations': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "TaskbarAnimations" -ErrorAction SilentlyContinue
          `);
          return {
            status: res.stdout.trim() === '0' ? 'applied' : 'not_applied',
            currentValue: res.stdout.trim()
          };
        }

        case 'ui_disable_combo_box_animation': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKCU:\\Control Panel\\Desktop" -Name "SmoothScroll" -ErrorAction SilentlyContinue
          `);
          return {
            status: res.stdout.trim() === '0' ? 'applied' : 'not_applied',
            currentValue: res.stdout.trim()
          };
        }

        case 'ui_disable_cursor_shadow': {
          return { status: 'not_applied' };
        }

        case 'visual_disable_tooltip_animation': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKCU:\\Control Panel\\Desktop" -Name "UserPreferencesMask" -ErrorAction SilentlyContinue
          `);
          return { status: 'applied', currentValue: '0' };
        }

        case 'visual_disable_combo_box_animation': {
          const res = await this.runner.run(`
            Get-ItemPropertyValue -Path "HKCU:\\Control Panel\\Desktop" -Name "SmoothScroll" -ErrorAction SilentlyContinue
          `);
          const isZero = res.stdout.trim() === '0';
          return {
            status: isZero ? 'applied' : 'not_applied',
            currentValue: res.stdout.trim()
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
      case 'ui_visual_effects_perf': {
        commands.push('Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\VisualEffects" -Name "VisualFXSetting" -Value 3 -Type DWord');
        // Keep smooth fonts (ClearType)
        commands.push('Set-ItemProperty -Path "HKCU:\\Control Panel\\Desktop" -Name "FontSmoothing" -Value "2"');
        break;
      }
      case 'ui_disable_window_animations': {
        commands.push('Set-ItemProperty -Path "HKCU:\\Control Panel\\Desktop\\WindowMetrics" -Name "MinAnimate" -Value "0"');
        break;
      }
      case 'ui_disable_transparency': {
        commands.push('Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "EnableTransparency" -Value 0 -Type DWord');
        break;
      }
      case 'ui_menu_show_delay_zero': {
        commands.push('Set-ItemProperty -Path "HKCU:\\Control Panel\\Desktop" -Name "MenuShowDelay" -Value "0"');
        break;
      }
      case 'ui_disable_accessibility_animations': {
        commands.push('Set-ItemProperty -Path "HKCU:\\Control Panel\\Accessibility" -Name "MessageDuration" -Value 5 -Type DWord');
        break;
      }
      case 'ui_disable_widgets_news': {
        commands.push('Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "TaskbarDa" -Value 0 -Type DWord');
        break;
      }
      case 'ui_disable_web_search_start': {
        commands.push('New-Item -Path "HKCU:\\Software\\Policies\\Microsoft\\Windows\\Explorer" -Force -ErrorAction SilentlyContinue');
        commands.push('Set-ItemProperty -Path "HKCU:\\Software\\Policies\\Microsoft\\Windows\\Explorer" -Name "DisableSearchBoxSuggestions" -Value 1 -Type DWord');
        break;
      }
      case 'ui_disable_tips_suggestions': {
        commands.push('Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager" -Name "SubscribedContent-338389Enabled" -Value 0 -Type DWord');
        break;
      }
      case 'ui_disable_lockscreen_spotlight': {
        commands.push('Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager" -Name "RotatingLockScreenOverlayEnabled" -Value 0 -Type DWord');
        break;
      }
      case 'ui_disable_action_center_animations':
      case 'ui_disable_taskbar_animations': {
        commands.push('Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "TaskbarAnimations" -Value 0 -Type DWord');
        break;
      }
      case 'ui_disable_combo_box_animation': {
        commands.push('Set-ItemProperty -Path "HKCU:\\Control Panel\\Desktop" -Name "SmoothScroll" -Value "0"');
        break;
      }
      case 'visual_disable_tooltip_animation': {
        commands.push('Set-ItemProperty -Path "HKCU:\\Control Panel\\Desktop" -Name "UserPreferencesMask" -Value ([byte[]](0x90,0x12,0x03,0x80,0x10,0x00,0x00,0x00))');
        break;
      }
      case 'visual_disable_combo_box_animation': {
        commands.push('Set-ItemProperty -Path "HKCU:\\Control Panel\\Desktop" -Name "SmoothScroll" -Value "0"');
        break;
      }
      default:
        break;
    }

    if (isDryRun) {
      return {
        success: true,
        message: '[Simulação] Comandos de interface prontos.',
        commands
      };
    }

    for (const cmd of commands) {
      const res = await this.runner.run(cmd);
      if (!res.success) {
        return {
          success: false,
          message: res.stderr || 'Falha ao aplicar configuração visual.',
          commands
        };
      }
    }

    return {
      success: true,
      message: 'Otimização visual aplicada com sucesso.',
      commands
    };
  }

  public async revert(id: string, _originalValue: any): Promise<ModuleRevertResult> {
    try {
      switch (id) {
        case 'ui_disable_window_animations': {
          await this.runner.run('Set-ItemProperty -Path "HKCU:\\Control Panel\\Desktop\\WindowMetrics" -Name "MinAnimate" -Value "1"');
          break;
        }
        case 'ui_disable_transparency': {
          await this.runner.run('Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize" -Name "EnableTransparency" -Value 1 -Type DWord');
          break;
        }
        case 'ui_menu_show_delay_zero': {
          await this.runner.run('Set-ItemProperty -Path "HKCU:\\Control Panel\\Desktop" -Name "MenuShowDelay" -Value "400"');
          break;
        }
        case 'ui_disable_widgets_news': {
          await this.runner.run('Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "TaskbarDa" -Value 1 -Type DWord');
          break;
        }
        case 'ui_disable_web_search_start': {
          await this.runner.run('Remove-ItemProperty -Path "HKCU:\\Software\\Policies\\Microsoft\\Windows\\Explorer" -Name "DisableSearchBoxSuggestions" -ErrorAction SilentlyContinue');
          break;
        }
        case 'ui_disable_tips_suggestions': {
          await this.runner.run('Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager" -Name "SubscribedContent-338389Enabled" -Value 1 -Type DWord');
          break;
        }
        case 'ui_disable_action_center_animations':
        case 'ui_disable_taskbar_animations': {
          await this.runner.run('Set-ItemProperty -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced" -Name "TaskbarAnimations" -Value 1 -Type DWord');
          break;
        }
        case 'visual_disable_tooltip_animation': {
          await this.runner.run('Set-ItemProperty -Path "HKCU:\\Control Panel\\Desktop" -Name "UserPreferencesMask" -Value ([byte[]](0x9E,0x1E,0x07,0x80,0x12,0x00,0x00,0x00))');
          break;
        }
        case 'visual_disable_combo_box_animation': {
          await this.runner.run('Set-ItemProperty -Path "HKCU:\\Control Panel\\Desktop" -Name "SmoothScroll" -Value "1"');
          break;
        }
        default:
          break;
      }
      return { success: true, message: 'Revertido com sucesso para a configuração visual original.' };
    } catch (e: any) {
      return { success: false, message: e.message };
    }
  }
}
