/**
 * Reset Admin Password Script
 * 
 * This script will:
 * 1. Check if admin user exists
 * 2. If exists, reset password
 * 3. If not exists, create new admin user
 * 
 * Usage: node reset-admin-password.js
 */

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data/letters.db');

// CONFIGURE YOUR ADMIN CREDENTIALS HERE
const ADMIN_EMAIL = 'admin@dearosagyefo.com';
const ADMIN_PASSWORD = 'Ghana2026!';  // Change this to your desired password
const ADMIN_FIRSTNAME = 'Admin';
const ADMIN_LASTNAME = 'User';

// Connect to database
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    process.exit(1);
  } else {
    console.log('✓ Connected to SQLite database');
    resetAdminPassword();
  }
});

async function resetAdminPassword() {
  try {
    // Hash the new password
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    
    // Check if user exists
    db.get('SELECT id, email FROM users WHERE email = ?', [ADMIN_EMAIL], (err, user) => {
      if (err) {
        console.error('❌ Error checking user:', err.message);
        db.close();
        return;
      }

      if (user) {
        // User exists, update password
        db.run(
          'UPDATE users SET password = ?, updatedAt = CURRENT_TIMESTAMP WHERE email = ?',
          [hashedPassword, ADMIN_EMAIL],
          function(err) {
            if (err) {
              console.error('❌ Error updating password:', err.message);
            } else {
              console.log('\n✅ Admin password reset successfully!\n');
              console.log('📧 Email:', ADMIN_EMAIL);
              console.log('🔑 Password:', ADMIN_PASSWORD);
              console.log('\n⚠️  Please change this password after logging in!\n');
            }
            db.close();
          }
        );
      } else {
        // User doesn't exist, create new admin
        db.run(
          'INSERT INTO users (email, password, firstName, lastName) VALUES (?, ?, ?, ?)',
          [ADMIN_EMAIL, hashedPassword, ADMIN_FIRSTNAME, ADMIN_LASTNAME],
          function(err) {
            if (err) {
              console.error('❌ Error creating admin user:', err.message);
            } else {
              console.log('\n✅ New admin user created successfully!\n');
              console.log('📧 Email:', ADMIN_EMAIL);
              console.log('🔑 Password:', ADMIN_PASSWORD);
              console.log('👤 User ID:', this.lastID);
              console.log('\n⚠️  Please change this password after logging in!\n');
            }
            db.close();
          }
        );
      }
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    db.close();
  }
}
