const db = require('../config/database');

// GET all approved public letters (optionally filtered by category or author)
exports.getPublicLetters = (req, res) => {
  const { category, author, search } = req.query;

  // Query from public_letters table (canonical published/curated letters)
  let query = `
    SELECT 
      pl.id,
      pl.letterNumber,
      pl.authorName,
      pl.title,
      pl.preview,
      pl.content,
      pl.category,
      pl.tags,
      COALESCE(pl.accentColor, '#D43F3A') as accentColor,
      pl.publishedAt,
      pl.imageData,
      pl.audioUrl
    FROM public_letters pl
    WHERE pl.isApproved = 1
  `;
  const params = [];

  if (category) {
    query += ` AND pl.category = ?`;
    params.push(category);
  }

  if (author) {
    query += ` AND pl.authorName LIKE ?`;
    params.push(`%${author}%`);
  }

  if (search) {
    query += ` AND (pl.title LIKE ? OR pl.preview LIKE ? OR pl.authorName LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY pl.id DESC`;

  db.all(query, params, (err, letters) => {
    if (err) {
      console.error('Error fetching public letters:', err);
      return res.status(500).json({ message: 'Server error' });
    }
    res.set('Cache-Control', 'no-store');
    res.json(letters);
  });
};

// GET a single public letter by ID (includes full content)
exports.getPublicLetter = (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT 
      pl.id,
      pl.letterNumber,
      pl.authorName,
      pl.title,
      pl.content,
      pl.preview,
      pl.category,
      pl.tags,
      COALESCE(pl.accentColor, '#D43F3A') as accentColor,
      pl.publishedAt,
      pl.imageData,
      pl.audioUrl
    FROM public_letters pl
    WHERE pl.id = ? AND pl.isApproved = 1`,
    [id],
    (err, letter) => {
      if (err) {
        console.error('Error fetching letter:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      if (!letter) {
        return res.status(404).json({ message: 'Letter not found' });
      }

      res.json(letter);
    }
  );
};

// GET all letters grouped by author
exports.getLettersByAuthor = (req, res) => {
  db.all(
    `SELECT authorName, COUNT(*) as letterCount,
            GROUP_CONCAT(title, ' | ') as titles,
            MIN(publishedAt) as firstPublished,
            MAX(publishedAt) as lastPublished
     FROM public_letters
     WHERE isApproved = 1
     GROUP BY authorName
     ORDER BY firstPublished ASC`,
    [],
    (err, authors) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }
      res.json(authors);
    }
  );
};

// GET all letters by a specific author name
exports.getLettersByAuthorName = (req, res) => {
  const { name } = req.params;

  db.all(
    `SELECT id, letterNumber, authorName, title, preview, category, tags, accentColor, publishedAt
     FROM public_letters
     WHERE isApproved = 1 AND authorName LIKE ?
     ORDER BY letterNumber ASC`,
    [`%${name}%`],
    (err, letters) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }
      res.json(letters);
    }
  );
};

// GET all available categories
exports.getCategories = (req, res) => {
  db.all(
    `SELECT category, COUNT(*) as count
     FROM public_letters
     WHERE isApproved = 1
     GROUP BY category
     ORDER BY count DESC`,
    [],
    (err, categories) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }
      res.json(categories);
    }
  );
};

// POST submit a new letter (public submission — goes into pending approval)
exports.submitPublicLetter = (req, res) => {
  const { authorName, title, content, category } = req.body;

  if (!authorName || !title || !content) {
    return res.status(400).json({ message: 'Author name, title, and content are required' });
  }

  // Build a short preview: strip HTML tags, collapse whitespace, trim to 200 chars
  const plainText = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const preview = plainText.length > 200 ? plainText.substring(0, 200) + '...' : plainText;

  db.run(
    `INSERT INTO public_letters (authorName, title, preview, content, category, isApproved)
     VALUES (?, ?, ?, ?, ?, 0)`,
    [authorName, title, preview, content, category || 'General'],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }

      res.status(201).json({
        message: 'Letter submitted successfully! It will appear after review.',
        letterId: this.lastID
      });
    }
  );
};
