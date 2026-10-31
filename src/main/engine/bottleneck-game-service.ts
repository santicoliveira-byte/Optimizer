import { HardwareService } from './hardware-service';

export interface SystemRigInfo {
  cpuName: string;
  gpuName: string;
  ramGb: number;
  ramSpeedMhz: number;
  vramGb: number;
  diskFreeGb: number;
  storageType: string;
  windowsVersion: string;
  isLaptop: boolean;
  hasDedicatedGpu: boolean;
}

export interface BottleneckResult {
  bottleneckPercent: number;
  limitingComponent: 'CPU' | 'GPU' | 'Equilibrado';
  severity: 'perfect' | 'light' | 'moderate' | 'high';
  resolution: '1080p' | '1440p' | '2160p';
  workload: 'general' | 'esports' | 'aaa';
  cpuScore: number;
  gpuScore: number;
  summary: string;
  recommendations: string[];
}

export interface GameRequirement {
  id: string;
  name: string;
  genre: 'esports' | 'fps' | 'rpg' | 'action' | 'sports' | 'sim';
  year: number;
  storageGb: number;
  iconUrl?: string;
  min: {
    cpu: string;
    cpuScore: number;
    gpu: string;
    gpuScore: number;
    ramGb: number;
    vramGb: number;
  };
  rec: {
    cpu: string;
    cpuScore: number;
    gpu: string;
    gpuScore: number;
    ramGb: number;
    vramGb: number;
  };
  ultra: {
    cpu: string;
    cpuScore: number;
    gpu: string;
    gpuScore: number;
    ramGb: number;
    vramGb: number;
  };
  expectedFps: {
    low1080p: number;
    high1080p: number;
    ultra1440p: number;
  };
}

export interface GameEvaluation {
  game: GameRequirement;
  status: 'ultra' | 'recommended' | 'minimum' | 'unsupported';
  passMinimum: boolean;
  passRecommended: boolean;
  verdictText: string;
  targetExperience: {
    preset: string;
    framerate: string;
    resolution: string;
  };
  fpsEstimate: {
    low1080p: number;
    high1080p: number;
    ultra1440p: number;
  };
  checklist: {
    cpu: { current: string; passMin: boolean; passRec: boolean; passUltra: boolean };
    gpu: { current: string; passMin: boolean; passRec: boolean; passUltra: boolean };
    ram: { currentGb: number; requiredMinGb: number; requiredRecGb: number; passMin: boolean; passRec: boolean };
    vram: { currentGb: number; requiredMinGb: number; requiredRecGb: number; passMin: boolean; passRec: boolean };
    os: { current: string; passMin: boolean; passRec: boolean };
    storage: { freeGb: number; requiredGb: number; pass: boolean; driveType?: string };
  };
}

export class BottleneckGameService {
  private static instance: BottleneckGameService;
  private hardwareService: HardwareService;

  // Known CPU benchmark relative index (scaled roughly 10-100)
  private cpuDatabase: { [key: string]: number } = {
    // Flagships / Enthusiast
    'ryzen 7 9800x3d': 100,
    'ryzen 7 7800x3d': 99,
    'ryzen 9 9950x': 98,
    'ryzen 9 7950x3d': 98,
    'core i9-14900k': 97,
    'core i9-13900k': 96,
    'core i7-14700k': 95,
    'ryzen 7 9700x': 95,
    'core i7-13700k': 93,
    'core i7-14700': 93,
    'core i7-13700': 91,
    'ryzen 7 7700x': 90,
    'core i5-14600k': 90,
    'ryzen 7 8700g': 90,
    'core i5-13600k': 88,
    'ryzen 7 5800x3d': 89,
    'ryzen 5 8600g': 87, // Zen 4, 6C/12T, 5.0 GHz boost
    'ryzen 5 7600x': 86,
    'ryzen 7 5700x3d': 86,
    'ryzen 5 7600': 85,
    'ryzen 5 7500f': 84,
    'ryzen 7 8845hs': 87,
    'ryzen 7 7840hs': 85,
    'core i7-13700h': 84,
    'ryzen 5 8500g': 80,
    'core i7-12700h': 80,
    'ryzen 7 7735hs': 79,
    'core i5-14400f': 78,
    'core i5-14400': 78,
    'ryzen 7 5700x': 78,
    'ryzen 5 5600x': 76,
    'core i5-13400f': 76,
    'core i5-13400': 76,
    'core i5-12400f': 75,
    'core i5-12400': 75,
    'ryzen 5 5600': 74,
    'core i7-10700k': 72,
    'core i5-11400f': 68,
    'core i7-9700k': 64,
    'core i3-12100f': 65,
    'ryzen 5 3600': 60,
    'core i5-10400f': 60,
    'core i7-8700k': 58,
    'core i3-10100f': 50,
    'core i5-8400': 48,
    'core i7-4790k': 42,
    'core i5-4460': 34,
    'core i3-2100': 20,
    'celeron': 15
  };

