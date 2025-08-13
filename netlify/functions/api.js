// Serverless API (Netlify Functions)
// Endpoints:
//   GET /api/health
//   GET /api/diagnostics
//   GET /api/commission-rules?limit=50 (اقصى حد افتراضي 50)

const json = (status, body = {}) => ({
  statusCode: status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,OPTIONS",
    "access-control-allow-headers": "content-type,authorization",
  },
  body: JSON.stringify(body),
});

exports.handler = async (event) => {
  // نتأكد من CORS للـ preflight
  if (event.httpMethod === "OPTIONS") return json(204);

  // نطبّع المسار بحيث يشتغل محليًا وعلى نتلايفاي
  const path = (event.path || "")
    .replace("/.netlify/functions/api", "/api");

  const SUPABASE_URL = process.env.SUPABASE_URL || "";
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  // 1) /api/health
  if (path.endsWith("/api/health")) {
    return json(200, { ok: true, msg: "API is running" });
  }

  // 2) /api/diagnostics
  if (path.endsWith("/api/diagnostics")) {
    const env = {
      url: Boolean(SUPABASE_URL),
      key: Boolean(SERVICE_KEY),
    };

    // نحاول نعمل ping بسيط على PostgREST
    let supabase = { ok: false };
    if (env.url && env.key) {
      try {
        const r = await fetch(`${SUPABASE_URL}/rest/v1`, {
          method: "GET",
          headers: {
            apikey: SERVICE_KEY,
            Authorization: `Bearer ${SERVICE_KEY}`,
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

  // 3) /api/commission-rules  (قراءة فقط)
  if (path.endsWith("/api/commission-rules")) {
    if (!SUPABASE_URL || !SERVICE_KEY) {
      return json(500, { ok: false, error: "Missing Supabase env vars" });
    }

    const url = new URL(`${SUPABASE_URL}/rest/v1/commission_rules`);
    const limit = Number(new URL(event.rawUrl).searchParams.get("limit")) || 50;
    url.searchParams.set("select", "*");
    url.searchParams.set("order", "updated_at.desc");
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

  // 404 لأي مسار آخر
  return json(404, { ok: false, error: "Not Found" });
};
