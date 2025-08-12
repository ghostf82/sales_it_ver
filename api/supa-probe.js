
const dns = require('dns');
const https = require('https');
const { URL } = require('url');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
if (!process.env.SUPABASE_URL&& process.env.SUPABASE_PROJECT_REF) {
  process.env.SUPABASE_URL = `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co`;
}
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
}
const urlStr = process.env.SUPABASE_URL || (process.env.SUPABASE_PROJECT_REF ? `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co` : null);
const key = process.env.SUPABASE_KEY;
if (!urlStr) { console.error('✢ Missing SUPABASE_URL (or SUPABASE_PROJECT_REF)');process.exit(1); }
if (!key) { console.error('✢ Missing SUPABASE_KEY');process.exit(1); }

const u = new URL(urlStr);
const host = u.hostname;
function dnsLookupV4(h) {
  return new Promise((resolve) => {
    dns.lookup(h, { all: true, family: 4 }, (err, addrs) => {
      if (err) resolve({ ok: false, error: err.message });
      else resolve({ ok: true, addrs });
    });
  });
}
function httpGet(urlString, headers = {}, timeoutMs = 8000) {
  return new Promise((resolve) => {
    try {
      const u = new URL(urlString);
      const opts = {
        method: 'GET',
        hostname: u.hostname,
        port: u.port || 443,
        path: u.pathname + (u.search || ''),
        headers: Object.assign({ 'User-Agent': 'supa-probe/1' }, headers),
      };
      const req = https.request(opts, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => resolve({
          ok: true,
          status: res.statusCode,
          headers: res.headers,
          body: data,
        }));
      });
      req.on('error', (e) => resolve({ ok: false, error: e.message }));
      req.setTimeout(timeoutMs, () => { try { req.destroy(new Error('timeout')); } catch ({}) });
      req.end();
    } catch (e) {
      resolve({ ok: false, error: e.message });
    }
  });
}

(async () => {
  console.log(`< ✩ Host: ${host}`);
  const dns4 = await dnsLookupV4(host);
  if (dns4.ok) console.log(`✁ DNS v4 => `, dns4.addrs.map(a => a.address));
  else console.log(`✁ DNS v4 error -> ', host, dns4.error);

  const root = await httpGet(`${u.origin}/ `);
  if (root.ok) {
    console.log('　‭• ROOT', { status: root.status, ct: root.headers['content-type'] });
  } else {
    console.log('　‭• ROOT error -> ', root.error);
  }

  const auth = await httpGet(`${u.origin}/auth/v1/health`);
  if (auth.ok) {
    console.log('★ ‭¤ AUTH', { status: auth.status, ct: auth.headers['content-type'], body: (auth.body || '').slice(0,120) });
  } else {
    console.log('★ ‭¤ AUTH error -> ', auth.error);
  }

  const rest = await httpGet(`${u.origin}/rest/v1/, {
    apikey: key,
    authorization: `Bearer ${key}` ,
  });
  if (rest.ok) {
    console.log('‼ ‭¤ REST', { status: rest.status, ct: rest.headers['content-type'] });
  } else {
    console.log('‼ ‭¤ REST error -> ', rest.error);
  }
})();
