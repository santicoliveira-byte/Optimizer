const fs = require('fs');
const path = require('path');

const catalogPath = path.resolve(__dirname, '../src/main/catalog/catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

const newOptimizations = [
  // 1. Visual UI additions
  {
    id: 'ui_disable_action_center_animations',
    category: 'visual_ui',
    itemNumber: 10,
    name: 'Desativar animações da Central de Notificações',
    description: 'Remove o efeito de deslize da Central de Ações e Notificações para abertura instantânea.',
    exactChange: 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced -> TaskbarAnimations = 0',
    risk: 'safe',
    type: 'alter',
    requiresAdmin: false,
    requiresReboot: false,
    compat: { win10: true, win11: true, desktop: true, laptop: true },
    recommended: true
  },
  {
    id: 'ui_disable_combo_box_animation',
    category: 'visual_ui',
    itemNumber: 11,
    name: 'Desativar animação suave em Caixas de Seleção (Combo Boxes)',
    description: 'Elimina o atraso e a transição ao abrir listas pendentes no Windows para resposta tátil imediata.',
    exactChange: 'HKCU:\\Control Panel\\Desktop -> SmoothScroll = 0',
    risk: 'safe',
    type: 'alter',
    requiresAdmin: false,
    requiresReboot: false,
    compat: { win10: true, win11: true, desktop: true, laptop: true },
    recommended: true
  },
  {
    id: 'ui_disable_cursor_shadow',
    category: 'visual_ui',
    itemNumber: 12,
    name: 'Desativar sombra sob o ponteiro do rato',
    description: 'Desativa o efeito de sombra transparente por baixo do cursor, poupando ciclos de composição gráfica.',
    exactChange: 'HKCU:\\Control Panel\\Desktop -> UserPreferencesMask',
    risk: 'safe',
    type: 'alter',
    requiresAdmin: false,
    requiresReboot: false,
    compat: { win10: true, win11: true, desktop: true, laptop: true },
    recommended: true
  },
  {
    id: 'ui_disable_taskbar_animations',
    category: 'visual_ui',
    itemNumber: 13,
    name: 'Desativar animações da barra de tarefas',
    description: 'Abre e alterna miniaturas e janelas na barra de tarefas de forma instantânea sem transições suaves.',
    exactChange: 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced -> TaskbarAnimations = 0',
    risk: 'safe',
    type: 'alter',
    requiresAdmin: false,
    requiresReboot: false,
    compat: { win10: true, win11: true, desktop: true, laptop: true },
    recommended: true
  },

  // 2. Privacy Telemetry additions
  {
    id: 'priv_disable_diagnostic_data_viewer',
    category: 'privacy_telemetry',
    itemNumber: 10,
    name: 'Desativar visualizador e recolha de diagnóstico de dados',
    description: 'Impede o armazenamento contínuo em cache de relatórios locais de diagnóstico do sistema.',
    exactChange: 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection -> DiagnosticDataViewer = 0',
    risk: 'safe',
    type: 'alter',
    requiresAdmin: true,
    requiresReboot: false,
    compat: { win10: true, win11: true, desktop: true, laptop: true },
    recommended: true
  },
  {
    id: 'priv_disable_handwriting_telemetry',
    category: 'privacy_telemetry',
    itemNumber: 11,
    name: 'Desativar telemetria de escrita e digitação',
    description: 'Impede o envio de amostras de teclado e reconhecimento de escrita para os servidores da Microsoft.',
    exactChange: 'HKCU:\\Software\\Microsoft\\InputPersonalization -> RestrictImplicitInkCollection = 1',
    risk: 'safe',
    type: 'alter',
    requiresAdmin: false,
    requiresReboot: false,
    compat: { win10: true, win11: true, desktop: true, laptop: true },
    recommended: true
  },
  {
    id: 'priv_disable_inventory_collector',
    category: 'privacy_telemetry',
    itemNumber: 12,
    name: 'Desativar inventário de software e compatibilidade (DeviceCensus)',
    description: 'Desativa o agendamento de inventário de hardware e aplicações que corre periodicamente em segundo plano.',
    exactChange: 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection -> DisableInventoryCollection = 1',
    risk: 'safe',
    type: 'alter',
    requiresAdmin: true,
    requiresReboot: false,
    compat: { win10: true, win11: true, desktop: true, laptop: true },
    recommended: true
  },
  {
    id: 'priv_disable_feedback_notifications',
    category: 'privacy_telemetry',
    itemNumber: 13,
    name: 'Desativar pedidos de opinião e feedback do Windows',
    description: 'Bloqueia notificações no ecrã a pedir avaliações sobre funcionalidades do sistema operativo.',
    exactChange: 'HKCU:\\Software\\Microsoft\\Siuf\\Rules -> NumberOfSIUFInPeriod = 0',
    risk: 'safe',
    type: 'alter',
    requiresAdmin: false,
    requiresReboot: false,
    compat: { win10: true, win11: true, desktop: true, laptop: true },
    recommended: true
  },

  // 3. Input Latency additions
  {
    id: 'input_system_responsiveness_gaming',
    category: 'input_latency',
    itemNumber: 25,
    name: 'Otimizar SystemResponsiveness para baixa latência multimédia',
    description: 'Ajusta a reserva de ciclos de CPU para tarefas de baixa latência em vez de priorizar serviços de fundo.',
    exactChange: 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile -> SystemResponsiveness = 10',
    risk: 'safe',
    type: 'alter',
    requiresAdmin: true,
    requiresReboot: false,
    compat: { win10: true, win11: true, desktop: true, laptop: true },
    recommended: true
  },
  {
    id: 'input_network_throttling_gaming',
    category: 'input_latency',
    itemNumber: 26,
    name: 'Desativar limitação de pacotes de rede multimédia (NetworkThrottlingIndex)',
    description: 'Evita que o Windows limite a taxa de processamento de pacotes TCP/UDP quando aplicações multimédia estão ativas.',
    exactChange: 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile -> NetworkThrottlingIndex = 0xFFFFFFFF',
    risk: 'safe',
    type: 'alter',
    requiresAdmin: true,
    requiresReboot: false,
    compat: { win10: true, win11: true, desktop: true, laptop: true },
    recommended: true
  },
  {
    id: 'input_game_priority_boost',
    category: 'input_latency',
    itemNumber: 27,
    name: 'Configurar GPU Priority e Scheduling de Jogos',
    description: 'Define as prioridades de agendamento de jogos para GPU Priority 8 e Scheduling Category High.',
    exactChange: 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games -> GPU Priority = 8, Priority = 6',
    risk: 'safe',
    type: 'alter',
    requiresAdmin: true,
    requiresReboot: false,
    compat: { win10: true, win11: true, desktop: true, laptop: true },
    recommended: true
  },
  {
    id: 'input_keyboard_repeat_rate',
    category: 'input_latency',
    itemNumber: 28,
    name: 'Otimizar atraso e repetição de teclado (Auto-Repeat)',
    description: 'Reduz o atraso inicial de repetição das teclas para resposta mais imediata em digitação e teclas de movimento.',
    exactChange: 'HKCU:\\Control Panel\\Keyboard -> KeyboardDelay = 0, KeyboardSpeed = 31',
    risk: 'safe',
    type: 'alter',
    requiresAdmin: false,
    requiresReboot: false,
    compat: { win10: true, win11: true, desktop: true, laptop: true },
    recommended: true
  },

  // 4. Network Internet additions
  {
    id: 'net_disable_teredo_tunneling',
    category: 'network_internet',
    itemNumber: 29,
    name: 'Desativar túnel Teredo desnecessário',
    description: 'Desativa o adaptador de túnel Teredo se a ligação já dispuser de IPv4/IPv6 nativo, reduzindo sobrecarga de pacotes.',
    exactChange: 'netsh interface teredo set state disabled',
    risk: 'safe',
    type: 'alter',
    requiresAdmin: true,
    requiresReboot: false,
    compat: { win10: true, win11: true, desktop: true, laptop: true },
    recommended: true
  },
  {
    id: 'net_disable_isatap_tunneling',
    category: 'network_internet',
    itemNumber: 30,
    name: 'Desativar túnel ISATAP obsoleto',
    description: 'Desativa o protocolo legado ISATAP para evitar resolução desnecessária de adaptadores virtuais.',
    exactChange: 'netsh interface isatap set state disabled',
    risk: 'safe',
    type: 'alter',
    requiresAdmin: true,
    requiresReboot: false,
    compat: { win10: true, win11: true, desktop: true, laptop: true },
    recommended: true
  },
  {
    id: 'net_enable_ecn_capability',
    category: 'network_internet',
    itemNumber: 31,
    name: 'Verificar e ativar Explicit Congestion Notification (ECN)',
    description: 'Notifica routers congestionados para reduzir a velocidade sem causar descarte forçado de pacotes.',
    exactChange: 'netsh int tcp set global ecncapability=enabled',
    risk: 'safe',
    type: 'alter',
    requiresAdmin: true,
    requiresReboot: false,
    compat: { win10: true, win11: true, desktop: true, laptop: true },
    recommended: false
  },
  {
    id: 'net_enable_direct_cache_access',
    category: 'network_internet',
    itemNumber: 32,
    name: 'Ativar Direct Cache Access (DCA) da placa de rede',
    description: 'Permite que controladores de rede compatíveis transfiram dados diretamente para a cache L3 do CPU.',
    exactChange: 'netsh int tcp set global dca=enabled',
    risk: 'safe',
    type: 'alter',
    requiresAdmin: true,
    requiresReboot: false,
    compat: { win10: true, win11: true, desktop: true, laptop: true },
    recommended: true
  },

  // 5. CPU GPU Power additions
  {
    id: 'cpu_gpu_disable_core_parking_ac',
    category: 'cpu_gpu_power',
    itemNumber: 15,
    name: 'Impedir Core Parking de núcleos de CPU em corrente alternada (AC)',
    description: 'Mantém todos os núcleos do processador acordados sem latência de transição C-State quando ligado à corrente.',
    exactChange: 'powercfg /setacvalueindex scheme_current sub_processor CPMINCORES 100',
    risk: 'safe',
    type: 'alter',
    requiresAdmin: true,
    requiresReboot: false,
    compat: { win10: true, win11: true, desktop: true, laptop: true },
    recommended: true
  },
  {
    id: 'cpu_gpu_gpu_energy_driver_perf',
    category: 'cpu_gpu_power',
    itemNumber: 16,
    name: 'Forçar perfil de máximo desempenho no controlador gráfico WDDM',
    description: 'Configura o agendador WDDM do Windows para priorizar latência mínima de quadros.',
    exactChange: 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers -> PowerSavingsLogic = 0',
    risk: 'safe',
    type: 'alter',
    requiresAdmin: true,
    requiresReboot: false,
    compat: { win10: true, win11: true, desktop: true, laptop: true },
    recommended: true
  },

  // 6. Safe Cleanup additions
  {
    id: 'clean_edge_chromium_cache',
    category: 'safe_cleanup',
    itemNumber: 16,
    name: 'Limpar cache de renderização do Microsoft Edge',
    description: 'Remove ficheiros temporários em cache do motor Chromium do Edge sem tocar em histórico, cookies ou senhas.',
    exactChange: 'Remove-Item -Path "$env:LOCALAPPDATA\\Microsoft\\Edge\\User Data\\Default\\Cache\\*" -Recurse -Force',
    risk: 'safe',
    type: 'alter',
    requiresAdmin: false,
    requiresReboot: false,
    compat: { win10: true, win11: true, desktop: true, laptop: true },
    recommended: true
  },
  {
    id: 'clean_installer_temp_files',
    category: 'safe_cleanup',
    itemNumber: 17,
    name: 'Limpar ficheiros residuais de descompactação de instaladores',
    description: 'Elimina ficheiros temporários gerados durante instalações de programas em pastas temporárias.',
    exactChange: 'Remove-Item -Path "$env:WINDIR\\Temp\\*.tmp", "$env:TEMP\\*.tmp" -Force',
    risk: 'safe',
    type: 'alter',
    requiresAdmin: true,
    requiresReboot: false,
    compat: { win10: true, win11: true, desktop: true, laptop: true },
    recommended: true
  }
];

// Avoid duplicates if re-run
for (const item of newOptimizations) {
  const existingIdx = catalog.items.findIndex(i => i.id === item.id);
  if (existingIdx >= 0) {
    catalog.items[existingIdx] = item;
  } else {
    catalog.items.push(item);
  }
}

// Update categories counts
for (const cat of catalog.categories) {
  cat.totalItems = catalog.items.filter(i => i.category === cat.id).length;
}

catalog.updatedAt = new Date().toISOString();

fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
console.log('Catalog updated! Total optimizations:', catalog.items.length);
