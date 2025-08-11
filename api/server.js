const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

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

// Swagger documentation
swaggerSetup(app);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Commission API Server running on port ${PORT}`);
  console.log(`📚 API Documentation available at http://localhost:${PORT}/docs`);
  console.log(`🏥 Health check available at http://localhost:${PORT}/health`);
});

module.exports = app;