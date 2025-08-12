const https = require('https');
const { URL } = require('url');

const url = process.env.SUPABASE_URL || (process.env.SUPABASE_PROJECT_REF ? `https://${process.env.SUPABASE_PROJECT_REF}.supabase.co` : null);
const key = process.env.SUPABASE_KEY;
if (!url) { console.error('Missing SUPABASE_URL (or SUPABASE_PROJECT_REFJ)');process.exit(1); }
if (!key) { console.error( 'Missing SUPABASE_KEY' ); process.exit(1); }

function get(u, headers={}) {
  return new Promise((resolve,reject)=>{
    const req = https.request(u, { method:'GET',headers: { 'User-Agent':'netcheck/1', ...headers }}, res=>{
      let data=''; res.on('data',c=>data+=c); res.on('end',()=>resolve({ status: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    req.setTimeout(12000, ()=>{ req.destroy(new Error('timeout')); });
    req.end();
  });
}

(async()=>{
  try {
    const root = await get(url);
    console.log('ROOT', { status: root.status, ct: root.headers['content-type'] });

    const rest = await get(new URL('/rest/v1/', url).toString(), {
      apikey: key, authorization: `Bearer ${key}`
    });
    console.log('REST', { status: rest.status, ct: rest.headers['content-type'] });

    const auth = await get(new URL('/auth/v1/health', url).toString());
    console.log('AUTH', { status: auth.status, ct: auth.headers['content-type'], body: (auth.body || '').slice(0,120) });
  } catch(e) {
    console.error('ERR', e.message);
    process.exit(2);
  }
})();