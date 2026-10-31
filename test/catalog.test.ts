import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Catálogo de Otimizações (catalog.json)', () => {
  const catalogPath = path.resolve(__dirname, '../src/main/catalog/catalog.json');

  it('deve existir e ser um ficheiro JSON válido', () => {
    expect(fs.existsSync(catalogPath)).toBe(true);
    const content = fs.readFileSync(catalogPath, 'utf-8');
    const catalog = JSON.parse(content);
    expect(catalog).toBeDefined();
    expect(catalog.version).toBe('1.0.0');
  });

  it('deve conter exatamente 11 categorias', () => {
    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
    expect(catalog.categories).toBeDefined();
    expect(catalog.categories.length).toBe(11);
  });

  it('deve conter exatamente 500 otimizações', () => {
    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
    expect(catalog.items).toBeDefined();
    expect(catalog.items.length).toBe(500);
  });

  it('deve respeitar a distribuição exata de itens por categoria', () => {
    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
    const expectedCounts: Record<string, number> = {
      input_latency: 84,
      network_internet: 84,
      wifi: 15,
      startup_services: 44,
      memory_storage: 39,
      cpu_gpu_power: 69,
      gaming: 40,
      visual_ui: 50,
      privacy_telemetry: 23,
      safe_cleanup: 30,
      maintenance_diag: 22
    };

    const counts: Record<string, number> = {};
    for (const item of catalog.items) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }

    for (const [cat, count] of Object.entries(expectedCounts)) {
      expect(counts[cat]).toBe(count);
    }
  });

  it('REGRA Nº 1: NUNCA deve desativar Defender, Firewall, UAC, Windows Update ou mitigações', () => {
    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
    for (const item of catalog.items) {
      const text = `${item.id} ${item.name} ${item.exactChange}`.toLowerCase();

      // Proibições estritas
      expect(text).not.toContain('disable-windowsoptionalfeature -featurename windows-defender');
      expect(text).not.toContain('netsh advfirewall set allprofiles state off');
      expect(text).not.toContain('enablelua = 0');
      expect(text).not.toContain('useplatformclock');
      expect(text).not.toContain('system32');
      expect(text).not.toContain('spectre');
      expect(text).not.toContain('meltdown');
    }
  });

  it('cada item deve possuir todos os campos obrigatórios', () => {
    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf-8'));
    for (const item of catalog.items) {
      expect(item.id).toBeTruthy();
      expect(item.category).toBeTruthy();
      expect(item.name).toBeTruthy();
      expect(item.description).toBeTruthy();
      expect(item.exactChange).toBeTruthy();
      expect(['safe', 'moderate']).toContain(item.risk);
      expect(['alter', 'inform', 'clean']).toContain(item.type);
      expect(typeof item.requiresAdmin).toBe('boolean');
      expect(typeof item.requiresReboot).toBe('boolean');
      expect(item.compat).toBeDefined();
    }
  });
});
