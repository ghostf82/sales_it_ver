// Serverless API (Netlify Functions) — مع فحص متقدّم + حماية X-API-KEY + حاسبة عمولة
// Endpoints:
//   GET /api/health
//   GET /api/diagnostics
//   GET /api/_probe
//   GET /api/_env
//   GET /api/_auth-check
//   GET /api/_sb
//   GET /api/commission-rules?limit=50
//   GET /api/calc-commission?target=250000&sales=350000&category=اسمنتي
//      أو: ...&tier1_rate=0.0031&tier2_rate=0.0063&tier3_rate=0.0079

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

// حماية اختيارية: لو API_TOKEN مضبوط، نطلب X-API-KEY
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
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const ANON_KEY     = process.env.SUPABASE_ANON_KEY || ""; // جديد: نستخدمه في apikey

  // 1) /api/health
  if (path.endsWith("/api/health")) {
    return json(200, { ok: true, msg: "API is running" });
  }

  // 2) /api/diagnostics
  if (path.endsWith("/api/diagnostics")) {
    const env = { url: Boolean(SUPABASE_URL), key: Boolean(SERVICE_KEY), anon: Boolean(ANON_KEY) };
    let supabase = { ok: false };
    if (env.url && env.key) {
      try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1`, {
          method: "GET",
          headers: {
            apikey: ANON_KEY || SERVICE_KEY,                  // apikey = anon (أو service كـ fallback)
            Authorization: `Bearer ${SERVICE_KEY}`,           // Authorization = service_role
          },
        });
        supabase.ok = r.ok;
        supabase.status = r.status;
      } catch (e) {
        supabase.ok = false;
        supabase.error = e?.message || String(e);
      }
    } else {
      supabase = { ok: false, error: "Missing SUPABASE_URL or SERVICE_KEY" };
    }
    return json(200, { ok: true, env, supabase });
  }

  // 3) /api/_probe (DNS + TLS + REST)
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
      const r1 = await fetch(`${SUPABASE_URL}/rest/v1`, {
        method: "GET",
        headers: {
          apikey: ANON_KEY || SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
        },
      });
      result.rest_v1 = { ok: r1.ok, status: r1.status };
      try { result.rest_v1_body_sample = (await r1.text()).slice(0, 200); } catch (_) {}
    } catch (e) {
      result.rest_v1 = { ok: false, error: e?.message || String(e) };
    }

    result.note = "Use NODE_OPTIONS='--dns-result-order=ipv4first' locally if needed.";
    return json(200, result);
  }

  // 4) /api/commission-rules (قراءة فقط)
  if (path.endsWith("/api/commission-rules")) {
    const unauthorized = requireApiKey(event);
    if (unauthorized) return unauthorized;

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return json(500, { ok: false, error: "Missing Supabase env vars" });
    }

    const url = new URL(`${SUPABASE_URL}/rest/v1/commission_rules`);
    const limit = Number(new URL(event.rawUrl).searchParams.get("limit")) || 50;
    url.searchParams.set("select", "*");
    url.searchParams.set("order", "updated_at.desc.nullslast");
    url.searchParams.set("limit", String(limit));

    try {
      const r = await fetch(url, {
        headers: {
          apikey: ANON_KEY || SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
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

    // لو المعدلات مش متوفرة وتم تمرير category نقرأها من Supabase
    if ((!tier1_rate || !tier2_rate || !tier3_rate) && category && SUPABASE_URL && SERVICE_KEY) {
      try {
        const q = new URL(`${SUPABASE_URL}/rest/v1/commission_rules`);
        q.searchParams.set("select", "tier1_rate,tier2_rate,tier3_rate");
        q.searchParams.set("category", `eq.${category}`);
        q.searchParams.set("limit", "1");
        const r = await fetch(q, {
          headers: {
            apikey: ANON_KEY || SERVICE_KEY,
            Authorization: `Bearer ${SERVICE_KEY}`,
          },
        });
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
      return json(400, { ok: false, error: "Rates are missing. Provide tier*_rate or pass a valid category with rules." });
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

  // 6) /api/_env : تشخيص سريع لقيم البيئة (لا يطبع أسرار)
  if (path.endsWith("/api/_env")) {
    return json(200, {
      ok: true,
      has_api_token: Boolean(process.env.API_TOKEN),
      api_token_len: process.env.API_TOKEN ? String(process.env.API_TOKEN).length : 0
    });
  }

  // 7) /api/_auth-check : يفحص وصول الهيدر ومطابقته دون كشف القيم
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

  // 8) /api/_sb : تشخيص مفاتيح Supabase (بدون كشف أسرار)
  if (path.endsWith("/api/_sb")) {
    const svc = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const pub = process.env.SUPABASE_ANON_KEY || "";
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
      header_alg,
      role,
      iss,
      exp
    });
  }
  // — /api/_sb-test : يجرب نداء REST فعلي على جدول commission_rules
  if (path.endsWith("/api/_sb-test")) {
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return json(500, { ok: false, error: "Missing Supabase env vars" });
    }
    try {
      const url = new URL(`${SUPABASE_URL}/rest/v1/commission_rules`);
      url.searchParams.set("select", "id");
      url.searchParams.set("limit", "1");
      const r = await fetch(url, {
        headers: {
          apikey: ANON_KEY || SERVICE_KEY,            // apikey = anon (أو service كـ fallback)
          Authorization: `Bearer ${SERVICE_KEY}`,     // Authorization = service_role
          Prefer: "count=none",
        },
      });
      const text = await r.text(); // قد يكون JSON أو رسالة خطأ
      return json(r.status, {
        ok: r.ok,
        status: r.status,
        bodySample: text.slice(0, 300)
      });
    } catch (e) {
      return json(500, { ok: false, error: e?.message || String(e) });
    }
  }

  // 404 لأي مسار آخر
  return json(404, { ok: false, error: "Not Found" });
};
