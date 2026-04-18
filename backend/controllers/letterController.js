const db = require('../config/database');

// Create a new letter
exports.createLetter = (req, res) => {
  const { recipientName, recipientEmail, subject, content, category, tags, summary, status, imageData } = req.body;

  // Support file upload via multer
  let img = imageData || null;
  if (req.file) {
    img = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  }

  // Validation
  if (!recipientName || !content) {
    return res.status(400).json({ message: 'Recipient name and content are required' });
  }

  db.run(
    `INSERT INTO letters (userId, recipientName, recipientEmail, subject, content, category, tags, summary, status, imageData)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, recipientName, recipientEmail || '', subject || '', content,
     category || 'General', tags || '', summary || '', status || 'draft', img],
    function(err) {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }

      res.status(201).json({
        message: 'Letter created successfully',
        letterId: this.lastID
      });
    }
  );
};

// Get all letters for user
exports.getUserLetters = (req, res) => {
  db.all(
    `SELECT id, recipientName, recipientEmail, subject, content, category, tags, summary, status, imageData, createdAt, updatedAt, sentAt
     FROM letters WHERE userId = ? ORDER BY createdAt DESC`,
    [req.user.id],
    (err, letters) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }

      res.json(letters);
    }
  );
};

// Get single letter
exports.getLetter = (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT * FROM letters WHERE id = ? AND userId = ?`,
    [id, req.user.id],
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

// Update letter
exports.updateLetter = (req, res) => {
  const { id } = req.params;
  const { recipientName, recipientEmail, subject, content, category, tags, summary, status, imageData } = req.body;

  // Support file upload via multer
  let img = imageData !== undefined ? imageData : null;
  if (req.file) {
    img = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  }

  db.run(
    `UPDATE letters 
     SET recipientName = ?, recipientEmail = ?, subject = ?, content = ?, category = ?, tags = ?, summary = ?, status = ?, imageData = ?, updatedAt = CURRENT_TIMESTAMP
     WHERE id = ? AND userId = ?`,
    [recipientName, recipientEmail, subject, content, category || 'General', tags || '', summary || '', status || 'draft', img, id, req.user.id],
    (err) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }

      res.json({ message: 'Letter updated successfully' });
    }
  );
};

// Delete letter
exports.deleteLetter = (req, res) => {
  const { id } = req.params;

  db.run(
    `DELETE FROM letters WHERE id = ? AND userId = ?`,
    [id, req.user.id],
    (err) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }

      res.json({ message: 'Letter deleted successfully' });
    }
  );
};

// Get dashboard statistics
exports.getDashboardStats = (req, res) => {
  db.serialize(() => {
    let stats = {};

    // Total letters count
    db.get(
      `SELECT COUNT(*) as total FROM letters WHERE userId = ?`,
      [req.user.id],
      (err, row) => {
        if (err) {
          return res.status(500).json({ message: 'Server error' });
        }
        stats.totalLetters = row.total;

        // Count by status
        db.get(
          `SELECT 
            COUNT(CASE WHEN status = 'draft' THEN 1 END) as drafts,
            COUNT(CASE WHEN status IN ('sent', 'published') THEN 1 END) as sent,
            COUNT(CASE WHEN status = 'archived' THEN 1 END) as archived
           FROM letters WHERE userId = ?`,
          [req.user.id],
          (err, row) => {
            if (err) {
              return res.status(500).json({ message: 'Server error' });
            }

            stats = { ...stats, ...row };

            res.json(stats);
          }
        );
      }
    );
  });
};

// Publish a letter from the private letters table to the public_letters table
exports.publishToSite = (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT * FROM letters WHERE id = ? AND userId = ?`,
    [id, req.user.id],
    (err, letter) => {
      if (err) return res.status(500).json({ message: 'Server error' });
      if (!letter) return res.status(404).json({ message: 'Letter not found' });

      // Check if already published to avoid duplicates
      db.get(`SELECT id FROM public_letters WHERE userId = ? AND title = ? AND isApproved = 1`,
        [req.user.id, letter.subject || 'Untitled'],
        (err2, existing) => {
          if (err2) return res.status(500).json({ message: 'Server error' });
          if (existing) return res.json({ message: 'Letter already published to site', publicId: existing.id });

          // Get the next letter number
          db.get(`SELECT COALESCE(MAX(letterNumber), 0) + 1 AS nextNum FROM public_letters`, (err3, row) => {
            if (err3) return res.status(500).json({ message: 'Server error' });

            const letterNumber = row.nextNum;
            const authorName = req.user.firstName || 'Anonymous';
            const preview = letter.summary || letter.content.substring(0, 200);

            db.run(
              `INSERT INTO public_letters (letterNumber, authorName, title, preview, content, category, tags, accentColor, publishedAt, isApproved, userId, imageData)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, date('now'), 1, ?, ?)`,
              [letterNumber, authorName, letter.subject || 'Untitled', preview, letter.content,
               letter.category || 'General', letter.tags || '', '#D43F3A', req.user.id, letter.imageData || null],
              function(err4) {
                if (err4) return res.status(500).json({ message: 'Server error' });

                // Mark the private letter as published
                db.run(`UPDATE letters SET status = 'published', updatedAt = CURRENT_TIMESTAMP WHERE id = ?`, [id]);

                res.json({ message: 'Letter published to site', publicId: this.lastID });
              }
            );
          });
        }
      );
    }
  );
};
