import { describe, it, expect } from 'vitest';
import { BottleneckGameService } from '../src/main/engine/bottleneck-game-service';

describe('BottleneckGameService', () => {
  const service = new BottleneckGameService();

  describe('calculateBottleneck', () => {
    it('deve identificar gargalo de CPU quando o processador é muito fraco para a GPU', () => {
      const result = service.calculateBottleneck('Core i3-2100', 'GeForce RTX 4080', '1080p', 'general');
      expect(result.limitingComponent).toBe('CPU');
      expect(result.bottleneckPercent).toBeGreaterThan(20);
      expect(result.severity).toMatch(/moderate|high/);
    });

    it('deve identificar gargalo de GPU quando a placa de vídeo é muito fraca para a CPU', () => {
      const result = service.calculateBottleneck('Ryzen 7 7800X3D', 'GeForce GT 710', '1440p', 'aaa');
      expect(result.limitingComponent).toBe('GPU');
      expect(result.bottleneckPercent).toBeGreaterThan(20);
    });

    it('deve indicar equilíbrio em configurações balanceadas', () => {
      const result = service.calculateBottleneck('Ryzen 7 7800X3D', 'GeForce RTX 4080', '1440p', 'aaa');
      expect(result.bottleneckPercent).toBeLessThanOrEqual(20);
    });

    it('deve gerar pontuações de CPU e GPU coerentes entre 1 e 100', () => {
      const result = service.calculateBottleneck('Core i5-12400F', 'RTX 3060', '1080p', 'general');
      expect(result.cpuScore).toBeGreaterThanOrEqual(1);
      expect(result.cpuScore).toBeLessThanOrEqual(100);
      expect(result.gpuScore).toBeGreaterThanOrEqual(1);
      expect(result.gpuScore).toBeLessThanOrEqual(100);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('evaluateGames', () => {
    const mockRig = {
      cpuName: 'AMD Ryzen 7 7800X3D 8-Core Processor',
      gpuName: 'NVIDIA GeForce RTX 4070 Ti SUPER',
      ramGb: 32,
      ramSpeedMhz: 6000,
      vramGb: 16,
      diskFreeGb: 500,
      storageType: 'NVMe SSD',
      windowsVersion: 'Windows 11 Pro 64-bit',
      isLaptop: false,
      hasDedicatedGpu: true
    };

    it('deve avaliar todos os jogos na base curada sem filtros', async () => {
      const games = await service.evaluateGames(mockRig);
      expect(games.length).toBeGreaterThanOrEqual(25);
      
      const cs2 = games.find(g => g.game.id === 'cs2');
      expect(cs2).toBeDefined();
      expect(cs2?.status).toBe('ultra');
      expect(cs2?.fpsEstimate.low1080p).toBeGreaterThan(250);
      expect(cs2?.checklist.ram.passMin).toBe(true);
      expect(cs2?.checklist.storage.pass).toBe(true);
    });

    it('deve calcular FPS realistas e status Ultra para o setup do utilizador (Ryzen 5 8600G + RTX 5060 Ti)', async () => {
      const userRig = {
        cpuName: 'AMD Ryzen 5 8600G w/ Radeon 760M Graphics',
        gpuName: 'NVIDIA GeForce RTX 5060 Ti',
        ramGb: 32,
        ramSpeedMhz: 6000,
        vramGb: 8,
        diskFreeGb: 150,
        storageType: 'NVMe SSD',
        windowsVersion: 'Windows 11',
        isLaptop: false,
        hasDedicatedGpu: true
      };

      const games = await service.evaluateGames(userRig);
      const cs2 = games.find(g => g.game.id === 'cs2')!;
      const val = games.find(g => g.game.id === 'valorant')!;
      const gta = games.find(g => g.game.id === 'gta5')!;

      expect(cs2.status).toBe('ultra');
      expect(cs2.fpsEstimate.low1080p).toBeGreaterThanOrEqual(250);
      expect(cs2.fpsEstimate.high1080p).toBeGreaterThanOrEqual(180);
      expect(cs2.fpsEstimate.ultra1440p).toBeGreaterThanOrEqual(140);

      expect(val.status).toBe('ultra');
      expect(val.fpsEstimate.low1080p).toBeGreaterThanOrEqual(350);

      expect(gta.status).toBe('ultra');
      expect(gta.fpsEstimate.low1080p).toBeGreaterThanOrEqual(140);
    });

    it('deve filtrar jogos por termo de pesquisa', async () => {
      const games = await service.evaluateGames(mockRig, 'Cyberpunk');
      expect(games.length).toBe(1);
      expect(games[0].game.name).toContain('Cyberpunk 2077');
    });

    it('deve filtrar jogos por gênero', async () => {
      const games = await service.evaluateGames(mockRig, undefined, 'esports');
      expect(games.length).toBeGreaterThan(0);
      for (const g of games) {
        expect(g.game.genre).toBe('esports');
      }
    });

    it('deve indicar unsupported ou minimum para rig muito básica', async () => {
      const potatoRig = {
        cpuName: 'Intel Celeron N4000',
        gpuName: 'Intel UHD Graphics 600',
        ramGb: 4,
        ramSpeedMhz: 2133,
        vramGb: 1,
        diskFreeGb: 20,
        storageType: 'HDD',
        windowsVersion: 'Windows 10',
        isLaptop: true,
        hasDedicatedGpu: false
      };

      const games = await service.evaluateGames(potatoRig, 'Cyberpunk');
      expect(games.length).toBe(1);
      expect(games[0].status).toBe('unsupported');
      expect(games[0].checklist.gpu.passRec).toBe(false);
      expect(games[0].checklist.storage.pass).toBe(false);
    });
  });
});
