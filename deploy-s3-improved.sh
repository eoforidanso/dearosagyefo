#!/bin/bash

echo "🚀 Deploying Dear Osagyefo to AWS S3..."

# Configuration
BUCKET_NAME="dearosagyefo.com"
REGION="us-east-1"  # Change if needed

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Prompt for EC2 API URL
echo ""
echo -e "${YELLOW}🔗 What is your EC2 backend API URL?${NC}"
echo "Examples:"
echo "  - http://YOUR_EC2_PUBLIC_IP"
echo "  - http://api.yourdomain.com"
echo "  - Skip (press Enter) to use localhost:3000"
echo ""
read -p "Enter EC2 API URL: " EC2_API_URL

if [ -z "$EC2_API_URL" ]; then
    EC2_API_URL="http://localhost:3000"
    echo -e "${YELLOW}⚠️  Using localhost:3000 - this won't work in production!${NC}"
else
    echo -e "${GREEN}✓ Using API URL: $EC2_API_URL${NC}"
fi

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not installed. Please install it first:${NC}"
    echo "   brew install awscli"
    echo "   OR download from: https://aws.amazon.com/cli/"
    exit 1
fi

# Check if AWS is configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}❌ AWS CLI is not configured. Please run:${NC}"
    echo "   aws configure"
    exit 1
fi

echo -e "${BLUE}📦 Preparing files for deployment...${NC}"

# Create a temporary deployment directory
DEPLOY_DIR="temp-deploy"
rm -rf $DEPLOY_DIR
mkdir -p $DEPLOY_DIR

# Copy static files (excluding backend and unnecessary files)
cp *.html $DEPLOY_DIR/ 2>/dev/null || true
cp *.css $DEPLOY_DIR/ 2>/dev/null || true
cp *.png $DEPLOY_DIR/ 2>/dev/null || true
cp *.jpg $DEPLOY_DIR/ 2>/dev/null || true
cp *.svg $DEPLOY_DIR/ 2>/dev/null || true
cp *.pdf $DEPLOY_DIR/ 2>/dev/null || true

# Copy magic.js explicitly (important for frontend functionality)
cp magic.js $DEPLOY_DIR/ 2>/dev/null || true
cp thumbnail.png $DEPLOY_DIR/ 2>/dev/null || true

# Copy audio directory if exists
if [ -d "audio" ]; then
    cp -r audio $DEPLOY_DIR/
fi

# Update API URLs in HTML files
echo -e "${BLUE}🔄 Updating API endpoints to: $EC2_API_URL${NC}"

for file in $DEPLOY_DIR/*.html; do
    if [ -f "$file" ]; then
        # Replace localhost:3000 with EC2 URL (both http and https)
        sed -i.bak "s|http://localhost:3000|$EC2_API_URL|g" "$file"
        sed -i.bak "s|https://localhost:3000|$EC2_API_URL|g" "$file"
        rm -f "${file}.bak"
    fi
done

# Also update magic.js if it contains API URLs
if [ -f "$DEPLOY_DIR/magic.js" ]; then
    sed -i.bak "s|http://localhost:3000|$EC2_API_URL|g" "$DEPLOY_DIR/magic.js"
    sed -i.bak "s|https://localhost:3000|$EC2_API_URL|g" "$DEPLOY_DIR/magic.js"
    rm -f "$DEPLOY_DIR/magic.js.bak"
fi

echo -e "${BLUE}🪣 Creating S3 bucket: $BUCKET_NAME${NC}"

# Create bucket (ignore error if it already exists)
aws s3 mb s3://$BUCKET_NAME --region $REGION 2>/dev/null || echo "Bucket may already exist"

# Disable Block Public Access
echo -e "${BLUE}🔓 Configuring public access...${NC}"
aws s3api put-public-access-block \
    --bucket $BUCKET_NAME \
    --public-access-block-configuration \
    "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false" 2>/dev/null || true

echo -e "${BLUE}⚙️  Configuring bucket for website hosting...${NC}"

# Configure bucket for static website hosting
aws s3 website s3://$BUCKET_NAME \
    --index-document index.html \
    --error-document index.html

# Apply bucket policy for public access
if [ -f "s3-bucket-policy.json" ]; then
    aws s3api put-bucket-policy \
        --bucket $BUCKET_NAME \
        --policy file://s3-bucket-policy.json
else
    echo -e "${YELLOW}⚠️  s3-bucket-policy.json not found, creating one...${NC}"
    cat > temp-bucket-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::$BUCKET_NAME/*"
    }
  ]
}
EOF
    aws s3api put-bucket-policy \
        --bucket $BUCKET_NAME \
        --policy file://temp-bucket-policy.json
    rm temp-bucket-policy.json
fi

echo -e "${BLUE}📤 Uploading files to S3...${NC}"

# Upload files with proper content types
aws s3 sync $DEPLOY_DIR s3://$BUCKET_NAME \
    --delete \
    --cache-control "max-age=3600" \
    --metadata-directive REPLACE

# Set specific content types and cache for HTML files
for html_file in $DEPLOY_DIR/*.html; do
    if [ -f "$html_file" ]; then
        filename=$(basename "$html_file")
        aws s3 cp "$html_file" s3://$BUCKET_NAME/$filename \
            --content-type "text/html; charset=utf-8" \
            --cache-control "max-age=300"
    fi
done

# Upload CSS files with proper content type
for css_file in $DEPLOY_DIR/*.css; do
    if [ -f "$css_file" ]; then
        filename=$(basename "$css_file")
        aws s3 cp "$css_file" s3://$BUCKET_NAME/$filename \
            --content-type "text/css; charset=utf-8" \
            --cache-control "max-age=86400"
    fi
done

# Upload JS files with proper content type
if [ -f "$DEPLOY_DIR/magic.js" ]; then
    aws s3 cp "$DEPLOY_DIR/magic.js" s3://$BUCKET_NAME/magic.js \
        --content-type "application/javascript; charset=utf-8" \
        --cache-control "max-age=86400"
fi

# Upload audio files with proper content type if they exist
if [ -d "$DEPLOY_DIR/audio" ]; then
    aws s3 sync $DEPLOY_DIR/audio s3://$BUCKET_NAME/audio \
        --content-type "audio/mpeg" \
        --cache-control "max-age=86400"
fi

# Upload images with proper caching
for img_ext in png jpg jpeg svg pdf; do
    for img_file in $DEPLOY_DIR/*.$img_ext; do
        if [ -f "$img_file" ]; then
            filename=$(basename "$img_file")
            aws s3 cp "$img_file" s3://$BUCKET_NAME/$filename \
                --cache-control "max-age=2592000"  # 30 days for images
        fi
    done
done

# Clean up temporary directory
rm -rf $DEPLOY_DIR

echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${GREEN}🌐 Your website is now live at:${NC}"
echo -e "   ${BLUE}http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com${NC}"
echo ""
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "   1. Test your site at the URL above"
echo "   2. Make sure your EC2 backend is running at: $EC2_API_URL"
echo "   3. Check CORS settings on EC2 to allow your S3 domain"
echo "   4. Set up CloudFront for HTTPS and better performance"
echo "   5. Configure custom domain (optional)"
echo ""
echo -e "${YELLOW}🔐 CORS Configuration Reminder:${NC}"
echo "   Update server.js on EC2 to include:"
echo "   app.use(cors({ origin: 'http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com' }));"
echo ""

# Show bucket info
echo -e "${BLUE}📊 Bucket information:${NC}"
aws s3 ls s3://$BUCKET_NAME --human-readable --summarize

echo ""
echo -e "${GREEN}🎉 Deployment successful!${NC}"
