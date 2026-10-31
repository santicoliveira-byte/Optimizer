#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const pkgPath = path.join(rootDir, 'package.json');

function getNextVersion(currentVersion, isMajor = false) {
  // Supports formats like "1.0.0", "1.1", "1.10", "1"
  const parts = currentVersion.split('.').map(Number);
  let major = parts[0] || 1;
  let minor = parts.length > 1 ? parts[1] : 0;

  if (isMajor) {
    major += 1;
    minor = 0;
  } else {
    if (minor >= 10) {
      // Rule: When it reaches 1.10, rolls over to 2.0
      major += 1;
      minor = 0;
    } else {
      minor += 1;
    }
  }

  // Returns semver string and display tag
  const displayTag = minor === 0 ? `${major}.0` : `${major}.${minor}`;
  const semver = `${major}.${minor}.0`;
  return { semver, displayTag, major, minor };
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
  const customVersionIdx = args.indexOf('--version');
  
  let newSemver, newTag;
  if (customVersionIdx !== -1 && args[customVersionIdx + 1]) {
    const raw = args[customVersionIdx + 1].replace(/^v/, '');
    const parts = raw.split('.').map(Number);
    const major = parts[0] || 1;
    const minor = parts.length > 1 ? parts[1] : 0;
    newTag = minor === 0 ? `${major}.0` : `${major}.${minor}`;
    newSemver = `${major}.${minor}.0`;
  } else if (args.includes('--init')) {
    newTag = '1.0';
    newSemver = '1.0.0';
  } else {
    const next = getNextVersion(currentVersion, isMajor);
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

  // 3. Compilar aplicação e gerar executável portátil
  console.log('\n--- 2/4: A compilar executável portátil (dist:portable) ---');
  run('npm run dist:portable');

  const exeName = `Optimizer-Portable-${newSemver}.exe`;
  const exePath = path.join(rootDir, 'release', exeName);

  if (!fs.existsSync(exePath)) {
    throw new Error(`Erro: O ficheiro executável ${exePath} não foi encontrado.`);
  }

  // 4. Copiar para o Desktop e E: (se disponível)
  console.log('\n--- 3/4: A instalar executável localmente ---');
  const desktopDest = path.join(process.env.USERPROFILE || 'C:\\Users\\Santiago', 'Desktop', 'Optimizer-Portable.exe');
  fs.copyFileSync(exePath, desktopDest);
  console.log(`✓ Copiado para: ${desktopDest}`);

  const driveEDir = 'E:\\Optimizer Final';
  if (fs.existsSync('E:\\')) {
    if (!fs.existsSync(driveEDir)) fs.mkdirSync(driveEDir, { recursive: true });
    const driveEDest = path.join(driveEDir, 'Optimizer-Portable.exe');
    fs.copyFileSync(exePath, driveEDest);
    console.log(`✓ Copiado para: ${driveEDest}`);
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
      
      const releaseNotes = `### Novidades da versão ${newTag}\n\n- Novo Contador de FPS em Tempo Real no HUD Overlay: Medidor dedicado de fotogramas por segundo (FPS) com indicador visual de alta visibilidade\n- Cores Dinâmicas Adaptativas para FPS: Verde Esmeralda (>=120 FPS), Azul Ciano (60-120 FPS) e Âmbar (<60 FPS)\n- Telemetria de Frame Rate Inteligente: Mede o loop de renderização do monitor e calcula a fluidez 3D real com base na carga do jogo e GPU\n- Largura Ajustada do HUD: Redimensionado para 550px para exibir perfeitamente FPS, Ping, CPU, GPU Temp/Carga e RAM`;
      const notesFile = path.join(rootDir, 'release', 'release-notes.tmp');
      fs.writeFileSync(notesFile, releaseNotes, 'utf8');

      const portableAliasPath = path.join(rootDir, 'release', 'Optimizer-Portable.exe');
      fs.copyFileSync(exePath, portableAliasPath);

      const createReleaseCmd = `${ghCmd} release create ${tag} "${portableAliasPath}" --title "Optimizer v${newTag}" --notes-file "${notesFile}"`;
      run(createReleaseCmd);
      console.log(`🎉 Release ${tag} publicada com sucesso no GitHub com o ficheiro Optimizer-Portable.exe!`);
      
      if (fs.existsSync(notesFile)) fs.unlinkSync(notesFile);
    } catch (err) {
      console.log(`ℹ️ GitHub Release: O comando 'gh release' requer que o utilizador inicie sessão via 'gh auth login'.`);
    }

  } catch (err) {
    console.log('Git não configurado ou erro no versionamento: ' + err.message);
  }

  console.log('\n==================================================');
  console.log(`✅ Release v${newTag} finalizada com sucesso!`);
  console.log(`Ficheiro pronto para download: ${exePath}`);
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
