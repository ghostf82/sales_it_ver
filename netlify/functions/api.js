// Serverless API (Netlify Functions) — مع فحص متقدّم واختياري X-API-KEY
// Endpoints:
//   GET /api/health
//   GET /api/diagnostics
//   GET /api/_probe
//   GET /api/commission-rules?limit=50

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

// حماية اختيارية: إذا تم ضبط API_TOKEN في البيئة، نُلزم الهيدر X-API-KEY
function requireApiKey(event) {
  const REQUIRED = process.env.API_TOKEN || "";
  if (!REQUIRED) return null; // غير مفعّل
  const h = event.headers || {};
  const got =
    h["x-api-key"] ||
    h["X-API-KEY"] ||
    h["x-api-Key"] ||
    h["X-Api-Key"] ||
    "";
  if (String(got) === String(REQUIRED)) return null;
  return json(401, { ok: false, error: "Unauthorized: missing or invalid X-API-KEY" });
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return json(204);

  const path = (event.path || "").replace("/.netlify/functions/api", "/api");
  const SUPABASE_URL = process.env.SUPABASE_URL || "";
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  // 1) /api/health
  if (path.endsWith("/api/health")) {
    return json(200, { ok: true, msg: "API is running" });
  }

  // 2) /api/diagnostics (سريع)
  if (path.endsWith("/api/diagnostics")) {
    const env = { url: Boolean(SUPABASE_URL), key: Boolean(SERVICE_KEY) };
    let supabase = { ok: false };
    if (env.url && env.key) {
      try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1`, {
          method: "GET",
          headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
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
    const env = { url: Boolean(SUPABASE_URL), key: Boolean(SERVICE_KEY) };
    const result = { ok: true, env };
    if (!env.url) return json(200, { ...result, note: "No SUPABASE_URL" });

    let host = null;
    try {
      host = new URL(SUPABASE_URL).hostname;
      result.host = host;
    } catch (e) {
      return json(200, { ...result, error: "Invalid SUPABASE_URL format", detail: String(e) });
    }

    try {
      result.dns4 = await dns.resolve4(host);
    } catch (e) {
      result.dns4 = { error: e?.code || e?.message || String(e) };
    }
    try {
      result.dns6 = await dns.resolve6(host);
    } catch (e) {
      result.dns6 = { error: e?.code || e?.message || String(e) };
    }

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
          apikey: SERVICE_KEY || "",
          Authorization: SERVICE_KEY ? `Bearer ${SERVICE_KEY}` : "",
        },
      });
      result.rest_v1 = { ok: r1.ok, status: r1.status };
      try {
        const text = await r1.text();
        result.rest_v1_body_sample = text.slice(0, 200);
      } catch (_) {}
    } catch (e) {
      result.rest_v1 = { ok: false, error: e?.message || String(e) };
    }

    result.note = "Use NODE_OPTIONS='--dns-result-order=ipv4first' locally if needed.";
    return json(200, result);
  }

  // 4) /api/commission-rules  (قراءة فقط حالياً)
  if (path.endsWith("/api/commission-rules")) {
    // تحقّق X-API-KEY (لو API_TOKEN مضبوط)
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
          apikey: SERVICE_KEY,
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

  return json(404, { ok: false, error: "Not Found" });
};
