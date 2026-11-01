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
      
      const releaseNotes = `### Novidades da versão ${newTag} - Enterprise-Grade Security & Public Hardening 🛡️\n\n` +
        `- **Proteção contra Protocol Hijacking & RCE**: Validação estrita de protocolos externos (\`isSafeExternalUrl\`) em janelas e popups, bloqueando esquemas perigosos (\`file://\`, \`javascript:\`, \`ms-msdt:\`, \`calc:\`).\n` +
        `- **Content Security Policy (CSP)**: Implementada política CSP estrita no HTML (\`index.html\`) e nos cabeçalhos de sessão Electron, mitigando XSS e injeção de código.\n` +
        `- **Anti-Tampering & DevTools Lock**: Bloqueio ativo de ferramentas de inspeção (\`F12\`, \`Ctrl+Shift+I\`, \`Ctrl+Shift+J\`, \`Ctrl+U\`) em ambiente de produção.\n` +
        `- **Navegação & WebViews Restritas**: Bloqueio de navegação externa não autorizada (\`will-navigate\`) e proibição de tags \`<webview>\`.\n` +
        `- **Sanitização Rigorosa contra Command Injection**: Sanitização de parâmetros nos motores de PowerShell (\`RestorePointManager\`, \`DnsBenchmarkService\`, \`MsiUtilityService\`, \`ProcessLassoService\`, \`StartupManagerService\`, \`GameTrafficRoutingService\`).\n` +
        `- **Validação do Auto-Updater**: O atualizador automático rejeita qualquer binário que não provenha do repositório oficial no GitHub.\n` +
        `- **Permissões de Hardware Trancadas**: Negação imediata de permissões para câmara, microfone e geolocalização.`;
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
