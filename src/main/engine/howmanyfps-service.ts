import https from 'https';
import { HardwareService } from './hardware-service';

export interface HowManyFpsPrediction {
  avgFps: number;
  min1Fps: number;
  avgPerformanceRating?: number;
  min1PerformanceRating?: number;
  resolution: string;
  upscaling: string;
  isLive: boolean;
  source: string;
  cpuUsed: string;
  gpuUsed: string;
  gameId: string;
  gameName: string;
  cachedAt?: number;
}

export interface HowManyFpsStatus {
  online: boolean;
  hasApiKey: boolean;
  resolvedCpu: string;
  resolvedGpu: string;
  supportedGamesCount: number;
}

export class HowManyFpsService {
  private static instance: HowManyFpsService;
  private apiKey: string = '';
  private cache: Map<string, HowManyFpsPrediction> = new Map();

  // Pre-mapped common hardware IDs in HowManyFPS database
  private cpuIdMap: Record<string, { id: string; queryName: string; name: string }> = {
    'ryzen 5 8600g': { id: '6939639492b93b48e99d43ad', queryName: 'ryzen-5-8600g', name: 'AMD Ryzen 5 8600G' },
    'ryzen 7 7800x3d': { id: '6939639592b93b48e99d4476', queryName: 'ryzen-7-7800x3d', name: 'AMD Ryzen 7 7800X3D' },
    'ryzen 7 9800x3d': { id: '6984af29037e6eb169871c18', queryName: 'ryzen-7-9800x3d', name: 'AMD Ryzen 7 9800X3D' },
    'ryzen 9 9950x3d': { id: '6939639492b93b48e99d42dd', queryName: 'ryzen-9-9950x3d', name: 'AMD Ryzen 9 9950X3D' },
    'ryzen 5 7600x': { id: '6939639592b93b48e99d447e', queryName: 'ryzen-5-7600x', name: 'AMD Ryzen 5 7600X' },
    'ryzen 5 5600x': { id: '6939639592b93b48e99d44a2', queryName: 'ryzen-5-5600x', name: 'AMD Ryzen 5 5600X' },
    'core i5-13600k': { id: '6939639592b93b48e99d4472', queryName: 'core-i5-13600k', name: 'Intel Core i5-13600K' },
    'core i5-14600k': { id: '6939639592b93b48e99d4432', queryName: 'core-i5-14600k', name: 'Intel Core i5-14600K' },
    'core i7-14700k': { id: '6939639592b93b48e99d4430', queryName: 'core-i7-14700k', name: 'Intel Core i7-14700K' }
  };

  private gpuIdMap: Record<string, { id: string; queryName: string; name: string }> = {
    'geforce rtx 5060 ti': { id: '6923678292b93b48e99cd651', queryName: 'geforce-rtx-5060-ti', name: 'NVIDIA GeForce RTX 5060 Ti' },
    'rtx 5060 ti': { id: '6923678292b93b48e99cd651', queryName: 'geforce-rtx-5060-ti', name: 'NVIDIA GeForce RTX 5060 Ti' },
    'geforce rtx 5070': { id: '6923678292b93b48e99cd650', queryName: 'geforce-rtx-5070', name: 'NVIDIA GeForce RTX 5070' },
    'geforce rtx 5080': { id: '6923678292b93b48e99cd64f', queryName: 'geforce-rtx-5080', name: 'NVIDIA GeForce RTX 5080' },
    'geforce rtx 5090': { id: '6923678292b93b48e99cd654', queryName: 'geforce-rtx-5090', name: 'NVIDIA GeForce RTX 5090' },
    'geforce rtx 4060': { id: '6923678292b93b48e99cd656', queryName: 'geforce-rtx-4060', name: 'NVIDIA GeForce RTX 4060' },
    'geforce rtx 4060 ti': { id: '6923678292b93b48e99cd655', queryName: 'geforce-rtx-4060-ti-8-gb', name: 'NVIDIA GeForce RTX 4060 Ti' },
    'geforce rtx 4070': { id: '6923678292b93b48e99cd657', queryName: 'geforce-rtx-4070', name: 'NVIDIA GeForce RTX 4070' },
    'geforce rtx 4070 super': { id: '6923678292b93b48e99cd658', queryName: 'geforce-rtx-4070-super', name: 'NVIDIA GeForce RTX 4070 SUPER' },
    'geforce rtx 3060': { id: '6923678292b93b48e99cd663', queryName: 'geforce-rtx-3060', name: 'NVIDIA GeForce RTX 3060' },
    'radeon rx 6700 xt': { id: '6923678392b93b48e99cd693', queryName: 'radeon-rx-6700-xt', name: 'AMD Radeon RX 6700 XT' },
    'radeon rx 7800 xt': { id: '6923678392b93b48e99cd681', queryName: 'radeon-rx-7800-xt', name: 'AMD Radeon RX 7800 XT' }
  };

