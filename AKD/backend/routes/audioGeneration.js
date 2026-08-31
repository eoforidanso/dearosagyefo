// This file is for local development reference.
// The actual implementation is in AKD/backend/controllers/audioController.js on the server.
// This is kept for documentation purposes.

const express = require('express');
const router = express.Router();
const { Polly } = require('@aws-sdk/client-polly');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const db = require('../config/database');

const polly = new Polly({ region: 'us-east-1' });
const s3Client = new S3Client({ region: 'us-east-1' });

const BUCKET = 'dearosagyefo.com';
const AUDIO_PREFIX = 'audio/';
const VOICE_ID = 'Brian'; // Neural voice
const CHUNK_SIZE = 2800; // Polly limit is 3000

/**
 * Clean HTML tags from text
 */
function cleanText(html) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n\n+/g, '\n')
    .trim();
}

/**
 * Split text into chunks for Polly
 */
function chunkText(text, maxChars = CHUNK_SIZE) {
  const chunks = [];
  let remaining = text;
  
  while (remaining.length > 0) {
    if (remaining.length <= maxChars) {
      chunks.push(remaining);
      break;
    }
    
    let chunk = remaining.substring(0, maxChars);
    const lastPeriod = chunk.lastIndexOf('.');
    const lastNewline = chunk.lastIndexOf('\n');
    const splitPoint = Math.max(lastPeriod, lastNewline);
    
    if (splitPoint > maxChars * 0.7) {
      chunk = remaining.substring(0, splitPoint + 1);
    }
    
    chunks.push(chunk);
    remaining = remaining.substring(chunk.length).trim();
  }
  
  return chunks;
}

/**
 * Call AWS Polly to generate audio
 */
async function callPolly(text) {
  try {
    const response = await polly.synthesizeSpeech({
      Text: text,
      OutputFormat: 'mp3',
      VoiceId: VOICE_ID,
      Engine: 'neural'
    });

    const chunks = [];
    for await (const chunk of response.AudioStream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch (error) {
    throw new Error(`Polly error: ${error.message}`);
  }
}

/**
 * Generate audio for a single letter
 */
async function generateAudioForLetter(letterId, title, content) {
  try {
    // Clean and prepare text
    const cleanedText = cleanText(content);
    if (!cleanedText) throw new Error('No valid text content');

    // Split into chunks
    const chunks = chunkText(cleanedText, CHUNK_SIZE);
    const audioBuffers = [];

    // Generate audio for each chunk
    for (const chunk of chunks) {
      const buffer = await callPolly(chunk);
      audioBuffers.push(buffer);
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Combine audio buffers
    const finalBuffer = Buffer.concat(audioBuffers);

    // Upload to S3
    const fileName = `letter-${letterId}.mp3`;
    const uploadParams = {
      Bucket: BUCKET,
      Key: `${AUDIO_PREFIX}${fileName}`,
      Body: finalBuffer,
      ContentType: 'audio/mpeg',
      CacheControl: 'public, max-age=86400'
    };

    await s3Client.send(new PutObjectCommand(uploadParams));

    // Return the audioUrl
    return `https://${BUCKET}/${AUDIO_PREFIX}${fileName}`;
  } catch (error) {
    throw new Error(`Audio generation failed: ${error.message}`);
  }
}

/**
 * Generate audio for a specific letter
 * POST /api/admin/generate-audio/:id
 */
router.post('/generate-audio/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Get letter from database
    db.get(
      `SELECT id, title, content FROM public_letters WHERE id = ?`,
      [id],
      async (err, letter) => {
        if (err) {
          return res.status(500).json({ error: 'Database error', message: err.message });
        }

        if (!letter) {
          return res.status(404).json({ error: 'Letter not found' });
        }

        try {
          // Generate audio
          const audioUrl = await generateAudioForLetter(letter.id, letter.title, letter.content);

          // Update database
          db.run(
            `UPDATE public_letters SET audioUrl = ? WHERE id = ?`,
            [audioUrl, letter.id],
            (updateErr) => {
              if (updateErr) {
                return res.status(500).json({ error: 'Failed to update database', message: updateErr.message });
              }

              res.json({
                success: true,
                message: `Audio generated for letter #${letter.id}`,
                letterId: letter.id,
                audioUrl,
                title: letter.title
              });
            }
          );
        } catch (genError) {
          res.status(500).json({ error: 'Audio generation error', message: genError.message });
        }
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

/**
 * Bulk generate audio for letters missing it
 * POST /api/admin/generate-audio/bulk/missing
 */
router.post('/generate-audio-missing', async (req, res) => {
  try {
    // Get all letters without audio
    db.all(
      `SELECT id, title, content FROM public_letters WHERE audioUrl IS NULL AND isApproved = 1 ORDER BY id DESC`,
      async (err, letters) => {
        if (err) {
          return res.status(500).json({ error: 'Database error', message: err.message });
        }

        if (!letters || letters.length === 0) {
          return res.json({ message: 'No letters need audio generation', processed: 0 });
        }

        const results = { success: [], failed: [] };

        // Process each letter
        for (const letter of letters) {
          try {
            const audioUrl = await generateAudioForLetter(letter.id, letter.title, letter.content);
            
            // Update database
            await new Promise((resolve, reject) => {
              db.run(
                `UPDATE public_letters SET audioUrl = ? WHERE id = ?`,
                [audioUrl, letter.id],
                (updateErr) => {
                  if (updateErr) reject(updateErr);
                  else resolve();
                }
              );
            });

            results.success.push({ id: letter.id, title: letter.title, audioUrl });
            process.stdout.write(`✓`);
          } catch (error) {
            results.failed.push({ id: letter.id, title: letter.title, error: error.message });
            process.stdout.write(`✗`);
          }

          // Small delay between letters
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        console.log(`\n\nBulk generation complete: ${results.success.length} succeeded, ${results.failed.length} failed`);
        res.json({
          success: true,
          processed: results.success.length + results.failed.length,
          succeeded: results.success.length,
          failed: results.failed.length,
          results
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Server error', message: error.message });
  }
});

/**
 * Get audio generation status
 * GET /api/admin/audio-status
 */
router.get('/audio-status', (req, res) => {
  db.get(
    `SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN isApproved = 1 THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN audioUrl IS NOT NULL AND isApproved = 1 THEN 1 ELSE 0 END) as with_audio,
      SUM(CASE WHEN audioUrl IS NULL AND isApproved = 1 THEN 1 ELSE 0 END) as missing_audio
    FROM public_letters`,
    (err, stats) => {
      if (err) {
        return res.status(500).json({ error: 'Database error', message: err.message });
      }

      const coverage = stats.approved > 0 ? Math.round((stats.with_audio / stats.approved) * 100) : 0;

      res.json({
        total: stats.total,
        approved: stats.approved,
        with_audio: stats.with_audio,
        missing_audio: stats.missing_audio,
        coverage_percent: coverage,
        status: coverage === 100 ? '✅ All letters have audio' : `⚠️ ${stats.missing_audio} letters missing audio`
      });
    }
  );
});

module.exports = router;
