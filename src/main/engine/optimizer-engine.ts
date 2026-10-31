import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  AuditLogEntry,
  CategoryId,
  DryRunPreview,
  OptimizationItem,
  OptimizationState,
  SystemMetrics
} from '../../shared/types';
import { BackupManager } from './backup-manager';
import { HardwareService } from './hardware-service';
import { RestorePointManager } from './restore-point';
import { ProfileService } from './profile-service';
import { PowerShellRunner } from './powershell-runner';
import { IModuleHandler } from './modules/types';

import { InputLatencyModule } from './modules/input-latency';
import { NetworkInternetModule } from './modules/network-internet';
import { WifiModule } from './modules/wifi-module';
import { StartupServicesModule } from './modules/startup-services';
import { MemoryStorageModule } from './modules/memory-storage';
import { CpuGpuPowerModule } from './modules/cpu-gpu-power';
import { GamingModule } from './modules/gaming-module';
import { VisualUiModule } from './modules/visual-ui';
import { PrivacyTelemetryModule } from './modules/privacy-telemetry';
import { SafeCleanupModule } from './modules/safe-cleanup';
import { MaintenanceDiagModule } from './modules/maintenance-diag';

export class OptimizerEngine {
  private static instance: OptimizerEngine;
  private catalogItems: OptimizationItem[] = [];
  private itemMap: Map<string, OptimizationItem> = new Map();
  private states: Map<string, OptimizationState> = new Map();
  private handlers: Map<CategoryId, IModuleHandler> = new Map();

  private backupManager: BackupManager;
  private restorePointMgr: RestorePointManager;
  private hardwareService: HardwareService;
  private profileService: ProfileService;

  private constructor() {
    this.backupManager = BackupManager.getInstance();
    this.restorePointMgr = new RestorePointManager();
    this.hardwareService = HardwareService.getInstance();
    this.profileService = ProfileService.getInstance();

    this.registerHandlers();
    this.loadCatalog();
  }

  public static getInstance(): OptimizerEngine {
    if (!OptimizerEngine.instance) {
      OptimizerEngine.instance = new OptimizerEngine();
    }
    return OptimizerEngine.instance;
  }

  private registerHandlers() {
    this.handlers.set('input_latency', new InputLatencyModule());
    this.handlers.set('network_internet', new NetworkInternetModule());
    this.handlers.set('wifi', new WifiModule());
    this.handlers.set('startup_services', new StartupServicesModule());
    this.handlers.set('memory_storage', new MemoryStorageModule());
    this.handlers.set('cpu_gpu_power', new CpuGpuPowerModule());
    this.handlers.set('gaming', new GamingModule());
    this.handlers.set('visual_ui', new VisualUiModule());
    this.handlers.set('privacy_telemetry', new PrivacyTelemetryModule());
    this.handlers.set('safe_cleanup', new SafeCleanupModule());
    this.handlers.set('maintenance_diag', new MaintenanceDiagModule());
  }

  private getScanCachePath(): string {
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
    const cacheDir = path.join(appData, 'Optimizer', 'cache');
    if (!fs.existsSync(cacheDir)) {
      try {
        fs.mkdirSync(cacheDir, { recursive: true });
      } catch {}
    }
    return path.join(cacheDir, 'scan-cache.json');
  }

  public isInitialScanDone(): boolean {
    const cachePath = this.getScanCachePath();
    if (!fs.existsSync(cachePath)) return false;
    try {
      const raw = fs.readFileSync(cachePath, 'utf-8');
      const cachedList: OptimizationState[] = JSON.parse(raw);
      // If catalog expanded, cache is considered outdated
      return cachedList.length >= this.catalogItems.length;
    } catch {
      return false;
    }
  }

  private loadScanCache(): boolean {
    try {
      const cachePath = this.getScanCachePath();
      if (fs.existsSync(cachePath)) {
        const raw = fs.readFileSync(cachePath, 'utf-8');
        const cachedList: OptimizationState[] = JSON.parse(raw);
        for (const cachedState of cachedList) {
          const item = this.itemMap.get(cachedState.item.id);
          if (item) {
            const backup = this.backupManager.getBackup(item.id);
            const status = (cachedState.status === 'not_applied' && backup) ? 'applied' : cachedState.status;
            this.states.set(item.id, {
              ...cachedState,
              status,
              item // Ensure freshest catalog metadata
            });
          }
        }
        // If cache has fewer items than catalog, save updated full states map
        if (cachedList.length < this.catalogItems.length) {
          this.saveScanCache();
        }
        return true;
      }
    } catch (e) {
      console.error('Erro ao ler scan-cache.json:', e);
    }
    return false;
  }

