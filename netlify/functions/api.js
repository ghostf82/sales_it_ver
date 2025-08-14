// Serverless API (Netlify Functions) — نسخة إنتاج
// - حماية عبر X-API-KEY (API_TOKEN)
// - اتصال Supabase بهيدرَين anon/anon (مع fallback للـ service)
// - المسارات المتاحة: /api/health ، /api/diagnostics (محمي)، /api/commission-rules ، /api/calc-commission

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

// حماية اختيارية: لو API_TOKEN مضبوط، نطلب X-API-KEY مطابق
function requireApiKey(event) {
  const REQUIRED = (process.env.API_TOKEN || "").trim();
  if (!REQUIRED) return null; // غير مفعّل
  const h = event.headers || {};
  const got = String(
    h["x-api-key"] || h["X-API-KEY"] || h["x-api-Key"] || h["X-Api-Key"] || ""
  ).trim();
  if (got && got === REQUIRED) return null;
  return json(401, { ok: false, error: "Unauthorized: missing or invalid X-API-KEY" });
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(204);

  // توحيد المسار سواء نُودي عبر /.netlify/functions/api أو /api
  const path = (event.path || "").replace("/.netlify/functions/api", "/api");

  // متغيرات البيئة
  const SUPABASE_URL = process.env.SUPABASE_URL || "";
  const SERVICE_KEY  = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const ANON_KEY     = (process.env.SUPABASE_ANON_KEY || "").trim();

  // هيدرز Supabase الموحّدة: apikey=anon ، Authorization=Bearer anon (مع fallback للـ service)
  const sbHeaders = () => ({
    apikey: ANON_KEY || SERVICE_KEY,
    Authorization: `Bearer ${ANON_KEY || SERVICE_KEY}`,
  });

  // 1) /api/health
  if (path.endsWith("/api/health")) {
    return json(200, { ok: true, msg: "API is running" });
  }

  // 2) /api/diagnostics — فحص سريع لاتصال Supabase (محمي بـ API key)
  if (path.endsWith("/api/diagnostics")) {
    const unauthorized = requireApiKey(event);
    if (unauthorized) return unauthorized;

    const env = { url: Boolean(SUPABASE_URL), key: Boolean(SERVICE_KEY), anon: Boolean(ANON_KEY) };
    let supabase = { ok: false };
    if (env.url && (env.key || env.anon)) {
      try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1`, { method: "GET", headers: sbHeaders() });
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

  // 3) /api/commission-rules — قراءة فقط (أعمدة مسموح بها للـ anon)
  if (path.endsWith("/api/commission-rules")) {
    const unauthorized = requireApiKey(event);
    if (unauthorized) return unauthorized;

    if (!SUPABASE_URL) {
      return json(500, { ok: false, error: "Missing Supabase URL" });
    }

    const url = new URL(`${SUPABASE_URL}/rest/v1/commission_rules`);
    const limit = Number(new URL(event.rawUrl).searchParams.get("limit")) || 50;
    url.searchParams.set(
      "select",
      "id,category,tier1_from,tier1_to,tier1_rate,tier2_from,tier2_to,tier2_rate,tier3_from,tier3_rate,created_at,updated_at"
    );
    url.searchParams.set("order", "updated_at.desc.nullslast");
    url.searchParams.set("limit", String(limit));

    try {
      const r = await fetch(url, { headers: { ...sbHeaders(), Prefer: "count=none" } });
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

  // 4) /api/calc-commission — حاسبة عمولة (تقرأ المعدلات من Supabase إن لزم)
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

  // 404 لأي مسار آخر
  return json(404, { ok: false, error: "Not Found" });
};
