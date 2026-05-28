// Script to fix letter formatting in modals that have single <p> blobs
const fs = require('fs');

let html = fs.readFileSync('letters.html', 'utf8');

// Function to reformat a single-<p> modal body into proper letter format
function reformatModalBody(content) {
  // Remove the wrapping <p> and </p>
  let text = content.trim();
  if (text.startsWith('<p>')) text = text.slice(3);
  if (text.endsWith('</p>')) text = text.slice(0, -4);
  text = text.trim();

  // Extract salutation
  let salutation = 'Dear Osagyefo,';
  text = text.replace(/^Dear Osagyefo,?\s*/, '');

  // Extract closing/signature - look for common patterns
  let closing = '';
  let signature = '';
  
  const closingPatterns = [
    /So long,?\s*(\d{4},?)?\s*(Ato[_ ]?KD|Ato_KD|Ato KD)\s*$/i,
    /So Long,?\s*(\d{4},?)?\s*(Ato[_ ]?KD|Ato_KD|Ato KD)\s*$/i,
    /Sincerely,?\s*(Ato[_ ]?KD|Ato_KD|Ato KD)\s*$/i,
    /Talk is cheap,?\s*(Ato[_ ]?KD|Ato_KD|Ato KD)\s*$/i,
    /Yours in frustration,?\s*(Ato[_ ]?KD|Ato_KD|Ato KD)\s*$/i,
    /Doctors everywhere,?\s*(Ato[_ ]?KD|Ato_KD|Ato KD)\s*$/i,
    /I promise continue updating you,?\s*(Ato[_ ]?KD|Ato_KD|Ato KD)\s*$/i,
    /Obia boa,?\s*(Ato[_ ]?KD|Ato_KD|Ato KD)\s*$/i,
    /(So long,?\s*2025,?\s*)(Ato[_ ]?KD|Ato_KD|Ato KD)\s*$/i,
    /(So long,?\s*2026,?\s*)(Ato[_ ]?KD|Ato_KD|Ato KD)\s*$/i,
  ];

  for (const pattern of closingPatterns) {
    const match = text.match(pattern);
    if (match) {
      // Get everything from the closing phrase to the end
      const idx = text.search(pattern);
      const closingText = text.slice(idx);
      text = text.slice(0, idx).trim();
      
      // Split closing from signature
      if (closingText.match(/So long,?\s*2025/i)) {
        closing = 'So long, 2025,';
        signature = 'Ato KD';
      } else if (closingText.match(/So long,?\s*2026/i)) {
        closing = 'So long, 2026,';
        signature = 'Ato KD';
      } else if (closingText.match(/So long/i)) {
        closing = 'So long,';
        signature = 'Ato KD';
      } else if (closingText.match(/Sincerely/i)) {
        closing = 'Sincerely,';
        signature = 'Ato_KD';
      } else if (closingText.match(/Talk is cheap/i)) {
        closing = 'Talk is cheap,';
        signature = 'Ato_KD';
      } else if (closingText.match(/Yours in frustration/i)) {
        closing = 'Yours in frustration,';
        signature = 'Ato_KD';
      } else if (closingText.match(/Doctors everywhere/i)) {
        closing = 'Doctors everywhere,';
        signature = 'Ato_KD';
      } else if (closingText.match(/I promise continue/i)) {
        closing = 'I promise to continue updating you,';
        signature = 'Ato_KD';
      } else if (closingText.match(/Obia boa/i)) {
        closing = 'Obia boa,';
        signature = 'Ato KD';
      } else {
        closing = 'So long,';
        signature = 'Ato KD';
      }
      break;
    }
  }

  // If no closing found, try a simpler extraction
  if (!closing) {
    const simpleMatch = text.match(/(So long|Sincerely|Yours)[^]*$/i);
    if (simpleMatch) {
      const idx = text.lastIndexOf(simpleMatch[0]);
      text = text.slice(0, idx).trim();
      closing = 'So long,';
      signature = 'Ato KD';
    }
  }

  // Split text into paragraphs on sentence boundaries where text runs together
  // Look for patterns like ".Word" or "!Word" (missing space after punctuation = paragraph break)
  let paragraphs = text.split(/(?<=[.!?])(?=[A-Z][a-z])/);
  
  // Group short fragments back together (aim for ~2-4 sentences per paragraph)
  let grouped = [];
  let current = '';
  let sentenceCount = 0;
  
  for (const frag of paragraphs) {
    current += frag;
    sentenceCount++;
    if (sentenceCount >= 3 && current.length > 200) {
      grouped.push(current.trim());
      current = '';
      sentenceCount = 0;
    }
  }
  if (current.trim()) grouped.push(current.trim());

  // Build the formatted HTML
  let result = `
      <div class="letter-salutation">Dear Osagyefo,</div>
      <div class="letter-body">
`;
  for (const para of grouped) {
    result += `        <p>${para}</p>\n`;
  }
  result += `      </div>
      <div class="letter-closing">
        ${closing}<br>
        <span class="signature">${signature}</span>
      </div>`;

  return result;
}

// Find and fix modals with single-<p> content (the broken ones)
// Pattern: modal-body with a single massive <p> containing "Dear Osagyefo"
const modalBodyRegex = /<div class="modal-body">\s*<p>Dear Osagyefo[^]*?<\/p>\s*<\/div>/g;

let count = 0;
html = html.replace(modalBodyRegex, (match) => {
  // Extract the <p>...</p> content
  const pMatch = match.match(/<p>(.*?)<\/p>/s);
  if (!pMatch) return match;
  
  // Only fix if it's a single <p> blob (no other <p> tags inside)
  const innerContent = pMatch[1];
  if (innerContent.includes('</p>')) return match; // Already has multiple paragraphs
  
  count++;
  const formatted = reformatModalBody(`<p>${innerContent}</p>`);
  return `<div class="modal-body">\n${formatted}\n    </div>`;
});

console.log(`Reformatted ${count} modal bodies`);

// Also add CSS for the letter format classes if not already present
if (!html.includes('.letter-salutation')) {
  const cssInsert = `
    /* Letter format styles */
    .letter-salutation {
      font-style: italic;
      color: var(--gray-700);
      margin-bottom: 1.5rem;
      font-size: 1.1rem;
    }
    .letter-body p {
      margin-bottom: 1.25rem;
      line-height: 1.8;
      text-align: justify;
    }
    .letter-closing {
      margin-top: 2rem;
      font-style: italic;
      text-align: right;
    }
    .letter-closing .signature {
      font-weight: 600;
      color: var(--green);
      font-style: normal;
    }
    .letter-date {
      color: var(--gray-500);
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }
`;
  // Insert before the first closing </style>
  html = html.replace('</style>', cssInsert + '  </style>');
}

fs.writeFileSync('letters.html', html);
console.log('Done! letters.html updated with proper letter formatting.');
