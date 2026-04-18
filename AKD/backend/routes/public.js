const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// All routes are public — no authentication required

// GET /api/public/letters              - All approved letters
// GET /api/public/letters?category=X   - Filter by category
// GET /api/public/letters?author=X     - Filter by author name
// GET /api/public/letters?search=X     - Search in title/preview/author
router.get('/letters', publicController.getPublicLetters);

// GET /api/public/letters/:id          - Single letter with full content
router.get('/letters/:id', publicController.getPublicLetter);

// GET /api/public/authors              - All authors with letter counts
router.get('/authors', publicController.getLettersByAuthor);

// GET /api/public/authors/:name        - All letters by a specific author
router.get('/authors/:name', publicController.getLettersByAuthorName);

// GET /api/public/categories           - All categories with counts
router.get('/categories', publicController.getCategories);

// POST /api/public/submit              - Submit a new letter (pending approval)
router.post('/submit', publicController.submitPublicLetter);

module.exports = router;
