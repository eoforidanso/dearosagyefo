#!/usr/bin/env python3
"""Generate high-quality MP3 audio files for all 10 letters using Google TTS."""
import re, os
from gtts import gTTS

HTML_FILE = 'letters.html'
OUTPUT_DIR = 'audio/letters'
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Read HTML
with open(HTML_FILE, 'r') as f:
    html = f.read()

# Extract text from each modal (modal1 through modal10)
for i in range(1, 11):
    pattern = rf'id="modal{i}".*?<div class="modal-body">(.*?)</div>\s*<div class="modal-footer"'
    match = re.search(pattern, html, re.DOTALL)
    if not match:
        print(f"Letter {i}: Could not find modal content, trying alternate pattern...")
        # Try alternate pattern
        pattern2 = rf'id="modal{i}".*?class="modal-body">(.*?)</div>'
        match = re.search(pattern2, html, re.DOTALL)
    
    if match:
        body = match.group(1)
        # Strip HTML tags
        text = re.sub(r'<[^>]+>', ' ', body)
        # Clean whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        if len(text) < 20:
            print(f"Letter {i}: Text too short ({len(text)} chars), skipping")
            continue
            
        print(f"Letter {i}: {len(text)} chars — generating audio...")
        
        # Generate with Google TTS — en-uk accent sounds authoritative and clear
        tts = gTTS(text=text, lang='en', tld='co.uk', slow=False)
        output_path = os.path.join(OUTPUT_DIR, f'letter-{i}.mp3')
        tts.save(output_path)
        
        size_kb = os.path.getsize(output_path) / 1024
        print(f"  → Saved {output_path} ({size_kb:.0f} KB)")
    else:
        print(f"Letter {i}: NOT FOUND in HTML")

print("\nDone! All audio files in:", OUTPUT_DIR)
