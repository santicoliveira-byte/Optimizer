# ⚡ Optimizer - Windows 10/11 Performance, Gaming & Hardware Suite

<p align="center">
  <img src="public/favicon.ico" alt="Optimizer Logo" width="84" height="84" />
</p>

<p align="center">
  <strong>A Suite Desktop Definitiva de Desempenho, Input Lag Zero e Telemetria para Jogadores e Entusiastas no Windows 10 e 11.</strong><br>
  364 Otimizações de Sistema, HUD Overlay em Jogo, Benchmark de FPS com 1% Lows, Calculador G-Sync Anti-Lag, Process Lasso e Blindagem de Segurança Enterprise.
</p>

<p align="center">
  <a href="https://github.com/santicoliveira-byte/Optimizer/releases/latest"><img src="https://img.shields.io/badge/Download-Optimizer--Setup.exe-6366f1?style=for-the-badge&logo=windows&logoColor=white" alt="Download Setup"></a>
  <a href="https://github.com/santicoliveira-byte/Optimizer/releases/latest"><img src="https://img.shields.io/badge/Download-Optimizer--Portable.exe-10b981?style=for-the-badge&logo=windows&logoColor=white" alt="Download Portable"></a>
  <img src="https://img.shields.io/badge/Windows-10%20%7C%2011%20x64-0078D6?style=for-the-badge&logo=windows" alt="Windows 10/11">
  <img src="https://img.shields.io/badge/Testes-81%20Passed-success?style=for-the-badge" alt="81 Tests Passed">
  <img src="https://img.shields.io/badge/Segurança-CSP%20Hardened-blueviolet?style=for-the-badge&logo=shield" alt="CSP Shield">
  <img src="https://img.shields.io/badge/Idiomas-PT%20%7C%20EN%20%7C%20ES-amber?style=for-the-badge" alt="Multi-language">
</p>

---

## 📥 Opções de Download e Instalação

