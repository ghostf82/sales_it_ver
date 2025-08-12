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
    app.use(path, authMiddleware, r);
    console.log(`[API] mounted ${rel} at ${path}`);
  } catch (e) {
    console.error(`[API] skipping ${rel}:`, e.message);
  }
}

// Mount known routes defensively (only if exist)
mountRoute("/api/reports", "./routes/reports");
mountRoute("/api/commission-rules", "./routes/commissionRules");
mountRoute("/api/representatives", "./routes/representatives");
mountRoute("/api/companies", "./routes/companies");
mountRoute("/api/sales", "./routes/sales");
mountRoute("/api/collections", "./routes/collections");

// Health endpoint (works even if routes fail)
app.get("/health", (_req, res) => {
  res.status(200).json({ success: true, data: { message: "API is running" } });
});

// 404 handler
app.use('*', (req, res) => {
const http = require("http");
const server = http.createServer(app);
server.on("error", (e) => console.error("[API] server error:", e));
server.listen(PORT, HOST, () => {
  console.log(`[API] listening on http://${HOST}:${PORT}`);
});

// global error guards
process.on("unhandledRejection", (r) => console.error("unhandledRejection:", r));
process.on("uncaughtException", (e) => console.error("uncaughtException:", e));
