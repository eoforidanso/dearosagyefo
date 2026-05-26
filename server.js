require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const rateLimit = require('express-rate-limit');
const path     = require('path');
const fs       = require('fs');

// ── Route imports ─────────────────────────────────────────────────────────────
const userRoutes      = require('./backend/routes/users');
const letterRoutes    = require('./backend/routes/letters');
const publicRoutes    = require('./backend/routes/public');
const visitorRoutes   = require('./backend/routes/visitors');
const subscribeRoutes = require('./backend/routes/subscribe');
const portalRoutes    = require('./backend/routes/portal');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Ensure data directory exists ──────────────────────────────────────────────
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// ── Security headers (helmet) ─────────────────────────────────────────────────
app.use(helmet({
  // Allow inline scripts/styles needed by the frontend pages
  contentSecurityPolicy: false,
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'https://www.dearosagyefo.com',
  'https://dearosagyefo.com',
];
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:3000');
}
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS: origin not allowed'));
  },
  credentials: true,
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ── Rate limiters ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});
const subscribeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many subscribe attempts, please try again later.' },
});
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many submissions, please try again later.' },
});

// ── Initialize database ───────────────────────────────────────────────────────
require('./backend/config/database');

// ── API routes ────────────────────────────────────────────────────────────────
// Apply rate limiters before the routers they apply to
app.use('/api/users/login',           authLimiter);
app.use('/api/users/register',        authLimiter);
app.use('/api/users/forgot-password', authLimiter);
app.use('/api/users/reset-password',  authLimiter);
app.use('/api/subscribe',             subscribeLimiter);
app.use('/api/visitors/submit',       submitLimiter);
app.use('/api/public/submit',         submitLimiter);

app.use('/api/users',     userRoutes);
app.use('/api/letters',   letterRoutes);
app.use('/api/public',    publicRoutes);
app.use('/api/visitors',  visitorRoutes);
app.use('/api/subscribe', subscribeRoutes);
app.use('/api/portal',    portalRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API 404 — return JSON, not HTML
app.use('/api', (req, res) => {
  res.status(404).json({ message: `API route not found: ${req.method} ${req.originalUrl}` });
});

// ── Frontend static files ─────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '.')));

// Page routes
const pages = ['login', 'dashboard', 'write', 'about', 'timeline', 'letters', 'preview', 'review', 'quiz', 'from-osagyefo'];
pages.forEach(page => {
  app.get(`/${page}`, (req, res) => res.sendFile(path.join(__dirname, `${page}.html`)));
});
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Frontend 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  // Return JSON for API errors, HTML for page errors
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({ message: 'Internal server error' });
  }
  res.status(500).sendFile(path.join(__dirname, '404.html'));
});

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  Letter to Osagyefo - Backend Server   ║
╚════════════════════════════════════════╝

  Server:   http://localhost:${PORT}
  API base: http://localhost:${PORT}/api

  Auth (rate-limited, 20 req/15 min)
    POST  /api/users/register
    POST  /api/users/login
    POST  /api/users/forgot-password
    POST  /api/users/reset-password
    GET   /api/users/profile          [JWT]
    PUT   /api/users/profile          [JWT]

  Public letters
    GET   /api/public/letters
    GET   /api/public/letters/:id
    GET   /api/public/categories
    GET   /api/public/authors
    POST  /api/public/submit          (rate-limited)

  User letters [JWT required]
    POST  /api/letters
    GET   /api/letters
    GET   /api/letters/:id
    PUT   /api/letters/:id
    DELETE /api/letters/:id
    GET   /api/letters/:id/pdf
    POST  /api/letters/:id/publish-to-site
    GET   /api/letters/stats/dashboard

  Admin letters [x-admin-secret required]
    GET   /api/letters/admin/all
    GET   /api/letters/admin/public/all
    GET   /api/letters/admin/public/:id
    PUT   /api/letters/admin/public/:id
    DELETE /api/letters/admin/public/:id
    PUT   /api/letters/admin/public/:id/restore
    POST  /api/letters/admin/public/:id/generate-audio

  Visitor submissions
    POST  /api/visitors/submit        (rate-limited)
    GET   /api/visitors/letters
    GET   /api/visitors/letters/:id
    GET   /api/visitors/categories
    POST  /api/visitors/my-letters

  Admin visitor review [x-admin-secret required]
    GET   /api/visitors/admin/pending
    GET   /api/visitors/admin/history
    PUT   /api/visitors/admin/:id/approve
    PUT   /api/visitors/admin/:id/reject

  Misc
    POST  /api/subscribe              (rate-limited)
    GET   /api/portal/ping            [x-portal-secret]
    GET   /api/health

  Press Ctrl+C to stop
  `);
});

module.exports = app;

