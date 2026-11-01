#!/usr/bin/env node
const crypto = require('crypto');

const LICENSE_SALT = 'OPTIMIZER_ENTERPRISE_SECRET_SALT_2026';

function generateKey(prefix = 'GMR01') {
  const cleanSeg = prefix.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 5) || 'VIP01';
  const randomSeg = crypto.randomBytes(2).toString('hex').toUpperCase();
  const payload = `OPT-PRO-${cleanSeg}-${randomSeg}`;
  const checksum = crypto
    .createHmac('sha256', LICENSE_SALT)
    .update(payload)
    .digest('hex')
    .substring(0, 4)
    .toUpperCase();

  return `${payload}-${checksum}`;
}

const count = parseInt(process.argv[2], 10) || 5;
const prefix = process.argv[3] || 'SALE';

console.log('==================================================');
console.log(`🔑 Gerador de Chaves Optimizer PRO (${count} chaves)`);
console.log('==================================================\n');

for (let i = 1; i <= count; i++) {
  console.log(`${i}. ${generateKey(prefix)}`);
}

console.log('\n==================================================');
console.log('Nota: Podes enviar qualquer uma destas chaves ao cliente.');
console.log('Chave Master Universal para testes: OPT-PRO-LIFETIME-VIP-2026');
console.log('==================================================\n');
