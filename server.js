require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const rateLimit = require('express-rate-limit');
const path     = require('path');
const fs       = require('fs');

// ── Route imports ─────────────────────────────────────────────────────────────
const userRoutes      = require('./backend/routes/users');
const letterRoutes    = require('./backend/routes/letters');
const publicRoutes    = require('./backend/routes/public');
const visitorRoutes   = require('./backend/routes/visitors');
const subscribeRoutes = require('./backend/routes/subscribe');
const portalRoutes    = require('./backend/routes/portal');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Ensure data directory exists ──────────────────────────────────────────────
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// ── Security headers (helmet) ─────────────────────────────────────────────────
app.use(helmet({
  // Allow inline scripts/styles needed by the frontend pages
  contentSecurityPolicy: false,
}));

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'https://www.dearosagyefo.com',
  'https://dearosagyefo.com',
];
if (process.env.NODE_ENV !== 'production') {
  allowedOrigins.push('http://localhost:3000');
}
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('CORS: origin not allowed'));
  },
  credentials: true,
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// ── Rate limiters ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests, please try again later.' },
});
const subscribeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many subscribe attempts, please try again later.' },
});
const submitLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many submissions, please try again later.' },
});

// ── Initialize database ───────────────────────────────────────────────────────
require('./backend/config/database');

// ── API routes ────────────────────────────────────────────────────────────────
// Apply rate limiters before the routers they apply to
app.use('/api/users/login',           authLimiter);
app.use('/api/users/register',        authLimiter);
app.use('/api/users/forgot-password', authLimiter);
app.use('/api/users/reset-password',  authLimiter);
app.use('/api/subscribe',             subscribeLimiter);
app.use('/api/visitors/submit',       submitLimiter);
app.use('/api/public/submit',         submitLimiter);

