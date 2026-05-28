/**
 * Test Login Script
 * Tests login credentials against the database
 */

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data/letters.db');

// Test credentials
const testCredentials = [
  { email: 'admin@dearosagyefo.com', password: 'GhanaIndependence1957!' },
  { email: 'admin@lettertoosagyefo.com', password: 'GhanaIndependence1957!' },
  { email: 'eoforid@gmail.com', password: 'GhanaIndependence1957!' },
];

// Connect to database
const db = new sqlite3.Database(DB_PATH, async (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    process.exit(1);
  }
  
  console.log('✓ Connected to SQLite database\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 Testing Login Credentials');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Test each credential
  for (const cred of testCredentials) {
    await testLogin(cred.email, cred.password);
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('💡 Recommendation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('If none of the above worked, you may need to:');
  console.log('1. Reset the password for an existing user, OR');
  console.log('2. Check if there are other users in the database\n');
  
  db.close();
});

function testLogin(email, password) {
  return new Promise((resolve) => {
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        console.log(`❌ ${email}`);
        console.log(`   Error: ${err.message}\n`);
        resolve();
        return;
      }
      
      if (!user) {
        console.log(`❌ ${email}`);
        console.log(`   User not found in database\n`);
        resolve();
        return;
      }
      
      // Check password
      const isValid = await bcrypt.compare(password, user.password);
      
      if (isValid) {
        console.log(`✅ ${email}`);
        console.log(`   Password: ${password}`);
        console.log(`   User ID: ${user.id}`);
        console.log(`   Name: ${user.firstName} ${user.lastName || ''}`);
        console.log(`   ✓ LOGIN WORKS!\n`);
      } else {
        console.log(`⚠️  ${email}`);
        console.log(`   User exists but password '${password}' is INCORRECT`);
        console.log(`   User ID: ${user.id}\n`);
      }
      
      resolve();
    });
  });
}