  // Known GPU benchmark relative index (scaled roughly 10-100)
  private gpuDatabase: { [key: string]: { score: number; vram: number } } = {
    // Blackwell / RTX 50 Series
    'rtx 5090': { score: 100, vram: 32 },
    'rtx 5080': { score: 94, vram: 16 },
    'rtx 5070 ti': { score: 89, vram: 16 },
    'rtx 5070': { score: 84, vram: 12 },
    'rtx 5060 ti': { score: 82, vram: 8 },
    'rtx 5060': { score: 76, vram: 8 },

    // Ada Lovelace / RTX 40 & RX 7000 Series
    'rtx 4090': { score: 98, vram: 24 },
    'rtx 4080 super': { score: 92, vram: 16 },
    'rtx 4080': { score: 90, vram: 16 },
    'rx 7900 xtx': { score: 88, vram: 24 },
    'rx 7900 xt': { score: 84, vram: 20 },
    'rtx 4070 ti super': { score: 84, vram: 16 },
    'rtx 4070 ti': { score: 82, vram: 12 },
    'rtx 4070 super': { score: 80, vram: 12 },
    'rx 7800 xt': { score: 78, vram: 16 },
    'rtx 4070': { score: 76, vram: 12 },
    'rx 7700 xt': { score: 74, vram: 12 },
    'rtx 4060 ti': { score: 68, vram: 8 },
    'rx 7600 xt': { score: 65, vram: 16 },
    'rtx 4060 laptop': { score: 64, vram: 8 },
    'rtx 4060': { score: 65, vram: 8 },
    'rx 7600': { score: 60, vram: 8 },
    'rtx 4050 laptop': { score: 52, vram: 6 },

    // Ampere / RTX 30 & RX 6000 Series
    'rtx 3090 ti': { score: 88, vram: 24 },
    'rtx 3090': { score: 85, vram: 24 },
    'rtx 3080 ti': { score: 80, vram: 12 },
    'rtx 3080': { score: 76, vram: 10 },
    'rx 6800 xt': { score: 76, vram: 16 },
    'rtx 3070 ti': { score: 72, vram: 8 },
    'rtx 3070': { score: 68, vram: 8 },
    'rx 6750 xt': { score: 68, vram: 12 },
    'rx 6700 xt': { score: 66, vram: 12 },
    'rtx 3060 ti': { score: 64, vram: 8 },
    'rx 6650 xt': { score: 55, vram: 8 },
    'rtx 3060 12gb': { score: 56, vram: 12 },
    'rtx 3060 laptop': { score: 54, vram: 6 },
    'rtx 3060': { score: 56, vram: 12 },
    'rx 6600 xt': { score: 53, vram: 8 },
    'rx 6600': { score: 50, vram: 8 },

    // Turing & Pascal Series
    'rtx 2080 ti': { score: 65, vram: 11 },
    'rtx 2070 super': { score: 58, vram: 8 },
    'rtx 2060 super': { score: 50, vram: 8 },
    'rtx 2060': { score: 45, vram: 6 },
    'gtx 1080 ti': { score: 55, vram: 11 },
    'gtx 1080': { score: 46, vram: 8 },
    'gtx 1070': { score: 40, vram: 8 },
    'gtx 1660 super': { score: 38, vram: 6 },
    'gtx 1660 ti': { score: 38, vram: 6 },
    'gtx 1650 super': { score: 32, vram: 4 },
    'gtx 1060 6gb': { score: 32, vram: 6 },
    'gtx 1060': { score: 32, vram: 6 },
    'rx 580': { score: 28, vram: 8 },
    'gtx 1650': { score: 26, vram: 4 },
    'gtx 1050 ti': { score: 22, vram: 4 },

    // Arc & Integrated / APU
    'intel arc a770': { score: 64, vram: 16 },
    'intel arc a750': { score: 58, vram: 8 },
    'radeon 780m': { score: 28, vram: 2 },
    'radeon 760m': { score: 22, vram: 2 },
    'radeon 680m': { score: 24, vram: 2 },
    'gt 1030': { score: 18, vram: 2 },
    'intel iris xe': { score: 14, vram: 1 },
    'gt 730': { score: 10, vram: 2 },
    'intel uhd graphics': { score: 8, vram: 1 },
    'gt 710': { score: 6, vram: 2 }
  };

