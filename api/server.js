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

// Import routes
const representativesRoutes = require('./routes/representatives');
const companiesRoutes = require('./routes/companies');
const collectionsRoutes = require('./routes/collections');
const salesRoutes = require('./routes/sales');
const commissionRulesRoutes = require('./routes/commissionRules');
const reportsRoutes = require('./routes/reports');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration for Odoo integration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

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

// ---- SERVER BOOTSTRAP (safe port/host) ----
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

// API routes with authentication middleware
app.use('/api/representatives', authMiddleware, representativesRoutes);
app.use('/api/companies', authMiddleware, companiesRoutes);
app.use('/api/collections', authMiddleware, collectionsRoutes);
app.use('/api/sales', authMiddleware, salesRoutes);
app.use('/api/commission-rules', authMiddleware, commissionRulesRoutes);
app.use('/api/reports', authMiddleware, reportsRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Global error handler
app.use(errorHandler);

// start server
app.listen(PORT, HOST, () => {
  console.log(`[API] listening on http://${HOST}:${PORT}`);
});
// ---- END BOOTSTRAP ----

module.exports = app;