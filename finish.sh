#!/bin/bash
echo "��️ Step 1: Generating AI Voice..."
python3 generate_voice.py

echo "📦 Step 2: Uploading to S3 Warehouse..."
aws s3 cp final_letter.wav s3://dearosagyefo.com/audio/final_letter.wav

echo "🌐 Step 3: Updating the World (CloudFront)..."
aws cloudfront create-invalidation --distribution-id E58CG4PIUEE3V --paths "/audio/final_letter.wav"

echo "✨ DONE! Your letter is now live."
