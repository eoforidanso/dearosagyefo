#!/usr/bin/env node
/**
 * Fix audioUrl values in the database by removing timestamps
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'data/letters.db');

console.log(`Opening database at ${DB_PATH}...`);

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    process.exit(1);
  }

  console.log('✅ Connected to database');

  // Fix audioUrl values
  db.run(
    `UPDATE public_letters 
     SET audioUrl = 'https://dearosagyefo.com/audio/letter-' || id || '.mp3'
     WHERE audioUrl IS NOT NULL 
       AND audioUrl LIKE '%/audio/letter-%'`,
    function(err) {
      if (err) {
        console.error('❌ Error updating audioUrl:', err.message);
        process.exit(1);
      }

      console.log(`✅ Fixed ${this.changes} audioUrl values`);

      // Verify
      db.all(
        `SELECT COUNT(*) as total, 
                SUM(CASE WHEN audioUrl LIKE '%letter-[0-9]%.mp3' THEN 1 ELSE 0 END) as with_correct_format
         FROM public_letters 
         WHERE audioUrl IS NOT NULL`,
        [],
        (err, results) => {
          if (err) {
            console.error('❌ Error verifying:', err.message);
            process.exit(1);
          }

          console.log('📊 Verification:');
          console.log(`   Total with audioUrl: ${results[0].total}`);
          console.log(`   With correct format: ${results[0].with_correct_format}`);

          // Show sample
          db.all(
            `SELECT id, audioUrl FROM public_letters WHERE audioUrl IS NOT NULL LIMIT 3`,
            [],
            (err, rows) => {
              if (!err) {
                console.log('\n📝 Sample results:');
                rows.forEach(row => {
                  console.log(`   [${row.id}] ${row.audioUrl}`);
                });
              }
              db.close();
              console.log('\n✅ Done!');
            }
          );
        }
      );
    }
  );
});
