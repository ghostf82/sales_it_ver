// api/server.js
'use strict';

const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
}

const app = require('./app');

/* ------------ Host/Port ------------ */
const rawPort = String(process.env.PORT || '3001').trim();
const PORT = Number.parseInt(rawPort, 10) > 0 ? Number.parseInt(rawPort, 10) : 3001;
const HOST = process.env.HOST || '0.0.0.0';

/* ------------ Process-level Guards ------------ */
process.on('unhandledRejection', (e) => console.error('unhandledRejection:', e));
process.on('uncaughtException', (e) => console.error('uncaughtException:', e));

/* ------------ Start Server (للتشغيل المحلي فقط) ------------ */
http.createServer(app).listen(PORT, HOST, () => {
  console.log(`🚀 Commission API on http://${HOST}:${PORT}`);
  console.log(`🏥 Health: http://${HOST}:${PORT}/health`);
  console.log(`📚 Docs:   http://${HOST}:${PORT}/docs`);
});

module.exports = app;
