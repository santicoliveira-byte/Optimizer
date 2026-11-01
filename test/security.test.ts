import { describe, it, expect } from 'vitest';
import net from 'net';
import fs from 'fs';
import path from 'path';
import {
  isSafeExternalUrl,
  isOfficialReleaseUrl,
  sanitizeRestorePointDescription,
  sanitizeProcessName
} from '../src/main/engine/security-utils';
import { AutoUpdaterService } from '../src/main/engine/auto-updater-service';
import { DnsBenchmarkService } from '../src/main/engine/dns-benchmark-service';
import { ProcessLassoService } from '../src/main/engine/process-lasso-service';

describe('App Security Hardening & Input Sanitization Suite', () => {
  describe('External URL Navigation Security', () => {
    it('should permit valid https and http URLs', () => {
      expect(isSafeExternalUrl('https://github.com/santicoliveira-byte/Optimizer')).toBe(true);
      expect(isSafeExternalUrl('http://example.com/info')).toBe(true);
    });

    it('should reject dangerous protocols and malicious URIs', () => {
      expect(isSafeExternalUrl('javascript:alert(1)')).toBe(false);
      expect(isSafeExternalUrl('file:///C:/Windows/System32/cmd.exe')).toBe(false);
      expect(isSafeExternalUrl('ms-msdt:/id PCWDiagnostic')).toBe(false);
      expect(isSafeExternalUrl('calculator:')).toBe(false);
      expect(isSafeExternalUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
      expect(isSafeExternalUrl('')).toBe(false);
      expect(isSafeExternalUrl('not a url')).toBe(false);
    });
  });

  describe('Auto-Updater Binary Security', () => {
    it('should validate official GitHub repository release binary URLs', () => {
      expect(isOfficialReleaseUrl('https://github.com/santicoliveira-byte/Optimizer/releases/download/v2.1.0/Optimizer-Portable-2.1.0.exe')).toBe(true);
      expect(isOfficialReleaseUrl('https://objects.githubusercontent.com/github-production-release-asset-2e65be/santicoliveira-byte/Optimizer/Optimizer.exe')).toBe(true);
      expect(isOfficialReleaseUrl('https://malicious-mirror.com/santicoliveira-byte/Optimizer/Optimizer.exe')).toBe(false);
      expect(isOfficialReleaseUrl('https://github.com/other-user/malicious-repo/releases/download/v1.0/trojan.exe')).toBe(false);
    });

    it('should reject non-official external download URLs', async () => {
      const updater = AutoUpdaterService.getInstance();
      const maliciousResult = await updater.downloadAndApplyUpdate('https://malicious-site.com/malware.exe');
      expect(maliciousResult.success).toBe(false);
      expect(maliciousResult.error).toContain('Origem de download de atualização não autorizada');
    });

    it('should reject empty or invalid download URLs', async () => {
      const updater = AutoUpdaterService.getInstance();
      const emptyResult = await updater.downloadAndApplyUpdate('');
      expect(emptyResult.success).toBe(false);
      expect(emptyResult.error).toContain('URL de download inválido');
    });
  });

  describe('DNS Benchmark & Configuration IP Sanitization', () => {
    it('should block command injection in DNS IP parameters', async () => {
      const dns = DnsBenchmarkService.getInstance();
      const injectionAttempt = await dns.applyDns('8.8.8.8; Remove-Item C:\\ -Recurse', '1.1.1.1');
      expect(injectionAttempt.success).toBe(false);
      expect(injectionAttempt.message).toContain('Endereço IP de DNS inválido');

      const injectionSecondary = await dns.applyDns('8.8.8.8', '1.1.1.1 && whoami');
      expect(injectionSecondary.success).toBe(false);
      expect(injectionSecondary.message).toContain('Endereço IP de DNS inválido');
    });

    it('should validate legitimate IPv4 and IPv6 addresses correctly', () => {
      expect(net.isIP('1.1.1.1')).toBe(4);
      expect(net.isIP('8.8.4.4')).toBe(4);
      expect(net.isIP('2606:4700:4700::1111')).toBe(6);
      expect(net.isIP('1.1.1.1" ; echo hack')).toBe(0);
    });
  });

  describe('System Restore Point Security', () => {
    it('should strip command injection symbols from restore point descriptions', () => {
      const sanitized = sanitizeRestorePointDescription('Test"; Remove-Item C:\\ -Recurse; #');
      expect(sanitized).not.toContain('"');
      expect(sanitized).not.toContain(';');
      expect(sanitized).not.toContain('\\');
      expect(sanitized).not.toContain('#');
      expect(sanitized).toBe('Test Remove-Item C -Recurse');
    });

    it('should fall back to safe default if description is empty or whitespace', () => {
      expect(sanitizeRestorePointDescription('')).toBe('Optimizer Backup Ponto de Restauro');
      expect(sanitizeRestorePointDescription('   ')).toBe('Optimizer Backup');
    });
  });

  describe('Process Lasso & Command Sanitization', () => {
    it('should sanitize process names with invalid shell characters', () => {
      const sanitized = sanitizeProcessName('malicious;calc.exe');
      expect(sanitized).toBe('maliciouscalc');
      expect(sanitized).not.toContain(';');

      const lasso = ProcessLassoService.getInstance();
      const added = lasso.addCustomProcess('dangerous&game.exe');
      expect(added).toBe(true);
    });
  });

  describe('Content Security Policy (CSP) Verification', () => {
    it('should enforce strict CSP meta tag in index.html', () => {
      const htmlPath = path.resolve(__dirname, '../src/renderer/index.html');
      const htmlContent = fs.readFileSync(htmlPath, 'utf8');
      expect(htmlContent).toContain('http-equiv="Content-Security-Policy"');
      expect(htmlContent).toContain("default-src 'self'");
      expect(htmlContent).toContain("script-src 'self'");
    });
  });
});
