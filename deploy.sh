#!/bin/bash

# Deploy dearosagyefo.com to S3 and invalidate CloudFront
S3_BUCKET="s3://dearosagyefo.com"
DIST_ID="E58CG4PIUEE3V"

echo "🚀 Deploying to S3..."

# Upload all site files
aws s3 sync . "$S3_BUCKET" \
  --exclude ".git/*" \
  --exclude "node_modules/*" \
  --exclude "data/*" \
  --exclude "kokoro_env/*" \
  --exclude "*.sh" \
  --exclude "*.md" \
  --exclude "*.py" \
  --exclude "*.js" \
  --exclude "*.json" \
  --exclude "*.txt" \
  --exclude "*.log" \
  --exclude "*.sql" \
  --exclude "Dockerfile" \
  --exclude "docker-compose.yml" \
  --exclude "package-lock.json" \
  --exclude ".env" \
  --exclude "temp-deploy/*" \
  --include "magic.js" \
  --include "manifest.json" \
  --include "api-config.js"

echo "☁️ Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/*"

echo "--- ✅ Deployed and Cache Cleared ---"
