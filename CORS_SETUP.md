# CORS Configuration for Production

After deploying to S3, update your `server.js` on EC2 to restrict CORS to your production domains.

## Update server.js

Replace this line (around line 24):
```javascript
app.use(cors());
```

With this:
```javascript
// Production CORS configuration
const allowedOrigins = [
  'http://dearosagyefo.com.s3-website-us-east-1.amazonaws.com',  // S3 static site
  'https://dearosagyefo.com',  // If using CloudFront/custom domain
  'https://www.dearosagyefo.com',  // www version
  'http://localhost:8080',  // Local development
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## After Making Changes

```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Edit server.js
cd ~/dearosagyefo
nano server.js

# Restart server
pm2 restart all

# Verify
pm2 logs
```

## Environment Variable Approach (Better)

Add to `.env`:
```env
CORS_ORIGINS=http://dearosagyefo.com.s3-website-us-east-1.amazonaws.com,https://dearosagyefo.com,http://localhost:8080
```

Update `server.js`:
```javascript
const allowedOrigins = process.env.CORS_ORIGINS ? 
  process.env.CORS_ORIGINS.split(',') : 
  ['http://localhost:8080'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
```

This allows you to update CORS without changing code!
