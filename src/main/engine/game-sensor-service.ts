import fs from 'fs';
import path from 'path';
import os from 'os';

export interface DetectedGame {
  id: string;
  name: string;
  category: string;
  platform: 'Steam' | 'Epic Games' | 'Riot Games' | 'EA Desktop' | 'Ubisoft' | 'GOG Galaxy' | 'Xbox / Microsoft' | 'Personalizado' | 'Windows';
  coverImage: string;
  processNames: string[];
  installDir?: string;
  executablePath?: string;
  recommendedOptimizations: string[];
  description: string;
  isRunning?: boolean;
  isCustom?: boolean;
}

// Database of popular titles with rich art, categories and process names
const KNOWN_GAME_METADATA: Record<string, {
  category: string;
  coverImage?: string;
  processNames: string[];
  optimizations: string[];
  description: string;
}> = {
  'counter-strike 2': {
    category: 'Competitivo FPS',
    coverImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/730/library_600x900_2x.jpg',
    processNames: ['cs2.exe'],
    optimizations: ['input_timer_resolution', 'input_pointer_speed', 'net_disable_nagling', 'clean_directx_shader_cache'],
    description: 'Sub-tick optimization, limpeza prévia de shaders DirectX e TCP/UDP NoDelay para hit registration ideal.'
  },
  'valorant': {
    category: 'Competitivo FPS',
    coverImage: 'https://media.rawg.io/media/games/618/618c2031a07bbff6b4f611f10f6bcdbc.jpg',
    processNames: ['VALORANT-Win64-Shipping.exe'],
    optimizations: ['input_timer_resolution', 'input_mouse_accel', 'net_tcp_autotuning', 'cpu_priority_high', 'game_mode'],
    description: 'Prioridade em timer resolution 0.5ms, raw mouse input e mitigação de bufferbloat UDP.'
  },
  'fortnite': {
    category: 'Battle Royale',
    coverImage: 'https://media.rawg.io/media/games/d82/d82990b0c67bf0d2d0f76d6e1824b694.jpg',
    processNames: ['FortniteClient-Win64-Shipping.exe'],
    optimizations: ['input_windowed_optimizations', 'clean_gpu_shader_cache', 'input_gpu_preference', 'net_rss'],
    description: 'Compilação suave de shaders DX12, ativação de VRR/FSO e afinidade de threads de CPU.'
  },
  'rocket league': {
    category: 'Esports Desporto',
    coverImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/252950/library_600x900_2x.jpg',
    processNames: ['RocketLeague.exe'],
    optimizations: ['input_mouse_accel', 'input_timer_resolution', 'net_prefer_ethernet_metric'],
    description: 'Física a 120Hz/240Hz sem desfasamento de input de comando ou teclado.'
  },
  'black myth: wukong': {
    category: 'Action RPG',
    coverImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2358720/library_600x900_2x.jpg',
    processNames: ['b1-Win64-Shipping.exe'],
    optimizations: ['clean_gpu_shader_cache', 'input_power_plan', 'input_gpu_preference', 'ui_visual_effects_perf'],
    description: 'Otimização para Unreal Engine 5 Nanite/Lumen, limpeza profunda de cache de compilação de shaders e prioridade de GPU.'
  },
  'red dead redemption 2': {
    category: 'Open World RPG',
    coverImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1174180/library_600x900_2x.jpg',
    processNames: ['RDR2.exe'],
    optimizations: ['clean_directx_shader_cache', 'input_gpu_preference', 'srv_disable_restart_apps'],
    description: 'Otimização da pipeline Vulkan/DX12, estabilização de frametimes e alívio de memória de sistema.'
  },
  'grand theft auto v': {
    category: 'Open World / Ação',
    coverImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/271590/library_600x900_2x.jpg',
    processNames: ['GTA5.exe', 'PlayGTAV.exe'],
    optimizations: ['clean_directx_shader_cache', 'input_gpu_preference', 'net_tcp_autotuning'],
    description: 'Carregamento de texturas mais rápido, alívio de stuttering e menor latência online no GTA Online/FiveM.'
  },
  'assetto corsa': {
    category: 'Simulação Automóvel',
    coverImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/244210/library_600x900_2x.jpg',
    processNames: ['acs.exe', 'AssettoCorsa.exe'],
    optimizations: ['input_timer_resolution', 'input_usb_selective_suspend', 'cpu_gpu_power_gaming'],
    description: 'Polling rate sem atraso para volantes FFB DirectDrive e máxima estabilidade de frametimes com mods pesados.'
  },
  'ea sports fc 24': {
    category: 'Futebol / Desporto',
    coverImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2195250/library_600x900_2x.jpg',
    processNames: ['FC24.exe'],
    optimizations: ['input_windowed_optimizations', 'input_mouse_accel', 'net_tcp_autotuning'],
    description: 'Redução de input delay em comandos analógicos e mitigação de jitter em partidas online.'
  },
  'ea sports fc 25': {
    category: 'Futebol / Desporto',
    coverImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2195250/library_600x900_2x.jpg',
    processNames: ['FC25.exe'],
    optimizations: ['input_windowed_optimizations', 'input_mouse_accel', 'net_tcp_autotuning'],
    description: 'Redução de input delay em comandos analógicos e mitigação de jitter em partidas online.'
  },
  'ea sports fc 26': {
    category: 'Futebol / Desporto',
    coverImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2195250/library_600x900_2x.jpg',
    processNames: ['FC26.exe'],
    optimizations: ['input_windowed_optimizations', 'input_mouse_accel', 'net_tcp_autotuning'],
    description: 'Redução de input delay em comandos analógicos e mitigação de jitter em partidas online.'
  },
  'sifu': {
    category: 'Artes Marciais',
    coverImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2138710/library_600x900_2x.jpg',
    processNames: ['Sifu-Win64-Shipping.exe'],
    optimizations: ['input_timer_resolution', 'input_windowed_optimizations'],
    description: 'Resposta de frames imediata para esquivas e parries sem latência de buffer de apresentação.'
  },
  'kartkraft': {
    category: 'Simulação Karting',
    coverImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/406350/library_600x900_2x.jpg',
    processNames: ['KartKraft-Win64-Shipping.exe', 'KartKraft.exe'],
    optimizations: ['input_usb_selective_suspend', 'input_gpu_preference', 'cpu_priority_high'],
    description: 'Prioridade em simulação de física de contacto de pneus com latência de direção instantânea.'
  },
  'dakar desert rally': {
    category: 'Rally / Todo-o-Terreno',
    coverImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1839940/library_600x900_2x.jpg',
    processNames: ['Dakar2-Win64-Shipping.exe'],
    optimizations: ['clean_gpu_shader_cache', 'input_power_plan'],
    description: 'Estabilização de streaming de cenários abertos desérticos e alívio de VRAM de placas gráficas.'
  },
  'roblox': {
    category: 'Sandbox / Comunidade',
    coverImage: 'https://media.rawg.io/media/games/53f/53f65f1109dc0d4f8fbda3e0a2977b75.jpg',
    processNames: ['RobloxPlayerBeta.exe', 'RobloxPlayer.exe'],
    optimizations: ['input_timer_resolution', 'net_tcp_autotuning'],
    description: 'Desbloqueio de taxa de atualização acima de 60 FPS e mitigação de atraso de sincronização de rede.'
  },
  'minecraft': {
    category: 'Sandbox / Sobrevivência',
    coverImage: 'https://media.rawg.io/media/games/cc4/cc40326388914b306b6eb8b14e0cc710.jpg',
    processNames: ['javaw.exe', 'Minecraft.exe', 'Minecraft.Gfx.Test.exe'],
    optimizations: ['cpu_priority_high', 'ram_clear_standby', 'input_mouse_accel'],
    description: 'Atribuição prioritária de RAM, JVM garbage collection suave e eliminação de stuttering ao carregar chunks.'
  },
  'league of legends': {
    category: 'MOBA Competitivo',
    coverImage: 'https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Aatrox_0.jpg',
    processNames: ['League of Legends.exe'],
    optimizations: ['input_timer_resolution', 'input_pointer_speed', 'net_disable_nagling'],
    description: 'Timer de kernel a 0.5ms e TCP NoDelay para tempo de resposta perfeito de cliques e habilidades.'
  },
  'apex legends': {
    category: 'Battle Royale FPS',
    coverImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1172470/library_600x900_2x.jpg',
    processNames: ['r5apex.exe'],
    optimizations: ['input_timer_resolution', 'clean_gpu_shader_cache', 'net_rss'],
    description: 'Optimização do motor Source, estabilização de FPS e resolução de timer para tracking suave.'
  },
  'cyberpunk 2077': {
    category: 'Sci-Fi RPG',
    coverImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1091500/library_600x900_2x.jpg',
    processNames: ['Cyberpunk2077.exe'],
    optimizations: ['clean_gpu_shader_cache', 'input_power_plan', 'input_gpu_preference'],
    description: 'Estabilização de Ray Tracing / Path Tracing, limpeza de shader cache e priorização de threads.'
  },
  'call of duty': {
    category: 'FPS Militar',
    coverImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1938090/library_600x900_2x.jpg',
    processNames: ['cod.exe', 'bootstrapper.exe'],
    optimizations: ['clean_directx_shader_cache', 'net_tcp_autotuning', 'input_timer_resolution'],
    description: 'Pré-carregamento de shaders sem travamentos e otimização UDP para Warzone e Multiplayer.'
  },
  'overwatch 2': {
    category: 'Hero Shooter',
    coverImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/2357570/library_600x900_2x.jpg',
    processNames: ['Overwatch.exe'],
    optimizations: ['input_timer_resolution', 'input_mouse_accel', 'input_gpu_preference'],
    description: 'NVIDIA Reflex / AMD Anti-Lag tuning, raw mouse input e mitigação de bufferbloat.'
  },
  'death stranding': {
    category: 'Aventura / Ação',
    coverImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1850570/library_600x900_2x.jpg',
    processNames: ['ds.exe'],
    optimizations: ['clean_directx_shader_cache', 'input_gpu_preference'],
    description: 'Motor Decima Engine tuning e máxima estabilidade de streaming de texturas ultra-altas.'
  },
  'among us': {
    category: 'Casual / Multijogador',
    coverImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/945360/library_600x900_2x.jpg',
    processNames: ['Among Us.exe'],
    optimizations: ['input_timer_resolution'],
    description: 'Sincronização imediata de rede e frametimes constantes.'
  },
  'marvel\'s guardians of the galaxy': {
    category: 'Ação / Aventura',
    coverImage: 'https://cdn.cloudflare.steamstatic.com/steam/apps/1088850/library_600x900_2x.jpg',
    processNames: ['GOTG.exe'],
    optimizations: ['clean_gpu_shader_cache', 'input_gpu_preference'],
    description: 'Compilação suave de shaders DX12 e priorização de GPU dedicada.'
  }
};

