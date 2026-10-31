import { IModuleHandler, ModuleApplyResult, ModuleDetectionResult, ModuleRevertResult } from './types';
import { PowerShellRunner } from '../powershell-runner';

export class SafeCleanupModule implements IModuleHandler {
  private runner: PowerShellRunner;

  constructor() {
    this.runner = PowerShellRunner.getInstance();
  }

  public async detect(id: string): Promise<ModuleDetectionResult> {
    try {
      let pathToCheck = '';
      switch (id) {
        case 'clean_user_temp':
          pathToCheck = '$env:TEMP';
          break;
        case 'clean_windows_temp':
          pathToCheck = 'C:\\Windows\\Temp';
          break;
        case 'clean_directx_shader_cache':
          pathToCheck = '$env:LOCALAPPDATA\\D3DSCache';
          break;
        case 'clean_windows_update_cache':
          pathToCheck = 'C:\\Windows\\SoftwareDistribution\\Download';
          break;
        case 'clean_memory_dumps':
        case 'safe_clean_crash_dumps':
          pathToCheck = 'C:\\Windows\\Minidump';
          break;
        case 'clean_windows_old':
          pathToCheck = 'C:\\Windows.old';
          break;
        case 'clean_edge_chromium_cache':
          pathToCheck = '$env:LOCALAPPDATA\\Microsoft\\Edge\\User Data\\Default\\Cache';
          break;
        case 'clean_installer_temp_files':
          pathToCheck = 'C:\\Windows\\Installer\\$PatchCache$';
          break;
        case 'clean_font_cache':
          pathToCheck = 'C:\\Windows\\ServiceProfiles\\LocalService\\AppData\\Local\\FontCache';
          break;
        case 'clean_branchcache_data':
          pathToCheck = 'C:\\Windows\\ServiceProfiles\\NetworkService\\AppData\\Local\\PeerDistRep';
          break;
        default:
          break;
      }

      if (pathToCheck) {
        const res = await this.runner.run(`
          if (Test-Path "${pathToCheck}") {
            $s = (Get-ChildItem -Path "${pathToCheck}" -Recurse -File -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
            if ($s) { [Math]::Round($s / 1MB, 1) } else { 0 }
          } else { 0 }
        `);
        const mb = Number(res.stdout.trim()) || 0;
        return {
          status: mb > 1 ? 'not_applied' : 'applied',
          infoValue: `${mb} MB a libertar`,
          currentValue: mb
        };
      }

      if (id === 'clean_recycle_bin') {
        const res = await this.runner.run(`
          $shell = New-Object -ComObject Shell.Application
          $bin = $shell.Namespace(10)
          $items = $bin.Items()
          $size = 0
          foreach ($item in $items) { $size += $item.Size }
          [Math]::Round($size / 1MB, 1)
        `);
        const mb = Number(res.stdout.trim()) || 0;
        return {
          status: mb > 0 ? 'not_applied' : 'applied',
          infoValue: `${mb} MB na Reciclagem`,
          currentValue: mb
        };
      }

      return { status: 'not_applied' };
    } catch (e: any) {
      return { status: 'error', error: e.message };
    }
  }

