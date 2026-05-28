/**
 * generate-polly-audio.js
 *
 * Bulk-generate Amazon Polly MP3 audio for all approved public letters
 * that don't yet have an audioUrl, then upload to S3 and save the URL
 * back to the SQLite database.
 *
 * Usage:
 *   node generate-polly-audio.js           # generate missing audio only
 *   node generate-polly-audio.js --all     # regenerate ALL (overwrite existing)
 *   node generate-polly-audio.js --id 5    # regenerate one specific letter
 */

require('dotenv').config();

const { PollyClient, SynthesizeSpeechCommand } = require('@aws-sdk/client-polly');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// ── Config ────────────────────────────────────────────────────────────────────
const AWS_REGION  = process.env.AWS_REGION  || 'us-east-1';
const S3_BUCKET   = process.env.S3_BUCKET   || 'dearosagyefo.com';
const POLLY_VOICE = process.env.POLLY_VOICE || 'Brian';   // British male, Neural
const DB_PATH     = path.join(__dirname, 'data/letters.db');
const CHUNK_SIZE  = 2800; // Polly Neural limit: 3000 chars per request

const polly = new PollyClient({ region: AWS_REGION });
const s3    = new S3Client({ region: AWS_REGION });

// ── Helpers ───────────────────────────────────────────────────────────────────
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

function chunkText(text) {
  if (text.length <= CHUNK_SIZE) return [text];
  const chunks = [];
  let remaining = text;
  while (remaining.length > CHUNK_SIZE) {
    let idx = remaining.lastIndexOf('. ', CHUNK_SIZE);
    if (idx < 100) idx = remaining.lastIndexOf(' ', CHUNK_SIZE);
    if (idx < 0)   idx = CHUNK_SIZE;
    chunks.push(remaining.slice(0, idx + 1).trim());
    remaining = remaining.slice(idx + 1).trim();
  }
  if (remaining) chunks.push(remaining);
  return chunks;
}

async function callPolly(text) {
  const res = await polly.send(new SynthesizeSpeechCommand({
    Text: text,
    OutputFormat: 'mp3',
    VoiceId: POLLY_VOICE,
    Engine: 'neural',
    TextType: 'text',
  }));
  const buffers = [];
  for await (const chunk of res.AudioStream) {
    buffers.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(buffers);
}

async function generateAudio(letterId, content, title) {
  const bodyText = cleanText(content);
  const titleLine = title ? cleanText(title) + '. ' : '';
  const text = titleLine + 'Dear Osagyefo. ' + bodyText;
  if (!text) throw new Error('Empty content');

  const chunks  = chunkText(text);
  const buffers = await Promise.all(chunks.map(callPolly));
  const mp3     = Buffer.concat(buffers);

  const s3Key = `audio/letter-${letterId}.mp3`;
  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
    Body: mp3,
    ContentType: 'audio/mpeg',
  }));

  return `https://dearosagyefo.com/${s3Key}`;
}

// ── DB helpers ────────────────────────────────────────────────────────────────
function dbAll(db, sql, params = []) {
  return new Promise((res, rej) =>
    db.all(sql, params, (err, rows) => err ? rej(err) : res(rows))
  );
}
function dbRun(db, sql, params = []) {
  return new Promise((res, rej) =>
    db.run(sql, params, (err) => err ? rej(err) : res())
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const args   = process.argv.slice(2);
  const forceAll = args.includes('--all');
  const singleId = args.includes('--id') ? Number(args[args.indexOf('--id') + 1]) : null;

  const db = new sqlite3.Database(DB_PATH);

  // Ensure audioUrl column exists (idempotent)
  await dbRun(db, `ALTER TABLE public_letters ADD COLUMN audioUrl TEXT`).catch(() => {});

  let letters;
  if (singleId) {
    letters = await dbAll(db, `SELECT id, title, content FROM public_letters WHERE id = ? AND isApproved = 1`, [singleId]);
  } else if (forceAll) {
    letters = await dbAll(db, `SELECT id, title, content FROM public_letters WHERE isApproved = 1 ORDER BY id`);
  } else {
    letters = await dbAll(db, `SELECT id, title, content FROM public_letters WHERE isApproved = 1 AND (audioUrl IS NULL OR audioUrl = '') ORDER BY id`);
  }

  if (!letters.length) {
    console.log('✓ No letters to process.');
    db.close();
    return;
  }

  console.log(`\nGenerating Polly audio for ${letters.length} letter(s) — voice: ${POLLY_VOICE} (Neural)\n`);

  let ok = 0, failed = 0;
  for (const letter of letters) {
    process.stdout.write(`  [${letter.id}] ${letter.title.slice(0, 60)} ... `);
    try {
      const audioUrl = await generateAudio(letter.id, letter.content, letter.title);
      await dbRun(db, `UPDATE public_letters SET audioUrl = ? WHERE id = ?`, [audioUrl, letter.id]);
      console.log(`✓`);
      ok++;
    } catch (err) {
      console.log(`✗ ${err.message}`);
      failed++;
    }
    // Small delay to avoid Polly throttling
    await new Promise(r => setTimeout(r, 300));
  }

  db.close();
  console.log(`\nDone. ${ok} succeeded, ${failed} failed.\n`);
  if (ok > 0) {
    console.log('Next: deploy the backend to EC2 so new letters also auto-generate audio.');
    console.log('      (the /api/letters/admin/public/:id/generate-audio endpoint is live)\n');
  }
}

main().catch(err => { console.error(err); process.exit(1); });
