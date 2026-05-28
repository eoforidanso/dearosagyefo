# Dear Osagyefo - Production Architecture

## 🌐 Live Site
**https://dearosagyefo.com**

---

## Architecture Overview

```
User Browser
    ↓
Route 53 (DNS)
    ↓
CloudFront (CDN)
    ├─→ / (Root & Static Files) → S3 Bucket
    └─→ /api/* (API Calls) → EC2 Backend
```

---

## Components

### 1. **Route 53** (DNS)
- **Hosted Zone ID**: `Z09725646IL8EDWFSP9W`
- **Records**:
  - `dearosagyefo.com` → CloudFront (A Alias)
  - `www.dearosagyefo.com` → CloudFront (A Alias)
  - `api.dearosagyefo.com` → EC2 (A Record: 3.89.242.41)

### 2. **CloudFront** (CDN)
- **Distribution ID**: `E58CG4PIUEE3V`
- **Domain**: `d3269abdoxx7v9.cloudfront.net`
- **SSL Certificate**: ACM cert for `dearosagyefo.com`
- **Origins**:
  - **S3-Origin**: `dearosagyefo.com.s3.us-east-1.amazonaws.com`
  - **EC2-Backend**: `api.dearosagyefo.com:3000`
- **Behaviors**:
  - `/` → S3 (default)
  - `/api/*` → EC2 Backend

### 3. **S3** (Static Files)
- **Bucket**: `dearosagyefo.com`
- **Region**: `us-east-1`
- **Contents**:
  - HTML pages (index.html, login.html, dashboard.html, etc.)
  - CSS, JavaScript, images
  - `api-config.js` (API configuration)

### 4. **EC2** (Backend API)
- **IP**: `3.89.242.41`
- **Port**: `3000`
- **Domain**: `api.dearosagyefo.com`
- **Stack**: Node.js/Express + SQLite
- **Endpoints**:
  - `/api/public/letters` - Get published letters
  - `/api/users/login` - User authentication
  - `/api/letters/*` - Letter management (admin)
  - `/api/visitors/*` - Visitor tracking

---

## How It Works

1. **User visits https://dearosagyefo.com**
   - DNS (Route 53) resolves to CloudFront
   - CloudFront serves HTML/CSS/JS from S3
   - HTTPS secured with ACM certificate

2. **User logs in or loads letters**
   - JavaScript makes request to `/api/users/login`
   - CloudFront routes `/api/*` to EC2 backend
   - EC2 processes request and returns JSON
   - All via HTTPS (no mixed content issues)

3. **Benefits**:
   - ✅ Fully HTTPS
   - ✅ Fast global delivery (CloudFront CDN)
   - ✅ Secure API communication
   - ✅ Domain-agnostic code (works locally & production)

---

## Key Files

### Frontend Configuration
- **api-config.js**: Detects local vs production and sets API base URL
  ```javascript
  const isLocal = window.location.hostname === 'localhost' || 
                  window.location.hostname === '127.0.0.1';
  window.API_BASE = isLocal ? 'http://localhost:3000' : '';
  ```

### HTML Pages Using API
- `login.html` - Authentication
- `dashboard.html` - Admin interface
- `index.html`, `letters.html`, `write.html` - Public pages
- All use: `fetch(API_BASE + '/api/endpoint')`

---

## Deployment Commands

### Update Frontend (S3)
```bash
# Upload specific files
aws s3 cp login.html s3://dearosagyefo.com/
aws s3 cp dashboard.html s3://dearosagyefo.com/

# Sync entire directory (be careful!)
aws s3 sync . s3://dearosagyefo.com/ --exclude "*.md" --exclude "node_modules/*"

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E58CG4PIUEE3V \
  --paths "/*"
```

### Update Backend (EC2)
```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@3.89.242.41

# Pull latest code
cd ~/dearosagyefo
git pull

# Install dependencies (if needed)
npm install

# Restart server
pm2 restart all

# Check logs
pm2 logs
```

---

## Next Steps (Security)

### 🔒 Lock Down CORS
Currently your EC2 backend accepts requests from ANY origin. See `CORS_SETUP.md` for instructions to restrict to `dearosagyefo.com` only.

### 🔐 HTTPS for EC2 (Optional)
While CloudFront handles HTTPS for users, the CloudFront→EC2 connection is HTTP. To fully encrypt:
1. Install Let's Encrypt cert on EC2
2. Update CloudFront origin to use HTTPS
3. Update EC2 backend to listen on port 443

---

## Testing

### Test Frontend
```bash
curl -I https://dearosagyefo.com
```

### Test API
```bash
curl https://dearosagyefo.com/api/public/letters
```

### Test Login
1. Visit: https://dearosagyefo.com/login.html
2. Enter credentials
3. Should redirect to dashboard

---

## Troubleshooting

### "Site can't be reached"
- Check DNS: `dig dearosagyefo.com`
- Should show CloudFront IPs

### "Mixed content" error
- All API calls should use relative paths (`/api/*`)
- CloudFront handles the routing

### Login not working
- Check browser console for errors
- Verify `api-config.js` is loaded
- Test API directly: `curl https://dearosagyefo.com/api/public/letters`

---

**Last Updated**: April 18, 2026
**Status**: ✅ Production Ready