app.use('/api/users',     userRoutes);
app.use('/api/letters',   letterRoutes);
app.use('/api/public',    publicRoutes);
app.use('/api/visitors',  visitorRoutes);
app.use('/api/subscribe', subscribeRoutes);
app.use('/api/portal',    portalRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Verify admin secret server-side — never expose the secret in client code
app.post('/api/admin/verify', (req, res) => {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return res.status(500).json({ error: 'ADMIN_SECRET not configured' });
  if (req.headers['x-admin-secret'] !== secret) {
    return res.status(401).json({ error: 'Invalid secret' });
  }
  res.json({ ok: true });
});

// ── SEO routes (sitemap, RSS, individual letter OG pages) ────────────────────
const letterDb = require('./backend/config/database');
const sharp    = require('sharp');

const xmlEsc = s => String(s || '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

// ── Dynamic OG image — /og/:id.png ────────────────────────────────────────────
const ogCache = new Map();

// The linocut mark, pre-rendered as a cream medallion. Read once at boot —
// null if absent, in which case cards render without it rather than erroring.
const OG_MARK = (() => {
  try {
    return require('fs').readFileSync(require('path').join(__dirname, 'backend/assets/og-mark.png'));
  } catch (e) {
    console.warn('[OG] mark asset not found — cards will render without it');
    return null;
  }
})();

function wrapTitle(text, maxCh, maxLines = 3) {
  // A token longer than the line budget can't be wrapped, and the SVG has no
  // clip path — so hard-break it into chunks rather than let it run off the card.
  const chunk = new RegExp(`.{1,${maxCh}}`, 'g');
  const words = String(text || '')
    .split(/\s+/)
    .filter(Boolean)
    .flatMap(w => (w.length <= maxCh ? [w] : w.match(chunk)));

  const lines = [];
  let curr = '';

  for (let i = 0; i < words.length; i++) {
    const test = curr ? curr + ' ' + words[i] : words[i];

    if (test.length > maxCh && curr) {
      lines.push(curr);
      curr = words[i];

      // On the last allowed line, pack in as much as fits and mark anything
      // left over with an ellipsis — otherwise a long title is silently cut
      // and the card reads as finished when it isn't.
      if (lines.length === maxLines - 1) {
        const rest = words.slice(i);
        let last = '';
        let j = 0;
        for (; j < rest.length; j++) {
          const t = last ? last + ' ' + rest[j] : rest[j];
          if (t.length > maxCh) break;
          last = t;
        }
        if (j < rest.length) last = trimTrailing(last) + '…';
        lines.push(last);
        return lines;
      }
    } else {
      curr = test;
    }
  }

  if (curr) lines.push(curr);
  return lines;
}

// Drop trailing punctuation/space so we never render "Sights,…"
function trimTrailing(s) {
  return String(s).replace(/[\s,;:.!?—–-]+$/, '');
}

// Truncate on a word boundary. Falls back to a hard cut only when a single
// token is longer than the budget.
function clipText(text, maxCh) {
  const s = String(text || '').trim();
  if (s.length <= maxCh) return s;
  const cut = s.slice(0, maxCh);
  const sp  = cut.lastIndexOf(' ');
  return trimTrailing(sp > maxCh * 0.6 ? cut.slice(0, sp) : cut) + '…';
}

// The text column is narrowed to leave room for the linocut medallion on the
// right (composited after render — see MARK_PATH). The block is centred as a
// unit rather than pinned near the top, which previously left the lower third
// of the card empty regardless of how long the title was.
function buildOgSvg(title, author, category) {
  const lines = wrapTitle(title, 22);          // was 28; narrower column
  const LH = 82, TITLE_SIZE = 62;

  // Height of the title + byline block, so it can be centred vertically.
  const hasAuthor = Boolean(author && String(author).trim());
  const blockH = lines.length * LH + (hasAuthor ? 44 : 0);
  // Floor the first baseline so a three-line title cannot ride up into the
  // category pill (which occupies y 108–138) as the block grows taller.
  const startY = Math.max(
    Math.round((630 - blockH) / 2) + TITLE_SIZE * 0.34,
    205
  );

  const titleSvg = lines.map((l, i) =>
    `<text x="80" y="${Math.round(startY + i * LH)}" font-family="serif" font-size="${TITLE_SIZE}" font-weight="bold" fill="#F7F3EB" xml:space="preserve">${xmlEsc(l)}</text>`
  ).join('');

  // No "Anonymous" fallback: every letter is attributed, and where one is not
  // the byline is omitted rather than filled with a placeholder — matching the
  // cards and the modal sign-off.
  const authorSvg = hasAuthor
    ? `<text x="80" y="${Math.round(startY + lines.length * LH + 12)}" font-family="serif" font-size="27" fill="rgba(247,243,235,0.52)">— ${xmlEsc(author)}</text>`
    : '';

  const catTag = category
    ? `<rect x="80" y="108" width="${Math.min(category.length * 9.5 + 32, 300)}" height="30" rx="15" fill="rgba(201,168,106,0.16)"/>
       <text x="96" y="128" font-family="sans-serif" font-size="13" font-weight="700" fill="#C9A86A" letter-spacing="2">${xmlEsc(category.toUpperCase())}</text>`
    : '';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
        <stop offset="0%" stop-color="#0f1419"/>
        <stop offset="100%" stop-color="#1c2640"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="630" fill="url(#g)"/>
    <rect x="0" y="0" width="400" height="6" fill="#D43F3A"/>
    <rect x="400" y="0" width="400" height="6" fill="#E8B923"/>
    <rect x="800" y="0" width="400" height="6" fill="#2D5F3F"/>
    <rect x="80" y="82" width="56" height="3" rx="1.5" fill="#E8B923"/>
    ${catTag}
    ${titleSvg}
    ${authorSvg}
    <line x1="80" y1="566" x2="1120" y2="566" stroke="rgba(247,243,235,0.10)" stroke-width="1"/>
    <text x="80" y="600" font-family="sans-serif" font-size="19" fill="rgba(247,243,235,0.42)">dearosagyefo.com</text>
    <text x="1120" y="600" font-family="serif" font-size="21" fill="rgba(201,168,106,0.62)" text-anchor="end">Dear Osagyefo</text>
  </svg>`;
}

app.get('/og/:id.png', async (req, res) => {
  const { id } = req.params;
  if (!/^\d+$/.test(id)) return res.status(404).end();
  const cached = ogCache.get(id);
  if (cached && Date.now() - cached.ts < 3_600_000) {
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.end(cached.buf);
  }
  try {
    const letter = await new Promise((resolve, reject) =>
      letterDb.get('SELECT title, authorName, category FROM public_letters WHERE id = ? AND isApproved = 1', [id], (err, row) => err ? reject(err) : resolve(row))
    );
    if (!letter) return res.redirect('/thumbnail.png');
    const svg = buildOgSvg(letter.title, letter.authorName, letter.category);
    // Composite the Dear Osagyefo mark into the space the text column leaves.
    // Loaded once at startup; if the asset is missing the card still renders,
    // just without the mark, rather than failing the whole request.
    const base = sharp(Buffer.from(svg));
    const buf = OG_MARK
      ? await base.composite([{ input: OG_MARK, top: 175, left: 875 }]).png().toBuffer()
      : await base.png().toBuffer();
    ogCache.set(id, { buf, ts: Date.now() });
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.end(buf);
  } catch (e) {
    console.error('OG image error:', e.message);
    res.redirect('/thumbnail.png');
  }
});

// Dynamic sitemap — includes every published letter at /l/:id
app.get('/sitemap.xml', (req, res) => {
  letterDb.all(
    `SELECT id, updatedAt, publishedAt FROM public_letters WHERE isApproved = 1 ORDER BY id DESC`,
    [],
    (err, letters) => {
      const base = 'https://dearosagyefo.com';
      const today = new Date().toISOString().split('T')[0];
      const staticPages = [
        { u: '/',                    p: '1.0', f: 'weekly'  },
        { u: '/letters.html',        p: '0.9', f: 'daily'   },
        { u: '/from-osagyefo.html',  p: '0.8', f: 'monthly' },
        { u: '/about.html',          p: '0.7', f: 'monthly' },
        { u: '/quiz.html',           p: '0.7', f: 'monthly' },
        { u: '/write.html',          p: '0.7', f: 'monthly' },
      ];
      const staticXml = staticPages.map(p =>
        `  <url><loc>${base}${p.u}</loc><lastmod>${today}</lastmod><changefreq>${p.f}</changefreq><priority>${p.p}</priority></url>`
      ).join('\n');
      const toDate = v => {
        if (!v) return today;
        const part = String(v).split(/[T ]/)[0];
        return /^\d{4}-\d{2}-\d{2}$/.test(part) ? part : today;
      };
      const letterXml = (letters || []).map(l => {
        const d = toDate(l.updatedAt || l.publishedAt);
        return `  <url><loc>${base}/l/${l.id}</loc><lastmod>${d}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`;
      }).join('\n');
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${staticXml}\n${letterXml}\n</urlset>`);
    }
  );
});

