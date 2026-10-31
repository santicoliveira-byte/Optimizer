# ⚡ Optimizer - Windows 10/11 Performance, Hardware Suite & Latency

<p align="center">
  <img src="public/favicon.ico" alt="Optimizer Logo" width="80" height="80" />
</p>

<p align="center">
  <strong>Aplicação Desktop Profissional Tudo-em-Um para Windows 10 e Windows 11</strong><br>
  Otimizações de Baixa Latência, Suite de Hardware CPU-Z Nativa, Calculador de Gargalo & Can I Run It (HowManyFPS) e Central de Manutenção.
</p>

<p align="center">
  <a href="#-instalação-e-download-via-github-releases"><img src="https://img.shields.io/badge/Download-Optimizer--Portable.exe-22c55e?style=for-the-badge&logo=windows&logoColor=white" alt="Download Portable"></a>
  <img src="https://img.shields.io/badge/Windows-10%20%7C%2011%20x64-0078D6?style=for-the-badge&logo=windows" alt="Windows 10/11">
  <img src="https://img.shields.io/badge/Electron-34-47848F?style=for-the-badge&logo=electron" alt="Electron 34">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript 5">
  <img src="https://img.shields.io/badge/Testes-41%20Passed-success?style=for-the-badge" alt="41 Tests Passed">
</p>

---

## 📥 Instalação e Download (GitHub Releases)

Não é necessário instalar nada nem configurar ambientes para usar o Optimizer:

