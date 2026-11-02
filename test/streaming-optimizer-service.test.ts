import { describe, it, expect } from 'vitest';
import { StreamingOptimizerService } from '../src/main/engine/streaming-optimizer-service';
import { WindowsMaintenanceService } from '../src/main/engine/windows-maintenance-service';

describe('StreamingOptimizerService (Discord & OBS Studio)', () => {
  it('should return a valid singleton instance', () => {
    const s1 = StreamingOptimizerService.getInstance();
    const s2 = StreamingOptimizerService.getInstance();
    expect(s1).toBe(s2);
  });

  it('should provide status schema with Discord and OBS parameters', async () => {
    const service = StreamingOptimizerService.getInstance();
    const status = await service.getStatus();

    expect(status).toHaveProperty('discordInstalled');
    expect(status).toHaveProperty('discordRunning');
    expect(status).toHaveProperty('discordCacheSizeMb');
    expect(status).toHaveProperty('obsInstalled');
    expect(status).toHaveProperty('obsRunning');
    expect(status).toHaveProperty('obsHighPrioritySet');
    expect(typeof status.discordCacheSizeMb).toBe('number');
  });
});

describe('WindowsMaintenanceService (SFC, DISM, TRIM & Anti-Index)', () => {
  it('should include the new integrated SFC+DISM combo and anti-indexing tasks', () => {
    const service = WindowsMaintenanceService.getInstance();
    const tasks = service.getTasks();

    const ids = tasks.map((t) => t.id);
    expect(ids).toContain('sfc_dism_combo');
    expect(ids).toContain('disable_search_indexing');
    expect(ids).toContain('trim_ssd');
    expect(ids).toContain('winsxs_cleanup');
    expect(ids).toContain('repair_wu');
  });
});