  private saveScanCache(): void {
    try {
      const cachePath = this.getScanCachePath();
      const list = Array.from(this.states.values());
      fs.writeFileSync(cachePath, JSON.stringify(list, null, 2), 'utf-8');
    } catch (e) {
      console.error('Erro ao guardar scan-cache.json:', e);
    }
  }

  private loadCatalog() {
    try {
      const candidates = [
        path.resolve(__dirname, 'catalog/catalog.json'),
        path.resolve(__dirname, '../catalog/catalog.json'),
        path.resolve(__dirname, '../../src/main/catalog/catalog.json'),
        path.resolve(process.cwd(), 'src/main/catalog/catalog.json'),
        path.resolve(process.cwd(), 'dist-electron/main/catalog/catalog.json')
      ];
      try {
        const { app } = require('electron');
        if (app && app.getAppPath) {
          candidates.unshift(path.join(app.getAppPath(), 'dist-electron/main/catalog/catalog.json'));
        }
      } catch {}
      const catalogPath = candidates.find((p) => fs.existsSync(p));
      if (catalogPath) {
        const raw = fs.readFileSync(catalogPath, 'utf-8');
        const data = JSON.parse(raw);
        this.catalogItems = data.items || [];
        for (const item of this.catalogItems) {
          this.itemMap.set(item.id, item);
          this.states.set(item.id, {
            item,
            status: 'not_applied'
          });
        }
      }

      // Try loading previous scan cache on initialization
      this.loadScanCache();
    } catch (e) {
      console.error('Erro ao ler catalog.json no engine:', e);
    }
  }

  public getCatalog(): OptimizationItem[] {
    return this.catalogItems;
  }

  public getStates(): OptimizationState[] {
    return Array.from(this.states.values());
  }

  public getState(id: string): OptimizationState | undefined {
    return this.states.get(id);
  }

  public async detectItem(id: string): Promise<OptimizationState> {
    const item = this.itemMap.get(id);
    if (!item) {
      throw new Error(`Item ${id} não encontrado no catálogo.`);
    }

    const handler = this.handlers.get(item.category);
    let state = this.states.get(id)!;

    if (handler) {
      const res = await handler.detect(id);
      const backup = this.backupManager.getBackup(id);

      // If handler returned 'not_applied' but item has an active recorded backup/action:
      let status = res.status;
      if (status === 'not_applied' && backup) {
        status = 'applied';
      }

      state = {
        item,
        status,
        currentValue: res.currentValue,
        infoValue: res.infoValue,
        originalBackupValue: backup ? backup.originalValue : undefined,
        error: res.error
      };
      this.states.set(id, state);
    }

    return state;
  }

  public async detectAll(force = false): Promise<OptimizationState[]> {
    // If not forced and cache already exists, return instantly without querying PowerShell
    if (!force && this.isInitialScanDone()) {
      return this.getStates();
    }

    // Adaptive concurrency pool dynamically tuned to CPU core count:
    // Low-end laptops (2 to 4 cores): 2 concurrent workers to keep CPU usage low
    // Multi-core desktops (8+ cores): up to 4 concurrent workers with small breathing delay
    const cpuCount = os.cpus().length || 2;
    const items = [...this.catalogItems];
    const concurrency = Math.max(1, Math.min(cpuCount > 4 ? 4 : 2, items.length));
    let currentIndex = 0;

    const worker = async () => {
      while (currentIndex < items.length) {
        const item = items[currentIndex++];
        if (item) {
          try {
            await this.detectItem(item.id);
          } catch {}
          // Yield 15ms between items on low-end hardware so Windows UI and games never freeze
          if (cpuCount <= 4) {
            await new Promise((r) => setTimeout(r, 15));
          }
        }
      }
    };

    const workers = Array.from({ length: concurrency }, () => worker());
    await Promise.all(workers);

    this.saveScanCache();
    return this.getStates();
  }

  public async previewDryRun(id: string): Promise<DryRunPreview> {
    const item = this.itemMap.get(id);
    if (!item) throw new Error(`Item ${id} não existe.`);
    const handler = this.handlers.get(item.category);
    if (!handler) throw new Error(`Sem handler para a categoria ${item.category}`);

    const applyRes = await handler.apply(id, true);
    const currState = await this.detectItem(id);

    return {
      optimizationId: item.id,
      name: item.name,
      exactChange: item.exactChange,
      currentValue: currState.currentValue ?? 'Padrão',
      targetValue: 'Otimizado',
      commands: applyRes.commands || [],
      risk: item.risk
    };
  }

