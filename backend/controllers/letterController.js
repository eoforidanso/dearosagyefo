const db = require('../config/database');
const { generateAndStoreAudio } = require('./audioController');

// Resolve admin secret from env only — no hardcoded fallback
function getAdminSecret() {
  return process.env.ADMIN_SECRET || null;
}

// Verify x-admin-secret header against env var
function checkAdmin(req, res) {
  const secret = getAdminSecret();
  if (!secret) {
    res.status(503).json({ message: 'Admin not configured. Set ADMIN_SECRET in .env.' });
    return false;
  }
  if (req.headers['x-admin-secret'] !== secret) {
    res.status(403).json({ message: 'Forbidden' });
    return false;
  }
  return true;
}

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
    `SELECT l.id, l.recipientName, l.recipientEmail, l.subject, l.content, l.category, l.tags, l.summary, l.status, l.imageData, l.createdAt, l.updatedAt, l.sentAt,
            pl.id AS publicId
     FROM letters l
     LEFT JOIN public_letters pl ON pl.sourceLetterId = l.id AND pl.isApproved = 1
     WHERE l.userId = ? ORDER BY l.createdAt DESC`,
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
    async (err2) => {
      if (err2) return res.status(500).json({ message: 'Server error' });

      // Keep the published public copy in sync (if one exists)
      const publicChanges = await new Promise((resolve) => {
        db.run(
          `UPDATE public_letters
           SET title = ?, content = ?, preview = ?, category = ?, tags = ?, imageData = ?,
               customSalutation = ?, customClosing = ?, updatedAt = datetime('now')
           WHERE sourceLetterId = ?`,
          [subject, content, summary || '', category || 'General', tags || '', img,
           customSalutation || null, customClosing || null, id],
          function() { resolve(this.changes); }
        );
      });

      res.json({ message: 'Letter updated successfully' });

      // Regenerate audio after response if content changed and a public copy was updated
      if (content && publicChanges > 0) {
        try {
          const row = await new Promise((resolve, reject) => {
            db.get(`SELECT id, title FROM public_letters WHERE sourceLetterId = ?`,
              [id], (e, r) => e ? reject(e) : resolve(r));
          });
          if (row) {
            const url = await generateAndStoreAudio(row.id, content, row.title);
            console.log('[Audio] Regenerated after user edit for letter', row.id, '→', url);
          }
        } catch (e) {
          console.error('[Audio] User edit regen error:', e.message);
        }
      }
    }
  );
};

// Delete letter
exports.deleteLetter = (req, res) => {
  const { id } = req.params;

  // Delete the private letter (the sync_delete_public_on_letter_delete trigger
  // removes the linked public_letters row via sourceLetterId)
  db.run(
    `DELETE FROM letters WHERE id = ? AND userId = ?`,
    [id, req.user.id],
    function(err) {
      if (err) return res.status(500).json({ message: 'Server error' });
      if (this.changes === 0) return res.status(404).json({ message: 'Letter not found' });
      res.json({ message: 'Letter deleted successfully' });
    }
  );
};