// RSS 2.0 feed — latest 50 published letters
app.get('/rss.xml', (req, res) => {
  letterDb.all(
    `SELECT id, title, preview, authorName, category, publishedAt FROM public_letters WHERE isApproved = 1 ORDER BY id DESC LIMIT 50`,
    [],
    (err, letters) => {
      const base = 'https://dearosagyefo.com';
      const now = new Date().toUTCString();
      const items = (letters || []).map(l => {
        const pubDate = l.publishedAt ? new Date(l.publishedAt).toUTCString() : now;
        return `    <item>
      <title>${xmlEsc(l.title)}</title>
      <link>${base}/l/${l.id}</link>
      <guid isPermaLink="true">${base}/l/${l.id}</guid>
      <description>${xmlEsc(l.preview || '')}</description>
      <author>${xmlEsc(l.authorName || 'Anonymous')}</author>
      <category>${xmlEsc(l.category || 'General')}</category>
      <pubDate>${pubDate}</pubDate>
    </item>`;
      }).join('\n');
      res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=1800');
      res.send(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Dear Osagyefo — Open Letters to Kwame Nkrumah</title>
    <link>${base}/letters.html</link>
    <description>A living archive of open letters from Ghanaians and Africans to Kwame Nkrumah — witty, heartfelt dispatches from the present to the past.</description>
    <language>en-us</language>
    <copyright>© ${new Date().getFullYear()} Dr. Ato Kwamena Danso. All rights reserved.</copyright>
    <lastBuildDate>${now}</lastBuildDate>
    <ttl>60</ttl>
    <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${base}/thumbnail.png</url>
      <title>Dear Osagyefo</title>
      <link>${base}</link>
    </image>
${items}
  </channel>
</rss>`);
    }
  );
});

// Individual letter OG page — /l/:id
// Social crawlers read OG tags + JSON-LD here; humans are redirected instantly
app.get('/l/:id', (req, res) => {
  const { id } = req.params;
  if (!/^\d+$/.test(id)) return res.redirect('/letters.html');
  letterDb.get(
    `SELECT id, title, preview, content, authorName, category, imageData, publishedAt, updatedAt FROM public_letters WHERE id = ? AND isApproved = 1`,
    [id],
    (err, letter) => {
      if (err || !letter) return res.redirect('/letters.html');
      const title   = xmlEsc(letter.title);
      const desc    = xmlEsc(clipText(letter.preview, 200));
      const author  = xmlEsc(letter.authorName || 'Anonymous');
      const cat     = xmlEsc(letter.category || 'General');
      const image   = `https://dearosagyefo.com/og/${id}.png`;
      const canonUrl = `https://dearosagyefo.com/l/${id}`;
      const destUrl  = `/letters.html?letter=${id}`;
      const pubDate  = letter.publishedAt || letter.updatedAt || new Date().toISOString();
      const jsonld   = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: letter.title || 'Untitled Letter',
        description: clipText(letter.preview, 200),
        image,
        datePublished: pubDate,
        dateModified: letter.updatedAt || pubDate,
        author: { '@type': 'Person', name: letter.authorName || 'Anonymous' },
        publisher: {
          '@type': 'Organization',
          name: 'Dear Osagyefo',
          url: 'https://dearosagyefo.com',
          logo: { '@type': 'ImageObject', url: 'https://dearosagyefo.com/thumbnail.png' }
        },
        url: canonUrl,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonUrl },
        isPartOf: {
          '@type': 'CollectionPage',
          name: 'Open Letters to Osagyefo',
          url: 'https://dearosagyefo.com/letters.html'
        },
        keywords: `Kwame Nkrumah, Ghana, open letter, ${cat}, African history`,
        inLanguage: 'en-US',
        about: { '@type': 'Person', name: 'Kwame Nkrumah', sameAs: 'https://en.wikipedia.org/wiki/Kwame_Nkrumah' }
      });
      // Bots/crawlers get this page as-is, with real visible content, so it's
      // actually indexable — an immediate redirect (meta-refresh or JS) fired
      // at every visitor, including Googlebot, meant Google only ever saw "this
      // page redirects, nothing to index here" and never credited the rich
      // OG/JSON-LD metadata to a real page. Human visitors still get bounced
      // to the interactive SPA experience; bots stay put and read the article.
      const ua = (req.headers['user-agent'] || '').toLowerCase();
      const isBot = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegrambot|slackbot|discordbot|linkedinbot|pinterest|embedly|quora|redditbot|w3c_validator|duckduckbot|baiduspider|yandex/i.test(ua);
      const redirectTags = isBot ? '' : `<meta http-equiv="refresh" content="0;url=${destUrl}">
<script>window.location.replace('${destUrl}');</script>`;
      const pubDateStr = new Date(pubDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(`<!DOCTYPE html><html lang="en"><head>
<meta charset="UTF-8">
<title>${title} by ${author} | Dear Osagyefo</title>
<meta name="description" content="${desc}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${image}">
<meta property="og:url" content="${canonUrl}">
<meta property="og:type" content="article">
<meta property="og:article:author" content="${author}">
<meta property="og:site_name" content="Dear Osagyefo">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${image}">
<link rel="canonical" href="${canonUrl}">
<link rel="alternate" type="application/rss+xml" title="Dear Osagyefo RSS" href="https://dearosagyefo.com/rss.xml">
<script type="application/ld+json">${jsonld}</script>
${redirectTags}
</head><body>
<article>
<h1>${title}</h1>
<p><em>By ${author} &middot; ${pubDateStr} &middot; ${cat}</em></p>
${letter.content || `<p>${desc}</p>`}
<p><a href="${destUrl}">Read and react to this letter on Dear Osagyefo &rarr;</a></p>
</article>
</body></html>`);
    }
  );
});

