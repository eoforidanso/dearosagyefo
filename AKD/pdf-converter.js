const fs = require('fs');
const path = require('path');

// Try using html-pdf, fall back to puppeteer if not available
try {
  const htmlPdf = require('html-pdf');
  
  const htmlFile = path.join(__dirname, 'flyer.html');
  const pdfFile = path.join(__dirname, 'flyer.pdf');
  
  const html = fs.readFileSync(htmlFile, 'utf8');
  
  const options = {
    format: 'A4',
    orientation: 'portrait',
    border: '10mm',
    header: {
      height: '10mm'
    },
    footer: {
      height: '10mm'
    }
  };
  
  htmlPdf.create(html, options).toFile(pdfFile, (err, res) => {
    if (err) {
      console.error('Error creating PDF:', err);
      process.exit(1);
    }
    console.log(`✓ PDF created successfully: ${res.filename}`);
    process.exit(0);
  });
  
} catch (e) {
  console.log('html-pdf not installed. Installing...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install html-pdf', { stdio: 'inherit' });
    require('module').cache = {}; // Clear cache
    require('./pdf-converter.js'); // Re-run this script
  } catch (err) {
    console.error('Failed to install html-pdf:', err);
    process.exit(1);
  }
}
