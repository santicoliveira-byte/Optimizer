import { describe, it, expect } from 'vitest';
// @ts-ignore
const { getNextVersion } = require('../scripts/release');

describe('Release Versioning Logic', () => {
  it('increments patch version for error corrections: 1.1 -> 1.1.1 -> 1.1.2', () => {
    const fix1 = getNextVersion('1.1.0', 'patch');
    expect(fix1.displayTag).toBe('1.1.1');
    expect(fix1.semver).toBe('1.1.1');

    const fix2 = getNextVersion('1.1.1', 'patch');
    expect(fix2.displayTag).toBe('1.1.2');
    expect(fix2.semver).toBe('1.1.2');

    const fix3 = getNextVersion('1.1.2', 'patch');
    expect(fix3.displayTag).toBe('1.1.3');
    expect(fix3.semver).toBe('1.1.3');
  });

  it('increments patch on current version 1.9: 1.9.0 -> 1.9.1 -> 1.9.2', () => {
    const fix1 = getNextVersion('1.9.0', 'patch');
    expect(fix1.displayTag).toBe('1.9.1');
    expect(fix1.semver).toBe('1.9.1');

    const fix2 = getNextVersion('1.9.1', 'patch');
    expect(fix2.displayTag).toBe('1.9.2');
    expect(fix2.semver).toBe('1.9.2');
  });

  it('increments minor version correctly: 1.0 -> 1.1', () => {
    const next = getNextVersion('1.0.0', 'minor');
    expect(next.displayTag).toBe('1.1');
    expect(next.semver).toBe('1.1.0');
  });

  it('increments consecutively through 1.9 -> 1.10', () => {
    const next = getNextVersion('1.9.0', 'minor');
    expect(next.displayTag).toBe('1.10');
    expect(next.semver).toBe('1.10.0');
  });

  it('switches to major version 2.0 when reaching 1.10 as requested by user', () => {
    const next = getNextVersion('1.10.0', 'minor');
    expect(next.displayTag).toBe('2.0');
    expect(next.semver).toBe('2.0.0');
  });

  it('continues after 2.0: 2.0 -> 2.1 -> ... -> 2.10 -> 3.0', () => {
    const step1 = getNextVersion('2.0.0', 'minor');
    expect(step1.displayTag).toBe('2.1');
    expect(step1.semver).toBe('2.1.0');

    const step2 = getNextVersion('2.10.0', 'minor');
    expect(step2.displayTag).toBe('3.0');
    expect(step2.semver).toBe('3.0.0');
  });

  it('allows forced major version bump', () => {
    const next = getNextVersion('1.4.0', true);
    expect(next.displayTag).toBe('2.0');
    expect(next.semver).toBe('2.0.0');
  });
});
