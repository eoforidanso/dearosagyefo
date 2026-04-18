/**
 * Quick DB inspection script.
 * Usage: node db-query.js [optional SQL query]
 * Default: shows all tables and row counts.
 */
const sqlite3 = require('./node_modules/sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'letters.db');
const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY, (err) => {
  if (err) { console.error('Cannot open DB:', err.message); process.exit(1); }
});

const customQuery = process.argv[2];

if (customQuery) {
  db.all(customQuery, [], (err, rows) => {
    if (err) { console.error('Query error:', err.message); }
    else { console.table(rows); }
    db.close();
  });
} else {
  // Default: list tables + counts
  db.all("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name", [], (err, tables) => {
    if (err) { console.error(err.message); db.close(); return; }

    console.log('\n=== Tables in letters.db ===\n');
    let pending = tables.length;
    if (pending === 0) { console.log('(no tables)'); db.close(); return; }

    tables.forEach(t => {
      db.get(`SELECT COUNT(*) as count FROM "${t.name}"`, [], (err2, row) => {
        console.log(`  ${t.name.padEnd(25)} ${err2 ? '?' : row.count} rows`);
        pending--;
        if (pending === 0) db.close();
      });
    });
  });
}
