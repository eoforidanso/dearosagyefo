#!/usr/bin/env node

/**
 * generate-osagyefo-audio-polly.js
 * 
 * Generate Amazon Polly audio for the 15 historical Osagyefo letters
 * hardcoded in from-osagyefo.html
 */

require('dotenv').config();

const { PollyClient, SynthesizeSpeechCommand } = require('@aws-sdk/client-polly');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');

// ── Config ────────────────────────────────────────────────────────────────────
const AWS_REGION  = process.env.AWS_REGION  || 'us-east-1';
const S3_BUCKET   = process.env.S3_BUCKET   || 'dearosagyefo.com';
const POLLY_VOICE = 'Arthur';  // British English neural voice — closer to the formal register of Nkrumah-era oratory than the American 'Matthew'
const CHUNK_SIZE  = 2800;

const polly = new PollyClient({ region: AWS_REGION });
const s3    = new S3Client({ region: AWS_REGION });

// ── Extract letters data from HTML ────────────────────────────────────────────
function extractLettersData() {
  const htmlPath = path.join(__dirname, 'from-osagyefo.html');
  const content = fs.readFileSync(htmlPath, 'utf-8');
  
  // Extract the lettersData array
  const match = content.match(/const lettersData = \[([\s\S]*?)\n\];/);
  if (!match) throw new Error('Could not find lettersData in HTML');
  
  // Create a function to safely evaluate the data
  const arrayContent = '[' + match[1] + '\n]';
  try {
    // eslint-disable-next-line no-eval
    const lettersData = eval('(' + arrayContent + ')');
    return lettersData;
  } catch (e) {
    throw new Error(`Failed to parse lettersData: ${e.message}`);
  }
}

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

async function generateAudio(idx, title, body) {
  console.log(`[${idx + 1}/15] Generating audio for: ${title}`);
  
  const bodyText = cleanText(body);
  const titleLine = cleanText(title) + '. ';
  const text = titleLine + bodyText;
  
  if (!text.trim()) throw new Error(`Empty content for letter ${idx}`);

  const chunks = chunkText(text);
  console.log(`  → Chunked into ${chunks.length} part(s)...`);
  
  const buffers = await Promise.all(chunks.map(callPolly));
  const mp3 = Buffer.concat(buffers);

  // Upload to S3 with downloaded-audio path
  const s3Key = `downloaded-audio/osag-letter-${idx}.mp3`;
  console.log(`  → Uploading to S3: ${s3Key}`);
  
  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
    Body: mp3,
    ContentType: 'audio/mpeg',
  }));

  return `/downloaded-audio/osag-letter-${idx}.mp3`;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  try {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  Generating Osagyefo Historical Letters Audio (Polly)');
    console.log('═══════════════════════════════════════════════════════════\n');

    const letters = extractLettersData();
    console.log(`Found ${letters.length} letters in HTML\n`);

    const urls = [];
    
    for (let i = 0; i < letters.length; i++) {
      const letter = letters[i];
      const url = await generateAudio(i, letter.title, letter.body);
      urls.push(url);
      console.log(`  ✓ Generated: ${url}\n`);
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('  Audio URLs for from-osagyefo.html:');
    console.log('═══════════════════════════════════════════════════════════\n');
    
    console.log('const OSAG_AUDIO_URLS = [');
    urls.forEach(url => console.log(`  "${url}",`));
    console.log('];');
    
    console.log('\n✅ All audio generated successfully!\n');
    console.log('Next steps:');
    console.log('1. Copy the OSAG_AUDIO_URLS array above');
    console.log('2. Replace the array in from-osagyefo.html');
    console.log('3. Run: bash deploy-all.sh\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
