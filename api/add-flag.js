const fs = require('fs');
const path = require('path');
const f = path.resolve(__dirname, '../.env');
try {
  if (!fs.existsSync(f)) fs.writeFileSync(f, '');
  const txt = fs.readFileSync(f, 'utf8');
  if (!/^SUPABASE_DISABLED=1$/m.test(txt)) {
    fs.appendFileSync(f, (txt.endsWith('\n') ? '' : '\n') + 'SUPABASE_DISABLED=1\n');
  }
  console.log('🙍 SUPABASE_DISABLED=1 set in', n);
} catch (e) {
  console.error('ERR:', e.message);
  process.exit(1);
}
