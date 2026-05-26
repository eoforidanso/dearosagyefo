const db = require('../config/database');

// POST /api/visitors/submit — Accept a new letter from a website visitor
exports.submitVisitorLetter = (req, res) => {
  const { penName, email, title, content, category, tags, location } = req.body;

  if (!penName || !title || !content) {
    return res.status(400).json({ message: 'Pen name, title, and content are required.' });
  }

  if (content.length < 50) {
    return res.status(400).json({ message: 'Letter content must be at least 50 characters.' });
  }

  const preview = content.length > 220 ? content.substring(0, 220).trimEnd() + '...' : content;
  const tagsClean = tags ? tags.trim() : '';
  const locationClean = location ? location.trim().substring(0, 100) : null;

  db.run(
    `INSERT INTO visitor_letters (penName, email, title, preview, content, category, tags, location, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [penName.trim(), email || null, title.trim(), preview, content, category || 'General', tagsClean, locationClean],
    function (err) {
      if (err) {
        console.error('Error saving visitor letter:', err.message);
        return res.status(500).json({ message: 'Could not save your letter. Please try again.' });
      }
      res.status(201).json({
        message: 'Thank you! Your letter has been received and will appear after review.',
        letterId: this.lastID
      });
    }
  );
};

// GET /api/visitors/letters — All approved (status='approved') visitor letters
exports.getVisitorLetters = (req, res) => {
  const { category, search } = req.query;

  let query = `SELECT id, penName, title, preview, category, tags, location, submittedAt
               FROM visitor_letters WHERE status = 'approved'`;
  const params = [];

  if (category) {
    query += ` AND category = ?`;
    params.push(category);
  }

  if (search) {
    query += ` AND (title LIKE ? OR preview LIKE ? OR penName LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY submittedAt DESC`;

  db.all(query, params, (err, letters) => {
    if (err) {
      console.error('Error fetching visitor letters:', err.message);
      return res.status(500).json({ message: 'Server error' });
    }
    res.json(letters);
  });
};

// GET /api/visitors/letters/:id — Single approved visitor letter with full content
exports.getVisitorLetter = (req, res) => {
  const { id } = req.params;

  if (!Number.isInteger(Number(id))) {
    return res.status(400).json({ message: 'Invalid letter ID.' });
  }

  db.get(
    `SELECT id, penName, title, preview, content, category, tags, location, submittedAt
     FROM visitor_letters WHERE id = ? AND status = 'approved'`,
    [id],
    (err, letter) => {
      if (err) {
        console.error('Error fetching visitor letter:', err.message);
        return res.status(500).json({ message: 'Server error' });
      }
      if (!letter) {
        return res.status(404).json({ message: 'Letter not found.' });
      }
      res.json(letter);
    }
  );
};

// GET /api/visitors/categories — Distinct categories among approved visitor letters
exports.getVisitorCategories = (req, res) => {
  db.all(
    `SELECT category, COUNT(*) as count
     FROM visitor_letters WHERE status = 'approved'
     GROUP BY category ORDER BY count DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }
      res.json(rows);
    }
  );
};

// POST /api/visitors/my-letters — Get letters by array of IDs (for visitor to check their own)
exports.getMyLetters = (req, res) => {
  const { ids } = req.body;
  if (!ids || !Array.isArray(ids) || !ids.length) {
    return res.json([]);
  }
  const placeholders = ids.map(() => '?').join(',');
  db.all(
    `SELECT id, penName, title, preview, category, status, submittedAt
     FROM visitor_letters WHERE id IN (${placeholders})
     ORDER BY submittedAt DESC`,
    ids,
    (err, rows) => {
      if (err) {
        console.error('Error fetching my letters:', err.message);
        return res.status(500).json({ message: 'Server error' });
      }
      res.json(rows);
    }
  );
};

// ── ADMIN REVIEW ENDPOINTS ──────────────────────────────────────────────────

