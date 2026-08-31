/**
 * Audio Controller — Amazon Polly TTS (Updated)
 *
 * Uses Amazon Polly to generate audio for letters.
 * Audio is uploaded to S3 and the URL is stored in public_letters.audioUrl.
 * Uses the same AWS credentials already configured for S3 deployments.
 *
 * UPDATED: Removed timestamps from S3 keys to have consistent URLs.
 */

const { PollyClient, SynthesizeSpeechCommand } = require('@aws-sdk/client-polly');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const db = require('../config/database');

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const polly = new PollyClient({ region: AWS_REGION });
const s3 = new S3Client({ region: AWS_REGION });
const S3_BUCKET = process.env.S3_BUCKET || 'dearosagyefo.com';

// Polly Neural voice — Brian: British male, formal and dignified
const POLLY_VOICE = process.env.POLLY_VOICE || 'Brian';
const POLLY_ENGINE = 'neural';
// Polly Neural limit per request: 3000 chars
const POLLY_CHUNK_SIZE = 2800;

/**
 * Strip HTML tags and normalise whitespace.
 */
function cleanText(raw) {
  return (raw || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Split text into sentence-aware chunks that fit within Polly's per-request limit.
 */
function chunkText(text) {
  if (text.length <= POLLY_CHUNK_SIZE) return [text];
  const chunks = [];
  let remaining = text;
  while (remaining.length > POLLY_CHUNK_SIZE) {
    let idx = remaining.lastIndexOf('. ', POLLY_CHUNK_SIZE);
    if (idx < 100) idx = remaining.lastIndexOf(' ', POLLY_CHUNK_SIZE);
    if (idx < 0) idx = POLLY_CHUNK_SIZE;
    chunks.push(remaining.slice(0, idx + 1).trim());
    remaining = remaining.slice(idx + 1).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

/**
 * Call Amazon Polly for one text chunk. Returns MP3 Buffer.
 */
async function callPolly(text) {
  const response = await polly.send(new SynthesizeSpeechCommand({
    Text: text,
    OutputFormat: 'mp3',
    VoiceId: POLLY_VOICE,
    Engine: POLLY_ENGINE,
    TextType: 'text',
  }));
  // Collect the ReadableStream into a Buffer
  const chunks = [];
  for await (const chunk of response.AudioStream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

/**
 * Generate TTS via Amazon Polly, upload to S3, save URL to public_letters.
 * UPDATED: No timestamps in S3 keys
 */
async function generateAndStoreAudio(letterId, content, title) {
  const bodyText = cleanText(content);
  if (!bodyText) throw new Error('Letter content is empty after cleaning');
  const titleLine = title ? cleanText(title) + '. ' : '';
  const text = titleLine + 'Dear Osagyefo. ' + bodyText;

  console.log(`[Audio] Calling Amazon Polly for letter ${letterId} (${text.length} chars, voice: ${POLLY_VOICE})`);

  const textChunks = chunkText(text);
  const audioBuffers = await Promise.all(textChunks.map(callPolly));
  const audioBuffer = Buffer.concat(audioBuffers);

  // UPDATED: No timestamp in S3 key
  const s3Key = `audio/letter-${letterId}.mp3`;
  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
    Body: audioBuffer,
    ContentType: 'audio/mpeg',
    CacheControl: 'public, max-age=86400'
  }));

  const audioUrl = `https://dearosagyefo.com/${s3Key}`;
  console.log(`[Audio] Uploaded to S3: ${audioUrl}`);

  await new Promise((resolve, reject) => {
    db.run(
      `UPDATE public_letters SET audioUrl = ? WHERE id = ?`,
      [audioUrl, letterId],
      (err) => err ? reject(err) : resolve()
    );
  });

  return audioUrl;
}

/**
 * POST /api/letters/admin/public/:id/generate-audio
 * Admin endpoint to (re)generate audio for a single published letter.
 */
async function generatePublicLetterAudio(req, res) {
  const adminSecret = req.headers['x-admin-secret'];
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.params;
  try {
    const letter = await new Promise((resolve, reject) => {
      db.get(`SELECT id, title, content FROM public_letters WHERE id = ? AND isApproved = 1`, [id], (err, row) => {
        if (err) return reject(err);
        if (!row) return reject(new Error(`Letter ${id} not found`));
        resolve(row);
      });
    });

    const audioUrl = await generateAndStoreAudio(letter.id, letter.content, letter.title);
    res.json({ success: true, message: `Audio generated for letter #${id}`, audioUrl });
  } catch (err) {
    console.error('[Audio] generatePublicLetterAudio error:', err.message);
    res.status(500).json({ error: err.message });
  }
}

// alias
const generateLetterAudio = generatePublicLetterAudio;

module.exports = { generatePublicLetterAudio, generateLetterAudio, generateAndStoreAudio };
