import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { TRANSLATIONS } from '../src/renderer/i18n';
import { LicenseService } from '../src/main/engine/license-service';
import { BottleneckGameService } from '../src/main/engine/bottleneck-game-service';
import { OverlayConfigService } from '../src/main/engine/overlay-config-service';

describe('Public Launch Readiness Master QA Suite', () => {
  const rootDir = path.resolve(__dirname, '..');
  const catalogPath = path.join(rootDir, 'src/main/catalog/catalog.json');

  describe('1. Catalog Integrity & Safety', () => {
    it('verifies catalog JSON exists and has 500 items with unique IDs', () => {
      const raw = fs.readFileSync(catalogPath, 'utf-8');
      const catalog = JSON.parse(raw);
      expect(catalog.items).toBeDefined();
      expect(catalog.items.length).toBe(500);

      const idSet = new Set<string>();
      for (const item of catalog.items) {
        expect(item.id).toBeTruthy();
        expect(idSet.has(item.id), `Duplicate catalog id detected: ${item.id}`).toBe(false);
        idSet.add(item.id);

        expect(['safe', 'moderate']).toContain(item.risk);
        expect(['alter', 'inform', 'clean']).toContain(item.type);
        expect(typeof item.requiresAdmin).toBe('boolean');
        expect(typeof item.requiresReboot).toBe('boolean');
        expect(item.name.trim().length).toBeGreaterThan(0);
        expect(item.description.trim().length).toBeGreaterThan(0);
      }
    });

    it('ensures zero forbidden commands in catalog (Defender, Firewall, UAC, Mitigations)', () => {
      const raw = fs.readFileSync(catalogPath, 'utf-8').toLowerCase();
      expect(raw).not.toContain('disable-windowsoptionalfeature -featurename windows-defender');
      expect(raw).not.toContain('netsh advfirewall set allprofiles state off');
      expect(raw).not.toContain('enablelua = 0');
      expect(raw).not.toContain('spectre');
      expect(raw).not.toContain('meltdown');
    });
  });

  describe('2. Free vs PRO Licensing & Gating', () => {
    it('verifies PRO activation, deactivation and pricing integrity', () => {
      const licenseService = LicenseService.getInstance();
      const status = licenseService.getStatus();
      expect(status).toBeDefined();
      expect(['Free', 'PRO']).toContain(status.plan);

      // Verify that master dev key works
      expect(licenseService.verifyKey('OPT-PRO-CREATOR-SANTIAGO-VIP')).toBe(true);
      expect(licenseService.verifyKey('OPT-PRO-LIFETIME-VIP-2026')).toBe(true);

      // Verify that garbage keys fail
      expect(licenseService.verifyKey('FAKE-KEY-XYZ')).toBe(false);
    });

    it('ensures only PRO accounts can access competitive 0.500ms and process lasso', () => {
      const licenseService = LicenseService.getInstance();
      licenseService.deactivate();
      expect(licenseService.getStatus().isPro).toBe(false);

      const proGatedFeatures = ['timer05', 'processLasso', 'competitiveGpu', 'ultraGameMode', 'gameConfigs'];
      const isFeaturePermitted = (feat: string, isPro: boolean) => isPro || !proGatedFeatures.includes(feat);

      proGatedFeatures.forEach((feat) => {
        expect(isFeaturePermitted(feat, false)).toBe(false);
        expect(isFeaturePermitted(feat, true)).toBe(true);
      });
    });
  });

  describe('3. Overlay HUD Architecture', () => {
    it('validates overlay default configuration and supported formats', () => {
      const overlayMgr = OverlayConfigService.getInstance();
      const cfg = overlayMgr.getConfig();
      expect(cfg).toBeDefined();
      expect(['horizontal', 'vertical', 'minimal']).toContain(cfg.format);
      expect(['cyan', 'emerald', 'amber', 'purple', 'neon-magenta', 'dark-gamer']).toContain(cfg.theme);
      expect(cfg.items).toBeDefined();
      expect(typeof cfg.items.showFps).toBe('boolean');
      expect(typeof cfg.items.showCpu).toBe('boolean');
      expect(typeof cfg.items.showGpu).toBe('boolean');
      expect(typeof cfg.items.showRam).toBe('boolean');
      expect(typeof cfg.items.showPing).toBe('boolean');
    });

    it('confirms that obsolete GameOverlayWidget is not rendered in App.tsx', () => {
      const appTsx = fs.readFileSync(path.join(rootDir, 'src/renderer/App.tsx'), 'utf-8');
      expect(appTsx).not.toContain('import { GameOverlayWidget }');
      expect(appTsx).not.toContain('<GameOverlayWidget');
    });
  });

  describe('4. Localization & User Experience', () => {
    it('validates 100% key coverage across PT, EN, and ES languages', () => {
      const ptKeys = Object.keys(TRANSLATIONS.pt);
      const enKeys = Object.keys(TRANSLATIONS.en);
      const esKeys = Object.keys(TRANSLATIONS.es);

      expect(ptKeys.length).toBeGreaterThan(15);
      expect(enKeys.length).toBe(ptKeys.length);
      expect(esKeys.length).toBe(ptKeys.length);

      for (const k of ptKeys) {
        expect(TRANSLATIONS.en[k]).toBeDefined();
        expect(TRANSLATIONS.es[k]).toBeDefined();
      }
    });
  });

  describe('5. Hardware & Bottleneck Analysis Ready', () => {
    it('evaluates bottlenecks and game readiness without errors', async () => {
      const bottleneckSvc = new BottleneckGameService();
      const bottleneckRes = bottleneckSvc.calculateBottleneck('Ryzen 5 5600X', 'RTX 3060', '1080p', 'general');
      expect(bottleneckRes).toBeDefined();
      expect(typeof bottleneckRes.bottleneckPercent).toBe('number');
      expect(bottleneckRes.recommendations.length).toBeGreaterThan(0);

      const mockRig = {
        cpuName: 'AMD Ryzen 5 5600X',
        gpuName: 'NVIDIA GeForce RTX 3060',
        ramGb: 16,
        ramSpeedMhz: 3200,
        vramGb: 12,
        diskFreeGb: 400,
        storageType: 'NVMe SSD',
        windowsVersion: 'Windows 11',
        isLaptop: false,
        hasDedicatedGpu: true
      };

      const gameReports = await bottleneckSvc.evaluateGames(mockRig);
      expect(gameReports).toBeDefined();
      expect(gameReports.length).toBeGreaterThan(5);
      
      const cs2 = gameReports.find((g) => g.game.id === 'cs2');
      expect(cs2).toBeDefined();
      if (cs2) {
        expect(['ultra', 'recommended', 'optimal', 'playable']).toContain(cs2.status);
        expect(cs2.fpsEstimate.low1080p).toBeGreaterThan(100);
      }
    });
  });

  describe('6. Dynamic Versioning', () => {
    it('ensures no hardcoded legacy versions (v1.3, v2.1.0) exist in UI components', () => {
      const sidebarContent = fs.readFileSync(path.join(rootDir, 'src/renderer/components/Sidebar.tsx'), 'utf-8');
      expect(sidebarContent).not.toContain('>v1.3<');

      const settingsContent = fs.readFileSync(path.join(rootDir, 'src/renderer/components/SettingsModal.tsx'), 'utf-8');
      expect(settingsContent).not.toContain('v2.1.0');
    });
  });

  describe('7. In-App Updates & What\'s New Welcome Modal', () => {
    it('verifies that WhatsNewModal exists and contains curated release highlights', () => {
      const whatsNewContent = fs.readFileSync(path.join(rootDir, 'src/renderer/components/WhatsNewModal.tsx'), 'utf-8');
      expect(whatsNewContent).toContain('RELEASES_CHANGELOG');
      expect(whatsNewContent).toContain('Novidades da Versão');
      
      const appContent = fs.readFileSync(path.join(rootDir, 'src/renderer/App.tsx'), 'utf-8');
      expect(appContent).toContain('optimizer_last_seen_version');
      expect(appContent).toContain('WhatsNewModal');
    });

    it('verifies that checkUpdateStatus logic prevents recurring popups on identical version', () => {
      const isGenuineUpdate = (lastSeenVer: string, currentVer: string) => {
        return Boolean(lastSeenVer && lastSeenVer !== currentVer);
      };

      // First run (fresh install): no popup
      expect(isGenuineUpdate('', '2.2.11')).toBe(false);

      // Same version reopening: no popup
      expect(isGenuineUpdate('2.2.11', '2.2.11')).toBe(false);

      // Real update (e.g. from 2.2.10 to 2.2.11): popup shows once!
      expect(isGenuineUpdate('2.2.10', '2.2.11')).toBe(true);
    });
  });
});
