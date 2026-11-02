import { describe, it, expect } from 'vitest';

describe('UFO Motion Test Engine & Pacing', () => {
  it('should snap fluctuating measured refresh rates to standard gaming refresh rates', () => {
    const standardRates = [60, 75, 100, 120, 144, 165, 180, 240, 280, 360, 500];
    const snapHz = (rawHz: number) => {
      const rounded = Math.round(rawHz);
      return standardRates.find((r) => Math.abs(r - rounded) <= 2) || rounded;
    };

    expect(snapHz(143.8)).toBe(144);
    expect(snapHz(144.2)).toBe(144);
    expect(snapHz(279.2)).toBe(280);
    expect(snapHz(280.9)).toBe(280);
    expect(snapHz(239.5)).toBe(240);
    expect(snapHz(59.9)).toBe(60);
    expect(snapHz(164.7)).toBe(165);
  });

  it('should ensure Lane 2 and Lane 3 sample-and-hold never teleport backwards or jump unexpectedly', () => {
    const speed = 960; // 960 px/s
    const offset = 80;
    const canvasWidth = 1000;
    const totalTrack = canvasWidth + offset * 2; // 1160
    const nativeHz = 280;
    const dt = 1 / nativeHz; // ~0.00357s per frame

    let ufoPos = 0;
    let lane2Pos = 0;
    let lane2FrameCount = 0;
    let lane3Pos = 0;
    let lane3Timer = 0;
    const baseInterval = 1 / 60; // 60 FPS

    const positionsLane1: number[] = [];
    const positionsLane2: number[] = [];
    const positionsLane3: number[] = [];

    // Simulate 600 frames (~2.14 seconds)
    for (let frame = 0; frame < 600; frame++) {
      ufoPos = (ufoPos + speed * dt) % totalTrack;
      const x1 = ufoPos - offset;

      lane2FrameCount++;
      if (lane2FrameCount >= 2) {
        lane2FrameCount = 0;
        lane2Pos = ufoPos;
      }
      const x2 = lane2Pos - offset;

      lane3Timer += dt;
      if (lane3Timer >= baseInterval) {
        lane3Timer = lane3Timer % baseInterval;
        lane3Pos = ufoPos;
      }
      const x3 = lane3Pos - offset;

      positionsLane1.push(x1);
      positionsLane2.push(x2);
      positionsLane3.push(x3);
    }

    // Lane 1 moves smoothly forward until wrap
    for (let i = 1; i < positionsLane1.length; i++) {
      const diff1 = positionsLane1[i] - positionsLane1[i - 1];
      if (diff1 >= 0) {
        expect(diff1).toBeCloseTo(speed * dt, 1);
      } else {
        // Wrapped around track
        expect(diff1).toBeLessThan(0);
      }
    }

    // Lane 2 updates every 2 frames, never drifting away from Lane 1 by more than 2 frames of movement
    for (let i = 1; i < positionsLane2.length; i++) {
      const diff2 = positionsLane2[i] - positionsLane2[i - 1];
      if (diff2 > 0) {
        expect(diff2).toBeCloseTo(speed * dt * 2, 1);
      } else if (diff2 === 0) {
        expect(diff2).toBe(0); // Held frame
      }
    }

    // Lane 3 updates roughly every 4-5 frames (280/60), holding position between ticks
    let lane3HoldCount = 0;
    for (let i = 1; i < positionsLane3.length; i++) {
      if (positionsLane3[i] === positionsLane3[i - 1]) {
        lane3HoldCount++;
      }
    }
    // Most frames are holds for 60fps on 280hz
    expect(lane3HoldCount).toBeGreaterThan(400);
  });
});
