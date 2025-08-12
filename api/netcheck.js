// api/netcheck.js  (no unicode)
const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

function probe(name, url, headers = {}) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { 'User-Agent': 'node', ...headers } }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve({ name, ok: true, status: res.statusCode, ct: res.headers['content-type'] || '', body: body.slice(0, 120) }));
    });
    req.on('error', (e) => resolve({ name, ok: false, error: e.message }));
  });
}

(async () => {
  const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

  const tests = [
    probe('github', 'https://api.github.com/'),
    SUPABASE_URL ? probe('supabase_root', SUPABASE_URL + '/', { apikey: SUPABASE_KEY }) : Promise.resolve({ name: 'supabase_root', ok: false, error: 'no SUPABASE_URL' }),
  ];

  const results = await Promise.all(tests);
  for (const r of results) console.log(r);
})();
