import { describe, it, expect, beforeEach } from 'vitest';
import { CpuZInspectorService } from '../src/main/engine/cpuz-inspector-service';

describe('CpuZInspectorService', () => {
  let service: CpuZInspectorService;

  beforeEach(() => {
    service = CpuZInspectorService.getInstance();
  });

  it('should initialize singleton instance', () => {
    expect(service).toBeDefined();
    expect(CpuZInspectorService.getInstance()).toBe(service);
  });

  it('should return complete CPU-Z hardware inspector dataset', async () => {
    const data = await service.getCpuZData();
    expect(data).toBeDefined();

    // CPU tab checks
    expect(data.cpu).toBeDefined();
    expect(data.cpu.name).toBeDefined();
    expect(data.cpu.cores).toBeGreaterThan(0);
    expect(data.cpu.threads).toBeGreaterThan(0);
    expect(data.cpu.instructions.length).toBeGreaterThan(5);

    // Motherboard tab checks
    expect(data.motherboard).toBeDefined();
    expect(data.motherboard.manufacturer).toBeDefined();
    expect(data.motherboard.model).toBeDefined();
    expect(data.motherboard.biosVersion).toBeDefined();

    // Memory tab checks
    expect(data.memory).toBeDefined();
    expect(data.memory.type).toBe('DDR5');
    expect(data.memory.sizeGb).toBeGreaterThanOrEqual(16);
    expect(data.memory.channel).toBeDefined();

    // SPD tab checks
    expect(data.spd).toBeDefined();
    expect(data.spd.slots.length).toBeGreaterThanOrEqual(1);
    expect(data.spd.slots[0].timingsTable.length).toBeGreaterThanOrEqual(1);

    // Graphics tab checks
    expect(data.graphics).toBeDefined();
    expect(data.graphics.devices.length).toBeGreaterThanOrEqual(1);
    expect(data.graphics.devices[0].name).toContain('RTX');

    // Bench references checks
    expect(data.benchReferences.length).toBeGreaterThanOrEqual(5);
  });

  it('should execute CPU-Z single and multi-thread benchmark calculation', async () => {
    const bench = await service.runCpuBenchmark('multi');
    expect(bench).toBeDefined();
    expect(bench.singleScore).toBeGreaterThan(500);
    expect(bench.multiScore).toBeGreaterThan(3000);
    expect(bench.ratio).toBeGreaterThan(3);
    expect(bench.durationMs).toBeGreaterThan(50);
  });

  it('should report live clock speed and core voltage', () => {
    const live = service.getLiveMetrics();
    expect(live).toBeDefined();
    expect(live.cpuSpeedMhz).toBeGreaterThan(1000);
    expect(live.voltage).toContain('V');
  });
});