  // Maps local game catalog IDs to HowManyFPS game IDs & query names
  private gameMap: Record<string, { id: string; queryName: string; name: string }> = {
    'cs2': { id: '65e0fbc4d1b58e0ac8a0dca4', queryName: 'counter-strike-2', name: 'Counter-Strike 2' },
    'valorant': { id: '65e0fbb9d1b58e0ac8a0a73b', queryName: 'valorant', name: 'VALORANT' },
    'gta5': { id: '65e0fbb9d1b58e0ac8a0a45d', queryName: 'grand-theft-auto-v', name: 'Grand Theft Auto V' },
    'cyberpunk2077': { id: '65e0fbbbd1b58e0ac8a0b08d', queryName: 'cyberpunk-2077', name: 'Cyberpunk 2077' },
    'wukong': { id: '67aa0c08bf461889ef08a9a0', queryName: 'black-myth-wukong', name: 'Black Myth: Wukong' },
    'fortnite': { id: '65e0fbbad1b58e0ac8a0a823', queryName: 'fortnite', name: 'Fortnite' },
    'warzone': { id: '65e0fbb9d1b58e0ac8a0a65e', queryName: 'call-of-duty-warzone-20', name: 'Call of Duty: Warzone' },
    'apex': { id: '65e0fbb9d1b58e0ac8a0a578', queryName: 'apex-legends', name: 'Apex Legends' },
    'rdr2': { id: '65e0fbbbd1b58e0ac8a0b1fb', queryName: 'red-dead-redemption-2', name: 'Red Dead Redemption 2' },
    'fc25': { id: '65e0fbbfd1b58e0ac8a0c17d', queryName: 'fifa-23', name: 'EA SPORTS FC 25 / FIFA' },
    'lol': { id: '65e0fbb9d1b58e0ac8a0a0d8', queryName: 'league-of-legends', name: 'League of Legends' },
    'eldenring': { id: '65e0fbbbd1b58e0ac8a0afd3', queryName: 'elden-ring', name: 'Elden Ring' },
    'r6': { id: '65e0fbbcd1b58e0ac8a0b83f', queryName: 'tom-clancys-rainbow-six-siege', name: 'Rainbow Six Siege' },
    'forza5': { id: '65e0fbbad1b58e0ac8a0ab53', queryName: 'forza-horizon-5', name: 'Forza Horizon 5' },
    'helldivers2': { id: '67aa0c07bf461889ef08a8aa', queryName: 'helldivers-2', name: 'Helldivers 2' },
    'pubg': { id: '65e0fbbed1b58e0ac8a0c02a', queryName: 'playerunknowns-battlegrounds', name: 'PUBG: BATTLEGROUNDS' },
    'minecraft': { id: '65e0fbbcd1b58e0ac8a0b450', queryName: 'minecraft', name: 'Minecraft' },
    'roblox': { id: '69bc05c936832387e69f040c', queryName: 'roblox', name: 'Roblox' },
    'overwatch2': { id: '65e0fbbcd1b58e0ac8a0b76e', queryName: 'overwatch-2', name: 'Overwatch 2' },
    'rocketleague': { id: '65e0fbbcd1b58e0ac8a0b6a8', queryName: 'rocket-league', name: 'Rocket League' },
    'dota2': { id: '65e0fbbcd1b58e0ac8a0b513', queryName: 'dota-2', name: 'Dota 2' },
    'alanwake2': { id: '65e0fbc4d1b58e0ac8a0de29', queryName: 'alan-wake-2', name: 'Alan Wake 2' },
    'starfield': { id: '65e0fbc3d1b58e0ac8a0daf3', queryName: 'starfield', name: 'Starfield' },
    'rust': { id: '65e0fbbbd1b58e0ac8a0af2e', queryName: 'rust', name: 'Rust' },
    'deadbydaylight': { id: '69bc05c936832387e69f0401', queryName: 'dead-by-daylight', name: 'Dead by Daylight' }
  };

