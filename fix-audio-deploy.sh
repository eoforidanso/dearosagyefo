#!/bin/bash

# Deploy audio URL fix to EC2 and restart backend

EC2_HOST="54.226.117.39"
EC2_USER="ec2-user"
DB_PATH="~/dearosagyefo/data/letters.db"
DIST_ID="E58CG4PIUEE3V"

echo "🔧 Fixing audio URLs on EC2..."

# Run the SQL fix on the remote database
ssh -o StrictHostKeyChecking=no "${EC2_USER}@${EC2_HOST}" << 'EOF'
  cd ~/dearosagyefo
  sqlite3 data/letters.db << 'SQL'
UPDATE public_letters 
SET audioUrl = 'https://dearosagyefo.com/audio/letter-' || id || '.mp3'
WHERE audioUrl IS NOT NULL 
  AND audioUrl LIKE '%/audio/letter-%';
SQL
  echo "✅ Audio URLs fixed"
EOF

if [ $? -ne 0 ]; then
  echo "❌ SSH failed. Make sure you can SSH to ${EC2_HOST}"
  echo "Try: ssh -i your-key.pem ${EC2_USER}@${EC2_HOST}"
  exit 1
fi

echo "🔄 Restarting backend..."
ssh -o StrictHostKeyChecking=no "${EC2_USER}@${EC2_HOST}" << 'EOF'
  pm2 restart all || sudo systemctl restart osagyefo
  sleep 2
  echo "✅ Backend restarted"
EOF

echo "☁️ Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id "${DIST_ID}" --paths "/*" > /dev/null

echo ""
echo "✅ All done! Testing..."
sleep 2
curl -s "https://dearosagyefo.com/api/public/letters?limit=1" | jq '.[0] | {id, title, audioUrl}'
