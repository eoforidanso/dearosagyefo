#! /bin/bash
# 1. Sync your local files to S3
echo "📤 Uploading to S3..."
aws s3 sync . s3://dearosagyefo.com --delete --exclude "kokoro_env/*" --exclude "*.py" --exclude ".git/*"

# 2. Tell CloudFront to show the new content immediately
echo "🧹 Clearing CloudFront cache..."
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"

echo "--- 🚀 EVERYTHING IS LIVE! ---"
