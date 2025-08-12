// api/server.js
'use strict';

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
// Fallback لـ .env في جذر المشروع لو المتغيرات مش موجودة
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
}

const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const swaggerSetup = require('./config/swagger');
const errorHandler = require('./middleware/errorHandler');

const app = express();

/* ------------ Host/Port ------------ */
const rawPort = String(process.env.PORT || '3001').trim();
const PORT = Number.parseInt(rawPort, 10) > 0 ? Number.parseInt(rawPort, 10) : 3001;
const HOST = process.env.HOST || '0.0.0.0';

/* ------------ Security & Logging ------------ */
app.set('trust proxy', 1);
app.use(helmet());
app.use(morgan('combined'));

/* ------------ CORS (مرة واحدة فقط) ------------ */
const corsOrigin = process.env.CORS_ORIGIN || true; // true = يعكس الأورجن تلقائيًا
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

/* ------------ Body Parsers ------------ */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* ------------ Rate Limiting على مسار /api ------------ */
app.use(
  '/api',
  rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '', 10) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '', 10) || 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later.' },
  })
);

/* ------------ Health (بيستخدمه مزوّد الاستضافة) ------------ */
app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true, msg: 'API is running' });
});

/* ------------ Swagger Docs ------------ */
swaggerSetup(app);

/* ------------ Route Mounter آمن ------------ */
function mountRoute(routePath, rel) {
  try {
    const mod = require(rel);
    app.use(routePath, mod);
    console.log(`[API] mounted ${rel} at ${routePath}`);
  } catch (e) {
    console.warn(`[API] skipping ${rel}: ${e.message}`);
  }
}

mountRoute('/api/reports', './routes/reports');
mountRoute('/api/commission-rules', './routes/commissionRules');
mountRoute('/api/representatives', './routes/representatives');
mountRoute('/api/companies', './routes/companies');
mountRoute('/api/sales', './routes/sales');
mountRoute('/api/collections', './routes/collections');

/* ------------ Diagnostics اختيارية ------------ */
const { supabase } = require('./config/supabase');
app.get('/diagnostics', async (_req, res) => {
  const out = { ok: true, env: {}, supabase: { ok: false, error: null } };
  try {
    const { error } = await supabase
      .from('commission_rules')
      .select('id', { head: true, count: 'exact' });
    out.supabase.ok = !error;
    out.supabase.error = error ? error.message : null;
  } catch (e) {
    out.supabase.error = e.message;
  }
  out.env = {
    url: !!process.env.SUPABASE_URL || !!process.env.SUPABASE_PROJECT_REF,
    key: !!process.env.SUPABASE_KEY,
    port: PORT,
  };
  res.json(out);
});

/* ------------ Root Index ------------ */
app.get('/', (_req, res) => {
  res.status(200).json({
    ok: true,
    service: 'commission-api',
    health: '/health',
    docs: '/docs',
    endpoints: [
      '/api/commission-rules',
      '/api/representatives',
      '/api/companies',
      '/api/sales',
      '/api/collections',
      '/api/reports',
    ],
    time: new Date().toISOString(),
  });
});

/* ------------ 404 (لازم تكون آخر ميدل وير عادية) ------------ */
app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Not found', path: req.originalUrl });
});

/* ------------ Error Handler (لو عندك واحد مخصص) ------------ */
app.use(errorHandler);

/* ------------ Process-level Guards ------------ */
process.on('unhandledRejection', (e) => console.error('unhandledRejection:', e));
process.on('uncaughtException', (e) => console.error('uncaughtException:', e));

/* ------------ Start Server ------------ */
http.createServer(app).listen(PORT, HOST, () => {
  console.log(`🚀 Commission API on http://${HOST}:${PORT}`);
  console.log(`🏥 Health: http://${HOST}:${PORT}/health`);
  console.log(`📚 Docs:   http://${HOST}:${PORT}/docs`);
});

module.exports = app;