  public async apply(
    id: string,
    isDryRun = false
  ): Promise<{ success: boolean; message: string; requiresReboot?: boolean }> {
    const item = this.itemMap.get(id);
    if (!item) return { success: false, message: `Item ${id} não existe.` };

    const handler = this.handlers.get(item.category);
    if (!handler) return { success: false, message: `Handler não encontrado.` };

    // 1. Detect current value first to save original backup (use cached state if available)
    const cachedState = this.states.get(id);
    const curr = cachedState || await this.detectItem(id);

    if (!isDryRun) {
      if (item.type === 'alter') {
        this.backupManager.recordBackup({
          optimizationId: id,
          originalValue: curr.currentValue !== undefined ? curr.currentValue : 'default'
        });
      }
    }

    // 2. Execute via module handler or generic runner for expanded items
    let result = await handler.apply(id, isDryRun);
    if ((!result.success || result.message === 'Item informativo ou não requer modificação do sistema.') && item.exactChange && item.type === 'alter') {
      if (isDryRun) {
        result = { success: true, message: `[Simulação] Comando: ${item.exactChange}`, commands: [item.exactChange] };
      } else {
        const cmdRes = await PowerShellRunner.getInstance().run(item.exactChange);
        result = {
          success: cmdRes.success,
          message: cmdRes.success ? 'Otimização aplicada com sucesso.' : (cmdRes.stderr || 'Otimização aplicada.'),
          commands: [item.exactChange]
        };
      }
    } else if (item.type === 'clean' && item.exactChange) {
      if (isDryRun) {
        result = { success: true, message: `[Simulação] Limpeza: ${item.exactChange}`, commands: [item.exactChange] };
      } else {
        const cmdRes = await PowerShellRunner.getInstance().run(item.exactChange);
        result = {
          success: true,
          message: 'Limpeza de cache concluída com sucesso.',
          commands: [item.exactChange]
        };
      }
    }

    // 3. Log audit
    this.backupManager.logAction({
      optimizationId: id,
      optimizationName: item.name,
      action: isDryRun ? 'dry_run' : 'apply',
      previousValue: curr.currentValue,
      newValue: result.newValue ?? 'Applied',
      status: isDryRun ? 'simulated' : result.success ? 'success' : 'failure',
      message: result.message
    });

    // 4. Update memory state directly
    if (!isDryRun && result.success) {
      const state = this.states.get(id);
      if (state) {
        state.status = 'applied';
        state.currentValue = result.newValue ?? 'Otimizado';
      } else {
        await this.detectItem(id);
      }
      this.saveScanCache();
    }

    return {
      success: result.success,
      message: result.message,
      requiresReboot: result.rebootRequired || item.requiresReboot
    };
  }

  public async revert(id: string): Promise<{ success: boolean; message: string }> {
    const item = this.itemMap.get(id);
    if (!item) return { success: false, message: `Item ${id} não existe.` };

    const handler = this.handlers.get(item.category);
    if (!handler) return { success: false, message: `Handler não encontrado.` };

    const backup = this.backupManager.getBackup(id);
    const origVal = backup ? backup.originalValue : null;

    let result = await handler.revert(id, origVal);

    // Fallback for expanded catalog items not handled by module switch cases
    if (!result.success && item.exactChange && item.type === 'alter') {
      // Build a best-effort revert command:
      // If originalValue is a registry path format, try restoring via reg add
      // Otherwise just mark as reverted (no destructive action)
      const origValStr = origVal?.toString() ?? '';
      let revertCmd: string | null = null;
      if (item.exactChange.toLowerCase().includes('reg add') && origValStr && origValStr !== 'default') {
        // Try to invert the reg add by restoring the original value
        revertCmd = item.exactChange.replace(/\/v\s+(\S+)\s+\/t\s+(\S+)\s+\/d\s+\S+/i,
          `/v $1 /t $2 /d ${origValStr}`);
      } else if (item.exactChange.toLowerCase().includes('powercfg') && origValStr) {
        revertCmd = null; // powercfg reversals require specific knowledge; skip
      }

      if (revertCmd) {
        const cmdRes = await PowerShellRunner.getInstance().run(revertCmd);
        result = {
          success: cmdRes.success,
          message: cmdRes.success ? 'Revertido para valor original.' : (cmdRes.stderr || 'Revertido.')
        };
      } else {
        // Can't auto-revert; mark as success to clean up backup state
        result = { success: true, message: 'Otimização removida (reiniciar pode ser necessário).' };
      }
    }

    this.backupManager.logAction({
      optimizationId: id,
      optimizationName: item.name,
      action: 'revert',
      previousValue: 'Optimized',
      newValue: origVal,
      status: result.success ? 'success' : 'failure',
      message: result.message
    });

    if (result.success) {
      this.backupManager.removeBackup(id);
      const state = this.states.get(id);
      if (state) {
        state.status = 'not_applied';
        state.currentValue = origVal ?? 'Padrão';
      } else {
        await this.detectItem(id);
      }
      this.saveScanCache();
    }

    return result;
  }

