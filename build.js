/**
 * Build script — copies all deployment files into the /AKD folder.
 * Run: node build.js  (or npm run build)
 */

const fs   = require('fs');
const path = require('path');

const SRC  = __dirname;
const DEST = path.join(__dirname, 'AKD');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
  ensureDir(dest);
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath  = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

// ─── Clear existing AKD build ─────────────────────────────────────────────────

if (fs.existsSync(DEST)) {
  fs.rmSync(DEST, { recursive: true, force: true });
  console.log('Cleared previous AKD build.');
}
ensureDir(DEST);

// ─── Frontend HTML pages ──────────────────────────────────────────────────────

const htmlPages = [
  'index.html',
  'about.html',
  'letters.html',
  'write.html',
  'preview.html',
  'login.html',
  'timeline.html',
  'dashboard.html',
  'design-system.html',
  'from-osagyefo.html',
  'quiz.html',
  'review.html',
  '404.html',
];

htmlPages.forEach(file => {
  const src = path.join(SRC, file);
  if (fs.existsSync(src)) {
    copyFile(src, path.join(DEST, file));
    console.log(`Copied  ${file}`);
  } else {
    console.warn(`Missing ${file} — skipped`);
  }
});

// ─── Static assets (images, PDF) ─────────────────────────────────────────────

const staticFiles = [
  'magic.js',
  'horn-blower-ghana.jpg',
  'Independence-Declaration-1957.jpg',
  'Kwame.jpg',
  'osagyefo-portrait.png',
  'flyer.pdf',
  'thumbnail.png',
  'thumbnail.svg',
  'sitemap.xml',
  'robots.txt',
];

staticFiles.forEach(file => {
  const src = path.join(SRC, file);
  if (fs.existsSync(src)) {
    copyFile(src, path.join(DEST, file));
    console.log(`Copied  ${file}`);
  } else {
    console.warn(`Missing ${file} — skipped`);
  }
});

// ─── Audio folder ─────────────────────────────────────────────────────────────

const audioSrc = path.join(SRC, 'audio');
if (fs.existsSync(audioSrc)) {
  copyDir(audioSrc, path.join(DEST, 'audio'));
  console.log('Copied  audio/');
}

// ─── Backend / server files ───────────────────────────────────────────────────

const backendFiles = [
  'server.js',
  'package.json',
  'package-lock.json',
  'db-query.js',
  'generate-pdf.js',
  'pdf-converter.js',
  '.env.example',
  'netlify.toml',
  'Dockerfile',
  'docker-compose.yml',
];

backendFiles.forEach(file => {
  const src = path.join(SRC, file);
  if (fs.existsSync(src)) {
    copyFile(src, path.join(DEST, file));
    console.log(`Copied  ${file}`);
  } else {
    console.warn(`Missing ${file} — skipped`);
  }
});

// backend/ folder (controllers, routes, models, etc.)
const backendSrc = path.join(SRC, 'backend');
if (fs.existsSync(backendSrc)) {
  copyDir(backendSrc, path.join(DEST, 'backend'));
  console.log('Copied  backend/');
}

// data/ folder (SQLite database)
const dataSrc = path.join(SRC, 'data');
if (fs.existsSync(dataSrc)) {
  copyDir(dataSrc, path.join(DEST, 'data'));
  console.log('Copied  data/');
}

// ─── Done ──────────────────────────────────────────────────────────────────────

console.log(`\nBuild complete → AKD/`);