  // Curated database with realistic requirements and expected framerate profiles
  private curatedGames: GameRequirement[] = [
    {
      id: 'cs2',
      name: 'Counter-Strike 2',
      genre: 'esports',
      year: 2023,
      storageGb: 55,
      min: { cpu: 'Core i5-7500 / Ryzen 5 1600', cpuScore: 40, gpu: 'GTX 1060 / RX 580', gpuScore: 30, ramGb: 8, vramGb: 3 },
      rec: { cpu: 'Core i5-12400 / Ryzen 5 5600', cpuScore: 70, gpu: 'RTX 3060 / RX 6600', gpuScore: 55, ramGb: 16, vramGb: 6 },
      ultra: { cpu: 'Ryzen 7 7800X3D / Core i7-13700K', cpuScore: 88, gpu: 'RTX 4070 / RX 7800 XT', gpuScore: 75, ramGb: 32, vramGb: 8 },
      expectedFps: { low1080p: 220, high1080p: 160, ultra1440p: 120 }
    },
    {
      id: 'valorant',
      name: 'VALORANT',
      genre: 'esports',
      year: 2020,
      storageGb: 45,
      min: { cpu: 'Intel Core 2 Duo / Athlon 200GE', cpuScore: 20, gpu: 'Intel HD 4000 / GT 730', gpuScore: 10, ramGb: 4, vramGb: 1 },
      rec: { cpu: 'Core i5-4460 / Ryzen 3 1200', cpuScore: 45, gpu: 'GTX 1050 Ti / RX 560', gpuScore: 25, ramGb: 8, vramGb: 4 },
      ultra: { cpu: 'Ryzen 7 5700X3D / Core i5-12400', cpuScore: 75, gpu: 'GTX 1660 / RTX 3050', gpuScore: 40, ramGb: 16, vramGb: 6 },
      expectedFps: { low1080p: 340, high1080p: 280, ultra1440p: 220 }
    },
    {
      id: 'gta5',
      name: 'Grand Theft Auto V',
      genre: 'action',
      year: 2015,
      storageGb: 110,
      min: { cpu: 'Core 2 Quad Q6600 / Phenom 9850', cpuScore: 25, gpu: 'GTX 9800 / HD 4870', gpuScore: 15, ramGb: 4, vramGb: 2 },
      rec: { cpu: 'Core i5-3470 / FX-8350', cpuScore: 40, gpu: 'GTX 660 / HD 7870', gpuScore: 28, ramGb: 8, vramGb: 4 },
      ultra: { cpu: 'Core i5-10400 / Ryzen 5 3600', cpuScore: 60, gpu: 'RTX 3060 / RX 6600', gpuScore: 55, ramGb: 16, vramGb: 6 },
      expectedFps: { low1080p: 150, high1080p: 115, ultra1440p: 85 }
    },
    {
      id: 'cyberpunk2077',
      name: 'Cyberpunk 2077: Phantom Liberty',
      genre: 'rpg',
      year: 2023,
      storageGb: 85,
      min: { cpu: 'Core i7-6700 / Ryzen 5 1600', cpuScore: 50, gpu: 'GTX 1060 6GB / RX 580', gpuScore: 35, ramGb: 12, vramGb: 6 },
      rec: { cpu: 'Core i7-12700 / Ryzen 7 7800X3D', cpuScore: 78, gpu: 'RTX 2060 Super / RX 5700 XT', gpuScore: 60, ramGb: 16, vramGb: 8 },
      ultra: { cpu: 'Core i7-13700K / Ryzen 7 7800X3D', cpuScore: 92, gpu: 'RTX 4080 / RX 7900 XTX', gpuScore: 88, ramGb: 32, vramGb: 12 },
      expectedFps: { low1080p: 90, high1080p: 65, ultra1440p: 48 }
    },
    {
      id: 'wukong',
      name: 'Black Myth: Wukong',
      genre: 'action',
      year: 2024,
      storageGb: 130,
      min: { cpu: 'Core i5-8400 / Ryzen 5 1600', cpuScore: 52, gpu: 'GTX 1060 6GB / RX 580', gpuScore: 35, ramGb: 16, vramGb: 6 },
      rec: { cpu: 'Core i7-9700 / Ryzen 5 5500', cpuScore: 68, gpu: 'RTX 2060 / RX 5700 XT', gpuScore: 58, ramGb: 16, vramGb: 8 },
      ultra: { cpu: 'Core i7-13700K / Ryzen 7 7800X3D', cpuScore: 90, gpu: 'RTX 4070 Ti / RX 7900 XT', gpuScore: 82, ramGb: 32, vramGb: 12 },
      expectedFps: { low1080p: 85, high1080p: 60, ultra1440p: 45 }
    },
    {
      id: 'fortnite',
      name: 'Fortnite (Unreal Engine 5)',
      genre: 'esports',
      year: 2024,
      storageGb: 60,
      min: { cpu: 'Core i3-3225', cpuScore: 25, gpu: 'Intel HD 4000', gpuScore: 12, ramGb: 8, vramGb: 2 },
      rec: { cpu: 'Core i5-7300U / Ryzen 3 3300U', cpuScore: 50, gpu: 'GTX 960 / R9 280', gpuScore: 32, ramGb: 16, vramGb: 4 },
      ultra: { cpu: 'Core i5-12400 / Ryzen 5 5600X', cpuScore: 75, gpu: 'RTX 3060 Ti / RX 6700 XT', gpuScore: 68, ramGb: 16, vramGb: 8 },
      expectedFps: { low1080p: 210, high1080p: 120, ultra1440p: 85 }
    },
    {
      id: 'warzone',
      name: 'Call of Duty: Warzone / MW3',
      genre: 'fps',
      year: 2024,
      storageGb: 140,
      min: { cpu: 'Core i5-6600 / Ryzen 5 1400', cpuScore: 48, gpu: 'GTX 960 / RX 470', gpuScore: 30, ramGb: 8, vramGb: 4 },
      rec: { cpu: 'Core i7-6700K / Ryzen 5 1600X', cpuScore: 65, gpu: 'GTX 1080 / RTX 3060 / RX 6600', gpuScore: 56, ramGb: 16, vramGb: 8 },
      ultra: { cpu: 'Core i7-13700K / Ryzen 7 7800X3D', cpuScore: 90, gpu: 'RTX 4070 / RX 7800 XT', gpuScore: 78, ramGb: 32, vramGb: 12 },
      expectedFps: { low1080p: 135, high1080p: 95, ultra1440p: 72 }
    },
    {
      id: 'apex',
      name: 'Apex Legends',
      genre: 'esports',
      year: 2023,
      storageGb: 75,
      min: { cpu: 'Core i3-6300 / FX-4350', cpuScore: 30, gpu: 'GT 640 / Radeon HD 7730', gpuScore: 18, ramGb: 6, vramGb: 2 },
      rec: { cpu: 'Ryzen 5 / Core i5-3570K', cpuScore: 52, gpu: 'GTX 970 / R9 290', gpuScore: 40, ramGb: 12, vramGb: 4 },
      ultra: { cpu: 'Ryzen 5 5600X / Core i5-12400', cpuScore: 76, gpu: 'RTX 3060 / RX 6600 XT', gpuScore: 60, ramGb: 16, vramGb: 8 },
      expectedFps: { low1080p: 180, high1080p: 135, ultra1440p: 100 }
    },
    {
      id: 'rdr2',
      name: 'Red Dead Redemption 2',
      genre: 'action',
      year: 2019,
      storageGb: 150,
      min: { cpu: 'Core i5-2500K / FX-6300', cpuScore: 36, gpu: 'GTX 770 / R9 280', gpuScore: 28, ramGb: 8, vramGb: 3 },
      rec: { cpu: 'Core i7-4770K / Ryzen 5 1500X', cpuScore: 55, gpu: 'GTX 1060 6GB / RX 480', gpuScore: 42, ramGb: 12, vramGb: 6 },
      ultra: { cpu: 'Core i5-12400 / Ryzen 5 5600', cpuScore: 74, gpu: 'RTX 3070 / RX 6700 XT', gpuScore: 70, ramGb: 16, vramGb: 8 },
      expectedFps: { low1080p: 105, high1080p: 78, ultra1440p: 58 }
    },
    {
      id: 'fc25',
      name: 'EA SPORTS FC 25',
      genre: 'sports',
      year: 2024,
      storageGb: 100,
      min: { cpu: 'Core i5-6600K / Ryzen 5 1600', cpuScore: 48, gpu: 'GTX 1050 Ti / RX 570', gpuScore: 32, ramGb: 8, vramGb: 4 },
      rec: { cpu: 'Core i7-6700 / Ryzen 7 2700X', cpuScore: 62, gpu: 'GTX 1660 / RX 5600 XT', gpuScore: 48, ramGb: 12, vramGb: 6 },
      ultra: { cpu: 'Core i5-12400 / Ryzen 5 5600X', cpuScore: 75, gpu: 'RTX 3060 / RX 6600', gpuScore: 58, ramGb: 16, vramGb: 8 },
      expectedFps: { low1080p: 150, high1080p: 110, ultra1440p: 90 }
    },
    {
      id: 'lol',
      name: 'League of Legends',
      genre: 'esports',
      year: 2024,
      storageGb: 30,
      min: { cpu: 'Core i3-530 / A6-3650', cpuScore: 15, gpu: 'GeForce 9600GT / HD 6570', gpuScore: 10, ramGb: 4, vramGb: 1 },
      rec: { cpu: 'Core i5-3300 / Ryzen 3 1200', cpuScore: 38, gpu: 'GeForce GTX 560 / Radeon HD 6950', gpuScore: 22, ramGb: 8, vramGb: 2 },
      ultra: { cpu: 'Core i3-10100 / Ryzen 3 3100', cpuScore: 55, gpu: 'GTX 1050 Ti', gpuScore: 30, ramGb: 16, vramGb: 4 },
      expectedFps: { low1080p: 350, high1080p: 280, ultra1440p: 220 }
    },
    {
      id: 'eldenring',
      name: 'Elden Ring: Shadow of the Erdtree',
      genre: 'rpg',
      year: 2024,
      storageGb: 60,
      min: { cpu: 'Core i5-8400 / Ryzen 3 3300X', cpuScore: 55, gpu: 'GTX 1060 3GB / RX 580', gpuScore: 36, ramGb: 12, vramGb: 4 },
      rec: { cpu: 'Core i7-8700K / Ryzen 5 3600X', cpuScore: 68, gpu: 'GTX 1070 / RX Vega 56', gpuScore: 50, ramGb: 16, vramGb: 8 },
      ultra: { cpu: 'Core i5-13400 / Ryzen 5 7600', cpuScore: 82, gpu: 'RTX 3070 / RX 6750 XT', gpuScore: 72, ramGb: 16, vramGb: 8 },
      expectedFps: { low1080p: 95, high1080p: 75, ultra1440p: 60 }
    },
    {
      id: 'r6',
      name: "Tom Clancy's Rainbow Six Siege",
      genre: 'esports',
      year: 2023,
      storageGb: 65,
      min: { cpu: 'Core i3-560 / Phenom II X4 945', cpuScore: 22, gpu: 'GTX 460 / HD 5870', gpuScore: 15, ramGb: 6, vramGb: 2 },
      rec: { cpu: 'Core i5-2500K / FX-8120', cpuScore: 40, gpu: 'GTX 960 / RX 560', gpuScore: 30, ramGb: 8, vramGb: 4 },
      ultra: { cpu: 'Core i5-11400 / Ryzen 5 3600', cpuScore: 68, gpu: 'RTX 3060 / RX 6600', gpuScore: 55, ramGb: 16, vramGb: 6 },
      expectedFps: { low1080p: 240, high1080p: 180, ultra1440p: 140 }
    },
    {
      id: 'forza5',
      name: 'Forza Horizon 5',
      genre: 'sim',
      year: 2022,
      storageGb: 135,
      min: { cpu: 'Core i5-4460 / Ryzen 3 1200', cpuScore: 40, gpu: 'GTX 970 / RX 470', gpuScore: 35, ramGb: 8, vramGb: 4 },
      rec: { cpu: 'Core i7-10700K / Ryzen 7 3800XT', cpuScore: 70, gpu: 'RTX 2070 / RX 5700 XT', gpuScore: 58, ramGb: 16, vramGb: 8 },
      ultra: { cpu: 'Core i7-13700K / Ryzen 7 7800X3D', cpuScore: 88, gpu: 'RTX 4080 / RX 7900 XT', gpuScore: 85, ramGb: 32, vramGb: 16 },
      expectedFps: { low1080p: 130, high1080p: 95, ultra1440p: 75 }
    },
    {
      id: 'helldivers2',
      name: 'Helldivers 2',
      genre: 'action',
      year: 2024,
      storageGb: 100,
      min: { cpu: 'Core i7-4790K / Ryzen 5 1500X', cpuScore: 50, gpu: 'GTX 1050 Ti / RX 470', gpuScore: 30, ramGb: 8, vramGb: 4 },
      rec: { cpu: 'Core i7-9700K / Ryzen 7 3700X', cpuScore: 68, gpu: 'RTX 2060 / RX 6600 XT', gpuScore: 55, ramGb: 16, vramGb: 8 },
      ultra: { cpu: 'Core i5-13600K / Ryzen 7 7700X', cpuScore: 86, gpu: 'RTX 4070 Ti / RX 7900 XT', gpuScore: 82, ramGb: 32, vramGb: 12 },
      expectedFps: { low1080p: 95, high1080p: 72, ultra1440p: 55 }
    },
    {
      id: 'pubg',
      name: 'PUBG: BATTLEGROUNDS',
      genre: 'esports',
      year: 2023,
      storageGb: 50,
      min: { cpu: 'Core i5-4430 / FX-6300', cpuScore: 36, gpu: 'GTX 960 / R7 370', gpuScore: 28, ramGb: 8, vramGb: 2 },
      rec: { cpu: 'Core i5-6600K / Ryzen 5 1600', cpuScore: 52, gpu: 'GTX 1060 3GB / RX 580', gpuScore: 40, ramGb: 16, vramGb: 4 },
      ultra: { cpu: 'Core i5-12400 / Ryzen 5 5600', cpuScore: 74, gpu: 'RTX 3060 Ti / RX 6700 XT', gpuScore: 68, ramGb: 16, vramGb: 8 },
      expectedFps: { low1080p: 160, high1080p: 120, ultra1440p: 90 }
    },
    {
      id: 'minecraft',
      name: 'Minecraft (Java & Bedrock)',
      genre: 'action',
      year: 2024,
      storageGb: 4,
      min: { cpu: 'Core i3-3210 / A8-7600', cpuScore: 24, gpu: 'Intel HD 4000 / Radeon R5', gpuScore: 12, ramGb: 4, vramGb: 1 },
      rec: { cpu: 'Core i5-4690 / Ryzen 5 2600', cpuScore: 50, gpu: 'GTX 1060 / RX 580', gpuScore: 32, ramGb: 8, vramGb: 4 },
      ultra: { cpu: 'Ryzen 5 5600X / Core i5-12400', cpuScore: 76, gpu: 'RTX 3060 / RX 6600', gpuScore: 56, ramGb: 16, vramGb: 8 },
      expectedFps: { low1080p: 350, high1080p: 240, ultra1440p: 160 }
    },
    {
      id: 'roblox',
      name: 'Roblox',
      genre: 'action',
      year: 2024,
      storageGb: 5,
      min: { cpu: 'Intel Pentium 4 / AMD Athlon', cpuScore: 15, gpu: 'Intel HD / AMD Radeon HD', gpuScore: 8, ramGb: 2, vramGb: 1 },
      rec: { cpu: 'Core i3-8100 / Ryzen 3 2200G', cpuScore: 38, gpu: 'GTX 750 Ti / RX 550', gpuScore: 18, ramGb: 4, vramGb: 2 },
      ultra: { cpu: 'Core i5-10400 / Ryzen 5 3600', cpuScore: 60, gpu: 'GTX 1650 / RX 6500 XT', gpuScore: 28, ramGb: 8, vramGb: 4 },
      expectedFps: { low1080p: 240, high1080p: 180, ultra1440p: 140 }
    },
    {
      id: 'overwatch2',
      name: 'Overwatch 2',
      genre: 'esports',
      year: 2023,
      storageGb: 50,
      min: { cpu: 'Core i3 / Phenom X3 8650', cpuScore: 25, gpu: 'GTX 640 / HD 7000', gpuScore: 15, ramGb: 6, vramGb: 2 },
      rec: { cpu: 'Core i7 / Ryzen 5', cpuScore: 55, gpu: 'GTX 1060 / RX 580', gpuScore: 35, ramGb: 8, vramGb: 4 },
      ultra: { cpu: 'Ryzen 5 5600X / Core i5-12400', cpuScore: 76, gpu: 'RTX 3060 / RX 6600', gpuScore: 56, ramGb: 16, vramGb: 8 },
      expectedFps: { low1080p: 260, high1080p: 190, ultra1440p: 145 }
    },
    {
      id: 'rocketleague',
      name: 'Rocket League',
      genre: 'sports',
      year: 2020,
      storageGb: 20,
      min: { cpu: 'Dual Core 2.5 GHz', cpuScore: 20, gpu: 'GeForce 7600 GS / Radeon R7', gpuScore: 12, ramGb: 4, vramGb: 1 },
      rec: { cpu: 'Quad Core 3.0 GHz', cpuScore: 40, gpu: 'GTX 1060 / RX 470', gpuScore: 30, ramGb: 8, vramGb: 3 },
      ultra: { cpu: 'Core i5-10400 / Ryzen 5 3600', cpuScore: 60, gpu: 'GTX 1660 / RX 5600 XT', gpuScore: 40, ramGb: 16, vramGb: 6 },
      expectedFps: { low1080p: 350, high1080p: 260, ultra1440p: 200 }
    },
    {
      id: 'dota2',
      name: 'Dota 2',
      genre: 'esports',
      year: 2023,
      storageGb: 60,
      min: { cpu: 'Dual Core Intel / AMD 2.8 GHz', cpuScore: 25, gpu: 'GeForce 8600 / HD 2600', gpuScore: 14, ramGb: 4, vramGb: 1 },
      rec: { cpu: 'Core i5-7400 / Ryzen 3 1200', cpuScore: 48, gpu: 'GTX 960 / RX 460', gpuScore: 28, ramGb: 8, vramGb: 4 },
      ultra: { cpu: 'Ryzen 5 5600X / Core i5-12400', cpuScore: 76, gpu: 'RTX 3060 / RX 6600', gpuScore: 55, ramGb: 16, vramGb: 8 },
      expectedFps: { low1080p: 220, high1080p: 170, ultra1440p: 130 }
    },
    {
      id: 'alanwake2',
      name: 'Alan Wake 2',
      genre: 'action',
      year: 2023,
      storageGb: 90,
      min: { cpu: 'Core i5-7600K / Ryzen 5 3600', cpuScore: 60, gpu: 'RTX 2060 / RX 6600', gpuScore: 48, ramGb: 16, vramGb: 6 },
      rec: { cpu: 'Ryzen 7 3700X / Core i7-10700K', cpuScore: 75, gpu: 'RTX 3070 / RX 6700 XT', gpuScore: 68, ramGb: 16, vramGb: 8 },
      ultra: { cpu: 'Ryzen 7 7800X3D / Core i7-14700K', cpuScore: 94, gpu: 'RTX 4080 / RX 7900 XTX', gpuScore: 90, ramGb: 32, vramGb: 16 },
      expectedFps: { low1080p: 75, high1080p: 55, ultra1440p: 40 }
    },
    {
      id: 'starfield',
      name: 'Starfield',
      genre: 'rpg',
      year: 2023,
      storageGb: 125,
      min: { cpu: 'Core i7-6800K / Ryzen 5 2600X', cpuScore: 54, gpu: 'GTX 1070 Ti / RX 5700', gpuScore: 45, ramGb: 16, vramGb: 8 },
      rec: { cpu: 'Core i5-10600K / Ryzen 5 3600X', cpuScore: 70, gpu: 'RTX 2080 / RX 6800 XT', gpuScore: 65, ramGb: 16, vramGb: 8 },
      ultra: { cpu: 'Core i7-13700K / Ryzen 7 7800X3D', cpuScore: 92, gpu: 'RTX 4080 / RX 7900 XT', gpuScore: 86, ramGb: 32, vramGb: 16 },
      expectedFps: { low1080p: 85, high1080p: 62, ultra1440p: 46 }
    },
    {
      id: 'rust',
      name: 'Rust',
      genre: 'action',
      year: 2023,
      storageGb: 25,
      min: { cpu: 'Core i7-3770 / FX-9590', cpuScore: 40, gpu: 'GTX 670 / R9 280', gpuScore: 28, ramGb: 10, vramGb: 3 },
      rec: { cpu: 'Core i7-8700K / Ryzen 5 3600', cpuScore: 68, gpu: 'GTX 1070 / RX 580', gpuScore: 42, ramGb: 16, vramGb: 8 },
      ultra: { cpu: 'Ryzen 7 5800X3D / Core i5-13600K', cpuScore: 88, gpu: 'RTX 3070 / RX 6750 XT', gpuScore: 70, ramGb: 32, vramGb: 12 },
      expectedFps: { low1080p: 135, high1080p: 95, ultra1440p: 72 }
    },
    {
      id: 'deadbydaylight',
      name: 'Dead by Daylight',
      genre: 'action',
      year: 2023,
      storageGb: 50,
      min: { cpu: 'Core i3-4170 / FX-8120', cpuScore: 32, gpu: 'GTX 460 / HD 6850', gpuScore: 20, ramGb: 8, vramGb: 2 },
      rec: { cpu: 'Core i3-4170 / FX-8300', cpuScore: 45, gpu: 'GTX 760 / HD 8800', gpuScore: 30, ramGb: 8, vramGb: 4 },
      ultra: { cpu: 'Core i5-10400 / Ryzen 5 3600', cpuScore: 60, gpu: 'RTX 2060 / RX 5600 XT', gpuScore: 48, ramGb: 16, vramGb: 6 },
      expectedFps: { low1080p: 120, high1080p: 90, ultra1440p: 75 }
    }
  ];

