// Serverless API (Netlify Functions)
// - حماية X-API-KEY عبر API_TOKEN
// - تكامل Supabase: apikey = ANON_KEY ، Authorization = Bearer ANON_KEY
// - نقاط تشخيص متعددة + حاسبة عمولة

const dns = require("dns").promises;

const json = (status, body = {}) => ({
  statusCode: status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,OPTIONS",
    "access-control-allow-headers": "content-type,authorization,x-api-key",
  },
  body: JSON.stringify(body),
});

function requireApiKey(event) {
  const REQUIRED = (process.env.API_TOKEN || "").trim();
  if (!REQUIRED) return null;
  const h = event.headers || {};
  const got = String(
    h["x-api-key"] || h["X-API-KEY"] || h["x-api-Key"] || h["X-Api-Key"] || ""
  ).trim();
  if (got && got === REQUIRED) return null;
  return json(401, { ok: false, error: "Unauthorized: missing or invalid X-API-KEY" });
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(204);

  const path = (event.path || "").replace("/.netlify/functions/api", "/api");

  const SUPABASE_URL = process.env.SUPABASE_URL || "";
  const SERVICE_KEY  = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const ANON_KEY     = (process.env.SUPABASE_ANON_KEY || "").trim();

  // مُساعد: هيدرز Supabase الموحّدة (anon/anon مع fallback للـ service)
  const sbHeaders = () => ({
    apikey: ANON_KEY || SERVICE_KEY,
    Authorization: `Bearer ${ANON_KEY || SERVICE_KEY}`,
  });

  // 1) /api/health
  if (path.endsWith("/api/health")) {
    return json(200, { ok: true, msg: "API is running" });
  }

  // 2) /api/diagnostics
  if (path.endsWith("/api/diagnostics")) {
    const env = { url: Boolean(SUPABASE_URL), key: Boolean(SERVICE_KEY), anon: Boolean(ANON_KEY) };
    let supabase = { ok: false };
    if (env.url && (env.key || env.anon)) {
      try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1`, {
          method: "GET",
          headers: sbHeaders(),
        });
        supabase.ok = r.ok;
        supabase.status = r.status;
      } catch (e) {
        supabase.ok = false;
        supabase.error = e?.message || String(e);
      }
    } else {
      supabase = { ok: false, error: "Missing SUPABASE_URL or keys" };
    }
    return json(200, { ok: true, env, supabase });
  }

  // 3) /api/_probe
  if (path.endsWith("/api/_probe")) {
    const env = { url: Boolean(SUPABASE_URL), key: Boolean(SERVICE_KEY), anon: Boolean(ANON_KEY) };
    const result = { ok: true, env };
    if (!env.url) return json(200, { ...result, note: "No SUPABASE_URL" });

    let host = null;
    try { host = new URL(SUPABASE_URL).hostname; result.host = host; }
    catch (e) { return json(200, { ...result, error: "Invalid SUPABASE_URL format", detail: String(e) }); }

    try { result.dns4 = await dns.resolve4(host); } catch (e) { result.dns4 = { error: e?.code || e?.message || String(e) }; }
    try { result.dns6 = await dns.resolve6(host); } catch (e) { result.dns6 = { error: e?.code || e?.message || String(e) }; }

    try {
      const r = await fetch(`${SUPABASE_URL}`, { method: "HEAD" });
      result.tls_head = { ok: r.ok, status: r.status };
    } catch (e) {
      result.tls_head = { ok: false, error: e?.message || String(e) };
    }

    try {
      const r1 = await fetch(`${SUPABASE_URL}/rest/v1`, { method: "GET", headers: sbHeaders() });
      result.rest_v1 = { ok: r1.ok, status: r1.status };
      try { result.rest_v1_body_sample = (await r1.text()).slice(0, 200); } catch (_) {}
    } catch (e) {
      result.rest_v1 = { ok: false, error: e?.message || String(e) };
    }

    result.note = "Using anon/anon headers by default.";
    return json(200, result);
  }

  // 4) /api/commission-rules — قراءة فقط
  if (path.endsWith("/api/commission-rules")) {
    const unauthorized = requireApiKey(event);
    if (unauthorized) return unauthorized;

    if (!SUPABASE_URL) {
      return json(500, { ok: false, error: "Missing Supabase URL" });
    }

    const url = new URL(`${SUPABASE_URL}/rest/v1/commission_rules`);
    const limit = Number(new URL(event.rawUrl).searchParams.get("limit")) || 50;
    url.searchParams.set("select", "*");
    url.searchParams.set("order", "updated_at.desc.nullslast");
    url.searchParams.set("limit", String(limit));

    try {
      const r = await fetch(url, {
        headers: {
          ...sbHeaders(),          // apikey = anon, Authorization = Bearer anon
          Prefer: "count=none",
        },
      });
      if (!r.ok) {
        const text = await r.text();
        return json(r.status, { ok: false, error: text });
      }
      const data = await r.json();
      return json(200, { ok: true, data });
    } catch (e) {
      return json(500, { ok: false, error: e?.message || String(e) });
    }
  }

  // 5) /api/calc-commission — حاسبة العمولة
  if (path.endsWith("/api/calc-commission")) {
    const unauthorized = requireApiKey(event);
    if (unauthorized) return unauthorized;

    const url = new URL(event.rawUrl);
    const sales  = Number(url.searchParams.get("sales")  || NaN);
    const target = Number(url.searchParams.get("target") || NaN);
    const category = url.searchParams.get("category") || "";

    let tier1_rate = url.searchParams.get("tier1_rate");
    let tier2_rate = url.searchParams.get("tier2_rate");
    let tier3_rate = url.searchParams.get("tier3_rate");

    if (!Number.isFinite(sales) || !Number.isFinite(target) || target <= 0) {
      return json(400, { ok: false, error: "Missing or invalid 'sales' or 'target'." });
    }

    // لو المعدلات مفقودة وتم تمرير category نقرأها من Supabase
    if ((!tier1_rate || !tier2_rate || !tier3_rate) && category && SUPABASE_URL) {
      try {
        const q = new URL(`${SUPABASE_URL}/rest/v1/commission_rules`);
        q.searchParams.set("select", "tier1_rate,tier2_rate,tier3_rate");
        q.searchParams.set("category", `eq.${category}`);
        q.searchParams.set("limit", "1");
        const r = await fetch(q, { headers: sbHeaders() });
        if (r.ok) {
          const arr = await r.json();
          if (arr && arr[0]) {
            tier1_rate = String(arr[0].tier1_rate);
            tier2_rate = String(arr[0].tier2_rate);
            tier3_rate = String(arr[0].tier3_rate);
          }
        }
      } catch (_) {}
    }

    const t1 = Number(tier1_rate);
    const t2 = Number(tier2_rate);
    const t3 = Number(tier3_rate);
    if (![t1, t2, t3].every(Number.isFinite)) {
      return json(400, { ok: false, error: "Rates are missing. Provide tier*_rate or use a valid category." });
    }

    const achievement = (sales / target) * 100;
    const base1 = target * 0.70;
    const base2 = target * 0.30;
    const extra  = Math.max(0, sales - target);

    const amount1 = base1 * t1;
    const amount2 = achievement >= 71 ? base2 * t2 : 0;
    const amount3 = achievement > 100 ? extra  * t3 : 0;
    const total   = amount1 + amount2 + amount3;

    return json(200, {
      ok: true,
      input: { sales, target, category: category || null, tier1_rate: t1, tier2_rate: t2, tier3_rate: t3 },
      achievement: Number(achievement.toFixed(2)),
      breakdown: {
        tier1: { base: base1, rate: t1, amount: Number(amount1.toFixed(2)) },
        tier2: { base: achievement >= 71 ? base2 : 0, rate: t2, amount: Number(amount2.toFixed(2)) },
        tier3: { base: extra, rate: t3, amount: Number(amount3.toFixed(2)) }
      },
      total: Number(total.toFixed(2))
    });
  }

  // 6) /api/_env
  if (path.endsWith("/api/_env")) {
    return json(200, {
      ok: true,
      has_api_token: Boolean(process.env.API_TOKEN),
      api_token_len: process.env.API_TOKEN ? String(process.env.API_TOKEN).length : 0
    });
  }

  // 7) /api/_auth-check
  if (path.endsWith("/api/_auth-check")) {
    const REQUIRED = (process.env.API_TOKEN || "").trim();
    const h = event.headers || {};
    const got = String(
      h["x-api-key"] || h["X-API-KEY"] || h["x-api-Key"] || h["X-Api-Key"] || ""
    ).trim();

    return json(200, {
      ok: true,
      has_api_token: Boolean(REQUIRED),
      api_token_len: REQUIRED ? String(REQUIRED).length : 0,
      got_header: Boolean(got),
      got_len: got ? String(got).length : 0,
      match: Boolean(REQUIRED && got && got === REQUIRED)
    });
  }

  // 8) /api/_sb
  if (path.endsWith("/api/_sb")) {
    const svc = SERVICE_KEY;
    const pub = ANON_KEY;
    let header_alg = null, role = null, iss = null, exp = null;
    try {
      const [h, p] = (svc || "").split(".");
      const b64 = (s) => Buffer.from(s.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
      const hd = h ? JSON.parse(b64(h)) : null;
      const pl = p ? JSON.parse(b64(p)) : null;
      header_alg = hd?.alg || null;
      role = pl?.role || null;
      iss = pl?.iss || null;
      exp = pl?.exp || null;
    } catch (_) {}
    return json(200, {
      ok: true,
      has_service_key: Boolean(svc),
      service_key_len: svc.length,
      has_anon_key: Boolean(pub),
      anon_key_len: pub.length,
      header_alg, role, iss, exp
    });
  }

  // 9) /api/_sb-test
  if (path.endsWith("/api/_sb-test")) {
    if (!SUPABASE_URL) return json(500, { ok: false, error: "Missing Supabase URL" });
    try {
      const url = new URL(`${SUPABASE_URL}/rest/v1/commission_rules`);
      url.searchParams.set("select", "id");
      url.searchParams.set("limit", "1");
      const r = await fetch(url, { headers: { ...sbHeaders(), Prefer: "count=none" } });
      const text = await r.text();
      return json(r.status, { ok: r.ok, status: r.status, bodySample: text.slice(0, 300) });
    } catch (e) {
      return json(500, { ok: false, error: e?.message || String(e) });
    }
  }

  // 10) /api/_sb-matrix (تبقى كما هي لو موجودة عندك للاختبار)
  if (path.endsWith("/api/_sb-matrix")) {
    if (!SUPABASE_URL) return json(500, { ok: false, error: "Missing Supabase URL" });
    const combos = [
      { name: "svc/svc",   apikey: SERVICE_KEY, auth: `Bearer ${SERVICE_KEY}` },
      { name: "anon/svc",  apikey: ANON_KEY,    auth: `Bearer ${SERVICE_KEY}` },
      { name: "anon/anon", apikey: ANON_KEY,    auth: `Bearer ${ANON_KEY}` },
    ];
    const results = [];
    for (const c of combos) {
      const entry = { combo: c.name };
      try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1`, { method: "GET", headers: { apikey: c.apikey, Authorization: c.auth } });
        entry.rest_root = { status: r.status, ok: r.ok };
      } catch (e) { entry.rest_root = { error: String(e) }; }
      try {
        const u = new URL(`${SUPABASE_URL}/rest/v1/commission_rules`);
        u.searchParams.set("select", "id");
        u.searchParams.set("limit", "1");
        const r2 = await fetch(u, { headers: { apikey: c.apikey, Authorization: c.auth, Prefer: "count=none" } });
        const body = await r2.text();
        entry.table = { status: r2.status, ok: r2.ok, sample: body.slice(0, 160) };
      } catch (e) { entry.table = { error: String(e) }; }
      results.push(entry);
    }
    return json(200, { ok: true, results });
  }

  return json(404, { ok: false, error: "Not Found" });
};
