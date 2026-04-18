const db = require('../config/database');

// GET all approved public letters (optionally filtered by category or author)
exports.getPublicLetters = (req, res) => {
  const { category, author, search } = req.query;

  let query = `SELECT id, letterNumber, authorName, title, preview, category, tags, accentColor, publishedAt
               FROM public_letters WHERE isApproved = 1`;
  const params = [];

  if (category) {
    query += ` AND category = ?`;
    params.push(category);
  }

  if (author) {
    query += ` AND authorName LIKE ?`;
    params.push(`%${author}%`);
  }

  if (search) {
    query += ` AND (title LIKE ? OR preview LIKE ? OR authorName LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY letterNumber ASC`;

  db.all(query, params, (err, letters) => {
    if (err) {
      return res.status(500).json({ message: 'Server error' });
    }
    res.json(letters);
  });
};

// GET a single public letter by ID (includes full content)
exports.getPublicLetter = (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT * FROM public_letters WHERE id = ? AND isApproved = 1`,
    [id],
    (err, letter) => {
      if (err) {
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

  // Build a short preview from the first 200 chars of content
  const preview = content.length > 200 ? content.substring(0, 200) + '...' : content;

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
