# 🗄️ Database Configuration Summary

## Current Setup Overview

The Dear Osagyefo project currently uses **SQLite** as the local database. The API backend connects to this database via Node.js.

---

## 📍 Database Location

### Local Development
- **Database File**: `./data/letters.db`
- **Full Path**: `/Users/harrietappiah/Desktop/vscode/letter--main/data/letters.db`
- **Database Type**: SQLite3
- **Connection Module**: `backend/config/database.js`

### Production Deployment (EC2)
- **Database Location**: EC2 instance home directory
- **Path**: `~/dearosagyefo/data/letters.db`
- **Server**: AWS EC2 (Ubuntu 22.04 LTS)
- **Database Engine**: SQLite3 (no remote RDS)

---

## 🔧 Database Configuration Files

### 1. **[backend/config/database.js](backend/config/database.js)**
   - Main database initialization file
   - Creates SQLite connection
   - Automatically initializes all required tables on startup
   - Handles schema migrations and triggers
   - Seeds default admin user and 10 public letters

### 2. **.env File (Environment Variables)**
   - **Example File**: [.env.example](.env.example)
   - **Location**: Root directory
   - **Variables for Database**:
     ```env
     DB_PATH=./data/letters.db
     PORT=3000
     NODE_ENV=development
     JWT_SECRET=your-super-secret-key-change-this-in-production
     ADMIN_SECRET=change-this-to-a-strong-random-secret
     PORTAL_SECRET=change-this-to-a-strong-portal-passphrase
     ```

### 3. **[api-config.js](api-config.js)**
   - Frontend API configuration
   - Currently uses relative paths (same domain via CloudFront proxy)
   - `API_BASE = ''` (empty string means current domain/API proxy)

---

## 📊 Database Schema

### Tables Created Automatically

#### 1. **users**
- `id` - Primary Key (INTEGER, AUTO-INCREMENT)
- `email` - Unique email address
- `password` - Hashed password (bcryptjs)
- `firstName` - User's first name
- `lastName` - User's last name
- `createdAt` - Account creation timestamp
- `updatedAt` - Last update timestamp

#### 2. **public_letters**
- `id` - Primary Key
- `letterNumber` - Letter number
- `authorName` - Author's name
- `title` - Letter title
- `preview` - Short preview text
- `content` - Full letter content (HTML)
- `category` - Letter category (General, Politics, Culture, Diaspora, etc.)
- `tags` - Comma-separated tags
- `accentColor` - Hex color code for UI
- `publishedAt` - Publication date
- `isApproved` - Approval status (0 or 1)
- `userId` - Foreign key to users table
- `imageData` - Base64 encoded image data
- `audioUrl` - URL to TTS audio (stored on S3)
- `customSalutation` - Custom letter salutation
- `customClosing` - Custom letter closing
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

#### 3. **letters** (User-drafted letters)
- `id` - Primary Key
- `userId` - Foreign key to users table
- `recipientName` - Letter recipient
- `recipientEmail` - Recipient email
- `subject` - Letter subject
- `content` - Full letter content
- `category` - Category
- `tags` - Tags
- `summary` - Auto-generated summary
- `status` - Draft/Sent/Archived
- `imageData` - Image data
- `audioUrl` - TTS audio URL
- `customSalutation` - Custom salutation
- `customClosing` - Custom closing
- `sentAt` - When letter was sent
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

#### 4. **attachments**
- `id` - Primary Key
- `letterId` - Foreign key to letters
- `fileName` - Original file name
- `filePath` - Storage path
- `uploadedAt` - Upload timestamp

#### 5. **visitor_letters** (Public submissions)
- `id` - Primary Key
- `penName` - Visitor's pen name
- `email` - Visitor's email
- `title` - Letter title
- `preview` - Preview text
- `content` - Full content
- `category` - Category
- `tags` - Tags
- `location` - Visitor's location
- `status` - Pending/Approved/Rejected
- `submittedAt` - Submission timestamp
- `reviewedAt` - Review timestamp
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp

#### 6. **subscribers**
- `id` - Primary Key
- `email` - Subscriber email (unique)
- `subscribedAt` - Subscription timestamp

---

## 🔐 Default Credentials (Seeded on Startup)

### Admin User (Auto-seeded from Environment Variables)
```
Email: eoforid@gmail.com
Password: ejDanso22$
First Name: Eoforid
```

**Note**: These are stored in [backend/config/database.js](backend/config/database.js) as environment variable defaults.

---

## 🚀 Connection Details

### Local Development
```javascript
// Auto-connects on server startup
const sqlite3 = require('sqlite3').verbose();
const DB_PATH = './data/letters.db';
const db = new sqlite3.Database(DB_PATH);
```

### Backend Server
- **Port**: 3000 (or process.env.PORT)
- **API Base URL** (local): `http://localhost:3000`
- **API Base URL** (production): `https://dearosagyefo.com/api` (via CloudFront proxy to EC2)

---

## 📁 File Locations Summary

| Component | Location | Type |
|-----------|----------|------|
| Database | `./data/letters.db` | SQLite file |
| Config | `backend/config/database.js` | JavaScript module |
| API Routes | `backend/routes/` | Express routers |
| Controllers | `backend/controllers/` | Request handlers |
| Environment | `.env.example` | Template |
| Server Entry | `server.js` | Main Node.js file |

