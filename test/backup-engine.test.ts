import { describe, it, expect } from 'vitest';
import { BackupManager } from '../src/main/engine/backup-manager';
import { ProfileService } from '../src/main/engine/profile-service';
import { OptimizerEngine } from '../src/main/engine/optimizer-engine';

describe('Motor de Backup e Reversão (BackupManager)', () => {
  const backupMgr = BackupManager.getInstance();

  it('deve gravar e recuperar um backup de valor original com sucesso', () => {
    const record = backupMgr.recordBackup({
      optimizationId: 'test_opt_mouse',
      originalValue: '6',
      registryPath: 'HKCU:\\Control Panel\\Mouse'
    });

    expect(record).toBeDefined();
    expect(record.optimizationId).toBe('test_opt_mouse');
    expect(record.originalValue).toBe('6');

    const retrieved = backupMgr.getBackup('test_opt_mouse');
    expect(retrieved).toBeDefined();
    expect(retrieved?.originalValue).toBe('6');
  });

  it('não deve sobrescrever um backup existente para manter o valor de fábrica original', () => {
    backupMgr.recordBackup({
      optimizationId: 'test_opt_mouse',
      originalValue: 'MODIFIED_VAL'
    });

    const retrieved = backupMgr.getBackup('test_opt_mouse');
    expect(retrieved?.originalValue).toBe('6'); // mantido
  });

  it('deve remover backup após reversão bem-sucedida', () => {
    backupMgr.removeBackup('test_opt_mouse');
    expect(backupMgr.hasBackup('test_opt_mouse')).toBe(false);
  });

  it('deve registar entradas de auditoria com carimbo temporal e ação', () => {
    const entry = backupMgr.logAction({
      optimizationId: 'test_log_1',
      optimizationName: 'Desativar aceleração do rato',
      action: 'apply',
      previousValue: '1',
      newValue: '0',
      status: 'success',
      message: 'Aplicado com sucesso'
    });

    expect(entry.id).toBeDefined();
    expect(entry.timestamp).toBeDefined();

    const logs = backupMgr.getAuditLogs();
    expect(logs.some((l) => l.optimizationId === 'test_log_1')).toBe(true);
  });
});

describe('Serviço de Perfis (ProfileService)', () => {
  const profileService = ProfileService.getInstance();

  it('deve carregar os 3 perfis padrão (Gaming, Trabalho, Equilibrado)', () => {
    const profiles = profileService.getProfiles();
    expect(profiles.length).toBeGreaterThanOrEqual(3);

    const ids = profiles.map((p) => p.id);
    expect(ids).toContain('gaming');
    expect(ids).toContain('work');
    expect(ids).toContain('balanced');
  });

  it('perfil Gaming deve conter otimizações essenciais de latência e energia', () => {
    const gaming = profileService.getProfile('gaming');
    expect(gaming).toBeDefined();
    expect(gaming?.itemIds).toContain('input_mouse_accel');
    expect(gaming?.itemIds).toContain('input_power_plan');
    expect(gaming?.itemIds).toContain('net_tcp_autotuning');
  });
});

describe('Motor Principal (OptimizerEngine)', () => {
  const engine = OptimizerEngine.getInstance();

  it('deve carregar todo o catálogo com 500 itens', () => {
    const catalog = engine.getCatalog();
    expect(catalog.length).toBe(500);
  });

  it('deve calcular a pontuação de saúde inicial', () => {
    const health = engine.getHealthScore();
    expect(health.score).toBeGreaterThanOrEqual(60);
    expect(health.score).toBeLessThanOrEqual(100);
  });

  it('deve suportar simulação Dry-Run com preview de comandos sem alterar o sistema', async () => {
    const preview = await engine.previewDryRun('input_mouse_accel');
    expect(preview).toBeDefined();
    expect(preview.optimizationId).toBe('input_mouse_accel');
    expect(preview.commands.length).toBeGreaterThan(0);
  });
});
