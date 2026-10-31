import { describe, it, expect } from 'vitest';
// @ts-ignore
const { getNextVersion } = require('../scripts/release');

describe('Release Versioning Logic', () => {
  it('increments minor version correctly: 1.0 -> 1.1', () => {
    const next = getNextVersion('1.0.0');
    expect(next.displayTag).toBe('1.1');
    expect(next.semver).toBe('1.1.0');
  });

  it('increments consecutively through 1.9 -> 1.10', () => {
    const next = getNextVersion('1.9.0');
    expect(next.displayTag).toBe('1.10');
    expect(next.semver).toBe('1.10.0');
  });

  it('switches to major version 2.0 when reaching 1.10 as requested by user', () => {
    const next = getNextVersion('1.10.0');
    expect(next.displayTag).toBe('2.0');
    expect(next.semver).toBe('2.0.0');
  });

  it('continues after 2.0: 2.0 -> 2.1 -> ... -> 2.10 -> 3.0', () => {
    const step1 = getNextVersion('2.0.0');
    expect(step1.displayTag).toBe('2.1');
    expect(step1.semver).toBe('2.1.0');

    const step2 = getNextVersion('2.10.0');
    expect(step2.displayTag).toBe('3.0');
    expect(step2.semver).toBe('3.0.0');
  });

  it('allows forced major version bump', () => {
    const next = getNextVersion('1.4.0', true);
    expect(next.displayTag).toBe('2.0');
    expect(next.semver).toBe('2.0.0');
  });
});
