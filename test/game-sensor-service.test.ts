import { describe, it, expect } from 'vitest';
import { GameSensorService } from '../src/main/engine/game-sensor-service';

describe('GameSensorService', () => {
  it('instantiates as a singleton', () => {
    const service1 = GameSensorService.getInstance();
    const service2 = GameSensorService.getInstance();
    expect(service1).toBe(service2);
  });

  it('scans and detects installed games dynamically across platforms', async () => {
    const service = GameSensorService.getInstance();
    const games = await service.scanAllInstalledGames();

    expect(Array.isArray(games)).toBe(true);
    // On this machine, games from Steam, Epic or Riot exist
    expect(games.length).toBeGreaterThan(0);

    const first = games[0];
    expect(first.id).toBeDefined();
    expect(first.name).toBeDefined();
    expect(first.category).toBeDefined();
    expect(first.platform).toBeDefined();
    expect(first.coverImage).toBeDefined();
    expect(Array.isArray(first.processNames)).toBe(true);
  });

  it('allows adding and removing custom games', () => {
    const service = GameSensorService.getInstance();
    const custom = service.addCustomGame({
      name: 'Custom Shooter Demo',
      processName: 'customdemo.exe',
      category: 'FPS'
    });

    expect(custom.id).toContain('custom_');
    expect(custom.name).toBe('Custom Shooter Demo');
    expect(custom.processNames).toContain('customdemo.exe');

    const removed = service.removeCustomGame(custom.id);
    expect(removed).toBe(true);
  });
});
