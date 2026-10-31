import fs from 'fs';
import path from 'path';
import os from 'os';
import { ShaderCacheCategory } from '../../shared/types';

export class ShaderCacheService {
  private static instance: ShaderCacheService;

  private constructor() {}

  public static getInstance(): ShaderCacheService {
    if (!ShaderCacheService.instance) {
      ShaderCacheService.instance = new ShaderCacheService();
    }
    return ShaderCacheService.instance;
  }

  private getCacheLocations(): { id: string; name: string; path: string }[] {
    const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
    const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');

    return [
      {
        id: 'directx',
        name: 'DirectX Shader Cache (D3DSCache)',
        path: path.join(localAppData, 'D3DSCache')
      },
      {
        id: 'nvidia_dx',
        name: 'NVIDIA DirectX Shader Cache (DXCache)',
        path: path.join(localAppData, 'NVIDIA', 'DXCache')
      },
      {
        id: 'nvidia_gl',
        name: 'NVIDIA OpenGL/Vulkan Cache (GLCache)',
        path: path.join(appData, 'NVIDIA', 'GLCache')
      },
      {
        id: 'amd_d3d',
        name: 'AMD Radeon D3D Cache',
        path: path.join(localAppData, 'AMD', 'DxCache')
      },
      {
        id: 'intel_shader',
        name: 'Intel Graphics Shader Cache',
        path: path.join(localAppData, 'Intel', 'ShaderCache')
      }
    ];
  }

  private scanFolder(dirPath: string): { sizeBytes: number; fileCount: number; exists: boolean } {
    if (!fs.existsSync(dirPath)) {
      return { sizeBytes: 0, fileCount: 0, exists: false };
    }

    let sizeBytes = 0;
    let fileCount = 0;

    try {
      const files = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const file of files) {
        const fullPath = path.join(dirPath, file.name);
        try {
          if (file.isDirectory()) {
            const sub = this.scanFolder(fullPath);
            sizeBytes += sub.sizeBytes;
            fileCount += sub.fileCount;
          } else {
            const st = fs.statSync(fullPath);
            sizeBytes += st.size;
            fileCount += 1;
          }
        } catch {}
      }
    } catch {}

    return { sizeBytes, fileCount, exists: true };
  }

  public getCacheStatus(): ShaderCacheCategory[] {
    const locs = this.getCacheLocations();
    return locs.map((loc) => {
      const info = this.scanFolder(loc.path);
      return {
        id: loc.id,
        name: loc.name,
        path: loc.path,
        sizeBytes: info.sizeBytes,
        fileCount: info.fileCount,
        exists: info.exists
      };
    });
  }

  public cleanCache(id?: string): { success: boolean; freedBytes: number; deletedFiles: number; message: string } {
    const locs = this.getCacheLocations();
    const targets = id ? locs.filter((l) => l.id === id) : locs;

    let freedBytes = 0;
    let deletedFiles = 0;

    for (const target of targets) {
      if (!fs.existsSync(target.path)) continue;

      try {
        const files = fs.readdirSync(target.path, { withFileTypes: true });
        for (const file of files) {
          const fullPath = path.join(target.path, file.name);
          try {
            if (file.isDirectory()) {
              // Delete contents
              fs.rmSync(fullPath, { recursive: true, force: true });
              deletedFiles++;
            } else {
              const st = fs.statSync(fullPath);
              freedBytes += st.size;
              fs.unlinkSync(fullPath);
              deletedFiles++;
            }
          } catch {
            // Some files might be locked by running GPU processes, continue
          }
        }
      } catch {}
    }

    const freedMb = (freedBytes / (1024 * 1024)).toFixed(1);
    return {
      success: true,
      freedBytes,
      deletedFiles,
      message: `Cache limpa: ${deletedFiles} ficheiros eliminados (${freedMb} MB libertados). Ficheiros ativos em uso foram preservados.`
    };
  }
}