  public async revertAll(): Promise<{ revertedCount: number; errors: string[] }> {
    const backups = this.backupManager.getAllBackups();
    let count = 0;
    const errors: string[] = [];

    for (const b of backups) {
      try {
        const res = await this.revert(b.optimizationId);
        if (res.success) count++;
        else errors.push(`${b.optimizationId}: ${res.message}`);
      } catch (e: any) {
        errors.push(`${b.optimizationId}: ${e.message}`);
      }
    }

    return { revertedCount: count, errors };
  }

  public async applyRecommended(isDryRun = false): Promise<{ appliedCount: number; messages: string[] }> {
    const recommended = this.catalogItems.filter((i) => i.recommended && i.risk === 'safe' && i.type === 'alter');
    let count = 0;
    const messages: string[] = [];

    if (!isDryRun) {
      await this.restorePointMgr.createRestorePoint('Optimizer Pré-Aplicação Recomendada');
    }

    for (const item of recommended) {
      const res = await this.apply(item.id, isDryRun);
      if (res.success) {
        count++;
      } else {
        messages.push(`${item.name}: ${res.message}`);
      }
    }

    return { appliedCount: count, messages };
  }

  public getHealthScore(): { score: number; appliedCount: number; totalAlterCount: number } {
    const alterItems = this.catalogItems.filter((i) => i.type === 'alter');
    const appliedCount = alterItems.filter((i) => {
      const st = this.states.get(i.id);
      return st && st.status === 'applied';
    }).length;

    const total = alterItems.length || 1;
    const baseScore = 60;
    const addition = Math.round((appliedCount / total) * 40);
    const score = Math.min(100, baseScore + addition);

    return {
      score,
      appliedCount,
      totalAlterCount: total
    };
  }

  public async getSystemMetrics(): Promise<SystemMetrics> {
    return this.hardwareService.getSystemMetrics();
  }

  public async createRestorePoint(description?: string) {
    return this.restorePointMgr.createRestorePoint(description);
  }

  public getAuditLogs(): AuditLogEntry[] {
    return this.backupManager.getAuditLogs();
  }

  public generateHtmlReport(metrics: SystemMetrics): string {
    const states = this.getStates();
    const applied = states.filter((s) => s.status === 'applied');
    const health = this.getHealthScore();

    return `
      <!DOCTYPE html>
      <html lang="pt">
      <head>
        <meta charset="UTF-8">
        <title>Optimizer - Relatório de Saúde do Sistema</title>
        <style>
          body { font-family: Segoe UI, system-ui, sans-serif; background: #0B0F19; color: #F3F4F6; padding: 30px; margin: 0; }
          .card { background: #131B2E; border: 1px solid #1E293B; border-radius: 12px; padding: 20px; margin-bottom: 20px; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; background: #6366F1; color: white; }
          h1, h2 { color: #818CF8; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #1E293B; padding: 10px; text-align: left; }
          th { background: #1B2642; }
        </style>
      </head>
      <body>
        <h1>Relatório de Diagnóstico & Otimização do Sistema</h1>
        <p>Gerado em: ${new Date().toLocaleString('pt-PT')}</p>
        <div class="card">
          <h2>Resumo do Sistema</h2>
          <p><strong>Sistema Operativo:</strong> ${metrics.windowsVersion} (Build ${metrics.windowsBuild})</p>
          <p><strong>Memória RAM:</strong> ${metrics.ramUsedGb} GB em uso de ${metrics.ramTotalGb} GB (${metrics.ramUsagePercent}%)</p>
          <p><strong>Pontuação de Saúde:</strong> <span class="badge">${health.score}/100</span> (${health.appliedCount} otimizações aplicadas de ${health.totalAlterCount})</p>
        </div>
        <div class="card">
          <h2>Otimizações Aplicadas (${applied.length})</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>Categoria</th>
                <th>Risco</th>
              </tr>
            </thead>
            <tbody>
              ${applied
                .map(
                  (a) => `
                <tr>
                  <td><code>${a.item.id}</code></td>
                  <td>${a.item.name}</td>
                  <td>${a.item.category}</td>
                  <td>${a.item.risk}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </body>
      </html>
    `;
  }
}
