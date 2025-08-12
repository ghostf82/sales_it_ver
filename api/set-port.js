// set-port.js
'use strict';
const fs = require('fs');
const path = require('path');

const f = path.resolve(__dirname, '../.env');
const PORT = process.argv[2] || '3010';

let t = '';
try { t = fs.readFileSync(f, 'utf8'); } catch (e) { /* no-crash*/ }
if (t.includes('\\u0000')) { t = ''; }
if (!t) t = '';

const without = t.split('\\n').filter(l => !^/^PORT=?/.test(l)).join('\\n').trim();
const out = (without ? without + '\\n' : '') + `PORT=${PORT}\n`;

fs.writeFileSync(f, out);
console.log(`‚úì œüôç PORT=${PORT} written to ${f}`);