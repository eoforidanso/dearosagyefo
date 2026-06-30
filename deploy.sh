#!/bin/bash

# Deploy dearosagyefo.com to S3 and invalidate CloudFront
S3_BUCKET="s3://dearosagyefo.com"
DIST_ID="E58CG4PIUEE3V"

echo "🚀 Deploying to S3..."

# HTML pages
aws s3 sync . "$S3_BUCKET" \
  --exclude "*" \
  --include "*.html" \
  --include "*.css" \
  --include "*.png" \
  --include "*.jpg" \
  --include "*.jpeg" \
  --include "*.gif" \
  --include "*.svg" \
  --include "*.ico" \
  --include "*.webp" \
  --include "*.mp3" \
  --include "*.wav" \
  --include "*.pdf" \
  --include "sitemap.xml" \
  --include "robots.txt" \
  --include "manifest.json" \
  --exclude "node_modules/*" \
  --exclude "tts-env/*" \
  --exclude "backend/*" \
  --exclude "AKD/*" \
  --exclude "data/*" \
  --exclude "logs/*" \
  --exclude "downloaded-audio/*" \
  --exclude "Folder-tts/*" \
  --exclude "letters_to_process/*" \
  --exclude "go/*" \
  --exclude "*-backup*" \
  --exclude "*-old*"

# Frontend JS — named explicitly to avoid uploading server-side scripts
for f in api-config.js magic.js magic.v2.js metadata-utils.js; do
  [ -f "$f" ] && aws s3 cp "$f" "$S3_BUCKET/$f" \
    --content-type "application/javascript" \
    --cache-control "max-age=31536000, immutable"
done

# Service worker — MUST be no-cache so browsers always get the latest version
[ -f "service-worker.js" ] && aws s3 cp service-worker.js "$S3_BUCKET/service-worker.js" \
  --content-type "application/javascript" \
  --cache-control "no-cache, no-store, must-revalidate"

# manifest.json — short TTL so icon/theme changes roll out quickly
aws s3 cp manifest.json "$S3_BUCKET/manifest.json" \
  --content-type "application/manifest+json" \
  --cache-control "max-age=60"

echo "☁️ Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/*"

echo "--- ✅ Deployed and Cache Cleared ---"
