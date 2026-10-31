import https from 'https';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import { app } from 'electron';

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

  private constructor() {
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
   * Downloads the latest portable executable and launches it
   */
  public async downloadAndApplyUpdate(
    downloadUrl: string,
    onProgress?: (percent: number) => void
  ): Promise<{ success: boolean; path?: string; error?: string }> {
    if (!downloadUrl) {
      return { success: false, error: 'URL de download inválido.' };
    }

    const tempDir = os.tmpdir();
    const targetFile = path.join(tempDir, `Optimizer-Update-${Date.now()}.exe`);

    return new Promise((resolve) => {
      const followRedirects = (url: string) => {
        https.get(url, { headers: { 'User-Agent': 'Optimizer-Desktop-App' } }, (res) => {
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            followRedirects(res.headers.location);
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
            try {
              // Copy to Desktop as well
              const desktopPath = path.join(process.env.USERPROFILE || 'C:\\Users\\Santiago', 'Desktop', 'Optimizer-Portable.exe');
              try {
                fs.copyFileSync(targetFile, desktopPath);
              } catch {
                // Ignore if in use
              }

              // Spawn new process detached
              spawn(targetFile, [], {
                detached: true,
                stdio: 'ignore'
              }).unref();

              // Exit current process
              setTimeout(() => {
                if (app) {
                  app.quit();
                } else {
                  process.exit(0);
                }
              }, 1000);

              resolve({ success: true, path: targetFile });
            } catch (err: any) {
              resolve({ success: false, error: err.message });
            }
          });

          fileStream.on('error', (err) => {
            fs.unlink(targetFile, () => {});
            resolve({ success: false, error: err.message });
          });
        }).on('error', (err) => {
          resolve({ success: false, error: err.message });
        });
      };

      followRedirects(downloadUrl);
    });
  }
}
