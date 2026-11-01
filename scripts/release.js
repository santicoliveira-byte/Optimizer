#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const pkgPath = path.join(rootDir, 'package.json');

function getNextVersion(currentVersion, type = 'patch') {
  // Se for booleano (retrocompatibilidade com isMajor):
  if (typeof type === 'boolean') {
    type = type ? 'major' : 'minor';
  }

  const parts = currentVersion.split('.').map((p) => parseInt(p, 10) || 0);
  let major = parts[0] || 1;
  let minor = parts.length > 1 ? parts[1] : 0;
  let patch = parts.length > 2 ? parts[2] : 0;

  if (type === 'major') {
    major += 1;
    minor = 0;
    patch = 0;
  } else if (type === 'minor' || type === 'feature') {
    patch = 0;
    if (minor >= 10) {
      // Regra: Ao atingir .10, passa para a versão principal seguinte .0
      major += 1;
      minor = 0;
    } else {
      minor += 1;
    }
  } else {
    // 'patch' / 'fix' (correção de erro: 1.1 -> 1.1.1 -> 1.1.2)
    patch += 1;
  }

  // Retorna semver string e display tag
  const semver = `${major}.${minor}.${patch}`;
  const displayTag = patch > 0 ? `${major}.${minor}.${patch}` : (minor === 0 ? `${major}.0` : `${major}.${minor}`);
  return { semver, displayTag, major, minor, patch };
}

function run(cmd, options = {}) {
  console.log(`\n> ${cmd}`);
  return execSync(cmd, { cwd: rootDir, stdio: 'inherit', ...options });
}

