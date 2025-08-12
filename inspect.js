const fs = require('fs');
const path = require('path');

const SKIP = new Set(['node_modules','.git','dist','build','.next','.turbo','.cache']);

function walk(dir, onFile) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name)) continue;
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) walk(fp, onFile);
    else if (e.isFile()) onFile(fp);
  }
}

console.log('=== SEARCH: listen/express ===');
walk('.', (fp) => {
  if (!/\.(m?js|cjs|ts|tsx)$/.test(fp)) return;
  const lines = fs.readFileSync(fp, 'utf8').split(/\r?\n/);
  for (let i=0;i<lines.length;i++){
    const ln = lines[i];
    if (ln.includes('app.listen(') || ln.includes('createServer(') || ln.includes('express(')) {
      console.log(`${fp}:${i+1}: ${ln.trim()}`);
    }
  }
});

console.log('\n=== SEARCH: package.json scripts ===');
walk('.', (fp) => {
  if (path.basename(fp) !== 'package.json') return;
  try {
    const j = JSON.parse(fs.readFileSync(fp,'utf8'));
    console.log('\n'+fp);
    if (j.scripts) {
      for (const [k,v] of Object.entries(j.scripts)) {
        console.log(`  ${k}: ${v}`);
      }
    } else {
      console.log('  (no scripts)');
    }
  } catch (e) {
    console.log('\n'+fp+' (invalid JSON)');
  }
});