1. Aceda à secção de [**Releases no GitHub**](https://github.com/santicoliveira-byte/Optimizer/releases).
2. Na versão mais recente (ex.: `v1.0`, `v1.1`, etc.), faça o download do ficheiro executável:
   - **`Optimizer-Portable.exe`**
3. Execute o ficheiro com **permissões de Administrador** (botão direito -> *Executar como Administrador*).
4. O aplicativo é **100% portátil e autónomo**: não altera pastas de sistema para ser executado e guarda as suas configurações e salvaguardas com segurança em `%APPDATA%/Optimizer/`.

---

## 🏷️ Política e Ciclo de Versões

O versionamento deste projeto segue a regra de evolução contínua:
- **Versão Inicial**: `v1.0` (ou `1`)
- **Atualizações e Melhorias Menores**: Incremento decimal de `0.1` a cada melhoria:
  - `1.1` ➔ `1.2` ➔ `1.3` ➔ ... ➔ `1.9` ➔ `1.10`
- **Passagem de Versão Principal**:
  - Ao atingir a versão `1.10`, a versão seguinte avança automaticamente para **`2.0`** (ou `2`).
  - O ciclo recomeça em `2.1` ➔ `2.2` ➔ ... ➔ `2.10` ➔ `3.0`.
- Cada nova versão gera automaticamente um novo executável na secção de [Releases](https://github.com/santicoliveira-byte/Optimizer/releases) com o changelog correspondente.

---

## 🌟 Módulos e Funcionalidades Principais

```
┌────────────────────────────────────────────────────────────────────────┐
│                          OPTIMIZER SUITE                               │
├──────────────────┬──────────────────┬─────────────────┬────────────────┤
│   OTIMIZAÇÕES    │      CPU-Z       │ GARGALO & CAN I │  MANUTENÇÃO &   │
│   (166 ITENS)    │  HARDWARE SUITE  │     RUN IT      │   DIAGNÓSTICO  │
├──────────────────┼──────────────────┼─────────────────┼────────────────┤
│ • Input Delay    │ • CPU & Cores    │ • Gargalo %     │ • DISM & SFC   │
│ • GPU & Vídeo    │ • Placa-Mãe      │ • HowManyFPS    │ • Shaders GPU  │
│ • Rede & Ping    │ • Memória RAM    │ • Presets Res.  │ • CHKDSK       │
│ • Serviços       │ • SPD por Slot   │ • 1080p/1440p/4K│ • Ponto Rest.  │
│ • Privacidade    │ • GPU Detalhada  │ • Balanço Rig   │ • Temp Files   │
│ • Sistema & Som  │ • Bench / Stress │ • Recomendação  │ • Relatório    │
└──────────────────┴──────────────────┴─────────────────┴────────────────┘
```

### 1. ⚡ Catálogo com 166 Otimizações Seguras
- **Input Delay e Latência (24 itens)**: Desativação de aceleração de rato 1:1, desativação de suspensão seletiva USB e PCIe Link State Power Management, otimizações de janelas em DirectX, HAGS inteligente, redução de polling delay.
- **Placa Gráfica e Vídeo (19 itens)**: Preferência por GPU dedicada de alto desempenho, VRR/G-Sync, desativação de sobreposições desnecessárias, aceleração de hardware otimizada.
- **Rede e Ping (20 itens)**: Desativação do algoritmo Nagle (`TcpAckFrequency = 1`, `TCPNoDelay = 1`), Otimização de MTU, Network Throttling Index, Flush DNS e otimização de buffer de pacotes.
- **Armazenamento e Disco (13 itens)**: Trim forçado em SSDs NVMe/SATA, indexação ponderada, desativação de criação de nomes 8.3 legados.
- **Privacidade e Telemetria (9 itens)**: Telemetria reduzida ao nível mínimo suportado oficialmente por GPO da Microsoft, desativação de publicidade e relatórios em background.
- **Limpeza Segura (15 itens)**: Shaders DirectX, caches NVIDIA/AMD DXCache, temporários de utilizador e sistema, dumps de memória e WinSxS oficial via DISM.

---

### 2. 🔍 CPU-Z Hardware Inspector & Benchmark Suite
Módulo nativo desenvolvido com base em engenharia reversa do CPU-Z oficial:
- **CPU**: Nome completo, Codename da arquitetura (Phoenix, Zen, Raptor Lake, etc.), Socket/Package, Litografia (nm), TDP, Caches L1/L2/L3, Instruções suportadas (AVX-512, SSE4.2, FMA3, etc.) com **medidores em tempo real** de frequência (MHz) e tensão VID dos núcleos.
- **Mainboard**: Fabricante, modelo da placa-mãe, chipset/southbridge, versão da BIOS e data, barramento PCIe da GPU.
- **Memory**: Tipo (DDR5/DDR4), capacidade total, canais ativos (Dual Channel), frequência real e efetiva (MT/s) e sub-timings completos (CL-tRCD-tRP-tRAS-tRC-CR).
- **SPD**: Inspeção slot por slot (`DIMMA2`, `DIMMB2`, etc.), fabricante do módulo, Part Number, e comparação de perfis JEDEC padrão vs AMD EXPO / Intel XMP (1.35V).
- **Graphics**: Inspeção da GPU primária e integrada, memória VRAM dedicada, barramento e versão do driver.
- **Bench & Stress**:
  - Benchmark Single-Thread e Multi-Thread com pontuações calibradas na escala oficial do CPU-Z v17.01.64.
  - Comparador visual de barras lado a lado com processadores de referência (Ryzen 7 7800X3D, Core i9-14900K, Ryzen 5 7600X, Core i5-13600K).
  - Teste de estabilidade térmica contínuo (**Stress CPU**).
  - Botão de exportação **Guardar Relatório TXT** formatado como validação oficial.

---

### 3. ⚖️ Calculador de Gargalo (Bottleneck) & Can I Run It
- **Cálculo de Gargalo em Tempo Real**:
  - Deteta se o gargalo está centrado no Processador (CPU Bottleneck) ou na Placa Gráfica (GPU Bottleneck).
  - Simulações em 3 resoluções chave: **1080p (FHD)**, **1440p (QHD)** e **4K (UHD)**.
- **Can I Run It & HowManyFPS**:
  - Base de dados calibrada e integração com API do HowManyFPS.
  - Estimativa realista de FPS médios, 1% lows e avaliação de fluidez em jogos competitivos e títulos AAA (CS2, Valorant, GTA V, Cyberpunk 2077, Warzone, Fortnite, etc.).
  - Configurações gráficas em Baixo, Médio, Alto e Ultra com DLSS / FSR.

---

### 4. 🛠️ Central de Manutenção do Windows
- Ações rápidas de 1 clique:
  - Verificação de Integridade de Ficheiros do Sistema (`SFC /scannow`).
  - Reparação de Imagem de Componentes (`DISM /Online /Cleanup-Image /RestoreHealth`).
  - Verificação não invasiva de disco (`chkdsk C: /scan`).
  - Limpeza profunda de Cache de Shaders (NVIDIA, AMD, DirectX).
  - Criação instantânea de Pontos de Restauro do Windows.
  - Geração de Relatório de Saúde do Sistema em HTML autónomo exportável para o Ambiente de Trabalho.

---

## 🛡️ Segurança: Regra Nº 1 Acima de Tudo

- **Apenas Otimizações Documentadas e Reversíveis**:
  - ❌ **NUNCA** desativa o Windows Defender, Firewall, UAC ou Windows Update.
  - ❌ **NUNCA** desativa mitigações de segurança do CPU (Spectre/Meltdown).
  - ❌ **NUNCA** desativa a Integridade de Memória (VBS/HVCI).
  - ❌ **NUNCA** mexe em ficheiros protegidos do `System32` nem usa "RAM cleaners" agressivos.
- **Ponto de Restauro Automático**:
  - Cria automaticamente um ponto de restauro antes de qualquer aplicação em lote.
- **Simulação (Dry-Run)**:
  - Permite inspecionar linha a linha cada comando e chave de registo antes de aplicar qualquer alteração.
- **Reversão com 1 Clique**:
  - Cada item tem botão individual de reversão para os valores originais da máquina, além do botão mestre "Repor Tudo ao Original".

---

## 💻 Para Desenvolvedores

### Pré-requisitos
- Node.js 18+ e npm instalados.
- Windows 10/11 x64.
- Git instalado.

### 1. Clonar e Instalar
```bash
git clone https://github.com/santicoliveira-byte/Optimizer.git
cd Optimizer
npm install
```

### 2. Modo de Desenvolvimento
```bash
# Inicia o Vite e a janela do Electron com Hot Reload
npm run dev:electron
```

### 3. Suite de Testes Automatizados (Vitest)
```bash
npm test
```
*41 testes cobrindo conformidade do catálogo, motor de backup, regras de segurança, cálculos de FPS e lógica de versionamento.*

### 4. Criar uma Nova Release Automatizada
O projeto dispõe de um script que automatiza a regra de versões (`1.0` -> `1.1` -> ... -> `1.10` -> `2.0`), compila o executável, cria a tag git e publica no GitHub Releases:

```bash
# Publica a próxima versão pequena (ex: 1.0 -> 1.1)
npm run release

# Ou para forçar salto de versão principal (ex: 1.x -> 2.0)
npm run release -- --major
```

---

## 📄 Licença
Distribuído sob a licença MIT. Consulte `LICENSE` para mais informações.
