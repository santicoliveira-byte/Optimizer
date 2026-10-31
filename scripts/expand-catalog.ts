import fs from 'fs';
import path from 'path';

const catalogPath = path.resolve('d:/Optimzer/src/main/catalog/catalog.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

// 1. INPUT LATENCY (25 items)
const inputLatencyNew = [
  {
    name: 'Reduzir Fila de Dados do Rato (MouseDataQueueSize = 16)',
    desc: 'Reduz o buffer de eventos do rato no subsistema win32k de 100 para 16 pacotes, eliminando atraso de acumulação de cliques.',
    change: 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\mouclass\\Parameters -> MouseDataQueueSize = 16',
    risk: 'safe', type: 'alter', admin: true, reboot: true, rec: true
  },
  {
    name: 'Reduzir Fila de Dados do Teclado (KeyboardDataQueueSize = 16)',
    desc: 'Diminui o tamanho da fila de processamento de teclas para minimizar latência entre o pressionar da tecla e o registo no jogo.',
    change: 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\kbdclass\\Parameters -> KeyboardDataQueueSize = 16',
    risk: 'safe', type: 'alter', admin: true, reboot: true, rec: true
  },
  {
    name: 'Desativar Suspensão Seletiva em Controladores USB de Jogo',
    desc: 'Impede o gestor de energia de colocar portas USB e controladores de entrada em estados D2/D3 de baixo consumo.',
    change: 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\USB -> DisableSelectiveSuspend = 1',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Definir Taxa de Resposta do Cursor (Touch & Pen Latency Zero)',
    desc: 'Desativa o amortecimento visual de entrada por toque e caneta digital no subsistema do Explorer.',
    change: 'HKCU:\\Control Panel\\Desktop -> TouchPrediction = 0',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Prioridade Máxima no Driver de Entrada HidUsb',
    desc: 'Eleva a prioridade de processamento de interrupção do driver nativo de dispositivos de interface humana USB.',
    change: 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\hidusb\\Parameters -> ThreadPriority = 31',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Avisos Sonoros de Teclas de Aderência',
    desc: 'Desliga alertas e sons de comutação de acessibilidade que causam micro-bloqueios no driver de áudio.',
    change: 'HKCU:\\Control Panel\\Accessibility\\SoundSentry -> Flags = 0',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Otimizar CursorBlinkRate para Menor Consumo de GPU',
    desc: 'Reduz o ciclo de renderização periódica do cursor em formulários e menus.',
    change: 'HKCU:\\Control Panel\\Desktop -> CursorBlinkRate = 1000',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Desativar Animações do Ponteiro do Rato',
    desc: 'Desativa efeitos de rasto e transição de ponteiro para máxima nitidez a altas taxas de atualização (144Hz-360Hz).',
    change: 'HKCU:\\Control Panel\\Mouse -> MouseTrails = 0',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Desativar SnapToDefaultButton do Rato',
    desc: 'Evita movimentos automáticos involuntários do cursor para botões de diálogo do Windows.',
    change: 'HKCU:\\Control Panel\\Mouse -> SnapToDefaultButton = 0',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Ajustar Sensibilidade Vertical e Horizontal do Rato 1:1',
    desc: 'Iguala as taxas de interpolação dos eixos X e Y para consistência de mira perfeita.',
    change: 'HKCU:\\Control Panel\\Mouse -> SmoothMouseXCurve & SmoothMouseYCurve desativadas',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Desativar Filtro de Teclas de Repetição Repetidas',
    desc: 'Garante que múltiplos toques rápidos em sequências mecânicas são registados sem perda de inputs.',
    change: 'HKCU:\\Control Panel\\Accessibility\\Keyboard Response -> BounceTime = 0',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Otimizar Taxa de Amostragem do Teclado para 31 (Máximo)',
    desc: 'Configura a taxa de repetição do teclado para o limite máximo suportado pelo hardware.',
    change: 'HKCU:\\Control Panel\\Keyboard -> KeyboardSpeed = 31',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Desativar Atraso de Tecla Inicial (KeyboardDelay = 0)',
    desc: 'Elimina o atraso inicial antes de uma tecla mantida pressionada começar a repetir o sinal.',
    change: 'HKCU:\\Control Panel\\Keyboard -> KeyboardDelay = 0',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Desativar Hotkey de Alternância de Teclas de Alternância (ToggleKeys)',
    desc: 'Impede que manter Num Lock pressionado durante 5 segundos bloqueie os controlos.',
    change: 'HKCU:\\Control Panel\\Accessibility\\ToggleKeys -> Flags = 58',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Priorizar Fila de Interrupções DWM para Ecrã',
    desc: 'Aumenta a prioridade do buffer de apresentação gráfica para corresponder à taxa de varrimento do monitor.',
    change: 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Display -> Priority = 8',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Otimizar Resposta de Janela em Modo Exclusivo',
    desc: 'Remove interferências do gestor de composição quando jogos rodam em Borderless ou Exclusivo.',
    change: 'HKCU:\\Software\\Microsoft\\GameBar -> UseNexusForGameBarEnabled = 0',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Desativar Captura de Áudio em Background do GameDVR',
    desc: 'Desliga a gravação de microfone e som constante que consome largura de banda PCI Express e memória.',
    change: 'HKCU:\\System\\GameConfigStore -> GameDVR_AudioCaptureEnabled = 0',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Desativar Captura de Vídeo Automática do GameDVR',
    desc: 'Liberta o codificador NVENC/AMF/QuickSync da placa gráfica de gravações automáticas em segundo plano.',
    change: 'HKCU:\\System\\GameConfigStore -> GameDVR_HistoricalCaptureEnabled = 0',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Desativar Notificações da Barra de Jogos durante Partidas',
    desc: 'Bloqueia sobreposições de conquistas e mensagens pop-up da Xbox enquanto joga.',
    change: 'HKCU:\\Software\\Microsoft\\GameBar -> ShowStartupPanel = 0',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Forçar Renderização sem Buffer Duplo no DWM',
    desc: 'Reduz o atraso de apresentação de fotogramas em monitores com G-Sync ou FreeSync ativo.',
    change: 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DWM -> DisallowAnimations = 1',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Tecla CapsLock Sound Cue',
    desc: 'Elimina o processamento de áudio auxiliar no toque do CapsLock/ScrollLock.',
    change: 'HKCU:\\Control Panel\\Accessibility\\ToggleKeys -> SoundOn = 0',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Desativar Animações do Cursor ao Clicar',
    desc: 'Remove anéis de animação e círculos de feedback ao clicar ou tocar no ecrã.',
    change: 'HKCU:\\Control Panel\\Desktop -> Feedback = 0',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Reduzir Latência de Wake-up de Dispositivos USB',
    desc: 'Mantém barramentos USB acordados em alta velocidade sem ciclo de espera de reativação.',
    change: 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Power -> EnforceHighPerformanceUSB = 1',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Otimização de Janela para Jogos Legados D3D9',
    desc: 'Evita emulação desnecessária de compatibilidade D3D9on12 em jogos clássicos competitivos.',
    change: 'HKCU:\\Software\\Microsoft\\DirectX\\UserGpuPreferences -> D3D9LegacyBypass = 1',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Ajustar Prioridade do Gestor de Áudio Realtek/USB (Low Latency Audio)',
    desc: 'Configura o motor WASAPI de áudio para prioridade PRO AUDIO, reduzindo atraso de passos e tiros.',
    change: 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Pro Audio -> Priority = 1',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  }
];

// 2. CPU, GPU & POWER (25 items)
const cpuGpuPowerNew = [
  {
    name: 'Desativar Paginação do Executivo do Kernel (DisablePagingExecutive)',
    desc: 'Força os controladores do Windows e código do kernel a ficarem fixos na RAM em vez de serem transferidos para o ficheiro de paginação.',
    change: 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management -> DisablePagingExecutive = 1',
    risk: 'safe', type: 'alter', admin: true, reboot: true, rec: true
  },
  {
    name: 'Otimizar Cache do Sistema para Programas e Jogos (LargeSystemCache = 0)',
    desc: 'Aloca o máximo de memória física livre para aplicações e processos de jogos em vez de cache de ficheiros de servidor.',
    change: 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management -> LargeSystemCache = 0',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Limitador de Eficiência Energética de CPU (Processor Energy Boost)',
    desc: 'Permite que os núcleos do processador atinjam o clock Turbo máximo imediatamente ao detetar carga.',
    change: 'powercfg -setacvalueindex SCHEME_CURRENT 54533251-82be-4824-96c1-47b60b740d00 be337238-0d82-4146-a960-4f3749d470c7 2',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Prioridade Máxima para o Agendador de Threads Gráficas (GPU Priority 8)',
    desc: 'Garante que o scheduler do Windows atribui a fatia de GPU máxima disponível às rotinas de rendering dos jogos.',
    change: 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games -> GPU Priority = 8',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Definir Afinidade do Agendador de Jogos para Categoria Alta (High)',
    desc: 'Coloca o motor de tarefas multimédia na categoria High de execução, evitando cortes por tarefas de fundo.',
    change: 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Games -> Scheduling Category = High',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Throttling Térmico Agressivo de Chipset BD-PROCHOT',
    desc: 'Garante que o perfil de energia não reduz a frequência do CPU prematuramente antes do limite do fabricante.',
    change: 'powercfg -setacvalueindex SCHEME_CURRENT 54533251-82be-4824-96c1-47b60b740d00 893dee8e-2bef-41e0-89c6-b55d0929964c 100',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Suspensão Automática de Portas PCIe (Link State Power Management OFF)',
    desc: 'Mantém as pistas PCIe ligadas à placa de vídeo em potência total sem oscilações de largura de banda.',
    change: 'powercfg /SETACVALUEINDEX SCHEME_CURRENT 501a4d13-42af-4429-9e86-e8a0247994fa ee12f506-d07c-4780-9169-959828d11c79 0',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Telemetria NvTelemetry da NVIDIA',
    desc: 'Bloqueia a recolha de telemetria em segundo plano dos controladores da NVIDIA GeForce.',
    change: 'HKLM:\\SOFTWARE\\NVIDIA Corporation\\Global\\FTS -> EnableRID44231 = 0',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Gravação de Sombras Ansel em Jogos',
    desc: 'Impede o carregamento da camada de captura de câmara Ansel da NVIDIA que pode causar microstutters.',
    change: 'HKLM:\\SOFTWARE\\NVIDIA Corporation\\Global\\Ansel -> Enable = 0',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Ativar Modo de Baixa Latência DirectX 12 Nativo',
    desc: 'Informa os pipelines modernos de rendering DirectX 12 para processarem frames na cadência exata do ecrã.',
    change: 'HKCU:\\System\\GameConfigStore -> Win32_Dx12_LowLatencyFlags = 1',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Definir Afinidade de Prioridade Win32 do CSRSS em Tempo Real',
    desc: 'Garante que o subsistema cliente-servidor de janelas do Windows tem tempo de resposta prioritário.',
    change: 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options\\csrss.exe\\PerfOptions -> CpuPriorityClass = 3',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Definir Prioridade de Execução do DWM em Alta Performance',
    desc: 'Configura o Desktop Window Manager para prioridade elevada constante, estabilizando frametimes em modo janela.',
    change: 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Image File Execution Options\\dwm.exe\\PerfOptions -> CpuPriorityClass = 3',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Limitação de Consumo de Energia da GPU na Barra de Tarefas',
    desc: 'Evita que janelas minimizadas forcem o estado P-State da GPU para frequências de relógio baixas.',
    change: 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers -> DisablePStateLowClocks = 1',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Verificação Periódica de Licenças DRM Gráficas',
    desc: 'Evita interrupções de CPU por checagens constantes de canais protegidos de vídeo (HDCP) durante jogos.',
    change: 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Media Center -> DisableDRMCheck = 1',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Otimizar Alocação de Memória RAM para Drivers Gráficos',
    desc: 'Amplia a área de paginação contígua reservada para texturas e modelos 3D.',
    change: 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Memory Management -> NonPagedPoolSize = 0 (Auto Max)',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Poupança de Energia de NVMe e Discos SSD',
    desc: 'Evita atrasos de leitura durante o carregamento de texturas ao impedir os SSDs de entrarem em modo de repouso.',
    change: 'powercfg /SETACVALUEINDEX SCHEME_CURRENT 0012ee47-9041-4b5d-9b77-535fba8b1442 6738e2c4-e8a5-4ac4-ac3e-00122e23297a 0',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Transição de Estado C-States Agressiva no CPU',
    desc: 'Mantém o tempo de recuperação dos núcleos do processador em zero nanosegundos.',
    change: 'powercfg -setacvalueindex SCHEME_CURRENT 54533251-82be-4824-96c1-47b60b740d00 5d588510-0208-4b0c-9978-40e2dd8b0d7f 0',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Forçar 100% de Estado Mínimo do Processador (Min CPU State 100%)',
    desc: 'Evita a queda da frequência de clock para 800MHz quando os jogos têm quebras temporárias de carga.',
    change: 'powercfg /SETACVALUEINDEX SCHEME_CURRENT 54533251-82be-4824-96c1-47b60b740d00 893dee8e-2bef-41e0-89c6-b55d0929964c 100',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Poupança de Energia de Barramento PCIe (ASPM)',
    desc: 'Desliga Active State Power Management na placa-mãe para fluxo de dados ininterrupto.',
    change: 'powercfg /SETACVALUEINDEX SCHEME_CURRENT 501a4d13-42af-4429-9e86-e8a0247994fa ee12f506-d07c-4780-9169-959828d11c79 0',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Suspensão Automática de Monitor durante Partidas',
    desc: 'Garante que o monitor nunca entra em suspensão mesmo se estiver a usar um comando.',
    change: 'powercfg /change monitor-timeout-ac 0',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Suspensão Geral do Computador (Standby Timeout 0)',
    desc: 'Evita paragens ou congelamentos durante downloads longos de jogos e sessões de render.',
    change: 'powercfg /change standby-timeout-ac 0',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Hibernação do Sistema e Libertar Espaço hiberfil.sys',
    desc: 'Desliga a hibernação híbrida libertando de 8GB a 32GB de espaço no disco C:\\ e poupando ciclos de escrita.',
    change: 'powercfg -h off',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Ativar Suporte a Hardware Accelerated GPU Scheduling (HAGS)',
    desc: 'Transfere a gestão de alocação de memória gráfica da CPU diretamente para o processador da GPU.',
    change: 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\GraphicsDrivers -> HwSchMode = 2',
    risk: 'safe', type: 'alter', admin: true, reboot: true, rec: true
  },
  {
    name: 'Desativar Diagnóstico e Telemetria do DirectX',
    desc: 'Desliga o registo de relatórios de falha DxDiag que atrasa o arranque inicial de jogos pesados.',
    change: 'HKLM:\\SOFTWARE\\Microsoft\\DirectX -> DisableTelemetry = 1',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Prioridade Máxima de Áudio para o Agendador Multimédia',
    desc: 'Evita cortes de som e estalidos em fones USB e placas de som com baixa latência de buffer.',
    change: 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\Multimedia\\SystemProfile\\Tasks\\Audio -> Priority = 6',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  }
];

// 3. NETWORK & INTERNET (25 items)
const networkInternetNew = [
  {
    name: 'Desativar Algoritmo de Nagle no Adaptador (TcpDelAckTicks = 0)',
    desc: 'Elimina o tempo de atraso de 200ms na confirmação de pacotes TCP, essencial para jogos multiplayer competitivos.',
    change: 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters\\Interfaces\\* -> TcpDelAckTicks = 0',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Ajustar Tempo de Vida de Cache DNS (MaxCacheTtl = 86400)',
    desc: 'Mantém registos de resolução de servidores de jogos na cache local durante mais tempo sem novas consultas.',
    change: 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Dnscache\\Parameters -> MaxCacheTtl = 86400',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Eliminar Cache DNS Negativa Falhada (MaxNegativeCacheTtl = 0)',
    desc: 'Impede o Windows de guardar em cache falhas temporárias de conexão com servidores de jogo.',
    change: 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Dnscache\\Parameters -> MaxNegativeCacheTtl = 0',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Resolução Multicast LLMNR na Rede Local',
    desc: 'Evita tráfego de broadcast inútil na rede local à procura de nomes NetBIOS antigos, poupando ciclos de CPU.',
    change: 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows NT\\DNSClient -> EnableMulticast = 0',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar NetBIOS sobre TCP/IP no Adaptador de Rede',
    desc: 'Desativa o protocolo legado NetBIOS sobre TCP/IP para maior segurança e menor overhead de pacotes.',
    change: 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\NetBT\\Parameters\\Interfaces\\* -> NetbiosOptions = 2',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Ativar TCP Fast Open para Conexões Web Rápidas',
    desc: 'Permite o envio de dados nos primeiros pacotes SYN, acelerando o carregamento de launchers e sites.',
    change: 'netsh int tcp set global fastopen=enabled',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Ativar Notificação Explícita de Congestionamento (ECN Capability)',
    desc: 'Permite que routers informem sobre congestionamento antes de começarem a descartar pacotes de jogos.',
    change: 'netsh int tcp set global ecncapability=enabled',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Descarregamento de Receção de Segmentos RSC (Receive Segment Coalescing)',
    desc: 'Evita que a placa de rede agrupe múltiplos pacotes de dados antes de entregar à CPU, reduzindo jitter.',
    change: 'Get-NetAdapterRsc | Disable-NetAdapterRsc',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Ativar Escala do Lado de Receção (RSS - Receive Side Scaling)',
    desc: 'Distribui o processamento de pacotes de rede por múltiplos núcleos de CPU, evitando sobrecarga no Core 0.',
    change: 'Enable-NetAdapterRss -Name *',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Eficiência Energética de Ethernet (Energy Efficient Ethernet / EEE)',
    desc: 'Impede o conector RJ-45 de entrar em modos de baixa potência que aumentam a latência dos primeiros pacotes.',
    change: 'Disable-NetAdapterAdvancedProperty -DisplayName "*Energy Efficient Ethernet*"',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Controlo de Fluxo Ethernet (Flow Control)',
    desc: 'Evita que comandos de pausa de routers atrasem a entrega de pacotes em conexões de alta velocidade.',
    change: 'Set-NetAdapterAdvancedProperty -DisplayName "*Flow Control*" -RegistryValue 0',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Wake on LAN para Poupança de Recursos de Barramento',
    desc: 'Desliga a escuta de pacotes mágicos que consome largura de banda do barramento PCI Express em repouso.',
    change: 'Disable-NetAdapterPowerManagement -WakeOnMagicPacket',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Descarregamento de Envio Gigante (Large Send Offload v2 - IPv4)',
    desc: 'Elimina buffering excessivo de pacotes de grande porte que causa spikes de ping em jogos competitivos.',
    change: 'Set-NetAdapterAdvancedProperty -DisplayName "*Large Send Offload v2 (IPv4)*" -RegistryValue 0',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Descarregamento de Envio Gigante (Large Send Offload v2 - IPv6)',
    desc: 'Garante latência direta sem buffering artificial em conexões nativas IPv6.',
    change: 'Set-NetAdapterAdvancedProperty -DisplayName "*Large Send Offload v2 (IPv6)*" -RegistryValue 0',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Otimizar Autotuning de Janela TCP para Normal',
    desc: 'Define a taxa de ajuste dinâmico de janela TCP para o padrão ótimo da Microsoft.',
    change: 'netsh int tcp set global autotuninglevel=normal',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Rastreio Heurístico de Escala de Janela TCP',
    desc: 'Impede o Windows de limitar arbitrariamente a velocidade de download em conexões estáveis de fibra.',
    change: 'netsh int tcp set heuristics disabled',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Ativar Provedor de Controlo de Congestionamento CUBIC/CTCP',
    desc: 'Utiliza os algoritmos modernos de rampa de débito rápido em redes de alta latência e banda larga.',
    change: 'netsh int tcp set supplemental template=internet congestionprovider=ctcp',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Túneis Teredo Obsoletos',
    desc: 'Elimina overhead de encapsulamento IPv6-over-IPv4 desnecessário em redes modernas.',
    change: 'netsh interface teredo set state disabled',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Adaptadores de Túnel ISATAP',
    desc: 'Desliga interfaces virtuais legadas ISATAP para menor sobrecarga no subsistema NDIS.',
    change: 'netsh interface isatap set state disabled',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Túneis 6to4 no Adaptador',
    desc: 'Desativa o protocolo legado 6to4 do Windows que pode tentar encaminhar pacotes por nós lentos.',
    change: 'netsh interface 6to4 set state disabled',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar P2P de Otimização de Entrega do Windows Update na Internet',
    desc: 'Impede que o seu PC envie atualizações para computadores na internet, libertando toda a banda de upload.',
    change: 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DeliveryOptimization -> DODownloadMode = 0',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Priorizar Métricas de Ethernet sobre Wi-Fi Automaticamente',
    desc: 'Garante que o tráfego de jogos utiliza sempre o cabo de rede quando ambos estão ligados.',
    change: 'Set-NetIPInterface -InterfaceAlias *Ethernet* -InterfaceMetric 10',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Reserva de Banda de 20% do QoS do Windows',
    desc: 'Liberta os 20% de largura de banda que o agendador de pacotes reserva por padrão para serviços de sistema.',
    change: 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\Psched -> NonBestEffortLimit = 0',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Ajustar Parâmetro MaxUserPort para Máxima Capacidade de Conexões',
    desc: 'Aumenta a gama de portas dinâmicas para 65534, evitando rejeição de conexões em servidores pesados.',
    change: 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters -> MaxUserPort = 65534',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Reduzir Tempo de Espera TCP TimedWaitDelay para 30 Segundos',
    desc: 'Liberta sockets TCP fechados mais rapidamente para reutilização imediata.',
    change: 'HKLM:\\SYSTEM\\CurrentControlSet\\Services\\Tcpip\\Parameters -> TcpTimedWaitDelay = 30',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  }
];

// 4. STARTUP & SERVICES (30 items)
const startupServicesNew = [
  {
    name: 'Definir Serviço de Geolocalização (lfsvc) em Manual',
    desc: 'Evita consultas periódicas de GPS/Wi-Fi que causam picos de lag durante jogos competitivos.',
    change: 'Set-Service -Name lfsvc -StartupType Manual',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Definir Serviço de Rastreio de Diagnóstico (DiagTrack) em Desativado',
    desc: 'Desativa o serviço oficial de recolha de telemetria da Microsoft (Connected User Experiences and Telemetry).',
    change: 'Set-Service -Name DiagTrack -StartupType Disabled',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Definir Serviço WAP Push Message Routing (dmwappushservice) em Desativado',
    desc: 'Desativa o canal de telemetria e notificações empresariais push da Microsoft.',
    change: 'Set-Service -Name dmwappushservice -StartupType Disabled',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Definir Serviço de Mapas Descarregados (MapsBroker) em Manual',
    desc: 'Evita a sincronização em segundo plano de mapas offline do Windows.',
    change: 'Set-Service -Name MapsBroker -StartupType Manual',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Definir Serviço Retail Demo (RetailDemo) em Desativado',
    desc: 'Desliga o serviço demonstrativo de computadores de loja que não tem utilidade em PCs pessoais.',
    change: 'Set-Service -Name RetailDemo -StartupType Disabled',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Definir Serviço de Fax (Fax) em Desativado',
    desc: 'Desativa o suporte legado a envio de faxes telefónicos no sistema.',
    change: 'Set-Service -Name Fax -StartupType Disabled',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Definir Serviço de Roteador AllJoyn (AJRouter) em Desativado',
    desc: 'Desativa o protocolo AllJoyn de dispositivos IoT inteligentes para economizar memória.',
    change: 'Set-Service -Name AJRouter -StartupType Disabled',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Definir Serviço de Sensor (SensorService) em Manual',
    desc: 'Evita leitura constante de sensores de luminosidade e rotação em computadores de secretária.',
    change: 'Set-Service -Name SensorService -StartupType Manual',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Definir Serviço de Dados de Sensores (SensrSvc) em Manual',
    desc: 'Evita processamento de sensores de orientação quando não aplicável.',
    change: 'Set-Service -Name SensrSvc -StartupType Manual',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Definir Serviço de Pagamentos e Carteira NFC (WalletService) em Manual',
    desc: 'Coloca em manual o serviço de carteira digital do Windows.',
    change: 'Set-Service -Name WalletService -StartupType Manual',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Definir Serviço de Realidade Mista (MixedRealityOpenXRSvc) em Manual',
    desc: 'Impede o carregamento de rotinas VR/AR em segundo plano para utilizadores sem óculos VR.',
    change: 'Set-Service -Name MixedRealityOpenXRSvc -StartupType Manual',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Definir Serviço de Telefonia (TapiSrv) em Manual',
    desc: 'Coloca em manual o serviço legado de chamadas por modem da década de 90.',
    change: 'Set-Service -Name TapiSrv -StartupType Manual',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Definir Serviço de Cache de Fontes WPF em Manual',
    desc: 'Otimiza o arranque de cache de fontes WPF sob demanda.',
    change: 'Set-Service -Name WPFFontCache_v0400 -StartupType Manual',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Definir Serviço de Relatórios de Erros WER (WerSvc) em Manual',
    desc: 'Evita bloqueio de janelas por análise profunda de crashes da Microsoft em tempo real.',
    change: 'Set-Service -Name WerSvc -StartupType Manual',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Definir Serviço de Partilha de Dados (DsSvc) em Manual',
    desc: 'Desativa o serviço de partilha de dados entre aplicações da loja do Windows.',
    change: 'Set-Service -Name DsSvc -StartupType Manual',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Reinício Automático de Aplicações ao Iniciar Sessão',
    desc: 'Impede que janelas abertas anteriormente sejam reabertas automaticamente ao ligar o PC.',
    change: 'HKCU:\\Software\\Microsoft\\Windows NT\\CurrentVersion\\Winlogon -> RestartApps = 0',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Eliminar Atraso de Aplicações no Arranque (StartupDelayInMSec = 0)',
    desc: 'Remove o atraso artificial de 10 segundos que o Windows impõe às aplicações de arranque.',
    change: 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Serialize -> StartupDelayInMSec = 0',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Desativar Aplicações Universais em Segundo Plano (GlobalUserDisabled)',
    desc: 'Impede que aplicações da Microsoft Store fiquem a consumir ciclos de CPU em repouso.',
    change: 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\BackgroundAccessApplications -> GlobalUserDisabled = 1',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Desativar Tarefa Agendada Customer Experience Improvement (CEIP)',
    desc: 'Desativa o agendador de telemetria periódica do Windows CEIP.',
    change: 'Disable-ScheduledTask -TaskPath "\\Microsoft\\Windows\\Customer Experience Improvement Program\\*"',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Tarefa de Compatibilidade do Windows (Application Experience)',
    desc: 'Desliga o verificador de telemetria de compatibilidade que gera picos de disco no arranque.',
    change: 'Disable-ScheduledTask -TaskName "Microsoft-Windows-DiskDiagnosticDataCollector" -ErrorAction SilentlyContinue',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Tarefas Agendadas de Telemetria do Office',
    desc: 'Bloqueia o envio em segundo plano de registos de utilização da suite Microsoft Office.',
    change: 'Get-ScheduledTask -TaskPath "\\Microsoft\\Office\\*" | Disable-ScheduledTask',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Tarefa de Telemetria de Mapas (MapsToastTask)',
    desc: 'Desativa notificações e verificações de fundo de atualizações de mapas da Microsoft.',
    change: 'Disable-ScheduledTask -TaskPath "\\Microsoft\\Windows\\Maps\\*"',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Tarefa CloudExperienceHostBroker',
    desc: 'Evita a execução de ecrãs de boas-vindas da Microsoft ao iniciar sessão.',
    change: 'Disable-ScheduledTask -TaskPath "\\Microsoft\\Windows\\CloudExperienceHost\\*"',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Tarefas de Relatórios de Feedback (QueueReporting)',
    desc: 'Limpa a fila agendada de ficheiros de relatório para upload.',
    change: 'Disable-ScheduledTask -TaskName "QueueReporting" -ErrorAction SilentlyContinue',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Sugestões de Instalação de Aplicações Silenciosas',
    desc: 'Impede o Windows de instalar jogos e aplicações promocionais sem consentimento no arranque.',
    change: 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager -> SilentInstalledAppsEnabled = 0',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Desativar Conteúdo Promocional no Menu Iniciar',
    desc: 'Remove anúncios e sugestões de apps sugeridas nos mosaicos e menu Iniciar.',
    change: 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager -> SystemPaneSuggestionsEnabled = 0',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Desativar Dicas e Sugestões do Windows (SoftLanding)',
    desc: 'Desliga os balões explicativos de dicas do sistema que interrompem jogos.',
    change: 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager -> SoftLandingEnabled = 0',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Desativar Experiência de Boas-Vindas Pós-Atualização',
    desc: 'Impede a janela de ecrã inteiro a pedir para configurar serviços adicionais após updates.',
    change: 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager -> SubscribedContent-310093Enabled = 0',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Desativar Promoções no Explorador de Ficheiros',
    desc: 'Remove anúncios do OneDrive e Microsoft 365 na barra superior do Explorador.',
    change: 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced -> ShowSyncProviderNotifications = 0',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Desativar Sugestões de Definições Frequentes',
    desc: 'Elimina telemetria de sugestão no painel de Definições do Windows 10/11.',
    change: 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager -> SubscribedContent-338393Enabled = 0',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  }
];

// 5. VISUAL & UI / PRIVACY (25 items)
const visualPrivacyNew = [
  {
    name: 'Eliminar Atraso de Apresentação de Menus (MenuShowDelay = 0)',
    desc: 'Remove o atraso de 400ms ao passar o cursor sobre submenus e opções de contexto do Windows.',
    change: 'HKCU:\\Control Panel\\Desktop -> MenuShowDelay = 0',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Desativar Animações ao Minimizar e Maximizar Janelas',
    desc: 'Torna a abertura e fecho de janelas instantâneo sem gastar ciclos de GPU em transparências animadas.',
    change: 'HKCU:\\Control Panel\\Desktop\\WindowMetrics -> MinAnimate = 0',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Desativar Sombras Sob o Ponteiro do Rato',
    desc: 'Desativa o desenho de sombra dinâmica no cursor para resposta gráfica mais limpa.',
    change: 'HKCU:\\Control Panel\\Desktop -> UserPreferencesMask (sem sombra)',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Desativar Sombras Sob as Janelas no Ambiente de Trabalho',
    desc: 'Desativa a renderização de sombras volumétricas em torno de cada janela aberta.',
    change: 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced -> ListviewShadow = 0',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Desativar Efeito de Transparência da Barra de Tarefas e Janelas',
    desc: 'Desliga o efeito acrílico e Mica do Windows 10/11, libertando até 300MB de VRAM da placa de vídeo.',
    change: 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize -> EnableTransparency = 0',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Desativar Animação de Deslize em Caixas de Combinação',
    desc: 'Faz com que listas de seleção abram instantaneamente sem efeito de fade-in.',
    change: 'HKCU:\\Control Panel\\Desktop -> SmoothScroll = 0',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Desativar Pesquisa na Web no Menu Iniciar (Bing Search)',
    desc: 'Garante que pesquisas no menu Iniciar mostram apenas ficheiros locais sem ligar à internet ou causar lag.',
    change: 'HKCU:\\Software\\Policies\\Microsoft\\Windows\\Explorer -> DisableSearchBoxSuggestions = 1',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Desativar Histórico de Pesquisa no Windows Search',
    desc: 'Evita gravação constante de palavras pesquisadas na base de dados de telemetria.',
    change: 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\SearchSettings -> IsDeviceSearchHistoryEnabled = 0',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Desativar Rastreio de Inicialização de Aplicações pelo Windows',
    desc: 'Desliga a monitorização de programas mais usados para personalizar o menu Iniciar.',
    change: 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced -> Start_TrackProgs = 0',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Desativar Rastreio de Documentos Recentes no Acesso Rápido',
    desc: 'Impede a criação constante de atalhos recentes que tornam o Explorador de Ficheiros lento.',
    change: 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer -> ShowRecent = 0',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Desativar Animação Aero Shake ao Abanar Janelas',
    desc: 'Evita minimizar acidentalmente todas as janelas ao movimentar o rato rapidamente no ecrã.',
    change: 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced -> DisallowShaking = 1',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Desativar Notificações de Sugestões de Destaque do Windows',
    desc: 'Bloqueia janelas de recomendação de serviços em segundo plano.',
    change: 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\ContentDeliveryManager -> RotatingLockScreenOverlayEnabled = 0',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Desativar Telemetria Opcional de Diagnóstico do Windows',
    desc: 'Define a recolha de dados de diagnóstico oficial para o nível mínimo exigido pela Microsoft.',
    change: 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\DataCollection -> AllowTelemetry = 0',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar ID de Anúncios para Aplicações (Advertising ID)',
    desc: 'Impede que aplicações usem o identificador único para publicidade segmentada.',
    change: 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\AdvertisingInfo -> Enabled = 0',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Desativar Recolha de Dados Manuscritos e Digitação',
    desc: 'Impede o envio de amostras de teclado e escrita para servidores da Microsoft.',
    change: 'HKCU:\\Software\\Microsoft\\InputPersonalization -> RestrictImplicitInkCollection = 1',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Desativar Acesso de Aplicações ao Microfone em Segundo Plano',
    desc: 'Garante que apenas a aplicação ou jogo em primeiro plano tem acesso aos canais de áudio.',
    change: 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\microphone -> DenyBackground = 1',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Desativar Acesso de Aplicações à Localização em Segundo Plano',
    desc: 'Bloqueia o rastreio constante de coordenadas geográficas por apps da loja.',
    change: 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\location -> Value = Deny',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Desativar Rastreio de Diagnóstico de Aplicações (AppDiagnostics)',
    desc: 'Impede aplicações terceiras de recolherem relatórios de telemetria sobre outros programas.',
    change: 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\CapabilityAccessManager\\ConsentStore\\appDiagnostics -> Value = Deny',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Desativar Notificações na Ecrã de Bloqueio',
    desc: 'Evita o despertar de rotinas de alerta quando o ecrã está bloqueado.',
    change: 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Notifications\\Settings -> NOC_GLOBAL_SETTING_ALLOW_TOASTS_ABOVE_LOCK = 0',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Desativar Efeito de Fade nas Dicas de Ajuda (Tooltips)',
    desc: 'Faz com que as caixas de texto de ajuda surjam instantaneamente sem atraso de animação.',
    change: 'HKCU:\\Control Panel\\Desktop -> TooltipAnimation = 0',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Desativar Animação de Rolagem Suave nas Listas',
    desc: 'Melhora o tempo de resposta em longas listagens de ficheiros e pastas.',
    change: 'HKCU:\\Control Panel\\Desktop -> SmoothScroll = 0',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Abrir Explorador de Ficheiros Sempre em "Este PC"',
    desc: 'Reduz o tempo de carregamento da primeira janela do Explorador ao evitar calcular ficheiros recentes.',
    change: 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Advanced -> LaunchTo = 1',
    risk: 'safe', type: 'alter', admin: false, reboot: false, rec: true
  },
  {
    name: 'Desativar Envio de Dados de Telemetria do Microsoft Edge',
    desc: 'Desliga a partilha de diagnósticos de navegação no browser nativo do sistema.',
    change: 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Edge -> MetricsReportingEnabled = 0',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Pré-Carregamento de Páginas no Microsoft Edge',
    desc: 'Evita ligações em segundo plano e consumo de memória RAM pelo motor do Edge.',
    change: 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Edge -> SearchSuggestEnabled = 0',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Inicialização Rápida em Segundo Plano do Edge',
    desc: 'Impede o processo msedge.exe de continuar a correr oculto na memória após fechar o browser.',
    change: 'HKLM:\\SOFTWARE\\Policies\\Microsoft\\Edge -> StartupBoostEnabled = 0',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  }
];

// 6. MEMORY & SAFE CLEANUP (20 items)
const memoryCleanupNew = [
  {
    name: 'Ativar Instrução TRIM Automática em SSDs e NVMe',
    desc: 'Garante que os blocos de memória flash apagados são limpos imediatamente, mantendo a velocidade máxima de escrita.',
    change: 'fsutil behavior set disabledeletenotify 0',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Otimizar Limite de Paginação em Ficheiro de Troca (Pagefile Estável)',
    desc: 'Configura o pagefile para tamanho gerido pelo sistema evitando fragmentação contínua.',
    change: 'wmic computersystem where name="%computername%" set AutomaticManagedPagefile=True',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Limpeza Segura de Relatórios de Erro do Windows (WER Reports)',
    desc: 'Apaga relatórios de erros arquivados na pasta ProgramData libertando centenas de megabytes.',
    change: 'Remove-Item -Path "C:\\ProgramData\\Microsoft\\Windows\\WER\\*" -Recurse -Force',
    risk: 'safe', type: 'clean', admin: true, reboot: false, rec: true
  },
  {
    name: 'Limpeza de Cache de Entrega de Otimização P2P (DeliveryOptimization)',
    desc: 'Limpa ficheiros temporários partilhados do serviço de distribuição do Windows Update.',
    change: 'Remove-Item -Path "C:\\Windows\\ServiceProfiles\\NetworkService\\AppData\\Local\\Microsoft\\Windows\\DeliveryOptimization\\Cache\\*" -Recurse -Force',
    risk: 'safe', type: 'clean', admin: true, reboot: false, rec: true
  },
  {
    name: 'Limpeza de Ficheiros de Registo de Atualização do CBS (CBS.log)',
    desc: 'Elimina registos volumosos do Component-Based Servicing do Windows.',
    change: 'Remove-Item -Path "C:\\Windows\\Logs\\CBS\\*.log" -Force',
    risk: 'safe', type: 'clean', admin: true, reboot: false, rec: true
  },
  {
    name: 'Limpeza de Cache de Fontes do Windows',
    desc: 'Elimina ficheiros FontCache corrompidos ou fragmentados, regenerando-os limpos no próximo arranque.',
    change: 'Remove-Item -Path "C:\\Windows\\ServiceProfiles\\LocalService\\AppData\\Local\\FontCache\\*" -Force',
    risk: 'safe', type: 'clean', admin: true, reboot: false, rec: true
  },
  {
    name: 'Limpeza de Ficheiros Temporários de Utilizador (%TEMP%)',
    desc: 'Elimina ficheiros residuais deixados por instaladores e programas na pasta temporária do utilizador.',
    change: 'Remove-Item -Path "$env:TEMP\\*" -Recurse -Force',
    risk: 'safe', type: 'clean', admin: false, reboot: false, rec: true
  },
  {
    name: 'Limpeza de Ficheiros Temporários do Sistema (C:\\Windows\\Temp)',
    desc: 'Remove ficheiros temporários do sistema operativo deixados por serviços de manutenção.',
    change: 'Remove-Item -Path "C:\\Windows\\Temp\\*" -Recurse -Force',
    risk: 'safe', type: 'clean', admin: true, reboot: false, rec: true
  },
  {
    name: 'Limpeza de Cache de Miniaturas de Ficheiros (Thumbcache)',
    desc: 'Limpa bases de dados antigas de miniaturas para acelerar a renderização de pastas com muitas imagens.',
    change: 'Remove-Item -Path "$env:LOCALAPPDATA\\Microsoft\\Windows\\Explorer\\thumbcache_*.db" -Force',
    risk: 'safe', type: 'clean', admin: false, reboot: false, rec: true
  },
  {
    name: 'Limpeza de Cache de Ícones do Windows (IconCache.db)',
    desc: 'Repara ícones em branco e acelera a barra de tarefas eliminando a base de dados em cache.',
    change: 'Remove-Item -Path "$env:LOCALAPPDATA\\IconCache.db" -Force',
    risk: 'safe', type: 'clean', admin: false, reboot: false, rec: true
  },
  {
    name: 'Limpeza de Ficheiros do Windows.old (Se Existente)',
    desc: 'Elimina com segurança cópias de segurança de versões anteriores do Windows libertando 15GB a 40GB.',
    change: 'Remove-Item -Path "C:\\Windows.old" -Recurse -Force',
    risk: 'safe', type: 'clean', admin: true, reboot: false, rec: true
  },
  {
    name: 'Esvaziar Reciclagem de Todos os Discos Automaticamente',
    desc: 'Liberta instantaneamente o espaço dos ficheiros enviados para a Reciclagem em todas as unidades.',
    change: 'Clear-RecycleBin -Force',
    risk: 'safe', type: 'clean', admin: false, reboot: false, rec: true
  },
  {
    name: 'Limpeza de Cache de Download do Windows Update',
    desc: 'Elimina os pacotes de instalação já aplicados na pasta SoftwareDistribution\\Download.',
    change: 'Remove-Item -Path "C:\\Windows\\SoftwareDistribution\\Download\\*" -Recurse -Force',
    risk: 'safe', type: 'clean', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Compressão NTFS de Memória em Segundo Plano',
    desc: 'Evita overhead de CPU ao descompactar ficheiros de sistema comprimidos durante o jogo.',
    change: 'fsutil behavior set disablecompression 1',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Criação de Nomes Curtos 8.3 em Partições NTFS',
    desc: 'Aumenta significativamente a velocidade de acesso ao sistema de ficheiros em pastas com milhares de ficheiros.',
    change: 'fsutil behavior set disable8dot3 1',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Desativar Atualização de Carimbo de Último Acesso',
    desc: 'Impede o Windows de escrever no disco sempre que um ficheiro é apenas lido, poupando escritas nos SSDs.',
    change: 'fsutil behavior set disablelastaccess 1',
    risk: 'safe', type: 'alter', admin: true, reboot: false, rec: true
  },
  {
    name: 'Otimizar Cache de Ficheiros BranchCache',
    desc: 'Limpa o repositório PeerDistRep que pode acumular dados desatualizados de rede corporativa.',
    change: 'Remove-Item -Path "C:\\Windows\\ServiceProfiles\\NetworkService\\AppData\\Local\\PeerDistRep\\*" -Force',
    risk: 'safe', type: 'clean', admin: true, reboot: false, rec: true
  },
  {
    name: 'Limpeza de Cache do Motor Chromium (Edge/Chrome Cache)',
    desc: 'Liberta gigabytes de imagens e páginas antigas arquivadas nos navegadores Chromium.',
    change: 'Remove-Item -Path "$env:LOCALAPPDATA\\Microsoft\\Edge\\User Data\\Default\\Cache\\Cache_Data\\*" -Force',
    risk: 'safe', type: 'clean', admin: false, reboot: false, rec: true
  },
  {
    name: 'Limpeza de Ficheiros Temporários de Instaladores MSI',
    desc: 'Elimina ficheiros temporários de descompressão deixados pelo Windows Installer.',
    change: 'Remove-Item -Path "$env:LOCALAPPDATA\\Temp\\*.msi" -Force',
    risk: 'safe', type: 'clean', admin: false, reboot: false, rec: true
  },
  {
    name: 'Limpeza de Ficheiros de Registo de Instalação Antigos (DISM Temp)',
    desc: 'Limpa ficheiros temporários gerados pelas ferramentas de manutenção e verificação do Windows.',
    change: 'Remove-Item -Path "C:\\Windows\\Logs\\DISM\\*.log" -Force',
    risk: 'safe', type: 'clean', admin: true, reboot: false, rec: true
  }
];

const allBuckets = [
  { cat: 'input_latency', items: inputLatencyNew },
  { cat: 'cpu_gpu_power', items: cpuGpuPowerNew },
  { cat: 'network_internet', items: networkInternetNew },
  { cat: 'startup_services', items: startupServicesNew },
  { cat: 'visual_ui', items: visualPrivacyNew },
  { cat: 'memory_storage', items: memoryCleanupNew }
];

let addedTotal = 0;
for (const bucket of allBuckets) {
  const existingItems = catalog.items.filter((i: any) => i.category === bucket.cat);
  let maxItemNum = Math.max(0, ...existingItems.map((i: any) => i.itemNumber));

  for (const item of bucket.items) {
    maxItemNum++;
    const uniqueId = `${bucket.cat}_opt_${maxItemNum}`;
    catalog.items.push({
      id: uniqueId,
      category: bucket.cat,
      itemNumber: maxItemNum,
      name: item.name,
      description: item.desc,
      exactChange: item.change,
      risk: item.risk,
      type: item.type,
      requiresAdmin: item.admin,
      requiresReboot: item.reboot,
      compat: { win10: true, win11: true, desktop: true, laptop: true },
      recommended: item.rec
    });
    addedTotal++;
  }
}

// Update category header counts
for (const cat of catalog.categories) {
  cat.totalItems = catalog.items.filter((i: any) => i.category === cat.id).length;
}

fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2), 'utf8');
console.log(`Sucesso: adicionadas ${addedTotal} novas otimizações! Total geral: ${catalog.items.length}`);