export class GameSensorService {
  private static instance: GameSensorService;
  private customGames: DetectedGame[] = [];
  private customGamesFile: string;

  private constructor() {
    const userProfile = os.homedir();
    const appData = process.env.APPDATA || path.join(userProfile, 'AppData', 'Roaming');
    const optimizerDir = path.join(appData, 'OptimizerPro');
    if (!fs.existsSync(optimizerDir)) {
      try { fs.mkdirSync(optimizerDir, { recursive: true }); } catch {}
    }
    this.customGamesFile = path.join(optimizerDir, 'custom-detected-games.json');
    this.loadCustomGames();
  }

  public static getInstance(): GameSensorService {
    if (!GameSensorService.instance) {
      GameSensorService.instance = new GameSensorService();
    }
    return GameSensorService.instance;
  }

  public getAllKnownProcessNames(): string[] {
    const set = new Set<string>();
    for (const item of Object.values(KNOWN_GAME_METADATA)) {
      for (const p of item.processNames) {
        set.add(p.toLowerCase());
      }
    }
    for (const item of this.customGames) {
      for (const p of item.processNames) {
        set.add(p.toLowerCase());
      }
    }
    return Array.from(set);
  }

  private loadCustomGames() {
    try {
      if (fs.existsSync(this.customGamesFile)) {
        this.customGames = JSON.parse(fs.readFileSync(this.customGamesFile, 'utf8'));
      }
    } catch {
      this.customGames = [];
    }
  }

