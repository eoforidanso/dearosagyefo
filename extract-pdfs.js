const fs = require('fs');
const path = require('path');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

// List of PDF files to process
const pdfFiles = [
  'THE PERSISTENT CHALLENGE OF SMALL-SCALE MINING.pdf',
  'A NATIONS DRS DRAMAS AND DELUSIONS.pdf',
  'Dear Osagyefo,.pdf',
  'Letter XX.pdf',
  'GHOST OF NEW YEAR\'S RESOLUTIONS.pdf',
  'ANKWANOMA OSP: THE SINGING PROSECUTOR AND THE BAILED-OUT LAWYER.pdf'
];

async function extractPDFText(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = new Uint8Array(dataBuffer);
    
    const loadingTask = pdfjsLib.getDocument({ data });
    const pdfDocument = await loadingTask.promise;
    
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  } catch (error) {
    console.error(`Error extracting ${filePath}:`, error.message);
    return null;
  }
}

async function processAllPDFs() {
  console.log('📄 Extracting text from PDF letters...\n');
  
  const results = [];
  
  for (const filename of pdfFiles) {
    const filePath = path.join(__dirname, filename);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filename}`);
      continue;
    }
    
    console.log(`Processing: ${filename}`);
    const text = await extractPDFText(filePath);
    
    if (text) {
      // Extract title from filename
      const title = filename.replace('.pdf', '').replace(/_/g, ' ');
      
      results.push({
        filename,
        title,
        text: text.trim(),
        length: text.length
      });
      
      console.log(`✅ Extracted ${text.length} characters\n`);
    }
  }
  
  // Save results to JSON file
  const outputPath = path.join(__dirname, 'extracted-letters.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  
  console.log(`\n✨ Extraction complete! Saved to: extracted-letters.json`);
  console.log(`Total letters extracted: ${results.length}`);
  
  // Print summary
  console.log('\n📊 Summary:');
  results.forEach((letter, idx) => {
    console.log(`${idx + 1}. ${letter.title}`);
    console.log(`   Characters: ${letter.length}`);
    console.log(`   Preview: ${letter.text.substring(0, 100)}...`);
    console.log('');
  });
}

processAllPDFs().catch(console.error);
