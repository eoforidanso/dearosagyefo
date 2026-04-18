const db = require('../config/database');
const pdf = require('html-pdf');

// Generate PDF from letter
exports.generateLetterPDF = (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT * FROM letters WHERE id = ? AND userId = ?`,
    [id, req.user.id],
    (err, letter) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }

      if (!letter) {
        return res.status(404).json({ message: 'Letter not found' });
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .header { margin-bottom: 30px; }
            .recipient { margin-bottom: 30px; }
            .content { margin: 30px 0; white-space: pre-wrap; }
            .footer { margin-top: 40px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${escapeHtml(letter.subject || '')}</h1>
          </div>
          <div class="recipient">
            <p>To: ${escapeHtml(letter.recipientName)}</p>
            ${letter.recipientEmail ? `<p>Email: ${escapeHtml(letter.recipientEmail)}</p>` : ''}
          </div>
          <div class="content">${escapeHtml(letter.content)}</div>
          <div class="footer">
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
        </body>
        </html>
      `;

      const options = { format: 'A4' };

      pdf.create(htmlContent, options).toBuffer((err, buffer) => {
        if (err) {
          console.error('PDF generation error:', err);
          return res.status(500).json({ message: 'Error generating PDF' });
        }

        res.contentType('application/pdf');
        res.header('Content-Disposition', `attachment; filename="letter-${id}.pdf"`);
        res.send(buffer);
      });
    }
  );
};

// Helper function to escape HTML
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
