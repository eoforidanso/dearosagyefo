#!/usr/bin/env python3
"""Quick test — generate a sample from several deep male VCTK speakers so we can pick the best voice."""
from TTS.api import TTS
import os, subprocess
from pathlib import Path

OUT = Path("audio/voice-test")
OUT.mkdir(parents=True, exist_ok=True)

# A short passage from the first letter for testing
SAMPLE = (
    "Dear Osagyefo, it is with reverence and urgency that I write to you across the decades. "
    "Ghana stands at a crossroads, as she always has. The dream you articulated so brilliantly "
    "in nineteen fifty-seven echoes still in our streets, our markets, our parliament."
)

# Deep male speakers in VCTK dataset
SPEAKERS = [
    ("p226", "British Male"),
    ("p227", "American Male"),
    ("p232", "Deep Male"),
    ("p241", "American Male 2"),
    ("p243", "Deep British"),
    ("p245", "British Male 2"),
    ("p259", "Deep Authoritative"),
    ("p260", "Male Low"),
    ("p270", "Measured Male"),
    ("p271", "British Formal"),
    ("p273", "Deep Male 3"),
    ("p274", "American Formal"),
    ("p276", "Deep Male 4"),
    ("p284", "Authoritative"),
    ("p285", "Commanding"),
    ("p286", "Deep Low"),
    ("p287", "Gravelly"),
    ("p292", "Distinguished"),
    ("p298", "Radio Voice"),
    ("p302", "News Reader"),
    ("p304", "Professional"),
    ("p305", "Formal Male"),
    ("p307", "Deep Calm"),
    ("p311", "Baritone"),
    ("p316", "Documentary"),
    ("p326", "Narrator"),
    ("p334", "Senior Male"),
    ("p339", "Formal Mature"),
    ("p347", "Measured Tone"),
    ("p360", "Wise Voice"),
    ("p363", "Distinguished 2"),
    ("p374", "Elder Male"),
]

print("Loading VCTK VITS model...")
tts = TTS("tts_models/en/vctk/vits", progress_bar=True)

print(f"\nGenerating voice samples for {len(SPEAKERS)} speakers...")
for spk_id, label in SPEAKERS:
    wav_path = str(OUT / f"{spk_id}-{label.replace(' ','_')}.wav")
    try:
        tts.tts_to_file(text=SAMPLE, speaker=spk_id, file_path=wav_path)
        size = os.path.getsize(wav_path) / 1024
        print(f"  ✅ {spk_id} ({label}): {size:.0f} KB → {wav_path}")
    except Exception as e:
        print(f"  ❌ {spk_id}: {e}")

print(f"\nDone. Listen to files in: {OUT.absolute()}")
print("Pick your favourite speaker ID, then update SPEAKER in generate-coqui-audio.py")
