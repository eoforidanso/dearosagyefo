require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

// Import routes
const userRoutes = require('./backend/routes/users');
const letterRoutes = require('./backend/routes/letters');
const publicRoutes = require('./backend/routes/public');
const visitorRoutes = require('./backend/routes/visitors');
const fixAudioUrlsRoutes = require('./backend/routes/fixAudioUrls');

const app = express();
const PORT = process.env.PORT || 3000;

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Initialize database
const db = require('./backend/config/database');

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/letters', letterRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/admin', fixAudioUrlsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Portal access verification — checks x-portal-secret header
app.get('/api/portal/ping', (req, res) => {
  const PORTAL_SECRET = process.env.PORTAL_SECRET;
  if (!PORTAL_SECRET) {
    return res.status(503).json({ message: 'Portal not configured. Set PORTAL_SECRET in .env.' });
  }
  const provided = req.headers['x-portal-secret'];
  if (!provided || provided !== PORTAL_SECRET) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }
  res.json({ ok: true });
});

// ElevenLabs TTS proxy — API key stays server-side, never exposed to the browser
app.post('/api/tts', async (req, res) => {
  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
  if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY === 'your_elevenlabs_api_key_here') {
    return res.status(503).json({ message: 'Text-to-speech not configured: add ELEVENLABS_API_KEY to .env' });
  }

  const { text } = req.body;
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ message: 'text is required' });
  }

  const trimmed = text.trim().slice(0, 5000); // ElevenLabs free tier limit
  const voiceId = process.env.ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB'; // Adam

  try {
    const upstream = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        body: JSON.stringify({
          text: trimmed,
          model_id: 'eleven_monolingual_v1',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 }
        })
      }
    );

    if (!upstream.ok) {
      const errBody = await upstream.text();
      console.error(`ElevenLabs error ${upstream.status}:`, errBody);
      return res.status(502).json({ message: 'Audio generation failed' });
    }

    const buffer = await upstream.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('TTS proxy error:', err);
    res.status(500).json({ message: 'Server error during audio generation' });
  }
});

// ─── SUBSCRIBE ENDPOINT ───────────────────────────────────────────────────────
app.post('/api/subscribe', (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Valid email required' });
  }

  db.run(`INSERT OR IGNORE INTO subscribers (email) VALUES (?)`, [email], function (err) {
    if (err) {
      console.error('Subscribe error:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    if (this.changes === 0) {
      return res.json({ message: 'Already subscribed', alreadySubscribed: true });
    }

    console.log(`✉ New subscriber: ${email}`);

    // Send email notification via Nodemailer (if configured)
    const nodemailer = (() => { try { return require('nodemailer'); } catch { return null; } })();
    if (nodemailer && process.env.SMTP_HOST) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });
      transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: 'eoforid@gmail.com',
        subject: '📬 New Subscriber — Letter to Osagyefo',
        html: `<h3>New Subscriber!</h3><p><strong>${email}</strong> just subscribed to Letter to Osagyefo.</p><p style="color:#888;font-size:0.85rem;">${new Date().toLocaleString()}</p>`
      }).catch(err => console.error('Notification email failed:', err.message));
    }

    res.json({ message: 'Subscribed successfully' });
  });
});

// Temporary admin password reset — protected by PORTAL_SECRET, remove after use
app.post('/api/admin/reset-password', async (req, res) => {
  const PORTAL_SECRET = process.env.PORTAL_SECRET;
  const { secret, email, newPassword } = req.body;
  if (!PORTAL_SECRET || secret !== PORTAL_SECRET) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  if (!email || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: 'email and newPassword (min 6 chars) required' });
  }
  const bcrypt = require('bcryptjs');
  const hash = await bcrypt.hash(newPassword, 10);
  const db = require('./backend/config/database');
  db.run('UPDATE users SET password = ? WHERE email = ?', [hash, email], function(err) {
    if (err) return res.status(500).json({ message: 'DB error', error: err.message });
    if (this.changes === 0) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Password updated successfully' });
  });
});

// Serve static files
app.use(express.static(path.join(__dirname, '.')));

// Serve frontend files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dashboard.html'));
});

app.get('/write', (req, res) => {
  res.sendFile(path.join(__dirname, 'write.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'about.html'));
});

app.get('/timeline', (req, res) => {
  res.sendFile(path.join(__dirname, 'timeline.html'));
});

app.get('/letters', (req, res) => {
  res.sendFile(path.join(__dirname, 'letters.html'));
});

app.get('/preview', (req, res) => {
  res.sendFile(path.join(__dirname, 'preview.html'));
});

app.get('/review', (req, res) => {
  res.sendFile(path.join(__dirname, 'review.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  Letter to Osagyefo - Backend Server   ║
╚════════════════════════════════════════╝

✓ Server running on http://localhost:${PORT}
✓ Database initialized
✓ API endpoints ready at http://localhost:${PORT}/api

📝 API Routes:
  POST   /api/users/register         - Register new user
  POST   /api/users/login            - Login user
  GET    /api/users/profile          - Get user profile (protected)
  PUT    /api/users/profile          - Update profile (protected)
  
  POST   /api/letters                - Create letter (protected)
  GET    /api/letters                - Get all letters (protected)
  GET    /api/letters/:id            - Get single letter (protected)
  PUT    /api/letters/:id            - Update letter (protected)
  DELETE /api/letters/:id            - Delete letter (protected)
  GET    /api/letters/:id/pdf        - Generate PDF (protected)
  GET    /api/letters/stats/dashboard - Dashboard stats (protected)

✓ Press Ctrl+C to stop
  `);
});

module.exports = app;

