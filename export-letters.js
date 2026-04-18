const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'letters.db');
const db = new sqlite3.Database(dbPath);

// Export all letters
db.serialize(() => {
  // Get protected letters
  db.all('SELECT * FROM letters', [], (err, protectedLetters) => {
    if (err) {
      console.error('Error fetching protected letters:', err);
      return;
    }

    // Get public letters
    db.all('SELECT * FROM public_letters', [], (err, publicLetters) => {
      if (err) {
        console.error('Error fetching public letters:', err);
        return;
      }

      // Get users info
      db.all('SELECT id, email, firstName, lastName FROM users', [], (err, users) => {
        if (err) {
          console.error('Error fetching users:', err);
          return;
        }

        const exportData = {
          exportDate: new Date().toISOString(),
          totalLetters: protectedLetters.length + publicLetters.length,
          protectedLetters: protectedLetters,
          publicLetters: publicLetters,
          users: users
        };

        // Save to JSON file
        fs.writeFileSync(
          path.join(__dirname, 'letters-export.json'),
          JSON.stringify(exportData, null, 2)
        );

        console.log('\n✅ Letters Export Complete!\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📊 Export Summary:`);
        console.log(`   Total Letters: ${exportData.totalLetters}`);
        console.log(`   Protected Letters: ${protectedLetters.length}`);
        console.log(`   Public Letters: ${publicLetters.length}`);
        console.log(`   Users: ${users.length}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('📁 Saved to: letters-export.json\n');

        // Display letter details
        console.log('📝 Protected Letters:');
        protectedLetters.forEach((letter, idx) => {
          console.log(`\n${idx + 1}. Title: ${letter.title}`);
          console.log(`   Author: User ID ${letter.user_id}`);
          console.log(`   Created: ${letter.created_at}`);
          console.log(`   Content Preview: ${letter.content.substring(0, 100)}...`);
        });

        console.log('\n\n📢 Public Letters:');
        publicLetters.forEach((letter, idx) => {
          console.log(`\n${idx + 1}. From: ${letter.sender_name}`);
          console.log(`   Email: ${letter.sender_email || 'N/A'}`);
          console.log(`   Created: ${letter.created_at}`);
          console.log(`   Content Preview: ${letter.content.substring(0, 100)}...`);
        });

        console.log('\n\n📤 Next Steps:');
        console.log('   1. Copy letters-export.json to your host server');
        console.log('   2. Import the data into your production database');
        console.log('   3. Or use the SQL export below for direct database import\n');

        db.close();
      });
    });
  });
});
