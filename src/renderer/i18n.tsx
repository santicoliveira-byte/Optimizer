import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'pt' | 'en' | 'es';

export type ThemeAccent = 'indigo' | 'emerald' | 'cyan' | 'crimson' | 'amber' | 'purple' | 'rose';

export interface AccentColorConfig {
  id: ThemeAccent;
  name: string;
  nameEn: string;
  nameEs: string;
  hex: string;
  rgb: string;
  previewClass: string;
  gradientClass: string;
}

export const ACCENT_COLORS: AccentColorConfig[] = [
  {
    id: 'indigo',
    name: 'Índigo Elétrico (Padrão)',
    nameEn: 'Electric Indigo (Default)',
    nameEs: 'Índigo Eléctrico (Por defecto)',
    hex: '#6366f1',
    rgb: '99, 102, 241',
    previewClass: 'bg-indigo-500',
    gradientClass: 'from-indigo-600 to-indigo-800'
  },
  {
    id: 'emerald',
    name: 'Verde Cyberpunk / Razer',
    nameEn: 'Cyberpunk Green / Razer',
    nameEs: 'Verde Cyberpunk / Razer',
    hex: '#10b981',
    rgb: '16, 185, 129',
    previewClass: 'bg-emerald-500',
    gradientClass: 'from-emerald-600 to-teal-800'
  },
  {
    id: 'cyan',
    name: 'Azul Gelo / Cyan',
    nameEn: 'Ice Blue / Cyan',
    nameEs: 'Azul Hielo / Cian',
    hex: '#06b6d4',
    rgb: '6, 182, 212',
    previewClass: 'bg-cyan-500',
    gradientClass: 'from-cyan-600 to-blue-800'
  },
  {
    id: 'crimson',
    name: 'Vermelho Rogue / Crimson',
    nameEn: 'Rogue Red / Crimson',
    nameEs: 'Rojo Rogue / Carmesí',
    hex: '#ef4444',
    rgb: '239, 68, 68',
    previewClass: 'bg-rose-500',
    gradientClass: 'from-rose-600 to-red-800'
  },
  {
    id: 'amber',
    name: 'Âmbar Dourado / Sunset',
    nameEn: 'Gold Amber / Sunset',
    nameEs: 'Ámbar Dorado / Puesta de sol',
    hex: '#f59e0b',
    rgb: '245, 158, 11',
    previewClass: 'bg-amber-500',
    gradientClass: 'from-amber-500 to-orange-700'
  },
  {
    id: 'purple',
    name: 'Roxo Ametista / Neon',
    nameEn: 'Amethyst Purple / Neon',
    nameEs: 'Púrpura Amatista / Neón',
    hex: '#a855f7',
    rgb: '168, 85, 247',
    previewClass: 'bg-purple-500',
    gradientClass: 'from-purple-600 to-fuchsia-800'
  },
  {
    id: 'rose',
    name: 'Rosa Cyber / Neon Pink',
    nameEn: 'Cyber Rose / Neon Pink',
    nameEs: 'Rosa Cyber / Rosa Neón',
    hex: '#f43f5e',
    rgb: '244, 63, 94',
    previewClass: 'bg-pink-500',
    gradientClass: 'from-pink-600 to-rose-800'
  }
];

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  pt: {
    // Brand & Header
    'brand.subtitle': 'Windows Performance Suite',
    'search.placeholder': 'Pesquisar entre as 500 otimizações (nome, registo, comando)...',
    'nav.dashboard': 'Painel Geral',
    'nav.dashboard.desc': 'Saúde, resumo e otimizador rápido',
    'nav.gaming': 'Gaming & Latência',
    'nav.gaming.desc': 'Perfis de jogos, input lag e prioridade',
    'nav.bottleneck': 'Gargalo & Game Ready',
    'nav.bottleneck.desc': 'Calculador de CPU/GPU e estimativa de FPS',
    'nav.hardware': 'Rig-Z • Hardware Suite',
    'nav.hardware.desc': 'Inspetor de silício, SPD e Benchmark',
    'nav.network': 'Rede, Wi-Fi & Ping',
    'nav.network.desc': 'QoS, Wi-Fi 6, DNS e rotas',
    'nav.peripherals': 'Periféricos & Latência',
    'nav.peripherals.desc': 'Laboratório de Rato, Teclado, Fones e Ecrã',
    'nav.benchmark': 'Benchmark Antes/Depois',
    'nav.benchmark.desc': 'Comparativo oficial de FPS e estabilidade',
    'nav.system': 'Hardware & Sistema',
    'nav.system.desc': 'CPU, GPU, RAM, arranque e apps',
    'nav.maintenance': 'Manutenção & Perfis',
    'nav.maintenance.desc': 'Limpeza, privacidade e backups',
    'nav.main_modules': 'Módulos Principais',

    // Quick tools in sidebar
    'sidebar.hud_overlay': 'Game HUD Overlay',
    'sidebar.clean_shaders': 'Limpar Shaders GPU',
    'sidebar.safe_badge': '100% Reversível & Seguro',

    // Header buttons
    'header.timer_res': 'Resolução de Timer',
    'header.tourney_mode': 'Modo Torneio',
    'header.tourney_active': 'Torneio eSports ATIVO',
    'header.simulation': 'Simulação',
    'header.restore_point': 'Ponto de Restauro',
    'header.revert_all': 'Repor Tudo',
    'header.updates': 'Atualizações',
    'header.filters': 'Filtros:',
    'header.all_risks': 'Todos os Riscos',
    'header.safe': 'Seguro',
    'header.moderate': 'Moderado',
    'header.all_types': 'Todos os Tipos',
    'header.alters': 'Altera',
    'header.informs': 'Informa',
    'header.recommended_only': 'Apenas Recomendados',

    // Settings Modal
    'settings.title': 'Definições do Optimizer',
    'settings.desc': 'Personaliza o tema visual, paleta de cores e o idioma da aplicação.',
    'settings.tab_appearance': 'Aparência & Cores',
    'settings.tab_overlay': 'Overlay & HUD',
    'settings.tab_language': 'Idioma / Language',
    'settings.tab_hotkeys': 'Atalhos de Teclado',
    'settings.tab_gsync': 'G-Sync / Anti-Lag',
    'settings.tab_benchmark': 'Benchmark FPS',
    'settings.tab_startup': 'Arranque com Windows',
    'settings.tab_about': 'Sobre o Optimizer',
    'settings.overlay_title': 'Personalização do Overlay HUD',
    'settings.overlay_desc': 'Escolhe exatamente os dados visíveis no ecrã e o formato visual do painel flutuante.',
    'settings.overlay_format': 'Formato & Disposição do Overlay',
    'settings.overlay_format_desc': 'Escolhe a estrutura geométrica em que a telemetria é apresentada no teu ecrã.',
    'settings.overlay_items': 'Métricas e Elementos Visíveis',
    'settings.overlay_items_desc': 'Ativa ou desativa cada elemento para manter o HUD ultra-leve e focado no essencial.',
    'settings.overlay_theme': 'Tema & Aspeto Visual',
    'settings.overlay_theme_desc': 'Estilo de fundo e transparência do HUD para visibilidade ideal nos jogos.',
    'settings.overlay_reset': 'Repor Configuração do Overlay',
    'settings.accent_color': 'Cor de Destaque da Aplicação',
    'settings.accent_color_desc': 'Escolhe a cor principal dos botões, medidores, abas ativas e realces.',
    'settings.select_language': 'Selecionar Idioma da Interface',
    'settings.select_language_desc': 'Altera todo o texto e navegação para a tua língua de preferência.',
    'settings.lang_pt': 'Português (Portugal / Brasil)',
    'settings.lang_en': 'English (United States / UK)',
    'settings.lang_es': 'Español (España / Latinoamérica)',
    'settings.current_version': 'Versão Instalada:',
    'settings.repository': 'Repositório Oficial no GitHub',
    'settings.author': 'Desenvolvido por:',
    'settings.close': 'Guardar e Fechar',
    'settings.reset': 'Repor Padrões',
    'settings.hotkeys_title': 'Combinações de Teclas Globais',
    'settings.hotkeys_desc': 'Configura as combinações de teclas para ligar/desligar o HUD e controlar o rato em jogo.',
    'settings.ghost_title': 'Controlo de Emergência: Modo Fantasma',
    'settings.ghost_desc': 'Quando o Modo Fantasma está ativo, os cliques do rato passam 100% diretos para o jogo. Podes desativá-lo imediatamente aqui ou premir o atalho configurado.',
    'settings.ghost_deactivate_now': 'Desativar Modo Fantasma Agora (Recuperar Rato)',
    'settings.ghost_activate_now': 'Ativar Modo Fantasma (Passar Cliques ao Jogo)',
    'settings.ghost_active_badge': 'Modo Fantasma Ativo (Rato passa ao jogo)',
    'settings.ghost_inactive_badge': 'Modo Normal (HUD clicável)',
    'settings.hotkeys_reset': 'Restaurar Atalhos Padrão'
  },
  en: {
    // Brand & Header
    'brand.subtitle': 'Windows Performance Suite',
    'search.placeholder': 'Search among 500 optimizations (name, registry, command)...',
    'nav.dashboard': 'General Dashboard',
    'nav.dashboard.desc': 'Health score, overview and quick optimizer',
    'nav.gaming': 'Gaming & Latency',
    'nav.gaming.desc': 'Game profiles, input lag & CPU priority',
    'nav.bottleneck': 'Bottleneck & Game Ready',
    'nav.bottleneck.desc': 'CPU/GPU balancer and FPS predictor',
    'nav.hardware': 'Rig-Z • Hardware Suite',
    'nav.hardware.desc': 'Silicon inspector, SPD and Benchmark',
    'nav.network': 'Network, Wi-Fi & Ping',
    'nav.network.desc': 'QoS routing, Wi-Fi 6, DNS & packets',
    'nav.peripherals': 'Peripherals & Latency',
    'nav.peripherals.desc': 'Mouse, Keyboard, Headset & Display Lab',
    'nav.benchmark': 'Before/After Benchmark',
    'nav.benchmark.desc': 'Official FPS & stability comparison',
    'nav.system': 'Hardware & System',
    'nav.system.desc': 'CPU, GPU, RAM, startup & apps',
    'nav.maintenance': 'Maintenance & Profiles',
    'nav.maintenance.desc': 'Cleanup, privacy and system backups',
    'nav.main_modules': 'Main Modules',

    // Quick tools in sidebar
    'sidebar.hud_overlay': 'Game HUD Overlay',
    'sidebar.clean_shaders': 'Clean GPU Shaders',
    'sidebar.safe_badge': '100% Safe & Reversible',

    // Header buttons
    'header.timer_res': 'Timer Resolution',
    'header.tourney_mode': 'Tournament Mode',
    'header.tourney_active': 'eSports Tournament ACTIVE',
    'header.simulation': 'Simulation',
    'header.restore_point': 'Restore Point',
    'header.revert_all': 'Revert All',
    'header.updates': 'Updates',
    'header.filters': 'Filters:',
    'header.all_risks': 'All Risks',
    'header.safe': 'Safe',
    'header.moderate': 'Moderate',
    'header.all_types': 'All Types',
    'header.alters': 'Modifies',
    'header.informs': 'Informs',
    'header.recommended_only': 'Recommended Only',

    // Settings Modal
    'settings.title': 'Optimizer Settings',
    'settings.desc': 'Customize visual theme, accent color palette and interface language.',
    'settings.tab_appearance': 'Appearance & Colors',
    'settings.tab_overlay': 'Overlay & HUD',
    'settings.tab_language': 'Language / Idioma',
    'settings.tab_hotkeys': 'Keyboard Shortcuts',
    'settings.tab_gsync': 'G-Sync / Anti-Lag',
    'settings.tab_benchmark': 'FPS Benchmark',
    'settings.tab_startup': 'Windows Startup',
    'settings.tab_about': 'About Optimizer',
    'settings.overlay_title': 'Overlay HUD Customization',
    'settings.overlay_desc': 'Choose exactly what telemetry appears on screen and customize the HUD format and style.',
    'settings.overlay_format': 'Overlay Layout & Format',
    'settings.overlay_format_desc': 'Choose the geometric structure in which telemetry is displayed on your screen.',
    'settings.overlay_items': 'Visible Metrics & Elements',
    'settings.overlay_items_desc': 'Toggle each telemetry item to keep the HUD ultra-light and focused on essentials.',
    'settings.overlay_theme': 'Theme & Visual Styling',
    'settings.overlay_theme_desc': 'Background style and transparency for optimal in-game readability.',
    'settings.overlay_reset': 'Reset Overlay Settings',
    'settings.accent_color': 'App Accent Color',
    'settings.accent_color_desc': 'Choose the primary color for buttons, meters, active tabs and glows.',
    'settings.select_language': 'Select Interface Language',
    'settings.select_language_desc': 'Changes all navigation and interface text to your preferred language.',
    'settings.lang_pt': 'Portuguese (Portugal / Brazil)',
    'settings.lang_en': 'English (United States / UK)',
    'settings.lang_es': 'Spanish (Spain / Latin America)',
    'settings.current_version': 'Installed Version:',
    'settings.repository': 'Official GitHub Repository',
    'settings.author': 'Developed by:',
    'settings.close': 'Save & Close',
    'settings.reset': 'Reset Defaults',
    'settings.hotkeys_title': 'Global Keyboard Hotkeys',
    'settings.hotkeys_desc': 'Configure keyboard shortcuts to toggle HUD and control mouse click-through during games.',
    'settings.ghost_title': 'Emergency Control: Ghost Mode',
    'settings.ghost_desc': 'When Ghost Mode is active, mouse clicks pass straight through to the game. You can disable it here or press the designated global hotkey.',
    'settings.ghost_deactivate_now': 'Disable Ghost Mode Now (Restore Mouse)',
    'settings.ghost_activate_now': 'Enable Ghost Mode (Click-Through)',
    'settings.ghost_active_badge': 'Ghost Mode Active (Clicks pass through)',
    'settings.ghost_inactive_badge': 'Normal Mode (HUD clickable)',
    'settings.hotkeys_reset': 'Reset Default Hotkeys'
  },
  es: {
    // Brand & Header
    'brand.subtitle': 'Windows Performance Suite',
    'search.placeholder': 'Buscar entre las 500 optimizaciones (nombre, registro, comando)...',
    'nav.dashboard': 'Panel General',
    'nav.dashboard.desc': 'Salud del sistema, resumen y optimizador rápido',
    'nav.gaming': 'Gaming y Latencia',
    'nav.gaming.desc': 'Perfiles de juegos, input lag y prioridad de CPU',
    'nav.bottleneck': 'Cuello de Botella & Game Ready',
    'nav.bottleneck.desc': 'Calculador CPU/GPU y estimación de FPS',
    'nav.hardware': 'Rig-Z • Hardware Suite',
    'nav.hardware.desc': 'Inspector de silicio, SPD y Benchmark',
    'nav.network': 'Red, Wi-Fi y Ping',
    'nav.network.desc': 'QoS, Wi-Fi 6, DNS y paquetes',
    'nav.peripherals': 'Periféricos y Latencia',
    'nav.peripherals.desc': 'Laboratorio de Ratón, Teclado, Auriculares y Pantalla',
    'nav.benchmark': 'Benchmark Antes/Después',
    'nav.benchmark.desc': 'Comparativa oficial de FPS y estabilidad',
    'nav.system': 'Hardware y Sistema',
    'nav.system.desc': 'CPU, GPU, RAM, inicio y aplicaciones',
    'nav.maintenance': 'Mantenimiento y Perfiles',
    'nav.maintenance.desc': 'Limpieza, privacidad y copias de seguridad',
    'nav.main_modules': 'Módulos Principales',

    // Quick tools in sidebar
    'sidebar.hud_overlay': 'Game HUD Overlay',
    'sidebar.clean_shaders': 'Limpiar Shaders GPU',
    'sidebar.safe_badge': '100% Seguro y Reversible',

    // Header buttons
    'header.timer_res': 'Resolución de Timer',
    'header.tourney_mode': 'Modo Torneo',
    'header.tourney_active': 'Torneo eSports ACTIVO',
    'header.simulation': 'Simulación',
    'header.restore_point': 'Punto de Restauración',
    'header.revert_all': 'Restaurar Todo',
    'header.updates': 'Actualizaciones',
    'header.filters': 'Filtros:',
    'header.all_risks': 'Todos los Riesgos',
    'header.safe': 'Seguro',
    'header.moderate': 'Moderado',
    'header.all_types': 'Todos los Tipos',
    'header.alters': 'Modifica',
    'header.informs': 'Informa',
    'header.recommended_only': 'Solo Recomendados',

    // Settings Modal
    'settings.title': 'Configuración de Optimizer',
    'settings.desc': 'Personaliza el tema visual, la paleta de colores y el idioma de la aplicación.',
    'settings.tab_appearance': 'Apariencia y Colores',
    'settings.tab_overlay': 'Overlay y HUD',
    'settings.tab_language': 'Idioma / Language',
    'settings.tab_hotkeys': 'Atajos de Teclado',
    'settings.tab_gsync': 'G-Sync / Anti-Lag',
    'settings.tab_benchmark': 'Benchmark FPS',
    'settings.tab_startup': 'Inicio con Windows',
    'settings.tab_about': 'Acerca de Optimizer',
    'settings.overlay_title': 'Personalización del Overlay HUD',
    'settings.overlay_desc': 'Elige exactamente los datos visibles en pantalla y el formato visual del panel flotante.',
    'settings.overlay_format': 'Formato y Disposición del Overlay',
    'settings.overlay_format_desc': 'Elige la estructura geométrica en la que se muestra la telemetría en tu pantalla.',
    'settings.overlay_items': 'Métricas y Elementos Visibles',
    'settings.overlay_items_desc': 'Activa o desactiva cada elemento para mantener el HUD ultra ligero y enfocado en lo esencial.',
    'settings.overlay_theme': 'Tema y Aspecto Visual',
    'settings.overlay_theme_desc': 'Estilo de fondo y transparencia del HUD para una visibilidad óptima en juegos.',
    'settings.overlay_reset': 'Restaurar Configuración del Overlay',
    'settings.accent_color': 'Color de Énfasis de la Aplicación',
    'settings.accent_color_desc': 'Elige el color principal para botones, medidores, pestañas activas y destellos.',
    'settings.select_language': 'Seleccionar Idioma de la Interfaz',
    'settings.select_language_desc': 'Cambia toda la navegación y textos al idioma de tu preferencia.',
    'settings.lang_pt': 'Portugués (Portugal / Brasil)',
    'settings.lang_en': 'Inglés (Estados Unidos / UK)',
    'settings.lang_es': 'Español (España / Latinoamérica)',
    'settings.current_version': 'Versión Instalada:',
    'settings.repository': 'Repositorio Oficial en GitHub',
    'settings.author': 'Desarrollado por:',
    'settings.close': 'Guardar y Cerrar',
    'settings.reset': 'Restaurar Valores por Defecto',
    'settings.hotkeys_title': 'Atajos de Teclado Globales',
    'settings.hotkeys_desc': 'Configura las combinaciones de teclas para activar el HUD y controlar el ratón mientras juegas.',
    'settings.ghost_title': 'Control de Emergencia: Modo Fantasma',
    'settings.ghost_desc': 'Cuando el Modo Fantasma está activo, los clics del ratón pasan directamente al juego. Puedes desactivarlo aquí o pulsar el atajo global.',
    'settings.ghost_deactivate_now': 'Desactivar Modo Fantasma Ahora (Restaurar Ratón)',
    'settings.ghost_activate_now': 'Activar Modo Fantasma (Pasar Clics al Juego)',
    'settings.ghost_active_badge': 'Modo Fantasma Activo (Clics pasan al juego)',
    'settings.ghost_inactive_badge': 'Modo Normal (HUD interactivo)',
    'settings.hotkeys_reset': 'Restaurar Atajos por Defecto'
  }
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  accent: ThemeAccent;
  setAccent: (accent: ThemeAccent) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  language: 'pt',
  setLanguage: () => {},
  accent: 'indigo',
  setAccent: () => {},
  t: (k) => k
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('optimizer_language') as Language;
      return saved && TRANSLATIONS[saved] ? saved : 'pt';
    } catch {
      return 'pt';
    }
  });

  const [accent, setAccentState] = useState<ThemeAccent>(() => {
    try {
      const saved = localStorage.getItem('optimizer_theme_accent') as ThemeAccent;
      const found = ACCENT_COLORS.some((c) => c.id === saved);
      return found ? saved : 'indigo';
    } catch {
      return 'indigo';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('optimizer_language', lang);
    } catch {}
  };

  const setAccent = (newAccent: ThemeAccent) => {
    setAccentState(newAccent);
    try {
      localStorage.setItem('optimizer_theme_accent', newAccent);
      document.body.setAttribute('data-theme', newAccent);
    } catch {}
  };

  useEffect(() => {
    document.body.setAttribute('data-theme', accent);
  }, [accent]);

  const t = (key: string): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.pt;
    return dict[key] || TRANSLATIONS.pt[key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, accent, setAccent, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
