/**
 * Strip duplicate opening salutation from public_letters content.
 * Removes patterns like:
 *   "Dear Osagyefo,"  / "Dear Osagyefo ," / "Dear Osagyefo\n" / "Osagyefo,"
 * from the very beginning of each letter's content field.
 *
 * Run on EC2:  node fix-salutation.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'data/letters.db');

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) { console.error('DB open error:', err.message); process.exit(1); }
  console.log('✓ Connected to DB');
});

// Matches "Dear Osagyefo," or "Osagyefo," (with optional spaces/newlines after)
// at the very start of the content string
const SALUTATION_RE = /^(Dear\s+)?Osagyefo\s*,?\s*[\r\n]*/i;

db.all('SELECT id, title, content FROM public_letters ORDER BY id', (err, rows) => {
  if (err) { console.error(err.message); db.close(); return; }

  let updated = 0;
  let done = 0;

  rows.forEach((row) => {
    const cleaned = row.content.replace(SALUTATION_RE, '');

    if (cleaned === row.content) {
      console.log(`  — #${row.id} unchanged (no leading salutation): ${row.title.slice(0,50)}`);
      done++;
      if (done === rows.length) finish();
      return;
    }

    db.run(
      'UPDATE public_letters SET content = ? WHERE id = ?',
      [cleaned, row.id],
      function(e) {
        if (e) console.error(`  ✗ #${row.id} error:`, e.message);
        else { console.log(`  ✓ #${row.id} stripped: ${row.title.slice(0,50)}`); updated++; }
        done++;
        if (done === rows.length) finish();
      }
    );
  });

  function finish() {
    console.log(`\n🎉 Done: ${updated} letters updated, ${rows.length - updated} already clean`);
    db.close();
  }
});
