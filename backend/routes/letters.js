const express = require('express');
const router = express.Router();
const multer = require('multer');
const letterController = require('../controllers/letterController');
const pdfController = require('../controllers/pdfController');
const { authenticateToken } = require('../middleware/auth');

// Multer: store image in memory, max 5MB
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

// All routes require authentication
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
