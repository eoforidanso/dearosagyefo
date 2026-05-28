# Backend Integration Guide

This guide explains how to connect the frontend to the backend API and import the PDF letters.

## 📋 Prerequisites

1. **Node.js** installed (v14 or higher)
2. **Database** configured (SQLite by default)
3. **Environment variables** set up in `.env` file

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Set Up Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this
PORTAL_SECRET=your-portal-secret-key-change-this
NODE_ENV=development
```

### Step 3: Initialize the Database

The database will be created automatically when you start the server for the first time.

```bash
node server.js
```

### Step 4: Create Admin User

You'll need an admin user to manage letters. Use the backend API or create one directly:

```bash
# Using curl
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@dearosagyefo.com",
    "password": "your-secure-password"
  }'
```

### Step 5: Import PDF Letters

Once you have an admin user, update the `ADMIN_USER_ID` in `import-pdf-letters.js` with the user ID returned from registration, then run:

```bash
node import-pdf-letters.js
```

This will import all 5 PDF letters into the database:
- ✅ The Persistent Challenge of Small-Scale Mining
- ✅ A Nation's DRS Dramas and Delusions
- ✅ The Toxicology Report
- ✅ Speeches Are Paper, Change Is Concrete
- ✅ Ankwanoma OSP: The Singing Prosecutor

## 🔗 API Endpoints

### Public Endpoints (No Authentication Required)

#### Get All Published Letters
```
GET /api/public/letters
Query params: ?category=Politics&search=galamsey
```

#### Get Single Letter
```
GET /api/public/letters/:id
```

#### Get Categories
```
GET /api/public/categories
```

#### Get Authors
```
GET /api/public/authors
```

#### Submit New Letter (Pending Approval)
```
POST /api/public/submit
Body: {
  "recipientName": "Osagyefo",
  "subject": "Letter Title",
  "content": "<p>Letter content...</p>",
  "authorName": "John Doe",
  "authorEmail": "john@example.com",
  "category": "Politics"
}
```

### Protected Endpoints (Require Authentication)

#### Create Letter
```
POST /api/letters
Headers: Authorization: Bearer <token>
Body: {
  "recipientName": "Osagyefo",
  "subject": "Letter Title",
  "content": "<p>Letter content...</p>",
  "category": "Politics",
  "status": "draft"
}
```

#### Update Letter
```
PUT /api/letters/:id
Headers: Authorization: Bearer <token>
```

#### Delete Letter
```
DELETE /api/letters/:id
Headers: Authorization: Bearer <token>
```

#### Publish Letter to Site
```
POST /api/letters/:id/publish-to-site
Headers: Authorization: Bearer <token>
```

## 🎨 Frontend Integration

### Option 1: Use Static HTML with API Fetch (Current Setup)

The current `letters.html` contains hardcoded letters. To make it dynamic:

1. Include the API integration script:
```html
<script src="letters-api.js"></script>
```

2. Add a script to fetch and render letters:
```html
<script>
// Fetch letters on page load
document.addEventListener('DOMContentLoaded', async () => {
  console.log('📡 Fetching letters from API...');
  const letters = await fetchLetters();
  
  if (letters.length > 0) {
    console.log(`✅ Loaded ${letters.length} letters from backend`);
    // You can dynamically populate the grid here
  } else {
    console.log('⚠️ No letters from API, using static content');
  }
});
</script>
```

### Option 2: Fully Dynamic Letters Page

Create a new `letters-dynamic.html` that fetches all content from the API:

```javascript
// On page load
async function loadLetters() {
  const lettersGrid = document.querySelector('.articles-grid');
  const modalsContainer = document.body;
  
  const letters = await fetchLetters();
  
  letters.forEach((letter, index) => {
    const modalId = `modal${index + 1}`;
    
    // Add card to grid
    lettersGrid.innerHTML += generateLetterCard(letter, modalId);
    
    // Add modal to page
    modalsContainer.innerHTML += generateLetterModal(letter, modalId, index + 1);
  });
  
  // Initialize TTS and share buttons
  initializeTTSAndShare();
}

loadLetters();
```

## 🔐 Authentication

To access protected endpoints, you need a JWT token:

```javascript
// Login
const response = await fetch('http://localhost:3000/api/users/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@dearosagyefo.com',
    password: 'your-password'
  })
});

const { token } = await response.json();

// Use token for authenticated requests
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

## 📊 Database Schema

### Letters Table

```sql
CREATE TABLE letters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  userId INTEGER NOT NULL,
  recipientName TEXT NOT NULL,
  recipientEmail TEXT,
  subject TEXT,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  tags TEXT,
  summary TEXT,
  status TEXT DEFAULT 'draft',
  imageData TEXT,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  sentAt DATETIME,
  publishedToSite INTEGER DEFAULT 0,
  FOREIGN KEY (userId) REFERENCES users(id)
);
```

## 🚢 Deployment

### Production Setup

1. **Update API URL** in `letters-api.js`:
```javascript
const API_BASE_URL = 'https://api.dearosagyefo.com/api';
```

2. **Set Environment Variables** on your production server:
```env
PORT=3000
JWT_SECRET=<secure-random-string>
PORTAL_SECRET=<secure-random-string>
NODE_ENV=production
```

3. **Deploy Backend** to your server (AWS, Railway, Render, etc.)

4. **Update Frontend** to point to production API

5. **Configure CORS** in server.js if needed:
```javascript
app.use(cors({
  origin: ['https://www.dearosagyefo.com', 'https://dearosagyefo.com'],
  credentials: true
}));
```

## 🧪 Testing

Test the API endpoints:

```bash
# Health check
curl http://localhost:3000/api/health

# Get public letters
curl http://localhost:3000/api/public/letters

# Get categories
curl http://localhost:3000/api/public/categories
```

## 📝 Next Steps

1. ✅ Import PDF letters to database
2. ✅ Test API endpoints
3. ⏳ Update frontend to fetch from API (optional)
4. ⏳ Deploy backend to production
5. ⏳ Configure DNS for api.dearosagyefo.com
6. ⏳ Set up SSL certificate
7. ⏳ Update frontend API URL to production

## 🆘 Troubleshooting

### "Cannot find module" errors
```bash
npm install
```

### Database errors
```bash
# Remove and recreate database
rm data/letters.db
node server.js
```

### API not responding
```bash
# Check if server is running
curl http://localhost:3000/api/health

# Check server logs
node server.js
```

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [JWT Authentication Guide](https://jwt.io/introduction)

---

**Need help?** Check the server logs or contact the development team.