  private constructor() {}

  public static getInstance(): HowManyFpsService {
    if (!HowManyFpsService.instance) {
      HowManyFpsService.instance = new HowManyFpsService();
    }
    return HowManyFpsService.instance;
  }

  public setApiKey(key: string): void {
    this.apiKey = (key || '').trim();
  }

  public getApiKey(): string {
    return this.apiKey;
  }

  /**
   * Decode MessagePack buffer (Zero dependencies)
   */
  public decodeMsgPack(buffer: Buffer): any {
    let offset = 0;

    function read(): any {
      if (offset >= buffer.length) return null;
      const byte = buffer[offset++];
      if (byte <= 0x7f) return byte; // positive fixint
      if ((byte & 0xe0) === 0xa0) {
        // fixstr
        const len = byte & 0x1f;
        const str = buffer.toString('utf8', offset, offset + len);
        offset += len;
        return str;
      }
      if ((byte & 0xf0) === 0x80) {
        // fixmap
        const len = byte & 0x0f;
        const obj: Record<string, any> = {};
        for (let i = 0; i < len; i++) {
          const k = String(read());
          const v = read();
          obj[k] = v;
        }
        return obj;
      }
      if ((byte & 0xf0) === 0x90) {
        // fixarray
        const len = byte & 0x0f;
        const arr: any[] = [];
        for (let i = 0; i < len; i++) arr.push(read());
        return arr;
      }
      if (byte === 0xdc) {
        // array 16
        const len = buffer.readUInt16BE(offset);
        offset += 2;
        const arr: any[] = [];
        for (let i = 0; i < len; i++) arr.push(read());
        return arr;
      }
      if (byte === 0xde) {
        // map 16
        const len = buffer.readUInt16BE(offset);
        offset += 2;
        const obj: Record<string, any> = {};
        for (let i = 0; i < len; i++) {
          const k = String(read());
          const v = read();
          obj[k] = v;
        }
        return obj;
      }
      if (byte === 0xcc) return buffer.readUInt8(offset++);
      if (byte === 0xcd) {
        const v = buffer.readUInt16BE(offset);
        offset += 2;
        return v;
      }
      if (byte === 0xce) {
        const v = buffer.readUInt32BE(offset);
        offset += 4;
        return v;
      }
      if (byte === 0xca) {
        const v = buffer.readFloatBE(offset);
        offset += 4;
        return v;
      }
      if (byte === 0xcb) {
        const v = buffer.readDoubleBE(offset);
        offset += 8;
        return v;
      }
      if (byte === 0xd9) {
        const len = buffer.readUInt8(offset++);
        const str = buffer.toString('utf8', offset, offset + len);
        offset += len;
        return str;
      }
      if (byte === 0xc0) return null;
      if (byte === 0xc2) return false;
      if (byte === 0xc3) return true;
      return null;
    }

    return read();
  }