// ADMIN: Get ALL letters across all users
exports.adminGetAllLetters = (req, res) => {
  if (!checkAdmin(req, res)) return;
  db.all(
    `SELECT l.id, l.userId, l.recipientName, l.subject, l.content, l.category, l.tags, l.summary, l.status, l.imageData, l.createdAt, l.updatedAt,
            pl.id as publicId, pl.title as publicTitle, pl.authorName, pl.publishedAt, pl.isApproved
     FROM letters l
     LEFT JOIN public_letters pl ON pl.sourceLetterId = l.id AND pl.isApproved = 1
     ORDER BY l.createdAt DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Server error' });
      res.json(rows);
    }
  );
};

// ADMIN: Update any public letter by publicId
exports.adminUpdatePublicLetter = async (req, res) => {
  if (!checkAdmin(req, res)) return;
  const { id } = req.params;
  const { title, content, preview, authorName, category, tags, imageData } = req.body;
  const imgUpdate = imageData === null ? null : (imageData !== undefined ? imageData : undefined);
  const useImgCoalesce = imgUpdate === undefined;

  let sql, params;
  if (useImgCoalesce) {
    sql = `UPDATE public_letters SET title = COALESCE(?, title), content = COALESCE(?, content), preview = COALESCE(?, preview),
     authorName = COALESCE(?, authorName), category = COALESCE(?, category), tags = COALESCE(?, tags),
     updatedAt = datetime('now')
     WHERE id = ?`;
    params = [title || null, content || null, preview || null, authorName || null, category || null, tags || null, id];
  } else {
    sql = `UPDATE public_letters SET title = COALESCE(?, title), content = COALESCE(?, content), preview = COALESCE(?, preview),
     authorName = COALESCE(?, authorName), category = COALESCE(?, category), tags = COALESCE(?, tags),
     imageData = ?,
     updatedAt = datetime('now')
     WHERE id = ?`;
    params = [title || null, content || null, preview || null, authorName || null, category || null, tags || null, imgUpdate, id];
  }

  try {
    const changes = await new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) return reject(err);
        resolve(this.changes);
      });
    });

    if (changes === 0) return res.status(404).json({ message: 'Letter not found' });

    res.json({ message: 'Letter updated', id });

    // Regenerate audio after response is sent if content was updated
    if (content) {
      const row = await new Promise((resolve, reject) => {
        db.get(`SELECT id, title, content FROM public_letters WHERE id = ?`, [id], (e, r) => {
          if (e) return reject(e);
          resolve(r);
        });
      });
      if (row) {
        const url = await generateAndStoreAudio(row.id, row.content, row.title);
        console.log('[Audio] Regenerated after edit for letter', row.id, '→', url);
      }
    }
  } catch (err) {
    console.error('[Audio] adminUpdatePublicLetter error:', err.message);
    if (!res.headersSent) res.status(500).json({ message: 'Server error' });
  }
};

// ADMIN: Get single public letter by publicId
exports.adminGetPublicLetter = (req, res) => {
  if (!checkAdmin(req, res)) return;
  const { id } = req.params;
  db.get(`SELECT * FROM public_letters WHERE id = ?`, [id], (err, row) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (!row) return res.status(404).json({ message: 'Not found' });
    res.json(row);
  });
};

// ADMIN: Get ALL public letters directly (includes seeded ones with userId=null)
exports.adminGetAllPublicLetters = (req, res) => {
  if (!checkAdmin(req, res)) return;
  db.all(
    `SELECT id, letterNumber, title, authorName, category, publishedAt, isApproved, preview, content, audioUrl
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
  if (!checkAdmin(req, res)) return;
  const { id } = req.params;
  db.run(
    `DELETE FROM public_letters WHERE id = ?`,
    [id],
    function(err) {
      if (err) return res.status(500).json({ message: 'Server error' });
      if (this.changes === 0) return res.status(404).json({ message: 'Letter not found' });
      res.json({ message: 'Letter permanently deleted', id });
    }
  );
};

// ADMIN: Restore (unhide) a public letter — sets isApproved=1
exports.adminRestorePublicLetter = (req, res) => {
  if (!checkAdmin(req, res)) return;
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
      db.get(`SELECT id FROM public_letters WHERE sourceLetterId = ? AND isApproved = 1`,
        [id],
        (err2, existing) => {
          if (err2) return res.status(500).json({ message: 'Server error' });
          if (existing) return res.json({ message: 'Letter already published to site', publicId: existing.id });

          // Get the next letter number
          db.get(`SELECT COALESCE(MAX(letterNumber), 0) + 1 AS nextNum FROM public_letters`, (err3, row) => {
            if (err3) return res.status(500).json({ message: 'Server error' });

            const letterNumber = row.nextNum;
            // Use customClosing as the public author/signature if set; fall back to user's name
            const authorName = letter.customClosing || req.user.firstName || '';
            const rawPreview = letter.summary || letter.content || '';
            const preview = rawPreview.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 200);

            db.run(
              `INSERT INTO public_letters (letterNumber, authorName, title, preview, content, category, tags, accentColor, publishedAt, isApproved, userId, imageData, customSalutation, customClosing, sourceLetterId)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, date('now'), 1, ?, ?, ?, ?, ?)`,
              [letterNumber, authorName, letter.subject || 'Untitled', preview, letter.content,
               letter.category || 'General', letter.tags || '', '#D43F3A', req.user.id, letter.imageData || null,
               letter.customSalutation || null, letter.customClosing || null, id],
              function(err4) {
                if (err4) return res.status(500).json({ message: 'Server error' });

                // Mark the private letter as published
                db.run(`UPDATE letters SET status = 'published', updatedAt = CURRENT_TIMESTAMP WHERE id = ?`, [id]);

                // Fire-and-forget: generate Polly TTS audio in the background
                generateAndStoreAudio(this.lastID || id, letter.content, letter.subject || 'Untitled')
                  .then(url => console.log(`[Audio] Pre-generated for letter ${id}: ${url}`))
                  .catch(err => console.error(`[Audio] Failed for letter ${id}:`, err.message));

                res.json({ message: 'Letter published to site', publicId: this.lastID });
              }
            );
          });
        }
      );
    }
  );
};