  private saveCustomGames() {
    try {
      fs.writeFileSync(this.customGamesFile, JSON.stringify(this.customGames, null, 2), 'utf8');
    } catch (e) {
      console.error('Erro ao guardar jogos personalizados:', e);
    }
  }

  /**
   * Scans available Windows drive letters (C, D, E, F, etc.)
   */
  private getAvailableDrives(): string[] {
    const drives: string[] = [];
    ['C', 'D', 'E', 'F', 'G', 'H'].forEach((d) => {
      const root = `${d}:\\`;
      if (fs.existsSync(root)) {
        drives.push(root);
      }
    });
    return drives;
  }

  /**
   * 1. Sensor Steam: Scans all configured Steam libraries across all drives
   */
  private scanSteamGames(): DetectedGame[] {
    const games: DetectedGame[] = [];
    const drives = this.getAvailableDrives();

    // Potential steam install dirs
    const potentialSteamBases = [
      'C:\\Program Files (x86)\\Steam',
      'C:\\Program Files\\Steam'
    ];

    drives.forEach((d) => {
      potentialSteamBases.push(path.join(d, 'Steam'));
      potentialSteamBases.push(path.join(d, 'SteamLibrary'));
    });

    const steamLibraries: string[] = [];

    potentialSteamBases.forEach((base) => {
      const apps = path.join(base, 'steamapps');
      if (fs.existsSync(apps) && !steamLibraries.includes(apps)) {
        steamLibraries.push(apps);
      }

      // Check libraryfolders.vdf
      const vdf = path.join(base, 'steamapps', 'libraryfolders.vdf');
      if (fs.existsSync(vdf)) {
        try {
          const content = fs.readFileSync(vdf, 'utf8');
          const matches = content.matchAll(/"path"\s+"([^"]+)"/g);
          for (const m of matches) {
            const rawPath = m[1].replace(/\\\\/g, '\\');
            const libApps = path.join(rawPath, 'steamapps');
            if (fs.existsSync(libApps) && !steamLibraries.includes(libApps)) {
              steamLibraries.push(libApps);
            }
          }
        } catch {}
      }
    });

