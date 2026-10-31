const fs = require('fs');
const path = require('path');

const dir = path.resolve(__dirname, '../src/renderer/assets/icons');
const files = fs.readdirSync(dir);

for (const file of files) {
  const p = path.join(dir, file);
  let text = fs.readFileSync(p, 'utf8');
  if (!text.includes('fill=')) {
    text = text.replace('<svg ', '<svg fill="#ffffff" ');
    fs.writeFileSync(p, text, 'utf8');
    console.log('Added fill to ' + file);
  } else {
    console.log('Already had fill: ' + file);
  }
}
