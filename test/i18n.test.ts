import { describe, it, expect } from 'vitest';
import { TRANSLATIONS, ACCENT_COLORS } from '../src/renderer/i18n';

describe('i18n and Theme Colors', () => {
  it('supports PT, EN and ES languages with all core navigation keys', () => {
    const langs = ['pt', 'en', 'es'] as const;
    const requiredKeys = [
      'brand.subtitle',
      'search.placeholder',
      'nav.dashboard',
      'nav.gaming',
      'nav.bottleneck',
      'nav.hardware',
      'nav.network',
      'nav.peripherals',
      'nav.system',
      'nav.maintenance',
      'settings.title',
      'settings.accent_color',
      'settings.select_language'
    ];

    langs.forEach((lang) => {
      expect(TRANSLATIONS[lang]).toBeDefined();
      requiredKeys.forEach((key) => {
        expect(TRANSLATIONS[lang][key], `Missing key "${key}" in language "${lang}"`).toBeDefined();
        expect(TRANSLATIONS[lang][key].length).toBeGreaterThan(0);
      });
    });
  });

  it('ensures all translation keys present in PT are also translated in EN and ES', () => {
    const ptKeys = Object.keys(TRANSLATIONS.pt);
    const missingInEn: string[] = [];
    const missingInEs: string[] = [];

    ptKeys.forEach((key) => {
      if (!TRANSLATIONS.en[key]) missingInEn.push(key);
      if (!TRANSLATIONS.es[key]) missingInEs.push(key);
    });

    expect(missingInEn, `Missing EN keys: ${missingInEn.join(', ')}`).toEqual([]);
    expect(missingInEs, `Missing ES keys: ${missingInEs.join(', ')}`).toEqual([]);
  });

  it('provides 7 distinctive theme accent color palettes', () => {
    expect(ACCENT_COLORS.length).toBe(7);
    const ids = ACCENT_COLORS.map((c) => c.id);
    expect(ids).toContain('indigo');
    expect(ids).toContain('emerald');
    expect(ids).toContain('cyan');
    expect(ids).toContain('crimson');
    expect(ids).toContain('amber');
    expect(ids).toContain('purple');
    expect(ids).toContain('rose');

    ACCENT_COLORS.forEach((color) => {
      expect(color.hex).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(color.rgb).toBeDefined();
    });
  });
});