function main() {
  const args = process.argv.slice(2);
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const currentVersion = pkg.version || '1.0.0';

  const isMajor = args.includes('--major');
  const isMinor = args.includes('--minor') || args.includes('--feature');
  const isPatch = args.includes('--patch') || args.includes('--fix') || args.includes('--bugfix');
  const customVersionIdx = args.indexOf('--version');
  
  let newSemver, newTag;
  if (customVersionIdx !== -1 && args[customVersionIdx + 1]) {
    const raw = args[customVersionIdx + 1].replace(/^v/, '');
    const parts = raw.split('.').map((p) => parseInt(p, 10) || 0);
    const major = parts[0] || 1;
    const minor = parts.length > 1 ? parts[1] : 0;
    const patch = parts.length > 2 ? parts[2] : 0;
    newTag = patch > 0 ? `${major}.${minor}.${patch}` : (minor === 0 ? `${major}.0` : `${major}.${minor}`);
    newSemver = `${major}.${minor}.${patch}`;
  } else if (args.includes('--init')) {
    newTag = '1.0';
    newSemver = '1.0.0';
  } else {
    let releaseType = 'patch'; // Por padrão, incrementa correção de erro (ex: 1.1.1, 1.1.2)
    if (isMajor) {
      releaseType = 'major';
    } else if (isMinor) {
      releaseType = 'minor';
    }
    const next = getNextVersion(currentVersion, releaseType);
    newSemver = next.semver;
    newTag = next.displayTag;
  }

  console.log('==================================================');
  console.log(`🚀 Optimizer Release Manager`);
  console.log(`Versão Atual: ${currentVersion}`);
  console.log(`Nova Versão:  ${newTag} (${newSemver})`);
  console.log('==================================================\n');

  // 1. Atualizar package.json
  pkg.version = newSemver;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
  console.log(`✓ package.json atualizado para v${newSemver}`);

  // 2. Executar testes
  console.log('\n--- 1/4: A validar testes unitários ---');
  run('npm test');

  // 3. Compilar aplicação e gerar instalador Setup e executável portátil
  console.log('\n--- 2/4: A compilar executáveis (Setup NSIS & Portable) via dist:all ---');
  run('npm run dist:all');

  const portableExeName = `Optimizer-Portable-${newSemver}.exe`;
  const setupExeName = `Optimizer-Setup-${newSemver}.exe`;
  const portablePath = path.join(rootDir, 'release', portableExeName);
  const setupPath = path.join(rootDir, 'release', setupExeName);

  if (!fs.existsSync(portablePath)) {
    throw new Error(`Erro: O ficheiro executável portátil ${portablePath} não foi encontrado.`);
  }

  // 4. Copiar para o Desktop e E: (se disponível)
  console.log('\n--- 3/4: A instalar executáveis localmente ---');
  const desktopDir = path.join(process.env.USERPROFILE || 'C:\\Users\\Santiago', 'Desktop');
  const portableDest = path.join(desktopDir, 'Optimizer-Portable.exe');
  fs.copyFileSync(portablePath, portableDest);
  console.log(`✓ Copiado para: ${portableDest}`);

  if (fs.existsSync(setupPath)) {
    const setupDest = path.join(desktopDir, 'Optimizer-Setup.exe');
    fs.copyFileSync(setupPath, setupDest);
    console.log(`✓ Copiado para: ${setupDest}`);
  }

  const driveEDir = 'E:\\Optimizer Final';
  if (fs.existsSync('E:\\')) {
    if (!fs.existsSync(driveEDir)) fs.mkdirSync(driveEDir, { recursive: true });
    const drivePortable = path.join(driveEDir, 'Optimizer-Portable.exe');
    fs.copyFileSync(portablePath, drivePortable);
    console.log(`✓ Copiado para: ${drivePortable}`);

    if (fs.existsSync(setupPath)) {
      const driveSetup = path.join(driveEDir, 'Optimizer-Setup.exe');
      fs.copyFileSync(setupPath, driveSetup);
      console.log(`✓ Copiado para: ${driveSetup}`);
    }
  }

  // 5. Git Commit, Tag e GitHub Release
  console.log('\n--- 4/4: Git & GitHub Release ---');
  try {
    // Verificar se existe git repo
    execSync('git rev-parse --is-inside-work-tree', { cwd: rootDir, stdio: 'pipe' });
    
    // Add & Commit
    run('git add -A');
    try {
      run(`git commit -m "chore(release): v${newTag} [skip ci]"`);
    } catch {
      console.log('Nenhuma alteração pendente para commit.');
    }

    // Tag
    const tag = `v${newTag}`;
    try {
      run(`git tag -a ${tag} -m "Release ${tag}"`);
      console.log(`✓ Tag ${tag} criada.`);
    } catch (e) {
      console.log(`Tag ${tag} já existe ou não foi possível criar.`);
    }

    // Push se houver remote
    try {
      const remotes = execSync('git remote', { cwd: rootDir, encoding: 'utf8' }).trim();
      if (remotes) {
        console.log(`A enviar alterações e tags para o GitHub...`);
        run('git push');
        run(`git push origin ${tag}`);
      } else {
        console.log('⚠️ Nenhum remote Git configurado ainda.');
      }
    } catch (e) {
      console.log('Nota: Push para remote pendente de autenticação.');
    }

    // Criar GitHub Release via gh CLI se disponível
    try {
      const ghPath = 'C:\\Program Files\\GitHub CLI\\gh.exe';
      const ghCmd = fs.existsSync(ghPath) ? `"${ghPath}"` : 'gh';
      
      const releaseNotes = `### Novidades da versão ${newTag} - PRO Monetization & eSports Tier 👑🚀\n\n` +
        `- **Sistema de Licenciamento PRO Criptográfico**: Autenticação offline segura por HMAC-SHA256, chaves alfanuméricas ativadas instantaneamente sem latência.\n` +
        `- **Recursos Exclusivos PRO (Gated Tier)**:\n` +
        `  • **HUD Overlay em Tempo Real (Alt+O)**: Monitorização de FPS, Frametimes, CPU, GPU e RAM sem sair da partida.\n` +
        `  • **Benchmark e Análise de 1% Lows (Alt+B)**: Gravação e telemetria profunda com comparativo Antes vs Depois.\n` +
        `  • **Modo Torneio eSports 0.500ms**: Bloqueio de hardware timer para a menor latência de input possível.\n` +
        `  • **Otimização de P-Cores (Process Lasso)**: Afinidade de threads em CPUs híbridas Intel/AMD.\n` +
        `  • **Teto G-Sync / FreeSync Automático**: Ajuste de 1 clique para todos os jogos detectados.\n` +
        `  • **Prioridade de Interrupções MSI**: Afinidade direta na placa gráfica e placa de rede.\n` +
        `- **Plano Gratuito Mantido**: Otimizador completo com 364 tweaks de registro, limpeza de disco, DNS benchmark e diagnósticos.`;
      const notesFile = path.join(rootDir, 'release', 'release-notes.tmp');
      fs.writeFileSync(notesFile, releaseNotes, 'utf8');

      const portableAliasPath = path.join(rootDir, 'release', 'Optimizer-Portable.exe');
      fs.copyFileSync(portablePath, portableAliasPath);

      let releaseAssets = `"${portableAliasPath}"`;
      if (fs.existsSync(setupPath)) {
        const setupAliasPath = path.join(rootDir, 'release', 'Optimizer-Setup.exe');
        fs.copyFileSync(setupPath, setupAliasPath);
        releaseAssets += ` "${setupAliasPath}"`;
      }

      const createReleaseCmd = `${ghCmd} release create ${tag} ${releaseAssets} --title "Optimizer v${newTag}" --notes-file "${notesFile}"`;
      run(createReleaseCmd);
      console.log(`🎉 Release ${tag} publicada com sucesso no GitHub com os ficheiros Optimizer-Setup.exe e Optimizer-Portable.exe!`);
      
      if (fs.existsSync(notesFile)) fs.unlinkSync(notesFile);
    } catch (err) {
      console.log(`ℹ️ GitHub Release: O comando 'gh release' requer que o utilizador inicie sessão via 'gh auth login'.`);
    }

  } catch (err) {
    console.log('Git não configurado ou erro no versionamento: ' + err.message);
  }

  console.log('\n==================================================');
  console.log(`✅ Release v${newTag} finalizada com sucesso!`);
  console.log(`Ficheiros prontos para download:`);
  console.log(`- Portable: ${portablePath}`);
  console.log(`- Setup:    ${setupPath}`);
  console.log('==================================================\n');
}

if (require.main === module) {
  try {
    main();
  } catch (e) {
    console.error('Erro na release:', e.message);
    process.exit(1);
  }
}

module.exports = { getNextVersion };