// API 404 — return JSON, not HTML
app.use('/api', (req, res) => {
  res.status(404).json({ message: `API route not found: ${req.method} ${req.originalUrl}` });
});

// ── Frontend static files ─────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '.')));

// Page routes
const pages = ['login', 'dashboard', 'write', 'about', 'timeline', 'letters', 'preview', 'review', 'quiz', 'from-osagyefo'];
pages.forEach(page => {
  app.get(`/${page}`, (req, res) => res.sendFile(path.join(__dirname, `${page}.html`)));
});
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

// Frontend 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  // Return JSON for API errors, HTML for page errors
  if (req.path.startsWith('/api/')) {
    return res.status(500).json({ message: 'Internal server error' });
  }
  res.status(500).sendFile(path.join(__dirname, '404.html'));
});

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║  Letter to Osagyefo - Backend Server   ║
╚════════════════════════════════════════╝

  Server:   http://localhost:${PORT}
  API base: http://localhost:${PORT}/api

  Auth (rate-limited, 20 req/15 min)
    POST  /api/users/register
    POST  /api/users/login
    POST  /api/users/forgot-password
    POST  /api/users/reset-password
    GET   /api/users/profile          [JWT]
    PUT   /api/users/profile          [JWT]

  Public letters
    GET   /api/public/letters
    GET   /api/public/letters/:id
    GET   /api/public/categories
    GET   /api/public/authors
    POST  /api/public/submit          (rate-limited)

  User letters [JWT required]
    POST  /api/letters
    GET   /api/letters
    GET   /api/letters/:id
    PUT   /api/letters/:id
    DELETE /api/letters/:id
    GET   /api/letters/:id/pdf
    POST  /api/letters/:id/publish-to-site
    GET   /api/letters/stats/dashboard

  Admin letters [x-admin-secret required]
    GET   /api/letters/admin/all
    GET   /api/letters/admin/public/all
    GET   /api/letters/admin/public/:id
    PUT   /api/letters/admin/public/:id
    DELETE /api/letters/admin/public/:id
    PUT   /api/letters/admin/public/:id/restore
    POST  /api/letters/admin/public/:id/generate-audio

  Visitor submissions
    POST  /api/visitors/submit        (rate-limited)
    GET   /api/visitors/letters
    GET   /api/visitors/letters/:id
    GET   /api/visitors/categories
    POST  /api/visitors/my-letters

  Admin visitor review [x-admin-secret required]
    GET   /api/visitors/admin/pending
    GET   /api/visitors/admin/history
    PUT   /api/visitors/admin/:id/approve
    PUT   /api/visitors/admin/:id/reject

  Misc
    POST  /api/subscribe              (rate-limited)
    GET   /api/portal/ping            [x-portal-secret]
    GET   /api/health

  Press Ctrl+C to stop
  `);
});

module.exports = app;

