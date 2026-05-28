# How to Add TTS Audio to New Letters

## Quick Steps

### 1. Generate the Audio File

Edit `generate_voice.py` with your letter text:

```python
# Line 19-20: Update the letter text
letter_text = """
[PASTE YOUR FULL LETTER TEXT HERE]
"""
```

Then run:
```bash
./finish.sh
```

This will:
- Generate the audio file using Kokoro TTS
- Upload it to S3 at `audio/final_letter.wav`
- Invalidate CloudFront cache

### 2. Add Audio/Share Buttons to the Modal

Copy this HTML block and paste it at the end of your letter modal's body, just before the closing `</div>` of `.modal`:

```html
<!-- Audio and Share Controls -->
<div class="modal-actions">
  <div class="modal-audio">
    <button class="audio-btn" onclick="playTTS(XX)" id="audio-btn-XX">
      <span id="audio-icon-XX">🔊</span>
      <span id="audio-text-XX">Listen</span>
    </button>
    <span class="audio-status" id="audio-status-XX">0:00</span>
  </div>
  <div class="modal-share">
    <div class="share-label">Share this letter:</div>
    <div class="share-buttons">
      <a href="#" class="share-btn facebook" onclick="shareOnFacebook(XX); return false;" title="Share on Facebook">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      </a>
      <a href="#" class="share-btn twitter" onclick="shareOnTwitter(XX); return false;" title="Share on X/Twitter">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      </a>
      <a href="#" class="share-btn whatsapp" onclick="shareOnWhatsApp(XX); return false;" title="Share on WhatsApp">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488"/>
        </svg>
      </a>
      <button class="share-btn copy" onclick="copyLetterLink(XX)" title="Copy Link">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
      </button>
    </div>
  </div>
</div>
```

**Important:** Replace all `XX` with your letter number (e.g., `28` for Letter XXVIII)

### 3. Add Letter Title to JavaScript

In `letters.html`, find the `letterTitles` array (around line 3068) and add your new letter title:

```javascript
const letterTitles = [
  "On the Matter of Dumsor and the Audacity of Darkness",
  "On Mobile Money and Accidental Socialism",
  // ... existing titles ...
  "Your New Letter Title Here"  // Add this
];
```

### 4. Deploy

Run:
```bash
./deploy.sh
```

## Example: Adding Letter 28

### Step 1: Edit `generate_voice.py`
```python
letter_text = """
Dear Osagyefo,

The streets of Accra are buzzing with news...

[Your full letter content]

Sincerely,
Ato_KD
"""
```

### Step 2: Generate & Upload Audio
```bash
./finish.sh
```

### Step 3: Add to `letters.html` Modal 28
```html
<div class="modal-overlay" id="modal28" onclick="closeModalOnOverlay(event, 'modal28')">
  <div class="modal">
    <button class="modal-close" onclick="closeModal('modal28')">&times;</button>
    <div class="modal-header">
      <div class="modal-header-content">
        <div class="modal-letter-number">Letter XXVIII</div>
        <h2 class="modal-title">Your Letter Title</h2>
      </div>
    </div>
    <div class="modal-body">
      <div class="letter-salutation">Dear Osagyefo,</div>
      <div class="letter-body">
        <p>Your letter content...</p>
      </div>
      <div class="letter-closing">
        Sincerely,<br>
        <span class="signature">Ato_KD</span>
      </div>
    </div>
    
    <!-- ADD THIS BLOCK -->
    <div class="modal-actions">
      <div class="modal-audio">
        <button class="audio-btn" onclick="playTTS(28)" id="audio-btn-28">
          <span id="audio-icon-28">🔊</span>
          <span id="audio-text-28">Listen</span>
        </button>
        <span class="audio-status" id="audio-status-28">0:00</span>
      </div>
      <div class="modal-share">
        <div class="share-label">Share this letter:</div>
        <div class="share-buttons">
          <a href="#" class="share-btn facebook" onclick="shareOnFacebook(28); return false;" title="Share on Facebook">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>
          <a href="#" class="share-btn twitter" onclick="shareOnTwitter(28); return false;" title="Share on X/Twitter">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
          </a>
          <a href="#" class="share-btn whatsapp" onclick="shareOnWhatsApp(28); return false;" title="Share on WhatsApp">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.893 3.488"/>
            </svg>
          </a>
          <button class="share-btn copy" onclick="copyLetterLink(28)" title="Copy Link">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
    <!-- END OF AUDIO/SHARE BLOCK -->
    
  </div>
</div>
```

### Step 4: Deploy
```bash
./deploy.sh
```

## Notes

- ✅ All JavaScript functions already exist in `letters.html`
- ✅ All CSS styling is already in place
- ✅ The infrastructure (`finish.sh`, `generate_voice.py`) is ready
- ✅ Audio file will be available at: `https://www.dearosagyefo.com/audio/final_letter.wav`

## Troubleshooting

**Audio not playing?**
- Check that `finish.sh` completed successfully
- Verify audio file exists at S3: `aws s3 ls s3://dearosagyefo.com/audio/`
- Wait 5-10 minutes for CloudFront cache to clear

**Share buttons not working?**
- Make sure you replaced all `XX` with the correct letter number
- Check browser console for JavaScript errors

**Need help?**
- All existing audio/share functionality code is at the bottom of `letters.html`
- Look at modals 1-2 in the git history to see the original implementation