// GET /api/visitors/admin/pending — All letters awaiting review
exports.getPendingLetters = (req, res) => {
  db.all(
    `SELECT id, penName, email, title, preview, content, category, tags, location, submittedAt
     FROM visitor_letters WHERE status = 'pending'
     ORDER BY submittedAt ASC`,
    [],
    (err, rows) => {
      if (err) {
        console.error('Error fetching pending letters:', err.message);
        return res.status(500).json({ message: 'Server error' });
      }
      res.json(rows);
    }
  );
};

// GET /api/visitors/admin/history — Already-reviewed letters (approved + rejected)
exports.getReviewHistory = (req, res) => {
  db.all(
    `SELECT id, penName, title, preview, category, status, submittedAt, reviewedAt
     FROM visitor_letters WHERE status IN ('approved', 'rejected')
     ORDER BY reviewedAt DESC`,
    [],
    (err, rows) => {
      if (err) {
        console.error('Error fetching review history:', err.message);
        return res.status(500).json({ message: 'Server error' });
      }
      res.json(rows);
    }
  );
};

// PUT /api/visitors/admin/:id/approve — Approve a pending letter and publish to public_letters
exports.approveLetter = (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'Invalid letter ID.' });
  }

  // First fetch the letter so we can copy it to public_letters
  db.get(
    `SELECT * FROM visitor_letters WHERE id = ? AND status = 'pending'`,
    [id],
    (err, letter) => {
      if (err) {
        console.error('Error fetching visitor letter:', err.message);
        return res.status(500).json({ message: 'Server error' });
      }
      if (!letter) {
        return res.status(404).json({ message: 'Letter not found or already reviewed.' });
      }

      // Mark as approved in visitor_letters
      db.run(
        `UPDATE visitor_letters SET status = 'approved', reviewedAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
        [id],
        function (err2) {
          if (err2) {
            console.error('Error approving letter:', err2.message);
            return res.status(500).json({ message: 'Server error' });
          }

          // Get the next letter number
          db.get(`SELECT COALESCE(MAX(letterNumber), 0) + 1 AS nextNum FROM public_letters`, [], (err3, row) => {
            if (err3) return res.status(500).json({ message: 'Server error getting letter number' });

            const nextNum = row.nextNum;
            const today = new Date().toISOString().split('T')[0];

            // Insert into public_letters so it appears on Open Letters page
            db.run(
              `INSERT INTO public_letters (letterNumber, authorName, title, preview, content, category, tags, accentColor, publishedAt, isApproved)
               VALUES (?, ?, ?, ?, ?, ?, ?, '#D43F3A', ?, 1)`,
              [
                nextNum,
                letter.penName || 'Anonymous',
                letter.title,
                letter.preview || letter.content.substring(0, 220),
                letter.content,
                letter.category || 'General',
                letter.tags || '',
                today
              ],
              function (err4) {
                if (err4) {
                  console.error('Error inserting into public_letters:', err4.message);
                  // Still return success since visitor_letters was updated
                  return res.json({ message: 'Letter approved (public publish failed)', publicId: null });
                }
                res.json({ message: 'Letter approved and published to Open Letters.', publicId: this.lastID });
              }
            );
          });
        }
      );
    }
  );
};

// PUT /api/visitors/admin/:id/reject — Reject a pending letter
exports.rejectLetter = (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ message: 'Invalid letter ID.' });
  }

  db.run(
    `UPDATE visitor_letters SET status = 'rejected', reviewedAt = CURRENT_TIMESTAMP, updatedAt = CURRENT_TIMESTAMP
     WHERE id = ? AND status = 'pending'`,
    [id],
    function (err) {
      if (err) {
        console.error('Error rejecting letter:', err.message);
        return res.status(500).json({ message: 'Server error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: 'Letter not found or already reviewed.' });
      }
      res.json({ message: 'Letter rejected.' });
    }
  );
};
