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
      pl.content,
      pl.preview,
      pl.category,
      pl.tags,
      COALESCE(pl.accentColor, '#D43F3A') as accentColor,
      pl.publishedAt,
      pl.imageData,
      pl.audioUrl,
      COUNT(lr.id) as reactionCount
    FROM public_letters pl
    LEFT JOIN letter_reactions lr ON lr.letterId = pl.id
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
    query += ` AND (pl.title LIKE ? OR pl.preview LIKE ? OR pl.authorName LIKE ? OR pl.content LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ` GROUP BY pl.id ORDER BY pl.id DESC`;

  db.all(query, params, (err, letters) => {
    if (err) {
      console.error('Error fetching public letters:', err);
      return res.status(500).json({ message: 'Server error' });
    }
    // This list is public and identical for everyone, so it was needlessly
    // uncacheable: 'no-store' meant every page view — and every navigation
    // between the homepage and the archive — refetched the whole payload from
    // the origin, and CloudFront could never serve it. A short TTL keeps new
    // letters and reaction counts appearing promptly while letting the CDN
    // absorb the repeat traffic; stale-while-revalidate hides the refresh.
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
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

// POST toggle a heart reaction on a letter (fingerprint-based, one per browser)
exports.reactToLetter = (req, res) => {
  const { id } = req.params;
  const { fingerprint } = req.body;
  if (!fingerprint) return res.status(400).json({ message: 'fingerprint required' });

  db.get(
    `SELECT id FROM letter_reactions WHERE letterId = ? AND fingerprint = ?`,
    [id, fingerprint],
    (err, row) => {
      if (err) return res.status(500).json({ message: 'Server error' });

      const finish = () => {
        db.get(`SELECT COUNT(*) as count FROM letter_reactions WHERE letterId = ?`, [id], (e, r) => {
          res.json({ reacted: !row, count: r ? r.count : 0 });
        });
      };

      if (row) {
        db.run(`DELETE FROM letter_reactions WHERE letterId = ? AND fingerprint = ?`, [id, fingerprint], finish);
      } else {
        db.run(`INSERT OR IGNORE INTO letter_reactions (letterId, fingerprint) VALUES (?, ?)`, [id, fingerprint], finish);
      }
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
