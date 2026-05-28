// Script to split long paragraphs into multiple shorter ones
const fs = require('fs');

let html = fs.readFileSync('letters.html', 'utf8');

// Find all letter-body sections and split long <p> tags into multiple paragraphs
const letterBodyRegex = /<div class="letter-body">\s*([\s\S]*?)\s*<\/div>\s*<div class="letter-closing">/g;

let count = 0;
html = html.replace(letterBodyRegex, (match, bodyContent) => {
  // Extract all <p> tags
  const pTags = bodyContent.match(/<p>([\s\S]*?)<\/p>/g);
  if (!pTags) return match;
  
  let needsFix = false;
  for (const p of pTags) {
    if (p.length > 800) { needsFix = true; break; }
  }
  if (!needsFix) return match;
  
  count++;
  let newParagraphs = [];
  
  for (const p of pTags) {
    const content = p.replace(/<\/?p>/g, '');
    
    if (content.length <= 800) {
      newParagraphs.push(content);
      continue;
    }
    
    // Split on sentence boundaries where sentences run together (no space after period)
    // or natural paragraph breaks
    let text = content;
    
    // First, add spaces where sentences are joined (period followed directly by capital letter)
    text = text.replace(/([.!?])([A-Z])/g, '$1 $2');
    
    // Now split into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    // Group into paragraphs of ~3-4 sentences or ~400-600 chars
    let currentPara = '';
    let sentCount = 0;
    
    for (const sentence of sentences) {
      currentPara += sentence;
      sentCount++;
      
      if (sentCount >= 3 && currentPara.length > 350) {
        newParagraphs.push(currentPara.trim());
        currentPara = '';
        sentCount = 0;
      }
    }
    if (currentPara.trim()) {
      newParagraphs.push(currentPara.trim());
    }
  }
  
  const newBody = newParagraphs.map(p => `        <p>${p}</p>`).join('\n');
  return `<div class="letter-body">\n${newBody}\n      </div>\n      <div class="letter-closing">`;
});

console.log(`Split paragraphs in ${count} letter bodies`);
fs.writeFileSync('letters.html', html);
console.log('Done!');
