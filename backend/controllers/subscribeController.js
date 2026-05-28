const db = require('../config/database');

// POST /api/subscribe — Subscribe an email address
exports.subscribe = (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Valid email required' });
  }

  db.run(`INSERT OR IGNORE INTO subscribers (email) VALUES (?)`, [email], function (err) {
    if (err) {
      console.error('Subscribe error:', err);
      return res.status(500).json({ message: 'Server error' });
    }

    if (this.changes === 0) {
      return res.json({ message: 'Already subscribed', alreadySubscribed: true });
    }

    console.log(`✉ New subscriber: ${email}`);

    // Send email notification via Nodemailer (if configured)
    const nodemailer = (() => { try { return require('nodemailer'); } catch { return null; } })();
    if (nodemailer && process.env.SMTP_HOST) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });
      transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: process.env.NOTIFY_EMAIL || 'eoforid@gmail.com',
        subject: 'New Subscriber — Letter to Osagyefo',
        html: `<h3>New Subscriber!</h3><p><strong>${email}</strong> just subscribed to Letter to Osagyefo.</p><p style="color:#888;font-size:0.85rem;">${new Date().toLocaleString()}</p>`,
      }).catch(e => console.error('Notification email failed:', e.message));
    }

    res.status(201).json({ message: 'Subscribed successfully' });
  });
};
