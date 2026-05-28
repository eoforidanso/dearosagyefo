#!/usr/bin/env node
/**
 * Import PDF Letters to Backend Database
 * This script imports the extracted PDF letters into the backend database
 * so they can be managed through the admin portal.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./backend/config/database');

// Read the extracted letters
const extractedLetters = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'extracted-letters.json'), 'utf8')
);

// Admin user ID (you'll need to update this after creating an admin user)
const ADMIN_USER_ID = 1; // Default admin user ID

// Letter metadata mapping
const letterMetadata = {
  'THE PERSISTENT CHALLENGE OF SMALL-SCALE MINING': {
    category: 'Politics',
    date: 'March 2025',
    author: 'Ato_KD',
    authorTitle: 'Concerned Citizen',
    summary: 'Despite deploying a "heart surgeon" to the forest, the galamsey menace worsens. Dr. Bissiw ventures Rambo-style with her own gear and a cameraman...',
    tags: 'galamsey, mining, environment, politics'
  },
  'A NATIONS DRS DRAMAS AND DELUSIONS': {
    category: 'Politics',
    date: 'January 2026',
    author: 'Ato_KD',
    authorTitle: 'Political Observer',
    summary: 'Ghana qualified for the World Cup, but FIFA priced tickets like seats on a shuttle to Jupiter. Meanwhile, Venezuela\'s Maduro drama and Dr. Amoah\'s mysterious economic model...',
    tags: 'world cup, politics, satire, economics'
  },
  'Dear Osagyefo,': {
    category: 'Health',
    date: 'February 2025',
    author: 'Ato_KD',
    authorTitle: 'Health Professional',
    summary: 'Testing local beverages revealed a shocking cocktail of controlled substances. Herb Afrik contained benzodiazepine, PCP, and MDMA. What is the FDA doing?',
    tags: 'health, toxicology, FDA, public safety'
  },
  'Letter XX': {
    category: 'Politics',
    date: 'December 2024',
    author: 'Ato_KD',
    authorTitle: 'UN Observer',
    summary: 'President Mahama\'s UN address demanded Security Council reform. But beautiful speeches earn standing ovations while our water bodies are destroyed...',
    tags: 'UN, politics, speeches, galamsey'
  },
  'ANKWANOMA OSP: THE SINGING PROSECUTOR AND THE BAILED-OUT LAWYER': {
    category: 'Satire',
    date: 'March 2025',
    author: 'Ato_KD',
    authorTitle: 'Legal Satirist',
    summary: 'Martin Kpebu, once a champion of the downtrodden, now faces the same bail conditions he ridiculed. Meanwhile, the Special Prosecutor quotes Daddy Lumba on TV...',
    tags: 'law, satire, OSP, politics'
  }
};

// Function to format the letter content for database
function formatLetterContent(text, metadata) {
  // Remove the title and category from the beginning
  let content = text;
  
  // Try to extract just the letter body
  const dearOsagyefoIndex = content.indexOf('Dear Osagyefo');
  if (dearOsagyefoIndex !== -1) {
    content = content.substring(dearOsagyefoIndex);
  }
  
  // Remove signature at the end
  content = content.replace(/Talk is cheap,?\s*Ato_?[Kk][Dd]$/i, '');
  content = content.replace(/So long,?\s*Ato_?[Kk][Dd]$/i, '');
  content = content.replace(/Alarmed,?\s*Ato_?[Kk][Dd]$/i, '');
  
  // Format as HTML paragraphs
  const paragraphs = content.split(/\n+/).filter(p => p.trim().length > 0);
  const htmlContent = paragraphs.map(p => `<p>${p.trim()}</p>`).join('\n');
  
  return htmlContent;
}

// Import letters function
async function importLetters() {
  console.log('📝 Starting PDF letter import...\n');
  
  let imported = 0;
  let skipped = 0;
  
  for (const letter of extractedLetters) {
    const metadata = letterMetadata[letter.title] || {
      category: 'General',
      date: 'March 2025',
      author: 'Ato_KD',
      authorTitle: 'Contributor',
      summary: letter.text.substring(0, 150) + '...',
      tags: 'imported'
    };
    
    // Format the content
    const formattedContent = formatLetterContent(letter.text, metadata);
    
    // Clean up the title
    const cleanTitle = letter.title
      .replace(/^(THE|A)\s+/i, '')
      .replace(/POLITICS$/, '')
      .trim();
    
    try {
      // Check if letter already exists
      const existing = await new Promise((resolve, reject) => {
        db.get(
          `SELECT id FROM letters WHERE subject = ?`,
          [cleanTitle],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });
      
      if (existing) {
        console.log(`⏭️  Skipped (already exists): ${cleanTitle}`);
        skipped++;
        continue;
      }
      
      // Insert the letter
      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO letters (userId, recipientName, recipientEmail, subject, content, category, tags, summary, status, createdAt, publishedToSite)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            ADMIN_USER_ID,
            'Osagyefo',
            '',
            cleanTitle,
            formattedContent,
            metadata.category,
            metadata.tags,
            metadata.summary,
            'published', // Mark as published
            new Date().toISOString(),
            1 // Mark as published to site
          ],
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          }
        );
      });
      
      console.log(`✅ Imported: ${cleanTitle}`);
      console.log(`   Category: ${metadata.category}`);
      console.log(`   Author: ${metadata.author} (${metadata.authorTitle})`);
      console.log(`   Tags: ${metadata.tags}\n`);
      imported++;
      
    } catch (error) {
      console.error(`❌ Error importing "${cleanTitle}":`, error.message);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`✨ Import complete!`);
  console.log(`   Imported: ${imported} letters`);
  console.log(`   Skipped: ${skipped} letters`);
  console.log('='.repeat(60) + '\n');
}

// Run the import
importLetters()
  .then(() => {
    console.log('👍 All done! The letters are now available in the backend.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
