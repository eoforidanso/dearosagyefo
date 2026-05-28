# 🚀 Deployment Guide: S3 + EC2

## Overview
- **Frontend**: AWS S3 (Static website hosting)
- **Backend**: AWS EC2 (Node.js API server)
- **Database**: SQLite on EC2 instance

---

## 📋 Prerequisites

### 1. AWS CLI Installation
```bash
# Check if installed
aws --version

# If not installed:
brew install awscli
```

### 2. AWS Configuration
```bash
aws configure
# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region (e.g., us-east-1)
# - Output format (json)
```

### 3. Required Information
- [ ] EC2 instance public IP/domain (after EC2 setup)
- [ ] S3 bucket name: `dearosagyefo.com`
- [ ] EC2 key pair for SSH access

---

## 🖥️ PART 1: Deploy Backend to EC2

### Step 1: Launch EC2 Instance

1. **Go to AWS EC2 Console**
   - Launch Instance
   - Choose **Ubuntu Server 22.04 LTS**
   - Instance type: **t2.micro** (free tier) or **t2.small**
   - Create/select key pair (download `.pem` file)
   - Security Group settings:
     ```
     - SSH (22) - Your IP
     - HTTP (80) - Anywhere
     - HTTPS (443) - Anywhere
     - Custom TCP (3000) - Anywhere (for API)
     ```

### Step 2: Connect to EC2

```bash
# Change permissions on key pair
chmod 400 your-key.pem

# Connect via SSH
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

### Step 3: Install Node.js on EC2

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version

# Install PM2 (process manager)
sudo npm install -g pm2
```

### Step 4: Upload Backend Code to EC2

**Option A: Using SCP (from your local machine)**
```bash
# Create a deployment package
cd /Users/harrietappiah/Desktop/letter--main
tar -czf backend-deploy.tar.gz backend/ server.js package.json package-lock.json .env

# Upload to EC2
scp -i your-key.pem backend-deploy.tar.gz ubuntu@YOUR_EC2_PUBLIC_IP:~/

# SSH to EC2 and extract
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
mkdir -p ~/dearosagyefo
tar -xzf backend-deploy.tar.gz -C ~/dearosagyefo
cd ~/dearosagyefo
```

**Option B: Using Git (recommended)**
```bash
# On EC2
cd ~
git clone https://github.com/eoforidanso/dearosagyefo.git
cd dearosagyefo
```

### Step 5: Configure Backend on EC2

```bash
# Install dependencies
npm install --production

# Create .env file
nano .env
```

**Add to .env:**
```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-change-this
PORTAL_SECRET=your-portal-secret-change-this
NODE_ENV=production
DATABASE_PATH=./data/letters.db
```

```bash
# Create data directory
mkdir -p data

# Test the server
node server.js
# Should see: "Server running on port 3000"
# Press Ctrl+C to stop
```

### Step 6: Run Backend with PM2

```bash
# Start server with PM2
pm2 start server.js --name dearosagyefo-api

# Configure PM2 to start on system boot
pm2 startup
pm2 save

# Useful PM2 commands:
pm2 status          # Check status
pm2 logs            # View logs
pm2 restart all     # Restart server
pm2 stop all        # Stop server
```

### Step 7: Set Up Nginx Reverse Proxy (Optional but Recommended)

```bash
# Install Nginx
sudo apt install -y nginx

# Configure Nginx
sudo nano /etc/nginx/sites-available/dearosagyefo
```

**Add this configuration:**
```nginx
server {
    listen 80;
    server_name YOUR_EC2_PUBLIC_IP;  # or your domain

    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/dearosagyefo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**Your API will be accessible at:** `http://YOUR_EC2_PUBLIC_IP/api`

---

## 🌐 PART 2: Deploy Frontend to S3

### Step 1: Update API URLs in Frontend

Before deploying, update all `localhost:3000` references to your EC2 API URL:

```bash
# From your local machine
cd /Users/harrietappiah/Desktop/letter--main

# Update API_BASE in all HTML files
# Will be done automatically by the script below
```

### Step 2: Run Deployment Script

```bash
# Make script executable
chmod +x deploy-s3.sh

# Run deployment
./deploy-s3.sh
```

The script will:
1. ✅ Check AWS CLI is installed and configured
2. ✅ Create temporary deployment directory
3. ✅ Copy all static files (HTML, CSS, JS, images, audio)
4. ✅ Create/configure S3 bucket for static hosting
5. ✅ Upload files with proper caching
6. ✅ Set bucket policy for public access

### Step 3: Access Your Website

After deployment completes, your site will be at:
```
http://dearosagyefo.com.s3-website-us-east-1.amazonaws.com
```

---

## 🔐 PART 3: Security & SSL (Optional but Recommended)

### Set Up HTTPS with CloudFront

1. **Go to AWS CloudFront Console**
2. Create Distribution:
   - Origin: Your S3 bucket
   - Viewer Protocol Policy: Redirect HTTP to HTTPS
   - Custom SSL Certificate (if using custom domain)
3. Update DNS to point to CloudFront distribution

---

## ✅ Post-Deployment Checklist

### Frontend (S3)
- [ ] S3 bucket created and configured
- [ ] Files uploaded successfully
- [ ] Website accessible via S3 URL
- [ ] API calls working (check browser console)

### Backend (EC2)
- [ ] EC2 instance running
- [ ] Node.js and PM2 installed
- [ ] Backend code deployed
- [ ] PM2 process running
- [ ] API endpoint accessible: `http://YOUR_EC2_IP/api/health`
- [ ] Database file exists in `data/` directory
- [ ] CORS configured to allow S3 domain

### Testing
- [ ] Test login at: `https://your-s3-url/login.html`
- [ ] Test writing letter
- [ ] Test viewing published letters
- [ ] Check all images load correctly

---

## 🔧 Troubleshooting

### Frontend Issues

**CORS Errors:**
Update `server.js` on EC2 to allow your S3 domain:
```javascript
app.use(cors({
  origin: ['http://dearosagyefo.com.s3-website-us-east-1.amazonaws.com', 'https://your-cloudfront-domain.cloudfront.net'],
  credentials: true
}));
```

**API Not Responding:**
- Check EC2 security group allows port 3000
- Verify PM2 process is running: `pm2 status`
- Check logs: `pm2 logs`

### Backend Issues

**Database Errors:**
```bash
# Check database file exists
ls -la data/letters.db

# Check permissions
chmod 644 data/letters.db
```

**PM2 Not Starting on Boot:**
```bash
pm2 startup
pm2 save
```

---

## 📊 Monitoring

### Check Backend Logs
```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# View logs
pm2 logs dearosagyefo-api

# Monitor in real-time
pm2 monit
```

### Check S3 Access Logs
Enable S3 access logging in AWS Console for traffic analysis.

---

## 💰 Cost Estimates (Monthly)

- **S3**: ~$0.50-2 (storage + data transfer)
- **EC2 t2.micro**: Free tier / ~$8.50 after
- **CloudFront**: Free tier includes 50GB transfer

**Total**: ~$0-10/month (depending on traffic)

---

## 🔄 Future Updates

### Update Frontend
```bash
./deploy-s3.sh
```

### Update Backend
```bash
# On EC2
cd ~/dearosagyefo
git pull
npm install
pm2 restart all
```

---

## 📞 Support

- AWS Documentation: https://docs.aws.amazon.com
- PM2 Guide: https://pm2.keymetrics.io/docs/usage/quick-start/
- S3 Static Hosting: https://docs.aws.amazon.com/AmazonS3/latest/userguide/WebsiteHosting.html
