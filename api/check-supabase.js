// api/check-supabase.js
const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

function mask(s, keepStart = 4, keepEnd = 4) {
  if (!s) return '';
  if (s.length <= keepStart + keepEnd) return '*'.repeat(s.length);
  return s.slice(0, keepStart) + '...' + s.slice(-keepEnd);
}

function probe(url, headers = {}) {
  return new Promise((resolve) => {
    const req = https.get(url, { headers: { 'User-Agent': 'node', ...headers } }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () =>
        resolve({
          url,
          ok: true,
          status: res.statusCode,
          ct: res.headers['content-type'] || '',
          body: body.slice(0, 120),
        })
      );
    });
    req.on('error', (e) => resolve({ url, ok: false, error: e.message }));
  });
}

(async () => {
  const RAW_URL = (process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '');
  const KEY = (process.env.SUPABASE_KEY || '').trim();

  console.log('ENV CHECK >>>');
  console.log('SUPABASE_URL:', RAW_URL || '(missing)');
  console.log('  - looks like https:', RAW_URL.startsWith('https://'));
  console.log('  - domain ends with .supabase.co:', /\.supabase\.co$/i.test(new URL(RAW_URL || 'https://x.example').hostname));
  console.log('SUPABASE_KEY:', KEY ? mask(KEY, 6, 6) : '(missing)');
  console.log('  - JWT-like (starts with eyJ):', KEY.startsWith('eyJ'));
  console.log('');

  if (!RAW_URL || !KEY) {
    console.log('❌ Missing SUPABASE_URL or SUPABASE_KEY');
    process.exit(0);
  }

  const root = RAW_URL + '/';
  const rest = RAW_URL + '/rest/v1/';
  const headers = { apikey: KEY, Authorization: 'Bearer ' + KEY, Accept: 'application/json' };

  console.log('PROBES >>>');
  console.log(await probe(root, headers));
  console.log(await probe(rest, headers));
})();