Podes descarregar a versão mais recente diretamente na secção de [**Releases no GitHub**](https://github.com/santicoliveira-byte/Optimizer/releases):

| Opção | Ficheiro | Descrição |
| :--- | :--- | :--- |
| **Instalador Oficial (Recomendado)** | `Optimizer-Setup.exe` | Assistente NSIS com criação automática de atalhos no Ambiente de Trabalho e Menu Iniciar, integração de arranque e desinstalador limpo. |
| **Versão Portátil (Zero-Install)** | `Optimizer-Portable.exe` | Executável único autónomo. Não necessita de instalação — executa imediatamente onde estiver (USB, disco externo, pasta local). |

> [!NOTE]
> Executa sempre o Optimizer como **Administrador** para permitir a aplicação de prioridades de CPU, MSI Mode em GPU/Rede, resolução de timer de 0.5ms e gestão de serviços do Windows.

---

## 🎮 Funcionalidades Gaming Exclusivas

### 1. In-Game HUD Overlay Ultra-Leve (`Alt + O`)
- Painel flutuante de telemetria com consumo de CPU/GPU inferior a 0.5%.
- **Posicionamento Livre por Arrastamento (Drag & Drop)**: Arrasta para qualquer ponto do ecrã com memorização automática de coordenadas.
- **3 Formatos Geométricos**: Barra Horizontal compacta, Widget Vertical estilo eSports ou Micro-Barra Minimalista.
- **Modo Fantasma (`Alt + G`)**: Torna o HUD 100% transparente aos cliques do rato, garantindo que miras e disparos em jogos competitivos passam diretamente ao motor 3D.
- **Suporte Nativo a Jogos em Tela Cheia**: Integração com DirectFlip / MPO do Windows para o HUD nunca desaparecer atrás de jogos em Fullscreen exclusivo.

### 2. Gravador de Benchmark de FPS & Frametime (`Alt + B`)
- Inicia e para a gravação durante qualquer partida premindo `Alt + B` ou através do botão na UI.
- Indicador visual em tempo real no HUD: `🔴 REC 00:24`.
- **Métricas Avançadas de Fluidez**:
  - FPS Médio, FPS Mínimo e FPS Máximo.
  - **1% Low FPS** e **0.1% Low FPS** (deteção de micro-engasgos / micro-stutters).
  - Frametime médio em milissegundos e Desvio Padrão.
  - **Pontuação de Estabilidade %** e Classificação Global (`S+`, `A`, `B`, `C`, `D`).
- **Histórico & Comparativo Antes vs Depois**: Compara automaticamente o teu desempenho antes e depois de aplicar as otimizações.
- **Exportação para CSV**: Exporta todo o histórico para folha de cálculo com 1 clique.

### 3. Calculador & Sincronizador G-Sync / FreeSync Anti-Lag
- Deteta automaticamente a taxa de atualização nativa do teu monitor (60Hz, 144Hz, 165Hz, 240Hz, 360Hz, etc.).
- Calcula o teto ideal de FPS (ex.: `141 FPS` para 144Hz; `237 FPS` para 240Hz) de acordo com o padrão de engenharia da Blur Busters.
- Aplicação com 1 clique diretamente nas configurações de jogos e drivers gráficos.

---

## ⚡ Motores de Otimização do Sistema

```
┌────────────────────────────────────────────────────────────────────────┐
│                        OPTIMIZER ENGINE SUITE                          │
├──────────────────┬──────────────────┬─────────────────┬────────────────┤
│   364 TWEAKS     │   GAME BOOSTER   │   REDE & DNS    │  RIG-Z & CPU-Z │
├──────────────────┼──────────────────┼─────────────────┼────────────────┤
│ • Input Lag Zero │ • Process Lasso  │ • QoS DSCP 46   │ • Inspetor SPD │
│ • Timer 0.500ms  │ • P-Cores Lock   │ • Benchmark DNS │ • Multi-Thread │
│ • MSI Mode (GPU) │ • Daemon em Tray │ • Wi-Fi 6 Gaming│ • Teste Caches │
│ • Shaders Cache  │ • Auto-Overlay   │ • Anti-Buffer   │ • Gargalo CPU  │
└──────────────────┴──────────────────┴─────────────────┴────────────────┘
```

1. **Catálogo de 364 Otimizações Reversíveis**:
   - Resolução de Timer de Alta Precisão (0.500 ms contínuo).
   - Otimizações de Registry para Windows 10 e 11 sem telemetria nem bloatware.
   - Otimizador de perfis de energia escondidos (Ultimate Performance).
2. **Process Lasso & Afinidade de CPU**:
   - Bloqueio de processos de jogos aos núcleos de alto desempenho (P-Cores) em CPUs Intel híbridos (12ª a 14ª geração) e AMD Ryzen X3D.
   - Prioridade de CPU em tempo real e isolamento de I/O.
3. **MSI Utility (Message Signaled Interrupts)**:
   - Configura interrupções MSI baseadas em vetores PCI para a Placa Gráfica (NVIDIA/AMD) e Controladores de Rede Ethernet, reduzindo DPC Latency e stutters.
4. **QoS Routing & Otimizador de Rede**:
   - Marcação de pacotes com **DSCP 46 (Expedited Forwarding)** para títulos competitivos (CS2, Valorant, Fortnite, Warzone, Apex, LoL, Rocket League).
   - Teste comparativo de servidores DNS (Cloudflare, Google, Quad9, OpenDNS) com medição de latência em milissegundos e aplicação instantânea.
5. **Debloater UWP & Limpeza Profunda**:
   - Remoção de aplicações desnecessárias em segundo plano (Cortana, OneDrive Sync, Bing News/Weather, Xbox Game Bar Overlay).
   - Limpeza de caches de shaders DirectX (NVIDIA DXCache / AMD / D3DSCache) e libertação de RAM Standby List.
6. **Proteção Total com Pontos de Restauro**:
   - Motor de salvaguarda integrado com criação automática de Ponto de Restauro do Windows e backups de chave de registo antes de qualquer alteração.

---

## ⌨️ Atalhos Rápidos Globais

| Atalho | Ação | Descrição |
| :--- | :--- | :--- |
| **`Alt + O`** | **Alternar HUD Overlay** | Abre ou oculta o painel flutuante de telemetria em cima de qualquer jogo. |
| **`Alt + G`** | **Modo Fantasma** | Alterna entre HUD clicável e cliques 100% diretos para o jogo. |
| **`Alt + B`** | **Gravar Benchmark** | Inicia ou para a gravação da sessão de FPS com cálculo de 1% Lows e estabilidade. |
| **`Ctrl + Shift + F3`** | **Atalho Legado** | Compatibilidade alternativa para teclados compactos. |

---

## 🛡️ Segurança de Nível Empresarial (Enterprise Hardened)

O Optimizer foi desenhado com foco absoluto na segurança e integridade do teu computador:

- **Content Security Policy (CSP) Estrita**: Bloqueia execução de scripts não autorizados e vetores XSS tanto no renderizador como nos cabeçalhos de sessão Electron.
- **Prevenção de Protocol Hijacking**: Bloqueia a execução remota de código (RCE) via validação rigorosa de esquemas de URL externos (`isSafeExternalUrl`).
- **Sanitização Profunda de Comandos**: Todos os parâmetros fornecidos a rotinas PowerShell ou Shell são estritamente sanitizados contra command injection.
- **Bloqueio de DevTools em Produção**: Proteção contra injeção de código e tampering em tempo de execução.
- **Validação de Assinatura de Atualizações**: O Auto-Updater apenas aceita binários provenientes do repositório oficial no GitHub.
- **Negação de Permissões de Hardware**: Pedidos de câmara, microfone e geolocalização são bloqueados por padrão.
- **100% de Execução Local**: O Optimizer não envia nem recolhe qualquer telemetria pessoal para servidores externos.

---

## 🌍 Suporte Multi-idioma & Temas Visuais

- **Idiomas Nativos**:
  - 🇵🇹 **Português** (Portugal / Brasil)
  - 🇬🇧 **English** (United States / International)
  - 🇪🇸 **Español** (España / Latinoamérica)
- **7 Paletas de Cores de Acento**:
  - Índigo Elétrico (Padrão) • Verde Cyberpunk Razer • Azul Gelo Cyan • Vermelho Rogue • Âmbar Dourado • Roxo Neon • Rosa Cyber.

---

## 👑 Planos & Edições

| Recurso | Plano Gratuito | Optimizer PRO (2,00€ - Vitalício) 👑 |
|---|:---:|:---:|
| **364 Tweaks de Registro Windows** | ✅ Incluído | ✅ Incluído |
| **Limpeza de Disco & Shaders** | ✅ Incluído | ✅ Incluído |
| **Benchmark & Otimizador DNS** | ✅ Incluído | ✅ Incluído |
| **Monitor de Hardware & CPU-Z** | ✅ Incluído | ✅ Incluído |
| **In-Game HUD Overlay (Alt+O)** | ❌ | ✅ Exclusivo PRO |
| **Gravação de Benchmark & 1% Lows (Alt+B)** | ❌ | ✅ Exclusivo PRO |
| **Bloqueio de Temporizador 0.500ms** | ❌ | ✅ Exclusivo PRO |
| **Isolamento de P-Cores (Process Lasso)** | ❌ | ✅ Exclusivo PRO |
| **Perfil Competitivo de Drivers GPU** | ❌ | ✅ Exclusivo PRO |
| **Otimizador de Configurações eSports (CS2, Fortnite, etc.)** | ❌ | ✅ Exclusivo PRO |
| **Suporte & Atualizações Vitalícias** | ✅ Incluído | ✅ Prioritário |

> **Licença PRO**: Pagamento único seguro de apenas **2,00€** (vitalício, sem mensalidades). Adquire a tua chave e ativa instantaneamente na aba **Definições > Licença PRO**.

---

## 🛠️ Tecnologias & Desenvolvimento

- **Runtime**: Electron 34 & Node.js
- **Frontend**: React 19, Tailwind CSS, Lucide Icons, Spline / Three.js
- **Compilador**: Vite 6 & TypeScript 5
- **Testes Unitários**: Vitest (81 testes unitários com 100% de taxa de sucesso)
- **Packaging**: Electron Builder (NSIS Setup & Portable)

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento com Vite HMR
npm run dev:electron

# Executar bateria de testes unitários
npm test

# Compilar instalador Setup e executável Portátil
npm run dist:all

# Publicar nova release com versionamento automático
npm run release:minor
```

---

## 📄 Licença

Distribuído sob a licença **MIT**. Consulta o ficheiro [LICENSE](LICENSE) para mais informações.
