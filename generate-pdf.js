const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  try {
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    const htmlPath = `file://${path.resolve(__dirname, 'flyer.html')}`;
    
    await page.goto(htmlPath, { waitUntil: 'networkidle0' });
    
    const pdfPath = path.join(__dirname, 'flyer.pdf');
    await page.pdf({
      path: pdfPath,
      format: 'A4',
      margin: {
        top: '10mm',
        bottom: '10mm',
        left: '10mm',
        right: '10mm'
      },
      printBackground: true
    });
    
    await browser.close();
    console.log(`✓ PDF created successfully: ${pdfPath}`);
  } catch (error) {
    console.error('Error creating PDF:', error);
    process.exit(1);
  }
})();
