const db = require('../config/database');
const nodemailer = require('nodemailer');

function createTransporter() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const WELCOME_HTML = (email) => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9f5ef;font-family:Georgia,serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f5ef;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:540px;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:#cc0000;padding:28px 32px;text-align:center;">
            <p style="margin:0;font-size:1.1rem;color:#ffd700;letter-spacing:2px;text-transform:uppercase;">Dear Osagyefo</p>
            <p style="margin:8px 0 0;font-size:0.85rem;color:rgba(255,255,255,0.8);">Letters to Kwame Nkrumah</p>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 32px;">
            <p style="margin:0 0 20px;font-size:1rem;color:#1a1a1a;line-height:1.7;">
              Your letter has reached us.<br><br>
              You are now part of a community continuing the conversation with Kwame Nkrumah —
              one letter at a time. We will let you know whenever a new letter arrives.
            </p>
            <p style="margin:0 0 20px;font-size:0.95rem;color:#444;line-height:1.7;">
              <em>"I am not African because I was born in Africa, but because Africa was born in me."</em><br>
              <span style="font-size:0.82rem;color:#888;">— Kwame Nkrumah</span>
            </p>
            <table>
              <tr>
                <td style="background:#cc0000;border-radius:4px;">
                  <a href="https://dearosagyefo.com" style="display:inline-block;padding:12px 28px;color:#fff;text-decoration:none;font-size:0.9rem;font-family:Georgia,serif;">
                    Read the Letters →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f0ebe2;text-align:center;">
            <p style="margin:0;font-size:0.78rem;color:#aaa;">
              You subscribed with ${email}.<br>
              To unsubscribe, reply with "unsubscribe" in the subject line.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

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

    const transporter = createTransporter();
    if (transporter) {
      const from = `"Dear Osagyefo" <${process.env.SMTP_USER}>`;

      // Welcome email to subscriber
      transporter.sendMail({
        from,
        to: email,
        subject: 'You wrote to Osagyefo',
        html: WELCOME_HTML(email),
      }).catch(e => console.error('Welcome email failed:', e.message));

      // Notification to site owner
      const notifyTo = process.env.NOTIFY_EMAIL || process.env.SMTP_USER;
      transporter.sendMail({
        from,
        to: notifyTo,
        subject: `New Subscriber — ${email}`,
        html: `<p><strong>${email}</strong> just subscribed to Dear Osagyefo.</p><p style="color:#888;font-size:0.85rem;">${new Date().toLocaleString('en-GH', { timeZone: 'Africa/Accra' })}</p>`,
      }).catch(e => console.error('Notification email failed:', e.message));
    } else {
      console.warn('SMTP not configured — subscriber saved but no email sent.');
    }

    res.status(201).json({ message: 'Subscribed successfully' });
  });
};

// GET /api/subscribe/admin/list — return all subscribers
exports.listSubscribers = (req, res) => {
  db.all(
    `SELECT email, subscribedAt FROM subscribers ORDER BY subscribedAt DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ message: 'Server error' });
      res.json({ count: rows.length, subscribers: rows });
    }
  );
};