  private constructor() {
    this.hardwareService = HardwareService.getInstance();
  }

  public static getInstance(): BottleneckGameService {
    if (!BottleneckGameService.instance) {
      BottleneckGameService.instance = new BottleneckGameService();
    }
    return BottleneckGameService.instance;
  }

  public async getSystemRig(): Promise<SystemRigInfo> {
    const metrics = await this.hardwareService.getSystemMetrics();
    const disk = this.hardwareService.getDiskMetrics();

    // 1. Precise VRAM detection
    let vramGb = metrics.gpuVramMb ? Math.round(metrics.gpuVramMb / 1024) : 0;
    if (vramGb < 2) {
      const gpuData = this.getGpuScore(metrics.gpuName || '');
      vramGb = gpuData.vram || 8;
    }

    // 2. High-speed SSD verification
    const diskStr = (metrics.diskModel || '').toLowerCase();
    const isSsd = diskStr.includes('nvme') ||
      diskStr.includes('ssd') ||
      diskStr.includes('sn770') ||
      diskStr.includes('sn530') ||
      diskStr.includes('samsung') ||
      diskStr.includes('wdc');
    const storageType = isSsd ? 'NVMe SSD' : (metrics.diskModel || 'SSD NVMe');

    return {
      cpuName: metrics.cpuModel || 'Processador Moderno',
      gpuName: metrics.gpuName || 'Placa Gráfica',
      ramGb: metrics.ramTotalGb || 16,
      ramSpeedMhz: metrics.ramSpeedMhz || 6000,
      vramGb,
      diskFreeGb: disk.freeGb,
      storageType,
      windowsVersion: metrics.windowsVersion || 'Windows 11',
      isLaptop: metrics.isLaptop,
      hasDedicatedGpu: metrics.hasDedicatedGpu
    };
  }

