#!/bin/bash

echo "🚀 Deploying Dear Osagyefo to AWS S3..."

# Configuration
BUCKET_NAME="dearosagyefo.com"
REGION="us-east-1"  # Change if needed

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

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
cp *.js $DEPLOY_DIR/ 2>/dev/null || true
cp *.json $DEPLOY_DIR/ 2>/dev/null || true
cp *.txt $DEPLOY_DIR/ 2>/dev/null || true
cp *.xml $DEPLOY_DIR/ 2>/dev/null || true
cp *.png $DEPLOY_DIR/ 2>/dev/null || true
cp *.jpg $DEPLOY_DIR/ 2>/dev/null || true
cp *.svg $DEPLOY_DIR/ 2>/dev/null || true
cp *.pdf $DEPLOY_DIR/ 2>/dev/null || true

# Copy audio directory if exists
if [ -d "audio" ]; then
    cp -r audio $DEPLOY_DIR/
fi

# Remove files that shouldn't be deployed
rm -f $DEPLOY_DIR/package*.json
rm -f $DEPLOY_DIR/server.js
rm -f $DEPLOY_DIR/amplify.json
rm -f $DEPLOY_DIR/netlify.toml
rm -f $DEPLOY_DIR/s3-*.json

echo -e "${BLUE}🪣 Creating S3 bucket: $BUCKET_NAME${NC}"

# Create bucket (ignore error if it already exists)
aws s3 mb s3://$BUCKET_NAME --region $REGION 2>/dev/null || echo "Bucket may already exist"

echo -e "${BLUE}⚙️ Configuring bucket for website hosting...${NC}"

# Configure bucket for static website hosting
aws s3 website s3://$BUCKET_NAME \
    --index-document index.html \
    --error-document 404.html

# Apply bucket policy for public access
aws s3api put-bucket-policy \
    --bucket $BUCKET_NAME \
    --policy file://s3-bucket-policy.json

echo -e "${BLUE}📤 Uploading files to S3...${NC}"

# Upload files with proper content types
aws s3 sync $DEPLOY_DIR s3://$BUCKET_NAME \
    --delete \
    --cache-control "max-age=3600" \
    --metadata-directive REPLACE

# Set specific content types for key files
aws s3 cp $DEPLOY_DIR/index.html s3://$BUCKET_NAME/index.html \
    --content-type "text/html; charset=utf-8" \
    --cache-control "max-age=300"

# Upload audio files with proper content type if they exist
if [ -d "$DEPLOY_DIR/audio" ]; then
    aws s3 sync $DEPLOY_DIR/audio s3://$BUCKET_NAME/audio \
        --content-type "audio/mpeg" \
        --cache-control "max-age=86400"
fi

# Clean up temporary directory
rm -rf $DEPLOY_DIR

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo -e "${GREEN}🌐 Your website is now live at:${NC}"
echo -e "   http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"
echo -e "${BLUE}📝 Next steps:${NC}"
echo "   1. Configure your domain name to point to this URL"
echo "   2. Set up CloudFront for HTTPS and better performance"
echo "   3. Deploy your backend API separately"

# Show bucket info
echo -e "${BLUE}📊 Bucket information:${NC}"
aws s3 ls s3://$BUCKET_NAME --human-readable --summarize
