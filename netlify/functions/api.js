// netlify/functions/api.js
// بتلفّ الـ Express app الموجود عندك كـ Netlify Function
const serverless = require('serverless-http');
const path = require('path');

// (اختياري لعمل dev محلي) حاول يقرأ .env لو موجود
try { require('dotenv').config({ path: path.resolve(__dirname, '../../.env') }); } catch {}

const app = require('../../api/app'); // احنا بنفترض إن عندك api/app.js بيرجع app
module.exports.handler = serverless(app);
