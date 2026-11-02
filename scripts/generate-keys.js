#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { LicenseService } = require('../dist-electron/main/engine/license-service.js');

const count = parseInt(process.argv[2], 10) || 50;
const licenseService = LicenseService.getInstance();

const keys = [];
for (let i = 1; i <= count; i++) {
  const prefix = `BUY${String(i).padStart(3, '0')}`;
  const key = licenseService.generateKey(prefix);
  keys.push(key);
}

const outputPath = path.resolve(__dirname, '../license-keys-for-sale.txt');
fs.writeFileSync(outputPath, keys.join('\n') + '\n', 'utf8');

console.log(`\n✅ ${count} Chaves PRO geradas com sucesso!`);
console.log(`Ficheiro guardado em: ${outputPath}`);
console.log('\nExemplo das primeiras 5 chaves:');
keys.slice(0, 5).forEach((k, idx) => console.log(`  ${idx + 1}. ${k}`));
console.log('\nPodes copiar a lista deste ficheiro e colar diretamente no Gumroad ou Sellix!');
