#!/usr/bin/env python3
"""
Generate all 10 letter MP3s using macOS 'say' command (Daniel, British English).
Fast — each letter takes seconds, not minutes.
"""
import os, re, sys, subprocess
from pathlib import Path

VOICE = "Daniel"   # British English — dignified, warm
RATE  = 175        # words per minute (default 200 is a touch fast)

OUT_DIR = Path("audio/letters")
OUT_DIR.mkdir(parents=True, exist_ok=True)

# ── Extract letter texts from the static modal bodies in letters.html ──────
def extract_texts():
    html = Path("letters.html").read_text(encoding="utf-8")
    texts = {}
    blocks = re.split(r'(?=<div class="modal-overlay")', html)
    for block in blocks:
        m = re.search(r'id="modal(\d+)"', block)
        if not m:
            continue
        num = int(m.group(1))
        body = re.search(r'<div class="modal-body"[^>]*>(.*?)</div>\s*</div>\s*</div>\s*</div>', block, re.DOTALL)
        if not body:
            continue
        raw = body.group(1)
        text = re.sub(r'<[^>]+>', ' ', raw)
        text = re.sub(r'&ldquo;|&rdquo;|&lsquo;|&rsquo;|&mdash;|&ndash;|&amp;|&nbsp;', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        text = re.sub(r'^By\s+.{0,60}?\d{4}\s*', '', text).strip()
        if len(text) > 80:
            texts[num] = text
    return texts

print("📖 Extracting letter texts...")
texts = extract_texts()
if not texts:
    print("❌ No texts found — check letters.html")
    sys.exit(1)
for n in sorted(texts):
    print(f"  Letter {n}: {len(texts[n])} chars")

# ── Generate each letter using macOS 'say' ───────────────────────────────────
print(f"\n🎙️  Generating with voice: {VOICE} at {RATE} wpm\n")

for num in sorted(texts):
    text = texts[num]
    # Strip UI fragments that leaked into text
    text = re.sub(r'[▶►]\s*Listen.*$', '', text, flags=re.IGNORECASE).strip()
    text = re.sub(r'Share this letter.*$', '', text, flags=re.IGNORECASE).strip()

    aiff_path = str(OUT_DIR / f"letter-{num}.aiff")
    mp3_path  = str(OUT_DIR / f"letter-{num}.m4a")

    print(f"📝 Letter {num} ({len(text.split())} words)...", end=" ", flush=True)
    try:
        # say → AIFF (lossless, native macOS)
        subprocess.run(
            ["say", "-v", VOICE, "-r", str(RATE), "-o", aiff_path, text],
            check=True, capture_output=True
        )
        # AIFF → AAC M4A via afconvert
        r = subprocess.run(
            ["afconvert", "-f", "mp4f", "-d", "aac", aiff_path, mp3_path],
            capture_output=True
        )
        if r.returncode == 0:
            os.remove(aiff_path)
            size = os.path.getsize(mp3_path) / 1024
            print(f"✅  letter-{num}.m4a ({size:.0f} KB)")
        else:
            print(f"⚠️  afconvert failed: {r.stderr.decode()}")
    except Exception as e:
        print(f"❌  {e}")

print("\n🎉 Done! Upload with:")
print("  aws s3 sync audio/letters/ s3://dearosagyefo.com/audio/letters/ --content-type audio/mp4")
print("  aws cloudfront create-invalidation --distribution-id E58CG4PIUEE3V --paths '/audio/letters/*'")
