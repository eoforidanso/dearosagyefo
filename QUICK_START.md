# Quick Start Guide - Backend Installation

## What's Been Created

Your backend is now ready with the following features:

✅ **Express.js Server** - Professional backend framework  
✅ **SQLite Database** - File-based database (no setup needed)  
✅ **User Authentication** - Registration, login with JWT tokens  
✅ **Letter Management** - Full CRUD operations (Create, Read, Update, Delete)  
✅ **PDF Generation** - Convert letters to PDF files  
✅ **Dashboard Statistics** - Track letter counts and status  
✅ **CORS Support** - Ready for frontend integration  
✅ **Error Handling** - Comprehensive error responses  

---

## Installation Steps

### 1. Install Node.js
Download from https://nodejs.org (LTS version recommended)

### 2. Install Dependencies
Open terminal in the project root and run:
```bash
npm install
```

This will install:
- express
- sqlite3
- bcryptjs (password hashing)
- jsonwebtoken (JWT authentication)
- cors (cross-origin requests)
- body-parser (JSON parsing)
- puppeteer (PDF generation)
- and more...

### 3. Create Environment File
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` if needed (optional for development):
```
PORT=3000
JWT_SECRET=your-secret-key
```

### 4. Start the Server

**For Development** (with auto-reload):
```bash
npm run dev
```

**For Production:**
```bash
npm start
```

You should see:
```
✓ Server running on http://localhost:3000
✓ Database initialized
✓ API endpoints ready
```

---

## Test the API

### Using Postman or curl

**1. Register a User**
```bash
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "eoforid@gmail.com",
    "password": "password123",
    "firstName": "Osagyefo",
    "lastName": "Frimpong"
  }'
```

You'll get a response with a token:
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {...}
}
```

**2. Save the Token** (you'll need it for protected routes)

**3. Create a Letter**
```bash
curl -X POST http://localhost:3000/api/letters \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "recipientName": "Friend",
    "recipientEmail": "friend@example.com",
    "subject": "Hello",
    "content": "This is my letter content"
  }'
```

**4. Get All Letters**
```bash
curl http://localhost:3000/api/letters \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## Frontend Integration

### Add This to Your HTML
```html
<script src="backend/utils/apiClient.js"></script>
```

### Example Usage in JavaScript

**Register:**
```javascript
const user = await UserAPI.register('eoforid@gmail.com', 'securePassword', 'Osagyefo');
console.log('Registered:', user);
```

**Login:**
```javascript
const user = await UserAPI.login('eoforid@gmail.com', 'securePassword');
console.log('Logged in:', user);
```

**Create Letter:**
```javascript
const result = await LetterAPI.createLetter(
  'Recipient Name',
  'recipient@example.com',
  'Letter Subject',
  'Letter content here...'
);
console.log('Letter created with ID:', result.letterId);
```

**Get Dashboard Stats:**
```javascript
const stats = await LetterAPI.getDashboardStats();
console.log('Total letters:', stats.totalLetters);
console.log('Drafts:', stats.drafts);
console.log('Sent:', stats.sent);
```

**Generate PDF:**
```javascript
await LetterAPI.generatePDF(1); // Downloads letter-1.pdf
```

---

## Project Structure

```
letter-to-osagyefo/
├── backend/
│   ├── config/
│   │   └── database.js          # SQLite setup
│   ├── controllers/
│   │   ├── userController.js    # Auth logic
│   │   ├── letterController.js  # Letter CRUD
│   │   └── pdfController.js     # PDF generation
│   ├── middleware/
│   │   └── auth.js              # JWT authentication
│   ├── routes/
│   │   ├── users.js             # User endpoints
│   │   └── letters.js           # Letter endpoints
│   └── utils/
│       └── apiClient.js         # Frontend API library
├── data/
│   └── letters.db               # SQLite database (auto-created)
├── server.js                    # Main Express server
├── package.json                 # Dependencies
├── .env                         # Environment variables
├── .env.example                 # Template for .env
├── .gitignore                   # Git ignore patterns
└── BACKEND_SETUP.md             # Full documentation
```

---

## Common Issues & Solutions

**Port 3000 already in use:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

**Module not found errors:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Database locked:**
Delete `data/letters.db` and restart the server

**Can't connect to database:**
Check that `data/` folder has write permissions

---

## Next Steps

1. ✅ Install dependencies: `npm install`
2. ✅ Start server: `npm start` or `npm run dev`
3. ✅ Test API endpoints (see examples above)
4. ✅ Integrate frontend with `backend/utils/apiClient.js`
5. ✅ Deploy to Google Cloud (see BACKEND_SETUP.md)

---

## API Documentation

See **[BACKEND_SETUP.md](./BACKEND_SETUP.md)** for full API documentation with all endpoints and examples.

## Need Help?

Check the documentation:
- `BACKEND_SETUP.md` - Complete API reference
- `backend/config/database.js` - Database schema
- `backend/routes/` - All API endpoints
- `backend/utils/apiClient.js` - Frontend integration examples

---

**Your backend is ready to use! 🚀**