  public async apply(id: string, isDryRun: boolean): Promise<ModuleApplyResult> {
    const commands: string[] = [];

    switch (id) {
      case 'clean_user_temp': {
        commands.push('Remove-Item -Path "$env:TEMP\\*" -Recurse -Force -ErrorAction SilentlyContinue');
        break;
      }
      case 'clean_windows_temp': {
        commands.push('Remove-Item -Path "C:\\Windows\\Temp\\*" -Recurse -Force -ErrorAction SilentlyContinue');
        break;
      }
      case 'clean_thumbnail_cache': {
        commands.push('Remove-Item -Path "$env:LOCALAPPDATA\\Microsoft\\Windows\\Explorer\\thumbcache_*.db" -Force -ErrorAction SilentlyContinue');
        break;
      }
      case 'clean_directx_shader_cache': {
        commands.push('Remove-Item -Path "$env:LOCALAPPDATA\\D3DSCache\\*" -Recurse -Force -ErrorAction SilentlyContinue');
        break;
      }
      case 'clean_gpu_shader_cache': {
        commands.push(`
          Remove-Item -Path "$env:LOCALAPPDATA\\NVIDIA\\DXCache\\*" -Recurse -Force -ErrorAction SilentlyContinue
          Remove-Item -Path "$env:LOCALAPPDATA\\AMD\\DxCache\\*" -Recurse -Force -ErrorAction SilentlyContinue
        `);
        break;
      }
      case 'clean_windows_update_cache': {
        commands.push('Remove-Item -Path "C:\\Windows\\SoftwareDistribution\\Download\\*" -Recurse -Force -ErrorAction SilentlyContinue');
        break;
      }
      case 'clean_old_windows_logs': {
        commands.push('Get-ChildItem -Path "C:\\Windows\\Logs" -Recurse -Include *.log -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue');
        break;
      }
      case 'clean_wer_error_reports': {
        commands.push('Remove-Item -Path "$env:LOCALAPPDATA\\Microsoft\\Windows\\WER\\*" -Recurse -Force -ErrorAction SilentlyContinue');
        break;
      }
      case 'clean_delivery_opt_files': {
        commands.push('Remove-Item -Path "C:\\Windows\\ServiceProfiles\\NetworkService\\AppData\\Local\\Microsoft\\Windows\\DeliveryOptimization\\Cache\\*" -Recurse -Force -ErrorAction SilentlyContinue');
        break;
      }
      case 'clean_memory_dumps':
      case 'safe_clean_crash_dumps': {
        commands.push(`
          Remove-Item -Path "C:\\Windows\\MEMORY.DMP" -Force -ErrorAction SilentlyContinue
          Remove-Item -Path "C:\\Windows\\Minidump\\*" -Force -ErrorAction SilentlyContinue
          Remove-Item -Path "C:\\Windows\\LiveKernelReports\\*" -Recurse -Force -ErrorAction SilentlyContinue
        `);
        break;
      }
      case 'clean_browser_caches': {
        commands.push(`
          Remove-Item -Path "$env:LOCALAPPDATA\\Google\\Chrome\\User Data\\Default\\Cache\\Cache_Data\\*" -Recurse -Force -ErrorAction SilentlyContinue
          Remove-Item -Path "$env:LOCALAPPDATA\\Microsoft\\Edge\\User Data\\Default\\Cache\\Cache_Data\\*" -Recurse -Force -ErrorAction SilentlyContinue
        `);
        break;
      }
      case 'clean_icon_cache': {
        commands.push('Remove-Item -Path "$env:LOCALAPPDATA\\IconCache.db" -Force -ErrorAction SilentlyContinue');
        break;
      }
      case 'clean_winsxs_dism': {
        commands.push('Dism.exe /online /Cleanup-Image /StartComponentCleanup /NoRestart');
        break;
      }
      case 'clean_windows_old': {
        commands.push('if (Test-Path "C:\\Windows.old") { Remove-Item -Path "C:\\Windows.old" -Recurse -Force -ErrorAction SilentlyContinue }');
        break;
      }
      case 'clean_recycle_bin': {
        commands.push('Clear-RecycleBin -Force -ErrorAction SilentlyContinue');
        break;
      }
      case 'clean_edge_chromium_cache': {
        commands.push('Remove-Item -Path "$env:LOCALAPPDATA\\Microsoft\\Edge\\User Data\\Default\\Cache\\Cache_Data\\*" -Recurse -Force -ErrorAction SilentlyContinue');
        break;
      }
      case 'clean_installer_temp_files': {
        commands.push('Remove-Item -Path "$env:LOCALAPPDATA\\Temp\\*" -Recurse -Force -ErrorAction SilentlyContinue');
        break;
      }
      case 'clean_font_cache': {
        commands.push(`
          Stop-Service "FontCache" -Force -ErrorAction SilentlyContinue
          Remove-Item -Path "C:\\Windows\\ServiceProfiles\\LocalService\\AppData\\Local\\FontCache*.dat" -Force -ErrorAction SilentlyContinue
          Start-Service "FontCache" -ErrorAction SilentlyContinue
        `);
        break;
      }
      case 'clean_branchcache_data': {
        commands.push('Remove-Item -Path "C:\\Windows\\ServiceProfiles\\NetworkService\\AppData\\Local\\PeerDistRep\\*" -Recurse -Force -ErrorAction SilentlyContinue');
        break;
      }
      default:
        break;
    }

    if (isDryRun) {
      return {
        success: true,
        message: '[Simulação] Ficheiros identificados para limpeza segura.',
        commands
      };
    }

    for (const cmd of commands) {
      await this.runner.run(cmd);
    }

    return {
      success: true,
      message: 'Limpeza segura concluída com sucesso.',
      commands
    };
  }

  public async revert(_id: string, _originalValue: any): Promise<ModuleRevertResult> {
    return {
      success: true,
      message: 'Ficheiros temporários e caches eliminados em segurança. O sistema recriará apenas os necessários.'
    };
  }
}
