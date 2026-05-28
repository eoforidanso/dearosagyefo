const express = require('express');
const router = express.Router();

// GET /api/portal/ping — Verify portal secret header
router.get('/ping', (req, res) => {
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

module.exports = router;
