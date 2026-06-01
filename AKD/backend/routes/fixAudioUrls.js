/**
 * Fix incorrect audioUrl values in the database
 * Removes timestamps from audioUrl paths to match actual S3 file names
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Fix all audioUrl values to point to correct S3 paths
router.post('/fix-audio-urls', (req, res) => {
  const updates = [];
  
  // Get all letters with audioUrl
  db.all(`SELECT id, audioUrl FROM public_letters WHERE audioUrl IS NOT NULL`, [], (err, letters) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    let fixed = 0;
    let processed = 0;

    letters.forEach(letter => {
      processed++;
      const { id, audioUrl } = letter;
      
      // Extract just the ID from the audioUrl and rebuild it correctly
      // Old format: https://dearosagyefo.com/audio/letter-5-1778030599852.mp3
      // New format: https://dearosagyefo.com/audio/letter-5.mp3
      const match = audioUrl.match(/letter-(\d+)(-\d+)?\.mp3/);
      if (match) {
        const letterId = match[1];
        const newUrl = `https://dearosagyefo.com/audio/letter-${letterId}.mp3`;
        
        if (newUrl !== audioUrl) {
          db.run(
            `UPDATE public_letters SET audioUrl = ? WHERE id = ?`,
            [newUrl, id],
            (err) => {
              if (!err) fixed++;
              if (processed === letters.length) {
                // All done
                res.json({
                  success: true,
                  message: `Fixed ${fixed}/${processed} audioUrl values`,
                  details: `Updated paths to remove timestamps and point to correct S3 files`
                });
              }
            }
          );
        } else if (processed === letters.length) {
          res.json({
            success: true,
            message: `No updates needed. ${fixed} URLs already correct.`
          });
        }
      } else if (processed === letters.length) {
        res.json({
          success: true,
          message: `Checked ${processed} letters. ${fixed} had updates.`
        });
      }
    });

    if (letters.length === 0) {
      return res.json({ success: true, message: 'No letters found' });
    }
  });
});

// Check which letters have/don't have audioUrl
router.get('/audio-status', (req, res) => {
  db.all(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN audioUrl IS NOT NULL AND audioUrl != '' THEN 1 ELSE 0 END) as with_audio,
      SUM(CASE WHEN audioUrl IS NULL OR audioUrl = '' THEN 1 ELSE 0 END) as without_audio
     FROM public_letters
     WHERE isApproved = 1`,
    [],
    (err, results) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(results[0] || {});
    }
  );
});

module.exports = router;
