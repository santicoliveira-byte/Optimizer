const fs = require('fs');
const catalogDir = 'src/main/catalog';
const catFiles = fs.readdirSync(catalogDir);
let allIds = [];
catFiles.forEach(f => {
  const content = fs.readFileSync(catalogDir + '/' + f, 'utf8');
  const matches = content.match(/id:\s*['"]([^'"]+)['"]/g) || [];
  matches.forEach(m => allIds.push(m.replace(/id:\s*['"]/, '').replace(/['"]/, '')));
});
console.log('Total catalog IDs:', allIds.length);

const profileSrc = fs.readFileSync('src/main/engine/profile-service.ts', 'utf8');
const gamingMatch = profileSrc.match(/id:\s*'gaming'[\s\S]*?itemIds:\s*\[([\s\S]*?)\]/);
if (gamingMatch) {
  const itemIds = gamingMatch[1].match(/'([^']+)'/g).map(s => s.replace(/'/g, ''));
  console.log('Gaming profile itemIds count:', itemIds.length);
  const missing = itemIds.filter(id => !allIds.includes(id));
  console.log('Missing from catalog:', missing);
  const present = itemIds.filter(id => allIds.includes(id));
  console.log('Present in catalog:', present.length);
}
