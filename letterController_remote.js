const db = require('../config/database');


// Create a new letter
exports.createLetter = (req, res) => {
  const { recipientName, recipientEmail, subject, content, category, tags, summary, status, imageData, customSalutation, customClosing } = req.body;

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
    `INSERT INTO letters (userId, recipientName, recipientEmail, subject, content, category, tags, summary, status, imageData, customSalutation, customClosing)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [req.user.id, recipientName, recipientEmail || '', subject || '', content,
     category || 'General', tags || '', summary || '', status || 'draft', img,
     customSalutation || null, customClosing || null],
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
  const { recipientName, recipientEmail, subject, content, category, tags, summary, status, imageData, customSalutation, customClosing } = req.body;

  // Support file upload via multer
  let img = imageData !== undefined ? imageData : null;
  if (req.file) {
    img = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  }

  db.run(
    `UPDATE letters 
     SET recipientName = ?, recipientEmail = ?, subject = ?, content = ?, category = ?, tags = ?, summary = ?, status = ?, imageData = ?,
         customSalutation = ?, customClosing = ?, updatedAt = CURRENT_TIMESTAMP
     WHERE id = ? AND userId = ?`,
    [recipientName, recipientEmail, subject, content, category || 'General', tags || '', summary || '', status || 'draft', img,
     customSalutation || null, customClosing || null, id, req.user.id],
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

// ADMIN: Get ALL letters across all users
exports.adminGetAllLetters = (req, res) => {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || req.headers['x-admin-secret'] !== secret) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  db.all(
    `SELECT l.id, l.userId, l.recipientName, l.subject, l.content, l.category, l.tags, l.summary, l.status, l.imageData, l.createdAt, l.updatedAt,
            pl.id as publicId, pl.title as publicTitle, pl.authorName, pl.publishedAt, pl.isApproved
     FROM letters l
     LEFT JOIN public_letters pl ON pl.userId = l.userId AND pl.title = l.subject AND pl.isApproved = 1
     ORDER BY l.createdAt DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Server error' });
      res.json(rows);
    }
  );
};

// ADMIN: Update any public letter by publicId
exports.adminUpdatePublicLetter = (req, res) => {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || req.headers['x-admin-secret'] !== secret) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const { id } = req.params;
  const { title, content, preview, authorName, category, tags } = req.body;
  db.run(
    `UPDATE public_letters SET title = COALESCE(?, title), content = COALESCE(?, content), preview = COALESCE(?, preview),
     authorName = COALESCE(?, authorName), category = COALESCE(?, category), tags = COALESCE(?, tags),
     updatedAt = datetime('now')
     WHERE id = ?`,
    [title || null, content || null, preview || null, authorName || null, category || null, tags || null, id],
    function(err) {
      if (err) return res.status(500).json({ message: 'Server error' });
      if (this.changes === 0) return res.status(404).json({ message: 'Letter not found' });
      res.json({ message: 'Letter updated', id });
    }
  );
};

// ADMIN: Get single public letter by publicId
exports.adminGetPublicLetter = (req, res) => {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || req.headers['x-admin-secret'] !== secret) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const { id } = req.params;
  db.get(`SELECT * FROM public_letters WHERE id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (!row) return res.status(404).json({ message: 'Not found' });
    res.json(row);
  });
};

// ADMIN: Get ALL public letters directly (includes seeded ones with userId=null)
exports.adminGetAllPublicLetters = (req, res) => {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || req.headers['x-admin-secret'] !== secret) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  db.all(
    `SELECT id, letterNumber, title, authorName, category, publishedAt, isApproved, preview
     FROM public_letters
     ORDER BY id DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Server error' });
      res.json(rows);
    }
  );
};

// ADMIN: Soft-delete (hide) a public letter — sets isApproved=0 so it's hidden from public pages
exports.adminDeletePublicLetter = (req, res) => {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || req.headers['x-admin-secret'] !== secret) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const { id } = req.params;
  db.run(
    `UPDATE public_letters SET isApproved = 0, updatedAt = datetime('now') WHERE id = ?`,
    [id],
    function(err) {
      if (err) return res.status(500).json({ message: 'Server error' });
      if (this.changes === 0) return res.status(404).json({ message: 'Letter not found' });
      res.json({ message: 'Letter hidden from public site', id });
    }
  );
};

// ADMIN: Restore (unhide) a public letter — sets isApproved=1
exports.adminRestorePublicLetter = (req, res) => {
  const secret = process.env.ADMIN_SECRET;
  if (!secret || req.headers['x-admin-secret'] !== secret) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const { id } = req.params;
  db.run(
    `UPDATE public_letters SET isApproved = 1, updatedAt = datetime('now') WHERE id = ?`,
    [id],
    function(err) {
      if (err) return res.status(500).json({ message: 'Server error' });
      if (this.changes === 0) return res.status(404).json({ message: 'Letter not found' });
      res.json({ message: 'Letter restored to public site', id });
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
          if (existing) {
            // Already published — update with latest content from the private letter
            const authorName = letter.customClosing || req.user.firstName || 'A Concerned Ghanaian';
            const preview = letter.summary || letter.content.substring(0, 200);
            db.run(
              `UPDATE public_letters SET content = ?, preview = ?, authorName = ?, category = ?, tags = ?,
                imageData = ?, customSalutation = ?, customClosing = ?, updatedAt = datetime('now')
                WHERE id = ?`,
              [letter.content, preview, authorName, letter.category || 'General', letter.tags || '',
               letter.imageData || null, letter.customSalutation || null, letter.customClosing || null, existing.id],
              (errU) => {
                if (errU) return res.status(500).json({ message: 'Server error updating letter' });
                db.run(`UPDATE letters SET status = 'published', updatedAt = CURRENT_TIMESTAMP WHERE id = ?`, [id]);
                return res.json({ message: 'Published letter updated', publicId: existing.id });
              }
            );
            return;
          }

          // Get the next letter number
          db.get(`SELECT COALESCE(MAX(letterNumber), 0) + 1 AS nextNum FROM public_letters`, (err3, row) => {
            if (err3) return res.status(500).json({ message: 'Server error' });

            const letterNumber = row.nextNum;
            // Use customClosing as the public author/signature if set; fall back to user's name
            const authorName = letter.customClosing || req.user.firstName || 'A Concerned Ghanaian';
            const preview = letter.summary || letter.content.substring(0, 200);

            db.run(
              `INSERT INTO public_letters (letterNumber, authorName, title, preview, content, category, tags, accentColor, publishedAt, isApproved, userId, imageData, customSalutation, customClosing)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, date('now'), 1, ?, ?, ?, ?)`,
              [letterNumber, authorName, letter.subject || 'Untitled', preview, letter.content,
               letter.category || 'General', letter.tags || '', '#D43F3A', req.user.id, letter.imageData || null,
               letter.customSalutation || null, letter.customClosing || null],
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
