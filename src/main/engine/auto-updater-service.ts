import https from 'https';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn, exec } from 'child_process';
import { app } from 'electron';
import { isOfficialReleaseUrl } from './security-utils';
import { PowerShellRunner } from './powershell-runner';

export interface UpdateInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseName: string;
  releaseNotes: string;
  downloadUrl: string;
  assetName: string;
  assetSize: number;
  publishedAt: string;
  htmlUrl: string;
}

export class AutoUpdaterService {
  private static instance: AutoUpdaterService;
  private readonly repoOwner = 'santicoliveira-byte';
  private readonly repoName = 'Optimizer';
  private currentVersion: string;
  private runner: PowerShellRunner;

  private constructor() {
    this.runner = PowerShellRunner.getInstance();
    try {
      const pkgPath = path.resolve(__dirname, '../../../package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        this.currentVersion = pkg.version || '1.0.0';
      } else {
        this.currentVersion = app ? app.getVersion() : '1.0.0';
      }
    } catch {
      this.currentVersion = '1.0.0';
    }
  }

  public static getInstance(): AutoUpdaterService {
    if (!AutoUpdaterService.instance) {
      AutoUpdaterService.instance = new AutoUpdaterService();
    }
    return AutoUpdaterService.instance;
  }

  public getCurrentVersion(): string {
    return this.currentVersion;
  }

  /**
   * Compares two version strings: e.g. "1.1" > "1.0", "1.10" > "1.9", "2.0" > "1.10"
   */
  public isNewerVersion(remoteTag: string, localVer: string): boolean {
    const cleanRemote = remoteTag.replace(/^v/, '').trim();
    const cleanLocal = localVer.replace(/^v/, '').trim();

    const rParts = cleanRemote.split('.').map(Number);
    const lParts = cleanLocal.split('.').map(Number);

    const rMajor = rParts[0] || 0;
    const rMinor = rParts.length > 1 ? rParts[1] : 0;
    const rPatch = rParts.length > 2 ? rParts[2] : 0;

    const lMajor = lParts[0] || 0;
    const lMinor = lParts.length > 1 ? lParts[1] : 0;
    const lPatch = lParts.length > 2 ? lParts[2] : 0;

    if (rMajor > lMajor) return true;
    if (rMajor < lMajor) return false;

    if (rMinor > lMinor) return true;
    if (rMinor < lMinor) return false;

    return rPatch > lPatch;
  }

