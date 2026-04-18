const sharp = require('sharp');
const fs = require('fs');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1" gradientUnits="objectBoundingBox">
      <stop offset="0%" stop-color="#1a1f2e"/>
      <stop offset="50%" stop-color="#2d3b4a"/>
      <stop offset="100%" stop-color="#1f2a38"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0" gradientUnits="objectBoundingBox">
      <stop offset="0%" stop-color="#c9a227"/>
      <stop offset="50%" stop-color="#f5d06a"/>
      <stop offset="100%" stop-color="#c9a227"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>
  <!-- Ghana flag stripes top -->
  <rect x="0" y="0" width="400" height="12" fill="#D43F3A"/>
  <rect x="400" y="0" width="400" height="12" fill="#E8B923"/>
  <rect x="800" y="0" width="400" height="12" fill="#2D5F3F"/>
  <!-- Ghana flag stripes bottom -->
  <rect x="0" y="618" width="400" height="12" fill="#D43F3A"/>
  <rect x="400" y="618" width="400" height="12" fill="#E8B923"/>
  <rect x="800" y="618" width="400" height="12" fill="#2D5F3F"/>
  <!-- Left gold bar -->
  <rect x="60" y="60" width="5" height="510" fill="url(#gold)" rx="2"/>
  <!-- Card -->
  <rect x="100" y="80" width="700" height="470" rx="16" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" stroke-width="1"/>
  <!-- Overline -->
  <text x="140" y="150" font-family="Georgia,serif" font-size="13" letter-spacing="5" fill="#E8B923">OPEN LETTERS · GHANA · PAN-AFRICANISM</text>
  <rect x="140" y="162" width="250" height="2" fill="#E8B923" opacity="0.6"/>
  <!-- Headline -->
  <text x="140" y="245" font-family="Georgia,serif" font-size="64" font-weight="bold" fill="white">Dear Osagyefo,</text>
  <text x="140" y="320" font-family="Georgia,serif" font-size="64" font-weight="bold" fill="white">We Need to Talk.</text>
  <!-- Divider -->
  <line x1="140" y1="342" x2="620" y2="342" stroke="rgba(232,185,35,0.4)" stroke-width="1"/>
  <!-- Subtext -->
  <text x="140" y="380" font-family="Georgia,serif" font-size="19" font-style="italic" fill="rgba(255,255,255,0.6)">A living archive of open letters to Kwame Nkrumah</text>
  <text x="140" y="407" font-family="Georgia,serif" font-size="19" font-style="italic" fill="rgba(255,255,255,0.6)">written from the present to the past.</text>
  <!-- Attribution -->
  <text x="140" y="462" font-family="Georgia,serif" font-size="15" fill="rgba(255,255,255,0.4)" letter-spacing="1">By Dr. Ato Kwamena Danso</text>
  <!-- Black Star -->
  <polygon points="960,180 980,240 1042,240 993,276 1013,336 960,300 907,336 927,276 878,240 940,240" fill="#E8B923" opacity="0.9"/>
  <!-- Quote -->
  <text x="960" y="390" font-family="Georgia,serif" font-size="13" fill="rgba(232,185,35,0.65)" text-anchor="middle" font-style="italic">The independence of Ghana is</text>
  <text x="960" y="412" font-family="Georgia,serif" font-size="13" fill="rgba(232,185,35,0.65)" text-anchor="middle" font-style="italic">meaningless unless it is linked up</text>
  <text x="960" y="434" font-family="Georgia,serif" font-size="13" fill="rgba(232,185,35,0.65)" text-anchor="middle" font-style="italic">with the total liberation of Africa.</text>
  <text x="960" y="458" font-family="Georgia,serif" font-size="11" fill="rgba(232,185,35,0.4)" text-anchor="middle" letter-spacing="2">— KWAME NKRUMAH, 1957</text>
  <!-- URL badge -->
  <rect x="820" y="490" width="310" height="42" rx="21" fill="rgba(255,255,255,0.07)" stroke="rgba(232,185,35,0.35)" stroke-width="1"/>
  <text x="975" y="517" font-family="Georgia,serif" font-size="13" fill="rgba(255,255,255,0.6)" text-anchor="middle">letter-to-osagyefo.up.railway.app</text>
</svg>`;

fs.writeFileSync('./thumbnail.svg', svg);

sharp(Buffer.from(svg))
  .resize(1200, 630)
  .png({ quality: 100 })
  .toFile('./thumbnail.png', (err, info) => {
    if (err) { console.error(err); process.exit(1); }
    console.log('PNG created:', info.size, 'bytes');
  });
