const fs = require('fs');
const path = require('path');
const dir = 'src/main/engine/modules';
const files = fs.readdirSync(dir);
files.forEach(f => {
  if (f.endsWith('.ts')) {
    const txt = fs.readFileSync(path.join(dir, f), 'utf8');
    const lines = txt.split('\n');
    lines.forEach((l, i) => {
      if (l.includes("status: 'not_applied'") || l.includes('status: "not_applied"')) {
        console.log(f + ':' + (i+1) + ' -> ' + l.trim());
      }
    });
  }
});