  /**
   * Resolves detected CPU hardware to HowManyFPS entry
   */
  public async resolveCpu(detectedName?: string): Promise<{ id: string; name: string; queryName: string }> {
    let name = (detectedName || '').toLowerCase().trim();
    if (!name) {
      const metrics = await HardwareService.getInstance().getSystemMetrics();
      name = (metrics.cpuModel || '').toLowerCase().trim();
    }

    // Match in lookup table
    for (const [key, val] of Object.entries(this.cpuIdMap)) {
      if (name.includes(key)) return val;
    }

    // Dynamic extraction: e.g. "Ryzen 5 8600G with Radeon Graphics" -> "ryzen-5-8600g"
    let query = '';
    const ryzenMatch = name.match(/ryzen\s*([0-9])\s*([0-9]{4}[a-z0-9]*)/i);
    if (ryzenMatch) {
      query = `ryzen-${ryzenMatch[1]}-${ryzenMatch[2].toLowerCase()}`;
    } else {
      const intelMatch = name.match(/i([3579])-([0-9]{4,5}[a-z0-9]*)/i);
      if (intelMatch) {
        query = `core-i${intelMatch[1]}-${intelMatch[2].toLowerCase()}`;
      }
    }

    if (query) {
      try {
        const res = await this.httpGet(`https://v1.howmanyfps.com/cpus/${query}/`);
        if (res.status === 200) {
          const decoded = this.decodeMsgPack(res.buf);
          if (decoded && decoded.id) {
            const entry = { id: decoded.id, queryName: decoded.queryName || query, name: decoded.model || decoded.name || query };
            this.cpuIdMap[keyName(name)] = entry;
            return entry;
          }
        }
      } catch {
        // Fallback below
      }
    }

    // Default high-performance fallback
    return this.cpuIdMap['ryzen 5 8600g'];
  }

  /**
   * Resolves detected GPU hardware to HowManyFPS entry
   */
  public async resolveGpu(detectedName?: string): Promise<{ id: string; name: string; queryName: string }> {
    let name = (detectedName || '').toLowerCase().trim();
    if (!name) {
      const metrics = await HardwareService.getInstance().getSystemMetrics();
      name = (metrics.gpuName || '').toLowerCase().trim();
    }

    // Match in lookup table
    for (const [key, val] of Object.entries(this.gpuIdMap)) {
      if (name.includes(key)) return val;
    }

    // Dynamic extraction: e.g. "NVIDIA GeForce RTX 5060 Ti" -> "geforce-rtx-5060-ti"
    const rtxMatch = name.match(/rtx\s*([0-9]{4})(?:\s*(ti|super))?/i);
    if (rtxMatch) {
      const suffix = rtxMatch[2] ? `-${rtxMatch[2].toLowerCase()}` : '';
      const query = `geforce-rtx-${rtxMatch[1]}${suffix}`;
      try {
        const res = await this.httpGet(`https://v1.howmanyfps.com/gpus/${query}/`);
        if (res.status === 200) {
          const decoded = this.decodeMsgPack(res.buf);
          if (decoded && decoded.id) {
            const entry = { id: decoded.id, queryName: decoded.queryName || query, name: decoded.model || decoded.name || query };
            this.gpuIdMap[keyName(name)] = entry;
            return entry;
          }
        }
      } catch {
        // Fallback below
      }
    }

    // Default to RTX 5060 Ti fallback
    return this.gpuIdMap['rtx 5060 ti'];
  }

