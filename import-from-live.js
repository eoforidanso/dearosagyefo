const https = require('https');
const http = require('http');
const fs = require('fs');

const LIVE_URL = 'https://www.ato-kwamena.com';

console.log('🌐 Fetching letters from live site...\n');

// Function to fetch from API
async function fetchFromAPI(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `${LIVE_URL}${endpoint}`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Try to fetch letters from various possible endpoints
async function importLetters() {
  console.log('Attempting to fetch from live API...\n');
  
  try {
    // Try common API endpoints
    const endpoints = [
      '/api/letters',
      '/api/public-letters',
      '/api/public/letters',
      '/letters'
    ];
    
    for (const endpoint of endpoints) {
      console.log(`🔍 Trying: ${LIVE_URL}${endpoint}`);
      try {
        const data = await fetchFromAPI(endpoint);
        console.log('✅ Success!');
        console.log('Data received:', JSON.stringify(data, null, 2).substring(0, 500));
        
        // Save to file
        fs.writeFileSync('live-letters-import.json', JSON.stringify(data, null, 2));
        console.log('\n📁 Saved to: live-letters-import.json\n');
        return data;
      } catch (err) {
        console.log(`❌ Failed: ${err.message}`);
      }
    }
    
    console.log('\n⚠️  Could not fetch from API endpoints.');
    console.log('Please provide:');
    console.log('  1. Your hosting platform credentials (cPanel, FTP, etc.)');
    console.log('  2. Database access details');
    console.log('  3. Or direct database file from your host\n');
    
  } catch (err) {
    console.error('Error:', err);
  }
}

importLetters();
