#!/bin/bash

# Update domain references from ato-kwamena.com to dearosagyefo.com
# This script updates all HTML files except those in excluded directories

echo "🔄 Updating domain references to dearosagyefo.com..."

# Find and replace in HTML files, excluding specific directories
find . -name "*.html" \
  -not -path "./tts-env/*" \
  -not -path "./AKD/*" \
  -not -path "./node_modules/*" \
  -exec sed -i '' 's/ato-kwamena\.com/dearosagyefo.com/g' {} \;

echo "✅ Domain update complete!"
echo "🌐 All references now point to dearosagyefo.com"

# Count remaining references (should be 0)
remaining=$(find . -name "*.html" -not -path "./tts-env/*" -not -path "./AKD/*" -exec grep -l "ato-kwamena.com" {} \; | wc -l)

if [ $remaining -eq 0 ]; then
    echo "✅ No remaining old domain references found"
else
    echo "⚠️  Found $remaining files with remaining references"
    find . -name "*.html" -not -path "./tts-env/*" -not -path "./AKD/*" -exec grep -l "ato-kwamena.com" {} \;
fi