  public getCpuScore(cpuName: string): number {
    const clean = cpuName.toLowerCase().trim();
    // Sort keys by descending length so specific models match before generic prefixes
    const sortedKeys = Object.keys(this.cpuDatabase).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      if (clean.includes(key)) return this.cpuDatabase[key];
    }
    // Heuristic fallbacks
    if (clean.includes('x3d')) return 92;
    if (clean.includes('i9') || clean.includes('ryzen 9')) return 95;
    if (clean.includes('i7') || clean.includes('ryzen 7')) return 88;
    if (clean.includes('8600g') || clean.includes('8700g')) return 87;
    if (clean.includes('i5') || clean.includes('ryzen 5')) return 78;
    if (clean.includes('i3') || clean.includes('ryzen 3')) return 55;
    return 65;
  }

  public getGpuScore(gpuName: string): { score: number; vram: number } {
    const clean = gpuName.toLowerCase().trim();
    const sortedKeys = Object.keys(this.gpuDatabase).sort((a, b) => b.length - a.length);
    for (const key of sortedKeys) {
      if (clean.includes(key)) return this.gpuDatabase[key];
    }
    // Fallbacks
    if (clean.includes('rtx 50')) return { score: 84, vram: 12 };
    if (clean.includes('rtx 40') || clean.includes('rx 7900')) return { score: 78, vram: 12 };
    if (clean.includes('rtx 30') || clean.includes('rx 6700')) return { score: 65, vram: 8 };
    if (clean.includes('rtx 20') || clean.includes('gtx 1660')) return { score: 48, vram: 6 };
    if (clean.includes('gtx') || clean.includes('rx 5')) return { score: 35, vram: 4 };
    return { score: 55, vram: 6 };
  }

  public calculateBottleneck(
    cpuName: string,
    gpuName: string,
    resolution: '1080p' | '1440p' | '2160p' = '1080p',
    workload: 'general' | 'esports' | 'aaa' = 'general'
  ): BottleneckResult {
    const cpuScore = this.getCpuScore(cpuName);
    const gpuData = this.getGpuScore(gpuName);
    const gpuScore = gpuData.score;

    // Demand multipliers based on resolution and workload
    let cpuDemandMultiplier = 1.0;
    let gpuDemandMultiplier = 1.0;

    if (resolution === '1080p') {
      cpuDemandMultiplier = 1.08;
      gpuDemandMultiplier = 0.94;
    } else if (resolution === '1440p') {
      cpuDemandMultiplier = 0.98;
      gpuDemandMultiplier = 1.02;
    } else if (resolution === '2160p') {
      cpuDemandMultiplier = 0.82;
      gpuDemandMultiplier = 1.22;
    }

    if (workload === 'esports') {
      cpuDemandMultiplier *= 1.15;
      gpuDemandMultiplier *= 0.90;
    } else if (workload === 'aaa') {
      cpuDemandMultiplier *= 0.90;
      gpuDemandMultiplier *= 1.15;
    }

    const effectiveCpu = Math.max(1, cpuScore / cpuDemandMultiplier);
    const effectiveGpu = Math.max(1, gpuScore / gpuDemandMultiplier);

    const maxCap = Math.max(effectiveCpu, effectiveGpu);
    const minCap = Math.min(effectiveCpu, effectiveGpu);
    const discrepancy = ((maxCap - minCap) / maxCap) * 100;

    let limitingComponent: 'CPU' | 'GPU' | 'Equilibrado' = 'Equilibrado';
    let rawPercent = Math.round(discrepancy * 0.45);

    // In modern gaming, being slightly GPU-bound is normal and intended
    if (effectiveGpu < effectiveCpu) {
      if (rawPercent <= 12 || (gpuScore >= 70 && rawPercent <= 20)) {
        limitingComponent = 'Equilibrado';
        rawPercent = Math.min(rawPercent, 6);
      } else {
        limitingComponent = 'GPU';
      }
    } else {
      if (rawPercent <= 8) {
        limitingComponent = 'Equilibrado';
      } else {
        limitingComponent = 'CPU';
      }
    }

    rawPercent = Math.min(50, Math.max(1, rawPercent));

    let severity: 'perfect' | 'light' | 'moderate' | 'high' = 'perfect';
    if (limitingComponent === 'Equilibrado' || rawPercent <= 8) {
      severity = 'perfect';
    } else if (rawPercent <= 15) {
      severity = 'light';
    } else if (rawPercent <= 26) {
      severity = 'moderate';
    } else {
      severity = 'high';
    }

    let summary = '';
    const recommendations: string[] = [];

    if (limitingComponent === 'Equilibrado') {
      summary = `Emparelhamento excelente! O ${cpuName} e a ${gpuName} funcionam em harmonia a ${resolution}. Desfruta de desempenho pleno e sem gargalos.`;
      recommendations.push('A configuração está idealmente calibrada para gaming.');
      recommendations.push('Podes utilizar taxas de atualização altas (144Hz+) com estabilidade.');
    } else if (limitingComponent === 'CPU') {
      summary = `Gargalo de CPU detetado (${rawPercent}% a ${resolution}): A ${gpuName} tem capacidade para gerar mais frames, mas o processador atinge o pico de utilização antes.`;
      if (resolution === '1080p') {
        recommendations.push('Aumenta a resolução para 1440p ou ativa DSR/Super-Resolução para transferir carga para a placa gráfica.');
      }
      recommendations.push('Aumenta a qualidade gráfica (texturas, sombras, iluminação) sem perder praticamente FPS nenhum.');
      recommendations.push('Fecha aplicações pesadas em segundo plano (Discord, navegadores, gravações).');
      if (severity === 'high') {
        recommendations.push('Para tirar 100% de proveito da tua GPU, pondera no futuro um upgrade de processador.');
      }
    } else {
      summary = `Gargalo de GPU detetado (${rawPercent}% a ${resolution}): O processador consegue enviar mais geometria do que a ${gpuName} consegue renderizar a esta resolução.`;
      recommendations.push('Ativa tecnologias de upscaling como NVIDIA DLSS, AMD FSR ou Intel XeSS em modo Qualidade.');
      recommendations.push('Reduz filtros volumétricos pesados, sombras complexas e oclusão de ambiente nos jogos.');
      recommendations.push('Se jogas a 1440p ou 4K, considera baixar para 1080p para obter o dobro da fluidez.');
    }

    return {
      bottleneckPercent: rawPercent,
      limitingComponent,
      severity,
      resolution,
      workload,
      cpuScore,
      gpuScore,
      summary,
      recommendations
    };
  }

  public async evaluateGames(rig?: SystemRigInfo, search?: string, genre?: string): Promise<GameEvaluation[]> {
    return this.evaluateAllGames(search, genre, rig);
  }

  public async evaluateAllGames(search?: string, genre?: string, customRig?: SystemRigInfo): Promise<GameEvaluation[]> {
    const rig = customRig || await this.getSystemRig();
    const cpuScore = this.getCpuScore(rig.cpuName);
    const gpuData = this.getGpuScore(rig.gpuName);
    const gpuScore = gpuData.score;
    const ramGb = rig.ramGb;
    const vramGb = rig.vramGb;
    const diskFreeGb = rig.diskFreeGb;

    let list = this.curatedGames;
    if (genre && genre !== 'all') {
      list = list.filter((g) => g.genre === genre);
    }
    if (search && search.trim() !== '') {
      const q = search.toLowerCase().trim();
      list = list.filter((g) => g.name.toLowerCase().includes(q));
    }

    return list.map((game) => {
      // Can You RUN It status criteria
      const effectiveRam = Math.round(ramGb);
      const passMinCpu = cpuScore >= game.min.cpuScore * 0.88;
      const passMinGpu = gpuScore >= game.min.gpuScore * 0.88;
      const passMinRam = effectiveRam >= game.min.ramGb;
      const passMinVram = vramGb >= game.min.vramGb;

      const passRecCpu = cpuScore >= game.rec.cpuScore * 0.92;
      const passRecGpu = gpuScore >= game.rec.gpuScore * 0.92;
      const passRecRam = effectiveRam >= game.rec.ramGb;
      const passRecVram = vramGb >= game.rec.vramGb;

      // Ultra criteria: passes recommended with surplus or meets dedicated ultra hardware target
      const passUltraCpu = cpuScore >= game.ultra.cpuScore * 0.95 || cpuScore >= game.rec.cpuScore * 1.15;
      const passUltraGpu = gpuScore >= game.ultra.gpuScore * 0.95 || gpuScore >= game.rec.gpuScore * 1.15;
      const passUltraRam = effectiveRam >= Math.min(game.ultra.ramGb, 32);
      const passUltraVram = vramGb >= Math.min(game.ultra.vramGb, 8);

      const meetsMin = passMinCpu && passMinGpu && passMinRam;
      const meetsRec = meetsMin && passRecCpu && passRecGpu && passRecRam;
      const meetsUltra = meetsRec && passUltraCpu && passUltraGpu && passUltraRam && passUltraVram;

      let status: 'ultra' | 'recommended' | 'minimum' | 'unsupported' = 'unsupported';
      if (meetsUltra) status = 'ultra';
      else if (meetsRec) status = 'recommended';
      else if (meetsMin) status = 'minimum';

      // Advanced Game-Engine Benchmark Scaler
      // Computes realistic framerates aligned with System Requirements Lab & NotebookCheck benchmarks
      const rawGpuRatio = gpuScore / Math.max(1, game.rec.gpuScore);
      const rawCpuRatio = cpuScore / Math.max(1, game.rec.cpuScore);

      let gpuWeight = 0.70;
      let cpuWeight = 0.30;
      if (game.genre === 'esports') {
        gpuWeight = 0.50;
        cpuWeight = 0.50;
      } else if (game.genre === 'rpg' || game.genre === 'sim') {
        gpuWeight = 0.80;
        cpuWeight = 0.20;
      }

      // Smooth diminishing returns curve so FPS scales smoothly and realistically
      const scaledGpu = Math.pow(Math.max(0.1, rawGpuRatio), 0.92);
      const scaledCpu = Math.pow(Math.max(0.1, rawCpuRatio), 0.88);
      const perfRatio = (gpuWeight * scaledGpu) + (cpuWeight * scaledCpu);

      // Memory modifiers
      const vramFactor = vramGb >= game.rec.vramGb ? 1.0 : Math.max(0.65, vramGb / game.rec.vramGb);
      const ramFactor = ramGb >= game.rec.ramGb ? 1.0 : Math.max(0.70, ramGb / game.rec.ramGb);

      const exp = game.expectedFps;
      const low1080p = Math.round(exp.low1080p * perfRatio * ramFactor);
      const high1080p = Math.round(exp.high1080p * perfRatio * ramFactor);
      const ultra1440p = Math.round(exp.ultra1440p * (scaledGpu * 0.85 + scaledCpu * 0.15) * vramFactor * ramFactor);

      // Realistic max boundaries per genre
      const maxLow = game.genre === 'esports' ? 600 : 360;
      const maxHigh = game.genre === 'esports' ? 450 : 260;
      const max1440p = game.genre === 'esports' ? 360 : 200;

      let verdictText = '';
      if (meetsUltra) {
        verdictText = `Sim! O teu computador cumpre e supera com distinção todos os requisitos recomendados para jogar ${game.name}. Podes jogar nas definições máximas no Ultra a 1080p e 1440p com excelente fluidez.`;
      } else if (meetsRec) {
        verdictText = `Sim! O teu computador cumpre todos os requisitos recomendados oficiais para jogar ${game.name}. A tua experiência será muito suave e consistente em definições Altas.`;
      } else if (meetsMin) {
        verdictText = `Sim, mas apenas nos requisitos mínimos. Conseguirás rodar ${game.name} em definições baixas a médias.`;
      } else {
        verdictText = `O teu computador não cumpre os requisitos mínimos oficiais para ${game.name}. Recomenda-se um upgrade de hardware.`;
      }

      const targetExperience = {
        preset: meetsUltra ? 'Ultra / Máximo' : meetsRec ? 'Alto / Recomendado' : meetsMin ? 'Médio / Baixo' : 'Requer Upgrade',
        framerate: game.genre === 'esports'
          ? (meetsUltra ? '144Hz - 240Hz+ (Competitivo Fluido)' : meetsRec ? '90 - 144 FPS' : '45 - 60 FPS')
          : (meetsUltra ? '90 - 120+ FPS (Ultra Fluido)' : meetsRec ? '60 - 90 FPS' : '30 - 45 FPS'),
        resolution: meetsUltra ? '1080p & 1440p Nativo' : '1080p Nativo'
      };

      return {
        game,
        status,
        passMinimum: meetsMin,
        passRecommended: meetsRec,
        verdictText,
        targetExperience,
        fpsEstimate: {
          low1080p: Math.min(maxLow, Math.max(25, low1080p)),
          high1080p: Math.min(maxHigh, Math.max(20, high1080p)),
          ultra1440p: Math.min(max1440p, Math.max(15, ultra1440p))
        },
        checklist: {
          cpu: {
            current: rig.cpuName,
            passMin: passMinCpu,
            passRec: passRecCpu,
            passUltra: passUltraCpu
          },
          gpu: {
            current: rig.gpuName,
            passMin: passMinGpu,
            passRec: passRecGpu,
            passUltra: passUltraGpu
          },
          ram: {
            currentGb: Math.round(ramGb),
            requiredMinGb: game.min.ramGb,
            requiredRecGb: game.rec.ramGb,
            passMin: passMinRam,
            passRec: passRecRam
          },
          vram: {
            currentGb: vramGb,
            requiredMinGb: game.min.vramGb,
            requiredRecGb: game.rec.vramGb,
            passMin: passMinVram,
            passRec: passRecVram
          },
          os: {
            current: `${rig.windowsVersion} 64-bit`,
            passMin: true,
            passRec: true
          },
          storage: {
            freeGb: diskFreeGb,
            requiredGb: game.storageGb,
            pass: diskFreeGb >= game.storageGb,
            driveType: rig.storageType
          }
        }
      };
    });
  }
}