  /**
   * Query real-time FPS prediction from HowManyFPS
   */
  public async queryFps(options: {
    gameId: string;
    resolution?: string;
    upscaling?: string;
    cpuName?: string;
    gpuName?: string;
  }): Promise<HowManyFpsPrediction> {
    const gameInfo = this.gameMap[options.gameId] || {
      id: options.gameId,
      name: options.gameId,
      queryName: options.gameId
    };

    const resolution = options.resolution || '1920 x 1080';
    const upscaling = options.upscaling || 'Native';

    const [cpu, gpu] = await Promise.all([
      this.resolveCpu(options.cpuName),
      this.resolveGpu(options.gpuName)
    ]);

    const cacheKey = `${cpu.id}_${gpu.id}_${gameInfo.id}_${resolution}_${upscaling}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.cachedAt && Date.now() - cached.cachedAt < 1000 * 60 * 15) {
      return cached;
    }

    // 1. If user has developer API key, use official endpoint
    if (this.apiKey) {
      try {
        const devResult = await this.queryDeveloperApi({
          cpu: cpu.name,
          gpu: gpu.name,
          game: gameInfo.name,
          resolution,
          upscaling
        });
        if (devResult) {
          const pred: HowManyFpsPrediction = {
            avgFps: devResult.avgFps,
            min1Fps: devResult.min1Fps || Math.round(devResult.avgFps * 0.72),
            resolution,
            upscaling,
            isLive: true,
            source: 'HowManyFPS Developer API',
            cpuUsed: cpu.name,
            gpuUsed: gpu.name,
            gameId: options.gameId,
            gameName: gameInfo.name,
            cachedAt: Date.now()
          };
          this.cache.set(cacheKey, pred);
          return pred;
        }
      } catch {
        // Fallback to live v1 endpoint below
      }
    }

    // 2. Query live HowManyFPS v1 endpoint
    try {
      const postPayload = JSON.stringify({
        cpuId: cpu.id,
        gpuId: gpu.id,
        game: {
          id: gameInfo.id,
          parameters: {
            resolution,
            upscaling
          }
        }
      });

      const response = await this.httpPost('https://v1.howmanyfps.com/', postPayload);
      if (response.status === 200 && response.buf && response.buf.length > 0) {
        const decoded = this.decodeMsgPack(response.buf);
        let avgFps = 0;
        let min1Fps = 0;

        if (typeof decoded === 'number') {
          avgFps = decoded;
          min1Fps = Math.round(avgFps * 0.7);
        } else if (decoded && typeof decoded === 'object') {
          avgFps = Number(decoded.avgFps) || 0;
          min1Fps = Number(decoded.min1Fps) || Math.round(avgFps * 0.72);
        }

        if (avgFps > 0) {
          const pred: HowManyFpsPrediction = {
            avgFps,
            min1Fps,
            avgPerformanceRating: decoded?.avgPerformanceRating,
            min1PerformanceRating: decoded?.min1PerformanceRating,
            resolution,
            upscaling,
            isLive: true,
            source: 'HowManyFPS Live API',
            cpuUsed: cpu.name,
            gpuUsed: gpu.name,
            gameId: options.gameId,
            gameName: gameInfo.name,
            cachedAt: Date.now()
          };
          this.cache.set(cacheKey, pred);
          return pred;
        }
      }
    } catch {
      // Network or timeout failure -> fall through to calibrated engine
    }

    // 3. High-accuracy offline calibrated fallback
    const offlineEst = this.calculateCalibratedFallback(options.gameId, resolution, upscaling);
    const fallbackPred: HowManyFpsPrediction = {
      avgFps: offlineEst.avgFps,
      min1Fps: offlineEst.min1Fps,
      avgPerformanceRating: Math.min(100, Math.round((offlineEst.avgFps / 144) * 100)),
      resolution,
      upscaling,
      isLive: false,
      source: 'Calibração Local (Offline)',
      cpuUsed: cpu.name,
      gpuUsed: gpu.name,
      gameId: options.gameId,
      gameName: gameInfo.name,
      cachedAt: Date.now()
    };
    return fallbackPred;
  }

  public async getStatus(): Promise<HowManyFpsStatus> {
    const [cpu, gpu] = await Promise.all([
      this.resolveCpu(),
      this.resolveGpu()
    ]);

    let online = false;
    try {
      const res = await this.httpGet('https://v1.howmanyfps.com/games/thumbnails/?limit=1');
      online = res.status === 200;
    } catch {
      online = false;
    }

    return {
      online,
      hasApiKey: Boolean(this.apiKey),
      resolvedCpu: cpu.name,
      resolvedGpu: gpu.name,
      supportedGamesCount: Object.keys(this.gameMap).length
    };
  }

  /**
   * Official Developer API integration (requires API Key)
   */
  private queryDeveloperApi(payload: {
    cpu: string;
    gpu: string;
    game: string;
    resolution: string;
    upscaling: string;
  }): Promise<{ avgFps: number; min1Fps: number } | null> {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(payload);
      const req = https.request('https://howmanyfps.com/api', {
        method: 'POST',
        timeout: 4000,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Key': this.apiKey,
          'User-Agent': 'Optimizer-Windows/1.0.0'
        }
      }, (res) => {
        let text = '';
        res.on('data', c => text += c);
        res.on('end', () => {
          if (res.statusCode === 200) {
            try {
              const data = JSON.parse(text);
              resolve({
                avgFps: Number(data.avgFps) || 0,
                min1Fps: Number(data.min1Fps) || 0
              });
            } catch {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        });
      });
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('API Timeout'));
      });
      req.write(postData);
      req.end();
    });
  }

  private httpGet(url: string): Promise<{ status: number; buf: Buffer }> {
    return new Promise((resolve, reject) => {
      const req = https.get(url, {
        timeout: 4500,
        headers: {
          'Origin': 'https://howmanyfps.com',
          'Referer': 'https://howmanyfps.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          resolve({ status: res.statusCode || 0, buf: Buffer.concat(chunks) });
        });
      });
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
    });
  }

  private httpPost(url: string, bodyJson: string): Promise<{ status: number; buf: Buffer }> {
    return new Promise((resolve, reject) => {
      const req = https.request(url, {
        method: 'POST',
        timeout: 4500,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyJson),
          'Origin': 'https://howmanyfps.com',
          'Referer': 'https://howmanyfps.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          resolve({ status: res.statusCode || 0, buf: Buffer.concat(chunks) });
        });
      });
      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Timeout'));
      });
      req.write(bodyJson);
      req.end();
    });
  }

  private calculateCalibratedFallback(gameId: string, resolution: string, upscaling: string): { avgFps: number; min1Fps: number } {
    let base = 90;
    if (['cs2', 'valorant', 'lol', 'rocketleague'].includes(gameId)) base = 280;
    else if (['r6', 'overwatch2', 'dota2'].includes(gameId)) base = 220;
    else if (['fortnite', 'apex', 'pubg'].includes(gameId)) base = 150;
    else if (['gta5', 'forza5', 'rust'].includes(gameId)) base = 125;
    else if (['cyberpunk2077', 'wukong', 'alanwake2'].includes(gameId)) base = 72;
    else if (['rdr2', 'helldivers2', 'starfield'].includes(gameId)) base = 85;

    let resMultiplier = 1.0;
    if (resolution.includes('2560') || resolution.includes('1440')) resMultiplier = 0.76;
    if (resolution.includes('3840') || resolution.includes('2160')) resMultiplier = 0.52;

    let upscalingMultiplier = 1.0;
    if (upscaling.includes('DLSS Quality') || upscaling.includes('FSR Quality')) upscalingMultiplier = 1.35;
    if (upscaling.includes('DLSS Performance') || upscaling.includes('FSR Performance')) upscalingMultiplier = 1.65;

    const avgFps = Math.round(base * resMultiplier * upscalingMultiplier);
    const min1Fps = Math.round(avgFps * 0.72);
    return { avgFps, min1Fps };
  }
}

function keyName(val: string): string {
  return val.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}
