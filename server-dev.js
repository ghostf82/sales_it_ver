// server-dev.js — تشغيل وظائف Netlify محليًا بدون Netlify CLI
// يحمّل .env يدويًا ويستدعي exports.handler من netlify/functions/api.js

const http = require("http");
const fs = require("fs");
const path = require("path");

// تحميل .env بدون مكتبات خارجية
(function loadEnv() {
  const envPath = path.resolve(__dirname, ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith("#")) continue;
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[m[1]] = v;
  }
})();

// استيراد الهاندلر من وظيفة نتلايفاي
const { handler } = require("./netlify/functions/api.js");

const PORT = process.env.PORT ? Number(process.env.PORT) : 3017;

const server = http.createServer(async (req, res) => {
  try {
    const event = {
      httpMethod: req.method,
      path: req.url.split("?")[0],
      rawUrl: `http://localhost:${PORT}${req.url}`,
      headers: req.headers,
    };

    const result = await handler(event, {});
    const status = result?.statusCode ?? 200;
    const headers = result?.headers ?? { "content-type": "text/plain; charset=utf-8" };
    const body = result?.body ?? "";

    res.writeHead(status, headers);
    res.end(body);
  } catch (e) {
    res.writeHead(500, { "content-type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: false, error: e?.message || String(e) }));
  }
});

server.listen(PORT, () => {
  console.log(`Dev server running at http://localhost:${PORT}`);
  console.log(`Test:  curl http://localhost:${PORT}/api/health`);
  console.log(`       curl http://localhost:${PORT}/api/diagnostics`);
  console.log(`       curl "http://localhost:${PORT}/api/commission-rules?limit=1"`);
});
