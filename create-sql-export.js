const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'letters.db');
const db = new sqlite3.Database(dbPath);

let sqlStatements = [];

sqlStatements.push('-- ============================================');
sqlStatements.push('-- Letter to Osagyefo - Database Export');
sqlStatements.push(`-- Export Date: ${new Date().toISOString()}`);
sqlStatements.push('-- ============================================\n');

db.serialize(() => {
  // Export users
  db.all('SELECT * FROM users', [], (err, users) => {
    if (err) {
      console.error('Error:', err);
      return;
    }

    sqlStatements.push('\n-- ============================================');
    sqlStatements.push('-- USERS');
    sqlStatements.push('-- ============================================\n');

    users.forEach(user => {
      const sql = `INSERT INTO users (id, email, password, firstName, lastName, createdAt, updatedAt) 
VALUES (${user.id}, ${escapeSQL(user.email)}, ${escapeSQL(user.password)}, ${escapeSQL(user.firstName)}, ${escapeSQL(user.lastName)}, ${escapeSQL(user.createdAt)}, ${escapeSQL(user.updatedAt)});`;
      sqlStatements.push(sql);
    });

    // Export protected letters
    db.all('SELECT * FROM letters', [], (err, letters) => {
      if (err) {
        console.error('Error:', err);
        return;
      }

      sqlStatements.push('\n-- ============================================');
      sqlStatements.push('-- PROTECTED LETTERS (User Portal)');
      sqlStatements.push('-- ============================================\n');

      letters.forEach(letter => {
        const sql = `INSERT INTO letters (id, userId, recipientName, recipientEmail, subject, content, category, tags, summary, status, createdAt, updatedAt, sentAt, imageData) 
VALUES (${letter.id}, ${letter.userId}, ${escapeSQL(letter.recipientName)}, ${escapeSQL(letter.recipientEmail)}, ${escapeSQL(letter.subject)}, ${escapeSQL(letter.content)}, ${escapeSQL(letter.category)}, ${escapeSQL(letter.tags)}, ${escapeSQL(letter.summary)}, ${escapeSQL(letter.status)}, ${escapeSQL(letter.createdAt)}, ${escapeSQL(letter.updatedAt)}, ${escapeSQL(letter.sentAt)}, ${escapeSQL(letter.imageData)});`;
        sqlStatements.push(sql);
      });

      // Export public letters
      db.all('SELECT * FROM public_letters', [], (err, publicLetters) => {
        if (err) {
          console.error('Error:', err);
          return;
        }

        sqlStatements.push('\n-- ============================================');
        sqlStatements.push('-- PUBLIC LETTERS (Open Platform)');
        sqlStatements.push('-- ============================================\n');

        publicLetters.forEach(letter => {
          const sql = `INSERT INTO public_letters (id, letterNumber, authorName, title, preview, content, category, tags, accentColor, publishedAt, isApproved, userId, createdAt, updatedAt, imageData) 
VALUES (${letter.id}, ${letter.letterNumber}, ${escapeSQL(letter.authorName)}, ${escapeSQL(letter.title)}, ${escapeSQL(letter.preview)}, ${escapeSQL(letter.content)}, ${escapeSQL(letter.category)}, ${escapeSQL(letter.tags)}, ${escapeSQL(letter.accentColor)}, ${escapeSQL(letter.publishedAt)}, ${letter.isApproved}, ${letter.userId}, ${escapeSQL(letter.createdAt)}, ${escapeSQL(letter.updatedAt)}, ${escapeSQL(letter.imageData)});`;
          sqlStatements.push(sql);
        });

        // Write to file
        const sqlContent = sqlStatements.join('\n');
        fs.writeFileSync(path.join(__dirname, 'letters-import.sql'), sqlContent);

        console.log('\n✅ SQL Export Complete!\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📊 Export Summary:`);
        console.log(`   Users: ${users.length}`);
        console.log(`   Protected Letters: ${letters.length}`);
        console.log(`   Public Letters: ${publicLetters.length}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('📁 Files Created:');
        console.log('   1. letters-export.json (JSON format)');
        console.log('   2. letters-import.sql (SQL format)\n');
        console.log('📤 To Import on Host Server:');
        console.log('   Upload letters-import.sql to your server and run:');
        console.log('   sqlite3 /path/to/letters.db < letters-import.sql\n');

        db.close();
      });
    });
  });
});

function escapeSQL(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'number') {
    return value;
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}
