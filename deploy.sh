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
  # Archival masters for the linocut/stipple marks — full-res sources kept in
  # git for future re-exports. The site only ever loads the web-sized copies
  # at the repo root, so these must never ship.
  "--exclude" "assets-mono/*"
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

# ── HTML — cached at the edge, freshness guaranteed by the invalidation below ─
#    This was 'no-store', which meant every page view and every navigation went
#    back to the origin in Virginia — CloudFront reported a miss every time. The
#    header was there so deploys appeared instantly, but that is already
#    guaranteed by the CloudFront invalidation at the end of this script, so
#    'no-store' was buying nothing and costing a trans-Atlantic round trip on
#    every request.
#    s-maxage lets CloudFront hold the page for a day (cleared on each deploy),
#    while the short max-age caps how long an already-loaded browser can hold a
#    stale copy after a deploy.
#    NOTE: cp, not sync. sync only transfers files whose *content* changed, so
#    a header-only change is silently skipped and the old Cache-Control stays
#    on the object forever. HTML here is a few hundred KB, so copying it every
#    deploy costs nothing and guarantees the headers are actually applied.
echo "  → HTML (edge-cached, invalidated on deploy)..."
aws s3 cp . "$S3_BUCKET" --recursive \
  --exclude "*" --include "*.html" \
  "${EXCLUDE_DIRS[@]}" \
  --content-type "text/html; charset=utf-8" \
  --cache-control "public, max-age=300, s-maxage=86400, stale-while-revalidate=86400" \
  --no-progress

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
