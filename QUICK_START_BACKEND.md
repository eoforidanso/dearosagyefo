# 🚀 Quick Start: Connect Frontend to Backend

## TL;DR - 3 Commands to Get Started

```bash
# 1. Start the backend server
./start-backend.sh

# 2. In another terminal, test the connection
node test-backend.js

# 3. Import the PDF letters (after creating admin user)
node import-pdf-letters.js
```

---

## ✅ What's Been Done

### Frontend Changes
- ✅ Letters page redesigned with magazine layout
- ✅ 5 PDF letters imported and displayed
- ✅ British male TTS voice on all pages
- ✅ Ghana Independence Song on from-osagyefo page
- ✅ Quiz celebration music fixed
- ✅ Hero modal upgraded with premium styling

### Backend Connection Files Created
- ✅ `import-pdf-letters.js` - Import PDFs to database
- ✅ `letters-api.js` - API integration library
- ✅ `start-backend.sh` - One-command server start
- ✅ `test-backend.js` - Test backend connection
- ✅ `BACKEND_CONNECTION_SUMMARY.md` - Complete guide
- ✅ `BACKEND_INTEGRATION.md` - Detailed docs

---

## 📝 Step-by-Step Setup

### Step 1: Start Backend (30 seconds)

```bash
./start-backend.sh
```

This will:
- ✅ Check Node.js installation
- ✅ Create .env with secure secrets
- ✅ Install dependencies
- ✅ Create data directory
- ✅ Start server on port 3000

**Expected output:**
```
🇬🇭 Dear Osagyefo - Backend Setup Script
==========================================

✅ Node.js version: v18.x.x
✅ Created .env file with secure random secrets
📦 Installing dependencies...
✅ Data directory created
🚀 Starting backend server...
   Server will be available at: http://localhost:3000
```

---

### Step 2: Test Connection (10 seconds)

**Open a new terminal** and run:

```bash
node test-backend.js
```

**Expected output:**
```
🧪 Testing Backend Connection...

✅ Test 1: Health check - PASSED
✅ Test 2: Get public letters - PASSED (0 letters)
✅ Test 3: Get categories - PASSED (0 categories)
✅ Test 4: Get authors - PASSED (0 authors)

📊 Test Results: 4 passed, 0 failed

🎉 All tests passed! Backend is working correctly.
```

---

### Step 3: Create Admin User (20 seconds)

```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@dearosagyefo.com",
    "password": "GhanaIndependence1957!"
  }'
```

**Expected response:**
```json
{
  "message": "User created successfully",
  "userId": 1
}
```

**Note the userId!** You'll need it for the next step.

---

### Step 4: Import PDF Letters (10 seconds)

Edit `import-pdf-letters.js` line 19:
```javascript
const ADMIN_USER_ID = 1; // Use the userId from step 3
```

Then run:
```bash
node import-pdf-letters.js
```

**Expected output:**
```
📝 Starting PDF letter import...

✅ Imported: PERSISTENT CHALLENGE OF SMALL-SCALE MINING
   Category: Politics
   Author: Ato_KD (Concerned Citizen)
   Tags: galamsey, mining, environment, politics

✅ Imported: NATIONS DRS DRAMAS AND DELUSIONS
   Category: Politics
   Author: Ato_KD (Political Observer)
   Tags: world cup, politics, satire, economics

✅ Imported: Dear Osagyefo,
   Category: Health
   Author: Ato_KD (Health Professional)
   Tags: health, toxicology, FDA, public safety

✅ Imported: Letter XX
   Category: Politics
   Author: Ato_KD (UN Observer)
   Tags: UN, politics, speeches, galamsey

✅ Imported: ANKWANOMA OSP: THE SINGING PROSECUTOR AND THE BAILED-OUT LAWYER
   Category: Satire
   Author: Ato_KD (Legal Satirist)
   Tags: law, satire, OSP, politics

============================================================
✨ Import complete!
   Imported: 5 letters
   Skipped: 0 letters
============================================================
```

---

### Step 5: Verify Import (5 seconds)

```bash
curl http://localhost:3000/api/public/letters | json_pp
```

Or open in browser:
```
http://localhost:3000/api/public/letters
```

You should see 5 letters in JSON format!

---

## 🎉 Done! What Now?

### View Your Site
Open in browser:
- Letters page: `http://localhost:8080/letters.html`
- Hero page: `http://localhost:8080/index.html`
- Timeline: `http://localhost:8080/from-osagyefo.html`
- Quiz: `http://localhost:8080/quiz.html`

### Test Features
- ✅ Click on any letter card → Beautiful modal opens
- ✅ Click 🎙️ Listen → British male voice reads letter
- ✅ Click Share → Facebook, Twitter, WhatsApp, Copy Link
- ✅ Try the Independence Song button on from-osagyefo page
- ✅ Complete the quiz → Hear celebration music

### Admin Dashboard (Optional)
Login to manage letters:
```
http://localhost:3000
```

Use the credentials from Step 3:
- Email: admin@dearosagyefo.com
- Password: GhanaIndependence1957!

---

## 🔧 Common Commands

### Start Backend
```bash
npm start
# or
node server.js
```

### Test Backend
```bash
node test-backend.js
```

### Import Letters Again
```bash
node import-pdf-letters.js
```

### View Logs
```bash
# Backend is running in foreground, logs show in terminal
# Look for errors marked with ❌
```

### Stop Backend
```
Press Ctrl+C in the terminal running the server
```

### Reset Database
```bash
rm data/letters.db
node server.js
```

---

## 📚 Full Documentation

For detailed information, see:

- **`BACKEND_CONNECTION_SUMMARY.md`** - Complete overview
- **`BACKEND_INTEGRATION.md`** - Technical details
- **`BACKEND_SETUP.md`** - Step-by-step setup
- **`BACKEND_COMPLETE.md`** - Original backend docs

---

## 🆘 Troubleshooting

### "Port 3000 is already in use"
```bash
lsof -ti:3000 | xargs kill -9
./start-backend.sh
```

### "Cannot find module"
```bash
npm install
```

### "Database locked"
```bash
rm data/letters.db
node server.js
```

### Backend not responding
```bash
# Check if running
curl http://localhost:3000/api/health

# If no response, restart
node server.js
```

### Import script fails
```bash
# Make sure you updated ADMIN_USER_ID
# Make sure backend is running
# Check data/letters.db exists
```

---

## 🎯 Next Steps

### Now (Optional)
- [ ] Add more letters via admin dashboard
- [ ] Customize letter categories
- [ ] Update author information

### Later (Production)
- [ ] Deploy backend to Railway/Render/AWS
- [ ] Point api.dearosagyefo.com to backend
- [ ] Update API_BASE_URL in letters-api.js
- [ ] Enable HTTPS with SSL certificate
- [ ] Set up database backups

---

## 🇬🇭 Congratulations!

Your frontend is now connected to the backend!

All 5 PDF letters are:
- ✅ Stored in the database
- ✅ Accessible via API
- ✅ Displayed on the website
- ✅ Ready for TTS playback
- ✅ Shareable on social media

**Enjoy your beautiful letter platform! 🎉**
