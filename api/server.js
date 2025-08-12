const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
}

const swaggerSetup = require('./config/swagger');
const errorHandler = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/auth');

const app = express();

// Security middleware
app.use(helmet());

// Trust proxy and CORS
app.set("trust proxy", 1);
app.use(cors({ origin: true, credentials: true }));

// Global error handling
process.on("uncaughtException", (e)=>console.error("uncaughtException:", e));
process.on("unhandledRejection", (e)=>console.error("unhandledRejection:", e));

// CORS configuration for Odoo integration
// (keeping existing CORS config as fallback)
if (!app._router || !app._router.stack.some(layer => layer.name === 'corsMiddleware')) {
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true
  }));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Start server on 0.0.0.0 with safe PORT
const rawPort = (process.env.PORT || "3001").toString().trim();
const PORT = Number.parseInt(rawPort, 10) > 0 ? Number.parseInt(rawPort, 10) : 3001;
const HOST = "0.0.0.0";

// health endpoint (for Bolt)
app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, data: { message: "API is running" } });
});

// global error guards
process.on("unhandledRejection", (r) => console.error("unhandledRejection:", r));
process.on("uncaughtException", (e) => console.error("uncaughtException:", e));

// Swagger documentation
swaggerSetup(app);

// ---------- SAFE ROUTE MOUNTER ----------
function mountRoute(path, rel) {
  try {
    const r = require(rel);
    app.use(path, r);
    console.log(`[API] mounted ${rel} at ${path}`);
  } catch (e) {
    console.error(`[API] skipping ${rel}: ${e.message}`);
  }
}

// Mount known routes defensively (only if exist)
mountRoute("/api/reports", "./routes/reports");
mountRoute("/api/commission-rules", "./routes/commissionRules");
mountRoute("/api/representatives", "./routes/representatives");
mountRoute("/api/companies", "./routes/companies");
mountRoute("/api/sales", "./routes/sales");
mountRoute("/api/collections", "./routes/collections");

// Root index to avoid 404 on "/"
app.get("/", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "commission-api",
    time: new Date().toISOString(),
    endpoints: [
      "/health",
      "/docs",
      "/api/commission-rules",
      "/api/representatives",
      "/api/companies",
      "/api/sales",
      "/api/collections",
      "/api/reports"
    ]
  });
});

// Health endpoint (works even if routes fail)
app.get("/health", (_req,res)=> res.status(200).json({ok:true, msg:"API is running"}));

const { supabase } = require("./config/supabase");
app.get("/diagnostics", async (_req, res) => {
  let supa = { ok: false, error: null };
  try {
    // lightweight metadata check (no data leak)
    const { error } = await supabase.from("commission_rules").select("id", { head: true, count: "exact" });
    supa.ok = !error; supa.error = error?.message || null;
  } catch (e) { supa.error = e.message; }
  res.json({
    ok: true,
    env: {
      url: !!process.env.SUPABASE_URL || !!process.env.SUPABASE_PROJECT_REF,
      key: !!process.env.SUPABASE_KEY,
      port: process.env.PORT
    },
    supabase: supa
  });
});

// Friendly JSON 404 for any unknown path (keep as last middleware)
app.use((req, res) => {
  res.status(404).json({ ok: false, error: "Not found", path: req.originalUrl });
});

// Root endpoint with API information
app.get("/", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "commission-api",
    health: "/health",
    docs: "/docs",
    api_examples: [
      "/api/commission-rules",
      "/api/representatives",
      "/api/companies",
      "/api/sales",
      "/api/collections",
      "/api/reports"
    ],
    time: new Date().toISOString()
  });
});

const rawPort = (process.env.PORT || "3001").toString().trim();
const PORT = Number.parseInt(rawPort, 10) > 0 ? Number.parseInt(rawPort, 10) : 3001;
const HOST = "0.0.0.0";
const http = require("http");
http.createServer(app).listen(PORT, HOST, () => {
  console.log(`🚀 Commission API Server running on http://${HOST}:${PORT}`);
  console.log(`🏥 Health: /health`);
  console.log(`📚 Docs: /docs`);
});

module.exports = app;