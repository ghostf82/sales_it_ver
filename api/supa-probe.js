// api/supa-probe.js
const dns = require('dns');
const tls = require('tls');
const https = require('https');
const { URL } = require('url');
const path = require('path');

// اقرأ متغيرات البيئة من ../.env (اللي كتبناها قبل كده)
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const raw =
  process.env.SUPABASE_URL ||
  (process.env.SUPABASE_PROJECT_REF
    ? `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co`
    : null);

const key = process.env.SUPABASE_KEY;

if (!raw) {
  console.error('❌ Missing SUPABASE_URL (or SUPABASE_PROJECT_REF).');
  process.exit(1);
}
if (!key) {
  console.error('❌ Missing SUPABASE_KEY.');
  process.exit(1);
}

const u = new URL(raw);
const host = u.hostname;

console.log('🔎 Host:', host);

// 1) DNS v4
dns.resolve4(host, (err, addrs) => {
  console.log('🌐 DNS v4 ->', err ? String(err) : addrs);

  // 2) TLS Handshake
  const sock = tls.connect(
    {
      host,
      port: 443,
      servername: host, // مهم لـ SNI
      rejectUnauthorized: true,
      timeout: 7000,
    },
    () => {
      console.log(
        '🔐 TLS authorized:',
        sock.authorized,
        'error:',
        sock.authorizationError || null,
        'proto:',
        sock.getProtocol()
      );
      sock.end();

      // 3) HTTPS GET /auth/v1/health
      const agent = new https.Agent({ keepAlive: false, maxSockets: 1 });
      const req = https.request(
        {
          host,
          port: 443,
          method: 'GET',
          path: '/auth/v1/health',
          headers: {
            'User-Agent': 'supa-probe/1',
            Accept: 'application/json',
          },
          servername: host,
          agent,
          timeout: 7000,
        },
        (res) => {
          let b = '';
          res.on('data', (c) => (b += c));
          res.on('end', () => {
            console.log('✅ HTTPS /auth/v1/health status:', res.statusCode);
            console.log('CT:', res.headers['content-type']);
            console.log('Body:', (b || '').slice(0, 200));
          });
        }
      );
      req.on('error', (e) => console.log('❌ HTTPS error:', String(e)));
      req.end();
    }
  );

  sock.on('error', (e) => console.log('❌ TLS error:', String(e)));
  sock.on('timeout', () => {
    console.log('⏳ TLS timeout');
    sock.destroy();
  });
});
