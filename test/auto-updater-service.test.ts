import { describe, it, expect } from 'vitest';
import { AutoUpdaterService } from '../src/main/engine/auto-updater-service';

describe('AutoUpdaterService', () => {
  const updater = AutoUpdaterService.getInstance();

  it('correctly compares version numbers matching custom scheme', () => {
    // 1.1 is newer than 1.0
    expect(updater.isNewerVersion('v1.1', '1.0.0')).toBe(true);
    expect(updater.isNewerVersion('1.1.0', '1.0.0')).toBe(true);

    // 1.10 is newer than 1.9
    expect(updater.isNewerVersion('v1.10', '1.9.0')).toBe(true);

    // 2.0 is newer than 1.10
    expect(updater.isNewerVersion('v2.0', '1.10.0')).toBe(true);

    // Same version is not newer
    expect(updater.isNewerVersion('v1.0', '1.0.0')).toBe(false);

    // Older version is not newer
    expect(updater.isNewerVersion('v1.0', '1.1.0')).toBe(false);
  });

  it('fetches current GitHub release information', async () => {
    const info = await updater.checkForUpdates();
    expect(info).toBeDefined();
    expect(info.currentVersion).toBeDefined();
    expect(typeof info.hasUpdate).toBe('boolean');
    expect(info.htmlUrl).toContain('github.com/santicoliveira-byte/Optimizer');
  }, 15000);

  it('resolves valid target executable path for in-place desktop update', () => {
    const targetPath = updater.resolveTargetExecutablePath();
    expect(targetPath).toBeDefined();
    expect(typeof targetPath).toBe('string');
    expect(targetPath.toLowerCase()).toMatch(/\.exe$/);
  });
});
