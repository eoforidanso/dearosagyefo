const express = require('express');
const router = express.Router();
const multer = require('multer');
const letterController = require('../controllers/letterController');
const pdfController = require('../controllers/pdfController');
const audioController = require('../controllers/audioController');
const { authenticateToken } = require('../middleware/auth');

// Multer: store image in memory, max 5MB
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// ── Admin middleware ──────────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  const ADMIN_SECRET = process.env.ADMIN_SECRET;
  if (!ADMIN_SECRET) {
    return res.status(503).json({ message: 'Admin not configured. Set ADMIN_SECRET in .env.' });
  }
  if (req.headers['x-admin-secret'] !== ADMIN_SECRET) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  next();
}

// ── Admin routes (protected by x-admin-secret header) ────────────────────────
router.get('/admin/all',              requireAdmin, letterController.adminGetAllLetters);
router.get('/admin/public/all',       requireAdmin, letterController.adminGetAllPublicLetters);
router.get('/admin/public/:id',       requireAdmin, letterController.adminGetPublicLetter);
router.put('/admin/public/:id',       requireAdmin, letterController.adminUpdatePublicLetter);
router.delete('/admin/public/:id',    requireAdmin, letterController.adminDeletePublicLetter);
router.put('/admin/public/:id/restore', requireAdmin, letterController.adminRestorePublicLetter);
router.post('/admin/public/:id/generate-audio', requireAdmin, audioController.generatePublicLetterAudio);

// All routes below require authentication
router.use(authenticateToken);

// Dashboard statistics — must be before /:id to avoid being shadowed
router.get('/stats/dashboard', letterController.getDashboardStats);

// Letter CRUD routes
router.post('/', upload.single('image'), letterController.createLetter);
router.get('/', letterController.getUserLetters);
router.get('/:id', letterController.getLetter);
router.put('/:id', upload.single('image'), letterController.updateLetter);
router.delete('/:id', letterController.deleteLetter);

// Publish a letter to the public site
router.post('/:id/publish-to-site', letterController.publishToSite);

// PDF generation route
router.get('/:id/pdf', pdfController.generateLetterPDF);

module.exports = router;