  /**
   * Queries GitHub Releases API for the latest release
   */
  public async checkForUpdates(): Promise<UpdateInfo> {
    const url = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/releases/latest`;

    return new Promise((resolve) => {
      const options = {
        family: 4,
        headers: {
          'User-Agent': 'Optimizer-Desktop-App',
          'Accept': 'application/vnd.github.v3+json'
        }
      };

      const req = https.get(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode !== 200) {
            resolve({
              hasUpdate: false,
              currentVersion: this.currentVersion,
              latestVersion: this.currentVersion,
              releaseName: '',
              releaseNotes: '',
              downloadUrl: '',
              assetName: '',
              assetSize: 0,
              publishedAt: '',
              htmlUrl: `https://github.com/${this.repoOwner}/${this.repoName}/releases`
            });
            return;
          }

          try {
            const release = JSON.parse(data);
            const remoteTag = release.tag_name || '';
            const hasUpdate = this.isNewerVersion(remoteTag, this.currentVersion);

            let downloadUrl = '';
            let assetName = 'Optimizer-Portable.exe';
            let assetSize = 0;

            if (Array.isArray(release.assets)) {
              const exeAsset = release.assets.find((a: any) =>
                a.name && a.name.toLowerCase().endsWith('.exe')
              );
              if (exeAsset) {
                downloadUrl = exeAsset.browser_download_url;
                assetName = exeAsset.name;
                assetSize = exeAsset.size;
              }
            }

            resolve({
              hasUpdate,
              currentVersion: this.currentVersion,
              latestVersion: remoteTag.replace(/^v/, ''),
              releaseName: release.name || remoteTag,
              releaseNotes: release.body || '',
              downloadUrl: downloadUrl || release.html_url,
              assetName,
              assetSize,
              publishedAt: release.published_at || '',
              htmlUrl: release.html_url || `https://github.com/${this.repoOwner}/${this.repoName}/releases`
            });
          } catch {
            resolve({
              hasUpdate: false,
              currentVersion: this.currentVersion,
              latestVersion: this.currentVersion,
              releaseName: '',
              releaseNotes: '',
              downloadUrl: '',
              assetName: '',
              assetSize: 0,
              publishedAt: '',
              htmlUrl: `https://github.com/${this.repoOwner}/${this.repoName}/releases`
            });
          }
        });
      });

      req.on('error', () => {
        resolve({
          hasUpdate: false,
          currentVersion: this.currentVersion,
          latestVersion: this.currentVersion,
          releaseName: '',
          releaseNotes: '',
          downloadUrl: '',
          assetName: '',
          assetSize: 0,
          publishedAt: '',
          htmlUrl: `https://github.com/${this.repoOwner}/${this.repoName}/releases`
        });
      });

      req.setTimeout(8000, () => {
        req.destroy();
        resolve({
          hasUpdate: false,
          currentVersion: this.currentVersion,
          latestVersion: this.currentVersion,
          releaseName: '',
          releaseNotes: '',
          downloadUrl: '',
          assetName: '',
          assetSize: 0,
          publishedAt: '',
          htmlUrl: `https://github.com/${this.repoOwner}/${this.repoName}/releases`
        });
      });
    });
  }

  /**
   * Downloads the latest portable executable and launches it with triple-tier resilience:
   * 1. Node.js HTTPS (IPv4 forced)
   * 2. Windows Native curl.exe with auto-redirects
   * 3. Windows PowerShell Invoke-WebRequest with TLS 1.2
   */
  public async downloadAndApplyUpdate(
    downloadUrl: string,
    onProgress?: (percent: number) => void
  ): Promise<{ success: boolean; path?: string; error?: string }> {
    if (!downloadUrl) {
      return { success: false, error: 'URL de download inválido.' };
    }

    // Strict Security Validation: Only allow official GitHub Release binary downloads
    if (!isOfficialReleaseUrl(downloadUrl)) {
      return {
        success: false,
        error: 'Segurança: Origem de download de atualização não autorizada. Apenas binários oficiais do repositório no GitHub são permitidos.'
      };
    }

    const tempDir = os.tmpdir();
    const targetFile = path.join(tempDir, `Optimizer-Update-${Date.now()}.exe`);

    const launchAndQuit = (): { success: boolean; path: string } => {
      const desktopPath = path.join(process.env.USERPROFILE || 'C:\\Users\\Santiago', 'Desktop', 'Optimizer-Portable.exe');
      try {
        fs.copyFileSync(targetFile, desktopPath);
      } catch {}

      spawn(targetFile, [], {
        detached: true,
        stdio: 'ignore'
      }).unref();

      setTimeout(() => {
        if (app) {
          app.quit();
        } else {
          process.exit(0);
        }
      }, 1000);

      return { success: true, path: targetFile };
    };

    // Layer 1: Node.js https.get with family: 4 (bypasses Windows IPv6 resolution glitches)
    const tryNodeDownload = (): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        let redirects = 0;
        const follow = (url: string) => {
          if (redirects++ > 8) {
            resolve({ success: false, error: 'Demasiados redirecionamentos.' });
            return;
          }

          const req = https.get(url, { family: 4, headers: { 'User-Agent': 'Optimizer-Desktop-App' } }, (res) => {
            if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
              follow(res.headers.location);
              return;
            }

            if (res.statusCode !== 200) {
              resolve({ success: false, error: `Falha no download (HTTP ${res.statusCode})` });
              return;
            }

            const totalSize = parseInt(res.headers['content-length'] || '0', 10);
            let downloaded = 0;
            const fileStream = fs.createWriteStream(targetFile);

            res.on('data', (chunk) => {
              downloaded += chunk.length;
              if (totalSize > 0 && onProgress) {
                onProgress(Math.round((downloaded / totalSize) * 100));
              }
            });

            res.pipe(fileStream);

            fileStream.on('finish', () => {
              fileStream.close();
              if (fs.existsSync(targetFile) && fs.statSync(targetFile).size > 1000000) {
                resolve({ success: true });
              } else {
                resolve({ success: false, error: 'Ficheiro descarregado incompleto.' });
              }
            });

            fileStream.on('error', (err) => {
              fs.unlink(targetFile, () => {});
              resolve({ success: false, error: err.message });
            });
          });

          req.on('error', (err) => {
            resolve({ success: false, error: err.message });
          });

          req.setTimeout(35000, () => {
            req.destroy();
            resolve({ success: false, error: 'Tempo limite esgotado.' });
          });
        };

        follow(downloadUrl);
      });
    };

    // Layer 2: Windows native curl.exe with -4 -L (uses Windows socket stack and handles redirects)
    const tryCurlDownload = (): Promise<{ success: boolean; error?: string }> => {
      return new Promise((resolve) => {
        const cmd = `curl.exe -4 -L --fail --retry 2 --connect-timeout 10 -o "${targetFile}" "${downloadUrl}"`;
        exec(cmd, { windowsHide: true }, (err) => {
          if (!err && fs.existsSync(targetFile) && fs.statSync(targetFile).size > 1000000) {
            if (onProgress) onProgress(100);
            resolve({ success: true });
          } else {
            resolve({ success: false, error: err?.message || 'Falha ao descarregar via curl' });
          }
        });
      });
    };

    // Layer 3: Windows PowerShell Invoke-WebRequest with TLS 1.2
    const tryPowerShellDownload = async (): Promise<{ success: boolean; error?: string }> => {
      try {
        const psScript = `
          [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13
          Invoke-WebRequest -Uri "${downloadUrl}" -OutFile "${targetFile}" -UseBasicParsing -TimeoutSec 60
        `;
        const psRes = await this.runner.run(psScript);
        if (psRes.success && fs.existsSync(targetFile) && fs.statSync(targetFile).size > 1000000) {
          if (onProgress) onProgress(100);
          return { success: true };
        }
        return { success: false, error: psRes.stderr || 'Falha ao descarregar via PowerShell' };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    };

    // Execute Layer 1 -> Layer 2 -> Layer 3
    const nodeRes = await tryNodeDownload();
    if (nodeRes.success) {
      return launchAndQuit();
    }

    const curlRes = await tryCurlDownload();
    if (curlRes.success) {
      return launchAndQuit();
    }

    const psRes = await tryPowerShellDownload();
    if (psRes.success) {
      return launchAndQuit();
    }

    return {
      success: false,
      error: `Falha de ligação/DNS ao GitHub (${nodeRes.error || curlRes.error || 'getaddrinfo ENOTFOUND'}). Verifique a ligação à internet ou clique em 'Ver no GitHub' para descarregar diretamente.`
    };
  }
}
