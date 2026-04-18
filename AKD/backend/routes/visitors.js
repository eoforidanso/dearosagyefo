const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitorController');

// Middleware: verify admin secret header
function requireAdmin(req, res, next) {
  const ADMIN_SECRET = process.env.ADMIN_SECRET;
  if (!ADMIN_SECRET) {
    return res.status(503).json({ message: 'Admin access not configured. Set ADMIN_SECRET in .env.' });
  }
  const provided = req.headers['x-admin-secret'];
  if (!provided || provided !== ADMIN_SECRET) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }
  next();
}

// ── Public routes ───────────────────────────────────────────────────────────

// POST /api/visitors/submit              - Submit a letter as a visitor
router.post('/submit', visitorController.submitVisitorLetter);

// GET  /api/visitors/letters             - All approved visitor letters
// GET  /api/visitors/letters?category=X  - Filter by category
// GET  /api/visitors/letters?search=X    - Search in title/preview/penName
router.get('/letters', visitorController.getVisitorLetters);

// GET  /api/visitors/letters/:id         - Single approved visitor letter
router.get('/letters/:id', visitorController.getVisitorLetter);

// GET  /api/visitors/categories          - Categories with counts
router.get('/categories', visitorController.getVisitorCategories);

// ── Admin review routes (protected) ────────────────────────────────────────

// GET  /api/visitors/admin/pending       - All pending letters awaiting review
router.get('/admin/pending', requireAdmin, visitorController.getPendingLetters);

// GET  /api/visitors/admin/history       - Already-reviewed letters
router.get('/admin/history', requireAdmin, visitorController.getReviewHistory);

// PUT  /api/visitors/admin/:id/approve   - Approve a pending letter
router.put('/admin/:id/approve', requireAdmin, visitorController.approveLetter);

// PUT  /api/visitors/admin/:id/reject    - Reject a pending letter
router.put('/admin/:id/reject', requireAdmin, visitorController.rejectLetter);

module.exports = router;
