/**
 * Import 31 real letters from Dr. Ato Kwamena Danso's blog API
 * into the dearosagyefo.com public_letters table.
 *
 * Run on EC2:  node import-blog-letters.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const https = require('https');

const DB_PATH = path.join(__dirname, 'data/letters.db');
const BLOG_API = 'https://fmmnsqxf9e.execute-api.us-east-1.amazonaws.com/api/getblog';

// ── helpers ───────────────────────────────────────────────────────────────────

function fetchBlogArticles() {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({});
    const url = new URL(BLOG_API);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed.customerData || []);
        } catch (e) {
          reject(new Error('Failed to parse blog API response: ' + e.message));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

function mapCategory(raw) {
  const map = {
    POLITICS: 'Politics',
    OTHER: 'Culture',
    CULTURE: 'Culture',
    ECONOMY: 'Economy',
    SPORTS: 'Sports',
    ENTERTAINMENT: 'Entertainment',
  };
  return map[(raw || '').toUpperCase()] || 'General';
}

// Strip expiring AWS pre-signed query params from image URL
function cleanImageUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    // Remove AWS signature params
    ['X-Amz-Algorithm','X-Amz-Credential','X-Amz-Date','X-Amz-Expires',
     'X-Amz-Security-Token','X-Amz-Signature','X-Amz-SignedHeaders']
      .forEach(p => u.searchParams.delete(p));
    return u.toString();
  } catch {
    return url;
  }
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('📡 Fetching blog articles from API...');
  const articles = await fetchBlogArticles();
  console.log(`✓ Fetched ${articles.length} articles`);

  // Sort oldest → newest so letterNumber assignment is chronological
  articles.sort((a, b) => parseInt(a.ID) - parseInt(b.ID));

  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) { console.error('DB open error:', err.message); process.exit(1); }
    console.log('✓ Connected to DB:', DB_PATH);
  });

  db.serialize(() => {
    // Ensure imageData column exists (it's added via ALTER in database.js but may not exist in fresh imports)
    db.run(`ALTER TABLE public_letters ADD COLUMN imageData TEXT`, () => {});
    db.run(`ALTER TABLE public_letters ADD COLUMN customSalutation TEXT`, () => {});
    db.run(`ALTER TABLE public_letters ADD COLUMN customClosing TEXT`, () => {});
    db.run(`ALTER TABLE public_letters ADD COLUMN audioUrl TEXT`, () => {});

    // Wipe existing letters
    db.run(`DELETE FROM public_letters`, function(err) {
      if (err) { console.error('DELETE error:', err.message); return; }
      console.log(`✓ Cleared existing letters (${this.changes} rows removed)`);
    });

    // Reset the autoincrement counter so IDs start from 1
    db.run(`DELETE FROM sqlite_sequence WHERE name='public_letters'`, () => {});

    const stmt = db.prepare(`
      INSERT INTO public_letters
        (letterNumber, authorName, title, preview, content, category, tags,
         accentColor, publishedAt, isApproved, imageData)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);

    articles.forEach((article, idx) => {
      const letterNumber = idx + 1;
      const authorName   = 'Dr. Ato Kwamena Danso';
      const title        = (article.title || '').trim();
      const preview      = (article.summary || '').trim();
      const content      = (article.message || '').trim();
      const category     = mapCategory(article.category);
      const tags         = (article.category || '').toLowerCase();
      const accentColor  = '#D43F3A'; // brand red
      const publishedAt  = new Date(parseInt(article.ID)).toISOString().slice(0, 10);
      const imageData    = cleanImageUrl(article.getImageURL);

      stmt.run(
        letterNumber, authorName, title, preview, content,
        category, tags, accentColor, publishedAt, imageData,
        function(err) {
          if (err) console.error(`  ✗ #${letterNumber} "${title}":`, err.message);
          else console.log(`  ✓ #${letterNumber} [${category}] ${title}`);
        }
      );
    });

    stmt.finalize(() => {
      db.get(`SELECT COUNT(*) as count FROM public_letters`, (err, row) => {
        console.log(`\n🎉 Import complete: ${row ? row.count : '?'} letters now in DB`);
        db.close();
      });
    });
  });
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
