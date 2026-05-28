#!/bin/bash

# Update API URLs for Production Deployment
# This script updates all localhost API URLs to production EC2 endpoint

echo "🔧 Updating API URLs for production deployment..."

# Check if EC2 URL is provided
if [ -z "$1" ]; then
    echo "❌ Error: Please provide your EC2 API URL"
    echo "Usage: ./update-api-urls.sh http://YOUR_EC2_IP"
    echo "   or: ./update-api-urls.sh http://api.yourdomain.com"
    exit 1
fi

EC2_API_URL="$1"
TEMP_DIR="temp-deploy"

echo "📍 EC2 API URL: $EC2_API_URL"

# Create temp directory
rm -rf $TEMP_DIR
mkdir -p $TEMP_DIR

# Copy all HTML files to temp directory
echo "📋 Copying files..."
cp *.html $TEMP_DIR/ 2>/dev/null || true
cp *.css $TEMP_DIR/ 2>/dev/null || true
cp *.js $TEMP_DIR/ 2>/dev/null || true

# Update API URLs in HTML files
echo "🔄 Updating API endpoints..."

for file in $TEMP_DIR/*.html; do
    if [ -f "$file" ]; then
        # Replace localhost:3000 with EC2 URL
        sed -i.bak "s|http://localhost:3000|$EC2_API_URL|g" "$file"
        
        # Also handle https localhost for safety
        sed -i.bak "s|https://localhost:3000|$EC2_API_URL|g" "$file"
        
        # Clean up backup files
        rm -f "${file}.bak"
        
        echo "   ✓ Updated $(basename $file)"
    fi
done

echo ""
echo "✅ API URLs updated successfully!"
echo "📁 Updated files are in: $TEMP_DIR/"
echo ""
echo "Next steps:"
echo "1. Review the updated files in $TEMP_DIR/"
echo "2. If everything looks good, run: ./deploy-s3.sh"
echo ""
echo "Note: The deploy-s3.sh script will use files from the main directory,"
echo "      so you may want to copy the updated files back:"
echo "      cp $TEMP_DIR/*.html ."
