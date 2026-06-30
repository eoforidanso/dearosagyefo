#!/bin/bash
set -e

# Deploy dearosagyefo.com to S3 and invalidate CloudFront
S3_BUCKET="s3://dearosagyefo.com"
DIST_ID="E58CG4PIUEE3V"

EXCLUDE_DIRS=(
  "--exclude" "node_modules/*"
  "--exclude" "tts-env/*"
  "--exclude" "backend/*"
  "--exclude" "AKD/*"
  "--exclude" "data/*"
  "--exclude" "logs/*"
  "--exclude" "downloaded-audio/*"
  "--exclude" "Folder-tts/*"
  "--exclude" "letters_to_process/*"
  "--exclude" "go/*"
  "--exclude" "*-backup*"
  "--exclude" "*-old*"
  "--exclude" "temp-deploy/*"
  "--exclude" "*.sh"
  "--exclude" "*.md"
  "--exclude" "*.log"
  "--exclude" "*.sql"
  "--exclude" "*.py"
  "--exclude" "*.txt.bak"
  "--exclude" "package*.json"
  "--exclude" "ecosystem.config.js"
  "--exclude" "Dockerfile"
  "--exclude" "docker-compose.yml"
)

echo "🚀 Deploying to S3..."

# ── HTML — no-cache so updates are always live immediately ───────────────────
echo "  → HTML (no-cache)..."
aws s3 sync . "$S3_BUCKET" \
  --exclude "*" --include "*.html" \
  "${EXCLUDE_DIRS[@]}" \
  --content-type "text/html; charset=utf-8" \
  --cache-control "no-cache, no-store, must-revalidate" \
  --metadata-directive REPLACE

# ── CSS — 1 day (filenames aren't hashed, so keep TTL short) ────────────────
echo "  → CSS (1 day)..."
aws s3 sync . "$S3_BUCKET" \
  --exclude "*" --include "*.css" \
  "${EXCLUDE_DIRS[@]}" \
  --content-type "text/css" \
  --cache-control "max-age=86400" \
  --metadata-directive REPLACE

# ── Images — 1 week ──────────────────────────────────────────────────────────
echo "  → Images (1 week)..."
for ext in png jpg jpeg gif svg ico webp; do
  aws s3 sync . "$S3_BUCKET" \
    --exclude "*" --include "*.$ext" \
    "${EXCLUDE_DIRS[@]}" \
    --cache-control "max-age=604800" \
    --metadata-directive REPLACE
done

# ── Audio — 1 week ───────────────────────────────────────────────────────────
echo "  → Audio (1 week)..."
aws s3 sync . "$S3_BUCKET" \
  --exclude "*" --include "*.mp3" --include "*.wav" \
  "${EXCLUDE_DIRS[@]}" \
  --cache-control "max-age=604800" \
  --metadata-directive REPLACE

# ── PDFs — 1 day ─────────────────────────────────────────────────────────────
echo "  → PDFs (1 day)..."
aws s3 sync . "$S3_BUCKET" \
  --exclude "*" --include "*.pdf" \
  "${EXCLUDE_DIRS[@]}" \
  --cache-control "max-age=86400" \
  --metadata-directive REPLACE

# ── SEO files — 1 hour ───────────────────────────────────────────────────────
echo "  → SEO files (1 hour)..."
aws s3 cp sitemap.xml "$S3_BUCKET/sitemap.xml" \
  --content-type "application/xml" \
  --cache-control "max-age=3600"
aws s3 cp robots.txt "$S3_BUCKET/robots.txt" \
  --content-type "text/plain" \
  --cache-control "max-age=3600"

# ── Service worker — NEVER cached ────────────────────────────────────────────
echo "  → service-worker.js (no-cache)..."
[ -f "service-worker.js" ] && aws s3 cp service-worker.js "$S3_BUCKET/service-worker.js" \
  --content-type "application/javascript" \
  --cache-control "no-cache, no-store, must-revalidate"

# ── Manifest — 1 minute so theme/icon changes propagate fast ─────────────────
echo "  → manifest.json (1 min)..."
aws s3 cp manifest.json "$S3_BUCKET/manifest.json" \
  --content-type "application/manifest+json" \
  --cache-control "max-age=60"

# ── Frontend JS — 1 day (not hashed, so can't go immutable) ──────────────────
echo "  → Frontend JS (1 day)..."
for f in api-config.js magic.js magic.v2.js metadata-utils.js; do
  [ -f "$f" ] && aws s3 cp "$f" "$S3_BUCKET/$f" \
    --content-type "application/javascript" \
    --cache-control "max-age=86400"
done

# ── CloudFront invalidation ───────────────────────────────────────────────────
echo "☁️  Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/*"

echo "✅ Done — dearosagyefo.com is live."
