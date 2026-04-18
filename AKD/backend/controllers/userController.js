const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { generateToken } = require('../middleware/auth');

// In-memory reset codes (code -> { email, expires })
const resetCodes = new Map();

// Register user
exports.register = (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  // Validation
  if (!email || !password || !firstName) {
    return res.status(400).json({ message: 'Email, password, and firstName are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }

  // Hash password
  bcrypt.hash(password, 10, (err, hashedPassword) => {
    if (err) {
      return res.status(500).json({ message: 'Server error' });
    }

    // Insert user into database
    db.run(
      `INSERT INTO users (email, password, firstName, lastName) VALUES (?, ?, ?, ?)`,
      [email, hashedPassword, firstName, lastName],
      (err) => {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ message: 'Email already registered' });
          }
          return res.status(500).json({ message: 'Server error' });
        }

        // Get the new user
        db.get(
          `SELECT id, email, firstName, lastName FROM users WHERE email = ?`,
          [email],
          (err, user) => {
            if (err) {
              return res.status(500).json({ message: 'Server error' });
            }

            const token = generateToken(user);
            res.status(201).json({
              message: 'User registered successfully',
              token,
              user: {
                id: user.id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName
              }
            });
          }
        );
      }
    );
  });
};

// Login user
exports.login = (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // Find user
  db.get(
    `SELECT * FROM users WHERE email = ?`,
    [email],
    (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }

      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Compare passwords
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          return res.status(500).json({ message: 'Server error' });
        }

        if (!isMatch) {
          return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = generateToken(user);
        res.json({
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
          }
        });
      });
    }
  );
};

// Get user profile
exports.getProfile = (req, res) => {
  db.get(
    `SELECT id, email, firstName, lastName, createdAt FROM users WHERE id = ?`,
    [req.user.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user);
    }
  );
};

// Update user profile
exports.updateProfile = (req, res) => {
  const { firstName, lastName } = req.body;

  db.run(
    `UPDATE users SET firstName = ?, lastName = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
    [firstName, lastName, req.user.id],
    (err) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }

      // Get updated user
      db.get(
        `SELECT id, email, firstName, lastName FROM users WHERE id = ?`,
        [req.user.id],
        (err, user) => {
          if (err) {
            return res.status(500).json({ message: 'Server error' });
          }

          res.json({
            message: 'Profile updated successfully',
            user
          });
        }
      );
    }
  );
};

// Forgot password — send reset code via email
exports.forgotPassword = (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  db.get(`SELECT id, email, firstName FROM users WHERE email = ?`, [email], (err, user) => {
    if (err) return res.status(500).json({ message: 'Server error' });
    if (!user) {
      // Don't reveal whether email exists
      return res.json({ message: 'If that email is registered, a reset code has been sent.' });
    }

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    resetCodes.set(code, { email: user.email, expires: Date.now() + 15 * 60 * 1000 }); // 15 min

    // Try sending email
    const nodemailer = (() => { try { return require('nodemailer'); } catch { return null; } })();
    if (nodemailer && process.env.SMTP_HOST) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      });
      transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: user.email,
        subject: '🔑 Password Reset — Letter to Osagyefo',
        html: `<h3>Password Reset</h3><p>Hi ${user.firstName},</p><p>Your reset code is:</p><h1 style="letter-spacing:6px;color:#D43F3A;font-size:2.5rem;">${code}</h1><p>This code expires in 15 minutes.</p><p style="color:#888;font-size:0.85rem;">If you didn't request this, ignore this email.</p>`
      }).then(() => {
        console.log(`✉ Reset code sent to ${user.email}`);
        res.json({ message: 'If that email is registered, a reset code has been sent.', emailSent: true });
      }).catch(err => {
        console.error('Reset email failed:', err.message);
        // Fallback: return code in response (dev/self-hosted mode)
        res.json({ message: 'Email delivery unavailable. Use the code shown.', code, emailSent: false });
      });
    } else {
      // No SMTP configured — return code directly (single-user self-hosted)
      console.log(`🔑 Reset code for ${user.email}: ${code}`);
      res.json({ message: 'Email not configured. Use the code shown.', code, emailSent: false });
    }
  });
};

// Reset password with code
exports.resetPassword = (req, res) => {
  const { code, newPassword } = req.body;
  if (!code || !newPassword) return res.status(400).json({ message: 'Code and new password are required' });
  if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

  const entry = resetCodes.get(code);
  if (!entry || Date.now() > entry.expires) {
    resetCodes.delete(code);
    return res.status(400).json({ message: 'Invalid or expired reset code' });
  }

  bcrypt.hash(newPassword, 10, (err, hash) => {
    if (err) return res.status(500).json({ message: 'Server error' });

    db.run(`UPDATE users SET password = ?, updatedAt = CURRENT_TIMESTAMP WHERE email = ?`, [hash, entry.email], function (err) {
      if (err) return res.status(500).json({ message: 'Server error' });
      resetCodes.delete(code);
      console.log(`✓ Password reset for ${entry.email}`);
      res.json({ message: 'Password updated successfully' });
    });
  });
};
