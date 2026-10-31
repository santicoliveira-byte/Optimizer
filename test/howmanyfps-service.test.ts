import { describe, it, expect, beforeEach } from 'vitest';
import { HowManyFpsService } from '../src/main/engine/howmanyfps-service';

describe('HowManyFpsService', () => {
  let service: HowManyFpsService;

  beforeEach(() => {
    service = HowManyFpsService.getInstance();
  });

  it('should initialize singleton instance', () => {
    expect(service).toBeDefined();
    expect(HowManyFpsService.getInstance()).toBe(service);
  });

  it('should decode MessagePack buffers correctly', () => {
    // Hex: 84a6617667467073cccea76d696e31467073cc9ab4617667506572666f726d616e6365526174696e6764b56d696e31506572666f726d616e6365526174696e6764
    const hex = '84a6617667467073cccea76d696e31467073cc9ab4617667506572666f726d616e6365526174696e6764b56d696e31506572666f726d616e6365526174696e6764';
    const buf = Buffer.from(hex, 'hex');
    const decoded = service.decodeMsgPack(buf);

    expect(decoded).toBeDefined();
    expect(decoded.avgFps).toBe(206);
    expect(decoded.min1Fps).toBe(154);
    expect(decoded.avgPerformanceRating).toBe(100);
    expect(decoded.min1PerformanceRating).toBe(100);
  });

  it('should resolve Ryzen 5 8600G correctly', async () => {
    const cpu = await service.resolveCpu('AMD Ryzen 5 8600G with Radeon 760M Graphics');
    expect(cpu).toBeDefined();
    expect(cpu.queryName).toBe('ryzen-5-8600g');
    expect(cpu.id).toBe('6939639492b93b48e99d43ad');
  });

  it('should resolve RTX 5060 Ti correctly', async () => {
    const gpu = await service.resolveGpu('NVIDIA GeForce RTX 5060 Ti');
    expect(gpu).toBeDefined();
    expect(gpu.queryName).toBe('geforce-rtx-5060-ti');
    expect(gpu.id).toBe('6923678292b93b48e99cd651');
  });

  it('should query FPS for Cyberpunk 2077 with realistic frame rate', async () => {
    const res = await service.queryFps({
      gameId: 'cyberpunk2077',
      resolution: '1920 x 1080',
      upscaling: 'Native',
      cpuName: 'AMD Ryzen 5 8600G',
      gpuName: 'NVIDIA GeForce RTX 5060 Ti'
    });

    expect(res).toBeDefined();
    expect(res.avgFps).toBeGreaterThan(45);
    expect(res.min1Fps).toBeGreaterThan(25);
    expect(res.resolution).toBe('1920 x 1080');
    expect(res.upscaling).toBe('Native');
    expect(res.gameName).toBe('Cyberpunk 2077');
  });

  it('should query FPS for competitive titles (CS2) with high frame rate', async () => {
    const res = await service.queryFps({
      gameId: 'cs2',
      resolution: '1920 x 1080',
      upscaling: 'Native',
      cpuName: 'AMD Ryzen 5 8600G',
      gpuName: 'NVIDIA GeForce RTX 5060 Ti'
    });

    expect(res).toBeDefined();
    expect(res.avgFps).toBeGreaterThan(120);
    expect(res.min1Fps).toBeGreaterThan(70);
  });

  it('should support setting and getting developer API key', () => {
    service.setApiKey('test_key_12345');
    expect(service.getApiKey()).toBe('test_key_12345');
    service.setApiKey('');
    expect(service.getApiKey()).toBe('');
  });

  it('should report service status including online connectivity and game catalog', async () => {
    const status = await service.getStatus();
    expect(status).toBeDefined();
    expect(status.supportedGamesCount).toBeGreaterThanOrEqual(25);
    expect(status.resolvedCpu).toBeDefined();
    expect(status.resolvedGpu).toBeDefined();
  });
});
