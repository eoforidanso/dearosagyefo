# Backend Setup & API Documentation

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables
Copy `.env.example` to `.env` and update values:
```bash
cp .env.example .env
```

### 3. Start the Server

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server will run on `http://localhost:3000`

## Database

The backend uses **SQLite** with the following tables:

### Users Table
- `id` - User ID (primary key)
- `email` - User email (unique)
- `password` - Hashed password
- `firstName` - First name
- `lastName` - Last name
- `createdAt` - Account creation timestamp
- `updatedAt` - Last update timestamp

### Letters Table
- `id` - Letter ID (primary key)
- `userId` - Foreign key to users
- `recipientName` - Letter recipient name
- `recipientEmail` - Letter recipient email
- `subject` - Letter subject
- `content` - Letter body content
- `status` - Letter status (draft/sent/archived)
- `createdAt` - Creation timestamp
- `updatedAt` - Last update timestamp
- `sentAt` - When letter was sent

### Attachments Table
- `id` - Attachment ID (primary key)
- `letterId` - Foreign key to letters
- `fileName` - Original file name
- `filePath` - Stored file path
- `uploadedAt` - Upload timestamp

## API Endpoints

### Authentication Routes

#### Register User
```http
POST /api/users/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

#### Login User
```http
POST /api/users/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

#### Get User Profile
```http
GET /api/users/profile
Authorization: Bearer <TOKEN>
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "createdAt": "2024-03-20T10:30:00Z"
}
```

#### Update User Profile
```http
PUT /api/users/profile
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith"
}
```

**Response:**
```json
{
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "Jane",
    "lastName": "Smith"
  }
}
```

---

### Letter Routes

#### Create Letter
```http
POST /api/letters
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "recipientName": "Osagyefo",
  "recipientEmail": "osagyefo@example.com",
  "subject": "Hello from the App",
  "content": "Dear Osagyefo...\n\nBest regards"
}
```

**Response:**
```json
{
  "message": "Letter created successfully",
  "letterId": 1
}
```

#### Get All Letters
```http
GET /api/letters
Authorization: Bearer <TOKEN>
```

**Response:**
```json
[
  {
    "id": 1,
    "recipientName": "Osagyefo",
    "recipientEmail": "osagyefo@example.com",
    "subject": "Hello from the App",
    "status": "draft",
    "createdAt": "2024-03-20T10:30:00Z",
    "updatedAt": "2024-03-20T10:30:00Z",
    "sentAt": null
  }
]
```

#### Get Single Letter
```http
GET /api/letters/1
Authorization: Bearer <TOKEN>
```

**Response:**
```json
{
  "id": 1,
  "userId": 1,
  "recipientName": "Osagyefo",
  "recipientEmail": "osagyefo@example.com",
  "subject": "Hello from the App",
  "content": "Dear Osagyefo...\n\nBest regards",
  "status": "draft",
  "createdAt": "2024-03-20T10:30:00Z",
  "updatedAt": "2024-03-20T10:30:00Z",
  "sentAt": null
}
```

#### Update Letter
```http
PUT /api/letters/1
Authorization: Bearer <TOKEN>
Content-Type: application/json

{
  "recipientName": "Osagyefo",
  "recipientEmail": "osagyefo@example.com",
  "subject": "Updated Subject",
  "content": "Updated content...",
  "status": "sent"
}
```

**Response:**
```json
{
  "message": "Letter updated successfully"
}
```

#### Delete Letter
```http
DELETE /api/letters/1
Authorization: Bearer <TOKEN>
```

**Response:**
```json
{
  "message": "Letter deleted successfully"
}
```

#### Generate Letter PDF
```http
GET /api/letters/1/pdf
Authorization: Bearer <TOKEN>
```

**Response:** Binary PDF file

#### Get Dashboard Statistics
```http
GET /api/letters/stats/dashboard
Authorization: Bearer <TOKEN>
```

**Response:**
```json
{
  "totalLetters": 10,
  "drafts": 3,
  "sent": 5,
  "archived": 2
}
```

---

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Token expires in 7 days.

## Frontend Integration

### JavaScript Example
```javascript
// Register
async function register() {
  const response = await fetch('http://localhost:3000/api/users/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'user@example.com',
      password: 'password123',
      firstName: 'John'
    })
  });
  const data = await response.json();
  localStorage.setItem('token', data.token);
  return data;
}

// Get user profile
async function getProfile() {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:3000/api/users/profile', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
}

// Create letter
async function createLetter(letter) {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:3000/api/letters', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(letter)
  });
  return await response.json();
}
```

## Deployment to Google Cloud

### Using Google Cloud Run

1. Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
ENV PORT=8080
CMD ["npm", "start"]
```

2. Deploy:
```bash
gcloud run deploy letter-to-osagyefo \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Using Google Cloud SQL

For production, replace SQLite with Cloud SQL:
```bash
npm install mysql2 -- save
```

Update database connection in `backend/config/database.js`.

## Error Handling

All errors return appropriate HTTP status codes:

- `400` - Bad Request (validation error)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (invalid token)
- `404` - Not Found (resource doesn't exist)
- `500` - Server Error

Error response format:
```json
{
  "message": "Error description"
}
```

## Security Notes

1. **Never commit `.env` file** - Use `.env.example` template
2. **Change JWT_SECRET in production** - Use strong, random key
3. **Use HTTPS in production** - Not just HTTP
4. **Hash passwords** - Already done with bcryptjs
5. **Validate all inputs** - Always check user input
6. **Set CORS properly** - Restrict to allowed origins in production

## Development

### Project Structure
```
backend/
├── config/          # Database configuration
├── controllers/     # Business logic
├── middleware/      # Authentication, validation
├── models/          # Database schemas
├── routes/          # API endpoints
└── utils/           # Helper functions

data/
└── letters.db       # SQLite database file
```

### Adding New Endpoints

1. Create a controller in `backend/controllers/`
2. Create routes in `backend/routes/`
3. Import routes in `server.js`
4. Test with curl or Postman

### Troubleshooting

**Port already in use:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

**Database locked:**
Delete `data/letters.db` and restart

## Support

For issues, check:
1. Node.js version (requires v14+)
2. `.env` file exists and is configured
3. Port 3000 is available
4. Database file has write permissions