---

## 🔗 API Endpoints (Database-Related)

### Public Endpoints
- `GET /api/public/letters` - Fetch approved letters
- `GET /api/public/letters/:id` - Single letter details
- `GET /api/public/categories` - All categories
- `GET /api/public/authors` - All authors
- `POST /api/public/submit` - Submit new letter (pending approval)

### Protected Endpoints (Require JWT Token)
- `POST /api/letters` - Create user letter
- `PUT /api/letters/:id` - Update letter
- `DELETE /api/letters/:id` - Delete letter
- `POST /api/letters/:id/publish-to-site` - Publish to public site

### Authentication
- `POST /api/users/register` - Create account
- `POST /api/users/login` - Get JWT token
- `POST /api/users/forgot-password` - Password reset
- `POST /api/users/reset-password` - Reset password

---

## ⚙️ Database Initialization Process

On server startup (`npm start` or `node server.js`):

1. **Load environment variables** from `.env`
2. **Create data directory** if it doesn't exist
3. **Initialize SQLite connection** to `./data/letters.db`
4. **Create all tables** (if they don't exist)
5. **Add columns** via migrations (ALTERs)
6. **Create database triggers** for sync operations
7. **Seed admin user** from environment variables
8. **Seed 10 default public letters** (only on first run)
9. **Start Express server** on port 3000

---

## 🌐 Remote Database Considerations

### Current: SQLite (Local)
- ✅ Zero setup required
- ✅ Perfect for development
- ✅ File-based (easy backup)
- ❌ Not ideal for multi-server scaling

### Alternative: AWS RDS (For Production Scaling)
If migrating to RDS in the future:
- Would require database.js modification
- Connection string example:
  ```
  mysql://user:password@db-instance.rds.amazonaws.com:3306/dearosagyefo
  ```
- Environment variables would need:
  - `DB_HOST`
  - `DB_USER`
  - `DB_PASSWORD`
  - `DB_NAME`
  - `DB_PORT`

---

## 💾 Backup & Restore

### Backup Local Database
```bash
# Simple file copy
cp data/letters.db data/letters.db.backup

# Or with timestamp
cp data/letters.db data/letters.db.$(date +%Y%m%d-%H%M%S)
```

### Restore from Backup
```bash
cp data/letters.db.backup data/letters.db
```

### EC2 Backup (via SSH)
```bash
# Download from EC2
scp -i your-key.pem ubuntu@EC2_IP:~/dearosagyefo/data/letters.db ./letters.db.backup

# Upload to EC2
scp -i your-key.pem ./letters.db ubuntu@EC2_IP:~/dearosagyefo/data/
```

---

## 🔄 Database Synchronization Triggers

Two SQL triggers maintain data consistency:

### Trigger 1: Delete Sync
```sql
CREATE TRIGGER sync_delete_public_on_letter_delete
AFTER DELETE ON letters
BEGIN
  DELETE FROM public_letters
  WHERE userId = OLD.userId AND title = OLD.subject;
END
```
- When a user deletes a draft letter, its published copy is also deleted

### Trigger 2: Title Sync
```sql
CREATE TRIGGER sync_title_on_letter_update
AFTER UPDATE OF subject ON letters
BEGIN
  UPDATE public_letters
  SET title = NEW.subject, updatedAt = datetime('now')
  WHERE userId = OLD.userId AND title = OLD.subject;
END
```
- When a user updates a letter title, the public version updates too

---

## 📝 Key Notes

1. **No Remote Database Currently**: This project uses local SQLite, not AWS RDS or remote databases
2. **Embedded Admin Credentials**: Default admin user is seeded from environment variables in database.js
3. **Auto-Schema Creation**: Database tables are created automatically on first server startup
4. **API Proxy**: Frontend makes API calls through CloudFront proxy (same domain), not direct to EC2
5. **SQLite Limitations**: Suitable for current load but consider RDS if scaling to multiple EC2 instances

---

## 🚀 Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Internet                              │
└────────────────────────┬────────────────────────────────┘
                         │
                   ┌─────▼──────┐
                   │ CloudFront │
                   │ (S3 + EC2) │
                   └─────┬──────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
    ┌────▼─────┐  ┌─────▼──────┐  ┌────▼─────┐
    │  S3      │  │  EC2/API   │  │ R53 DNS  │
    │(Frontend)│  │ (port 3000)│  │          │
    └──────────┘  └─────┬──────┘  └──────────┘
                        │
                   ┌────▼──────┐
                   │  SQLite   │
                   │ letters.db│
                   └───────────┘
```

**File**: This database is local to the EC2 instance at `~/dearosagyefo/data/letters.db`

---

## 📚 Related Documentation

- [BACKEND_SETUP.md](BACKEND_SETUP.md) - Backend setup guide
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - S3 + EC2 deployment
- [QUICK_START_BACKEND.md](QUICK_START_BACKEND.md) - Quick backend start guide
- [BACKEND_INTEGRATION.md](BACKEND_INTEGRATION.md) - API integration details
- [BACKEND_CONNECTION_SUMMARY.md](BACKEND_CONNECTION_SUMMARY.md) - Connection guide

