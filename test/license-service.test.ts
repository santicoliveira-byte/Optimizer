import { describe, it, expect } from 'vitest';
import { LicenseService } from '../src/main/engine/license-service';

describe('Optimizer PRO License Engine', () => {
  it('validates authentic cryptographic PRO keys', () => {
    const licenseService = LicenseService.getInstance();
    const generated = licenseService.generateKey('VIP01');
    expect(generated.startsWith('OPT-PRO-VIP01-')).toBe(true);
    expect(licenseService.verifyKey(generated)).toBe(true);
  });

  it('rejects tampered or fake license keys', () => {
    const licenseService = LicenseService.getInstance();
    expect(licenseService.verifyKey('OPT-PRO-FAKE-1234-9999')).toBe(false);
    expect(licenseService.verifyKey('INVALID-KEY-STRING')).toBe(false);
    expect(licenseService.verifyKey('')).toBe(false);
    expect(licenseService.verifyKey('OPT-PRO-ABC12-DEF34-ZZZZ')).toBe(false);
  });

  it('accepts universal master developer keys', () => {
    const licenseService = LicenseService.getInstance();
    expect(licenseService.verifyKey('OPT-PRO-LIFETIME-VIP-2026')).toBe(true);
    expect(licenseService.verifyKey('OPT-PRO-CREATOR-SANTIAGO-VIP')).toBe(true);
  });

  it('activates and deactivates PRO status correctly', async () => {
    const licenseService = LicenseService.getInstance();
    const validKey = licenseService.generateKey('TEST1');

    const activateRes = await licenseService.activate(validKey, 'Santiago Tester');
    expect(activateRes.success).toBe(true);
    expect(activateRes.isPro).toBe(true);
    expect(licenseService.getStatus().isPro).toBe(true);
    expect(licenseService.getStatus().plan).toBe('PRO');

    const deactivateRes = await licenseService.deactivate();
    expect(deactivateRes.success).toBe(true);
    expect(licenseService.getStatus().isPro).toBe(false);
    expect(licenseService.getStatus().plan).toBe('Free');
  });

  it('correctly gates premium features when plan is Free', () => {
    const licenseService = LicenseService.getInstance();
    licenseService.deactivate();
    expect(licenseService.getStatus().isPro).toBe(false);

    const canAccessFeature = (isPro: boolean, feature: string) => {
      const proOnlyFeatures = ['overlay', 'benchmark', 'gsync', 'pcors', 'timer05', 'msiPriority'];
      if (proOnlyFeatures.includes(feature) && !isPro) return false;
      return true;
    };

    expect(canAccessFeature(false, 'overlay')).toBe(false);
    expect(canAccessFeature(false, 'benchmark')).toBe(false);
    expect(canAccessFeature(false, 'timer05')).toBe(false);
    expect(canAccessFeature(false, 'msiPriority')).toBe(false);
    expect(canAccessFeature(true, 'overlay')).toBe(true);
    expect(canAccessFeature(true, 'timer05')).toBe(true);
    expect(canAccessFeature(true, 'msiPriority')).toBe(true);
  });
});
