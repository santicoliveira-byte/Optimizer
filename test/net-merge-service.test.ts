import { describe, it, expect } from 'vitest';
import { NetMergeService } from '../src/main/engine/net-merge-service';

describe('NetMergeService (Multi-WAN & Channel Bonding)', () => {
  it('should return a valid singleton instance', () => {
    const s1 = NetMergeService.getInstance();
    const s2 = NetMergeService.getInstance();
    expect(s1).toBe(s2);
  });

  it('should detect installation status and binary path', () => {
    const service = NetMergeService.getInstance();
    const binPath = service.getBinaryPath();
    expect(binPath).toContain('net-merge.exe');
    expect(typeof service.isInstalled()).toBe('boolean');
  });

  it('should provide complete status and telemetry schema', async () => {
    const service = NetMergeService.getInstance();
    const status = await service.getStatus();

    expect(status).toHaveProperty('isInstalled');
    expect(status).toHaveProperty('isRunning');
    expect(status).toHaveProperty('isMerging');
    expect(status).toHaveProperty('totalDownMbit');
    expect(status).toHaveProperty('totalUpMbit');
    expect(status).toHaveProperty('totalActiveFlows');
    expect(status).toHaveProperty('adapters');
    expect(Array.isArray(status.adapters)).toBe(true);

    if (status.adapters.length > 0) {
      const first = status.adapters[0];
      expect(first).toHaveProperty('name');
      expect(first).toHaveProperty('status');
      expect(first).toHaveProperty('ipv4');
      expect(first).toHaveProperty('downMbit');
      expect(first).toHaveProperty('upMbit');
      expect(first).toHaveProperty('activeFlows');
    }
  });
});
