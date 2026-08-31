#!/bin/bash
set -e

# ── Config ────────────────────────────────────────────────────────────────────
S3_BUCKET="s3://dearosagyefo.com"
DIST_ID="E58CG4PIUEE3V"
EC2_HOST="54.226.117.39"
EC2_USER="ec2-user"
EC2_KEY="$HOME/.ssh/dearosagyefo-key.pem"
EC2_APP="/home/ec2-user/app"
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "══════════════════════════════════════"
echo "  Dear Osagyefo — Full Deploy"
echo "══════════════════════════════════════"

# ── 1. Frontend → S3 ─────────────────────────────────────────────────────────
echo ""
echo "▶ [1/3] Syncing frontend to S3..."
# No --delete: this bucket also holds runtime-generated assets (Polly TTS
# output under audio/letter-*.mp3) that exist ONLY in S3, with no local
# source file to sync from. --delete here previously wiped all of them.
aws s3 sync . "$S3_BUCKET" \
  --exclude ".git/*" \
  --exclude "node_modules/*" \
  --exclude "backend/*" \
  --exclude "data/*" \
  --exclude "kokoro_env/*" \
  --exclude "tts-env/*" \
  --exclude "AKD/*" \
  --exclude "Folder-tts/*" \
  --exclude "audio/voice-test/*" \
  --exclude "*.sh" \
  --exclude "*.md" \
  --exclude "*.py" \
  --exclude "*.js" \
  --exclude "*.json" \
  --exclude "*.txt" \
  --exclude "*.log" \
  --exclude "*.sql" \
  --exclude "*.db" \
  --exclude "*.sqlite*" \
  --exclude "*.pem" \
  --exclude "*.key" \
  --exclude "*.bat" \
  --exclude "*.ps1" \
  --exclude ".DS_Store" \
  --exclude "*/.DS_Store" \
  --exclude ".env*" \
  --exclude "Dockerfile" \
  --exclude "docker-compose.yml" \
  --exclude "netlify.toml" \
  --exclude "amplify.yml" \
  --exclude "package-lock.json" \
  --exclude "temp-deploy/*" \
  --include "magic.js" \
  --include "manifest.json" \
  --include "api-config.js" \
  --include "service-worker.js"
echo "   ✓ Frontend uploaded"

# ── 2. Backend → EC2 ─────────────────────────────────────────────────────────
echo ""
echo "▶ [2/3] Deploying backend to EC2..."
scp -i "$EC2_KEY" -o StrictHostKeyChecking=no -r \
  backend \
  server.js \
  "$EC2_USER@$EC2_HOST:$EC2_APP/"
echo "   ✓ Backend files copied"

ssh -i "$EC2_KEY" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" \
  "cd $EC2_APP && npm install --omit=dev --silent && pm2 restart all --update-env && pm2 status"
echo "   ✓ Dependencies installed and PM2 restarted"

# ── 3. Invalidate CloudFront ──────────────────────────────────────────────────
echo ""
echo "▶ [3/3] Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id "$DIST_ID" \
  --paths "/*" \
  --query 'Invalidation.{Id:Id,Status:Status}' \
  --output table
echo "   ✓ Cache invalidation queued (live in ~1-2 min)"

echo ""
echo "══════════════════════════════════════"
echo "  ✅ Full deploy complete"
echo "══════════════════════════════════════"
echo ""
