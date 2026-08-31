const express = require('express');
const router = express.Router();
const subscribeController = require('../controllers/subscribeController');

function requireAdmin(req, res, next) {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return res.status(503).json({ message: 'Admin not configured' });
  if (req.headers['x-admin-secret'] !== secret) return res.status(403).json({ message: 'Forbidden' });
  next();
}

// POST /api/subscribe — Subscribe with an email address
router.post('/', subscribeController.subscribe);

// GET /api/subscribe/admin/list — List all subscribers (admin only)
router.get('/admin/list', requireAdmin, subscribeController.listSubscribers);

module.exports = router;
