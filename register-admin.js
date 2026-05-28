/**
 * Register Admin User Script
 * Creates the default admin account for the dashboard
 */

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'data/letters.db');

// Admin credentials from QUICK_START_BACKEND.md
const ADMIN_USER = {
  email: 'admin@dearosagyefo.com',
  password: 'GhanaIndependence1957!',
  firstName: 'Admin',
  lastName: 'User'
};

// Connect to database
const db = new sqlite3.Database(DB_PATH, async (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    process.exit(1);
  }
  
  console.log('✓ Connected to SQLite database\n');
  
  try {
    // Check if admin already exists
    db.get('SELECT * FROM users WHERE email = ?', [ADMIN_USER.email], async (err, row) => {
      if (err) {
        console.error('❌ Error checking for existing admin:', err.message);
        db.close();
        process.exit(1);
      }
      
      if (row) {
        console.log('ℹ️  Admin user already exists!');
        console.log('📧 Email:', ADMIN_USER.email);
        console.log('🔐 Password:', ADMIN_USER.password);
        console.log('\n✅ You can log in to the dashboard with these credentials.\n');
        db.close();
        return;
      }
      
      // Hash password
      console.log('🔐 Hashing password...');
      const hashedPassword = await bcrypt.hash(ADMIN_USER.password, 10);
      
      // Insert admin user
      db.run(
        'INSERT INTO users (email, password, firstName, lastName) VALUES (?, ?, ?, ?)',
        [ADMIN_USER.email, hashedPassword, ADMIN_USER.firstName, ADMIN_USER.lastName],
        function(err) {
          if (err) {
            console.error('❌ Error creating admin user:', err.message);
            db.close();
            process.exit(1);
          }
          
          console.log('\n✅ Admin user created successfully!\n');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('📋 Dashboard Login Credentials:');
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('📧 Email:   ', ADMIN_USER.email);
          console.log('🔐 Password:', ADMIN_USER.password);
          console.log('🆔 User ID: ', this.lastID);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
          console.log('🌐 Login at: https://dearosagyefo.com/dashboard.html\n');
          
          db.close();
        }
      );
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    db.close();
    process.exit(1);
  }
});