    // Read all appmanifest files in discovered libraries
    steamLibraries.forEach((lib) => {
      try {
        const files = fs.readdirSync(lib);
        files.forEach((f) => {
          if (f.startsWith('appmanifest_') && f.endsWith('.acf')) {
            try {
              const txt = fs.readFileSync(path.join(lib, f), 'utf8');
              const nameMatch = txt.match(/"name"\s+"([^"]+)"/i);
              const appidMatch = txt.match(/"appid"\s+"([^"]+)"/i);
              const dirMatch = txt.match(/"installdir"\s+"([^"]+)"/i);

              if (nameMatch && nameMatch[1]) {
                const rawName = nameMatch[1].trim();
                const appId = appidMatch ? appidMatch[1].trim() : '';

                // Filter out non-games / runtime tools
                if (
                  rawName.startsWith('Steamworks') ||
                  rawName.startsWith('Proton') ||
                  rawName.startsWith('Steam Linux') ||
                  rawName.includes('Dedicated Server') ||
                  rawName.includes('Soundtrack')
                ) {
                  return;
                }

                const installDir = dirMatch ? path.join(lib, 'common', dirMatch[1]) : undefined;

                // Match with known metadata or generate
                const matched = this.matchKnownGame(rawName);
                const coverImage = appId
                  ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_600x900_2x.jpg`
                  : matched.coverImage || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600';

                games.push({
                  id: `steam_${appId || rawName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
                  name: rawName,
                  category: matched.category,
                  platform: 'Steam',
                  coverImage,
                  processNames: matched.processNames,
                  installDir,
                  recommendedOptimizations: matched.optimizations,
                  description: matched.description
                });
              }
            } catch {}
          }
        });
      } catch {}
    });

    return games;
  }

  /**
   * 2. Sensor Epic Games: Scans all installed manifests from Epic Games Launcher
   */
  private scanEpicGames(): DetectedGame[] {
    const games: DetectedGame[] = [];
    const epicManifestDir = 'C:\\ProgramData\\Epic\\EpicGamesLauncher\\Data\\Manifests';

    if (fs.existsSync(epicManifestDir)) {
      try {
        const files = fs.readdirSync(epicManifestDir);
        files.forEach((f) => {
          if (f.endsWith('.item')) {
            try {
              const item = JSON.parse(fs.readFileSync(path.join(epicManifestDir, f), 'utf8'));
              const name = (item.DisplayName || '').trim();
              const installLoc = item.InstallLocation || '';

              // Filter out engine tools, artbooks, plugins
              if (
                !name ||
                !installLoc ||
                !fs.existsSync(installLoc) ||
                name.includes('Unreal Engine') ||
                name.includes('Plugin') ||
                name.includes('Artbook') ||
                name.includes('Outfit') ||
                name.includes('Social-Lord') ||
                name.includes('Bridge')
              ) {
                return;
              }

              const cleanName = name.replace(/®|™/g, '').trim();
              const matched = this.matchKnownGame(cleanName);

              // Derive process name from LaunchExecutable if available
              const procNames = [...matched.processNames];
              if (item.LaunchExecutable) {
                const exe = path.basename(item.LaunchExecutable);
                if (!procNames.includes(exe)) procNames.unshift(exe);
              }

              games.push({
                id: `epic_${item.AppName || cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
                name: cleanName,
                category: matched.category,
                platform: 'Epic Games',
                coverImage: matched.coverImage || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600',
                processNames: procNames,
                installDir: installLoc,
                executablePath: item.LaunchExecutable ? path.join(installLoc, item.LaunchExecutable) : undefined,
                recommendedOptimizations: matched.optimizations,
                description: matched.description
              });
            } catch {}
          }
        });
      } catch {}
    }

    return games;
  }

  /**
   * 3. Sensor Riot Games: Scans Riot client folders
   */
  private scanRiotGames(): DetectedGame[] {
    const games: DetectedGame[] = [];
    const drives = this.getAvailableDrives();

    drives.forEach((d) => {
      const riotRoot = path.join(d, 'Riot Games');
      if (fs.existsSync(riotRoot)) {
        try {
          const subdirs = fs.readdirSync(riotRoot);
          subdirs.forEach((sub) => {
            const full = path.join(riotRoot, sub);
            if (fs.statSync(full).isDirectory()) {
              const lower = sub.toLowerCase();
              if (lower.includes('valorant')) {
                const m = this.matchKnownGame('valorant');
                games.push({
                  id: 'riot_valorant',
                  name: 'VALORANT',
                  category: m.category,
                  platform: 'Riot Games',
                  coverImage: m.coverImage!,
                  processNames: m.processNames,
                  installDir: full,
                  recommendedOptimizations: m.optimizations,
                  description: m.description
                });
              } else if (lower.includes('league of legends')) {
                const m = this.matchKnownGame('league of legends');
                games.push({
                  id: 'riot_lol',
                  name: 'League of Legends',
                  category: m.category,
                  platform: 'Riot Games',
                  coverImage: m.coverImage!,
                  processNames: m.processNames,
                  installDir: full,
                  recommendedOptimizations: m.optimizations,
                  description: m.description
                });
              }
            }
          });
        } catch {}
      }
    });

    return games;
  }

  /**
   * 4. Sensor EA Games / Origin
   */
  private scanEaGames(): DetectedGame[] {
    const games: DetectedGame[] = [];
    const drives = this.getAvailableDrives();

    drives.forEach((d) => {
      const eaRoots = [
        path.join(d, 'Program Files', 'EA Games'),
        path.join(d, 'Program Files (x86)', 'Origin Games'),
        path.join(d, 'EA Games')
      ];

      eaRoots.forEach((root) => {
        if (fs.existsSync(root)) {
          try {
            const dirs = fs.readdirSync(root);
            dirs.forEach((dirName) => {
              const fullPath = path.join(root, dirName);
              if (fs.statSync(fullPath).isDirectory()) {
                const m = this.matchKnownGame(dirName);
                games.push({
                  id: `ea_${dirName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
                  name: dirName,
                  category: m.category,
                  platform: 'EA Desktop',
                  coverImage: m.coverImage || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600',
                  processNames: m.processNames,
                  installDir: fullPath,
                  recommendedOptimizations: m.optimizations,
                  description: m.description
                });
              }
            });
          } catch {}
        }
      });
    });

    return games;
  }

  /**
   * 5. Sensor Xbox Games / Microsoft Store
   */
  private scanXboxGames(): DetectedGame[] {
    const games: DetectedGame[] = [];
    const drives = this.getAvailableDrives();

    drives.forEach((d) => {
      const xboxRoot = path.join(d, 'XboxGames');
      if (fs.existsSync(xboxRoot)) {
        try {
          const dirs = fs.readdirSync(xboxRoot);
          dirs.forEach((dirName) => {
            const fullPath = path.join(xboxRoot, dirName);
            if (fs.statSync(fullPath).isDirectory()) {
              const m = this.matchKnownGame(dirName);
              games.push({
                id: `xbox_${dirName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
                name: dirName,
                category: m.category,
                platform: 'Xbox / Microsoft',
                coverImage: m.coverImage || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600',
                processNames: m.processNames,
                installDir: fullPath,
                recommendedOptimizations: m.optimizations,
                description: m.description
              });
            }
          });
        } catch {}
      }
    });

    return games;
  }

  /**
   * Helper: Matches game title with rich database of known games
   */
  private matchKnownGame(name: string) {
    const clean = name.toLowerCase().replace(/®|™|:|'/g, '').trim();

    for (const [key, meta] of Object.entries(KNOWN_GAME_METADATA)) {
      const keyClean = key.toLowerCase().replace(/®|™|:|'/g, '').trim();
      if (clean === keyClean || clean.includes(keyClean) || keyClean.includes(clean)) {
        return meta;
      }
    }

    // Default metadata for unknown titles
    const defaultExe = `${clean.replace(/\s+/g, '')}.exe`;
    return {
      category: 'Jogo de PC',
      coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600',
      processNames: [defaultExe],
      optimizations: ['input_timer_resolution', 'input_gpu_preference', 'clean_directx_shader_cache', 'net_tcp_autotuning'],
      description: 'Otimização cirúrgica de latência, prioridade de CPU P-Cores e resolução de timer a 0.500ms.'
    };
  }

  /**
   * Main API: Scans all connected platforms and returns unique detected games
   */
  public async scanAllInstalledGames(): Promise<DetectedGame[]> {
    const allGames: DetectedGame[] = [];
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();

    const addUnique = (game: DetectedGame) => {
      const normalizedName = game.name.toLowerCase().replace(/®|™|:|'/g, '').trim();
      if (!seenIds.has(game.id) && !seenNames.has(normalizedName)) {
        seenIds.add(game.id);
        seenNames.add(normalizedName);
        allGames.push(game);
      }
    };

    // 1. Steam
    const steam = this.scanSteamGames();
    steam.forEach(addUnique);

    // 2. Epic Games
    const epic = this.scanEpicGames();
    epic.forEach(addUnique);

    // 3. Riot Games
    const riot = this.scanRiotGames();
    riot.forEach(addUnique);

    // 4. EA Games
    const ea = this.scanEaGames();
    ea.forEach(addUnique);

    // 5. Xbox Games
    const xbox = this.scanXboxGames();
    xbox.forEach(addUnique);

    // 6. User Custom Games
    this.customGames.forEach(addUnique);

    return allGames;
  }

  /**
   * Add a custom game manually
   */
  public addCustomGame(game: {
    name: string;
    executablePath?: string;
    processName: string;
    category?: string;
    coverImage?: string;
  }): DetectedGame {
    const id = `custom_${Date.now()}_${game.processName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const matched = this.matchKnownGame(game.name);

    const newGame: DetectedGame = {
      id,
      name: game.name,
      category: game.category || matched.category || 'Personalizado',
      platform: 'Personalizado',
      coverImage: game.coverImage || matched.coverImage || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600',
      processNames: [game.processName],
      executablePath: game.executablePath,
      recommendedOptimizations: matched.optimizations,
      description: matched.description,
      isCustom: true
    };

    this.customGames.push(newGame);
    this.saveCustomGames();
    return newGame;
  }

  /**
   * Remove custom game
   */
  public removeCustomGame(gameId: string): boolean {
    const initialLen = this.customGames.length;
    this.customGames = this.customGames.filter((g) => g.id !== gameId);
    if (this.customGames.length !== initialLen) {
      this.saveCustomGames();
      return true;
    }
    return false;
  }
}
