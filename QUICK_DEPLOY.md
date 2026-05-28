# 🚀 Quick Deployment Reference

## 🎯 Deployment Order

### 1️⃣ Deploy Backend to EC2 (Do This First)

```bash
# Launch EC2 instance in AWS Console
# Security Group: Allow ports 22, 80, 3000

# Connect to EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Download and run setup script
curl -o ec2-setup.sh https://raw.githubusercontent.com/eoforidanso/dearosagyefo/main/ec2-setup.sh
chmod +x ec2-setup.sh
./ec2-setup.sh
```

**Or manually:** Follow steps in `DEPLOYMENT_GUIDE.md` Part 1

Your API will be at: `http://YOUR_EC2_IP:3000`

---

### 2️⃣ Deploy Frontend to S3

```bash
# From your local machine
cd /Users/harrietappiah/Desktop/letter--main

# Run improved deployment script
./deploy-s3-improved.sh

# When prompted, enter your EC2 API URL:
# http://YOUR_EC2_IP:3000
```

Your website will be at: `http://dearosagyefo.com.s3-website-us-east-1.amazonaws.com`

---

## ⚡ Quick Commands

### EC2 Backend

```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Check server status
pm2 status

# View logs
pm2 logs

# Restart server
pm2 restart all

# Update code (if using Git)
cd ~/dearosagyefo
git pull
npm install
pm2 restart all
```

### S3 Frontend

```bash
# Re-deploy frontend
./deploy-s3-improved.sh

# Update just one file
aws s3 cp index.html s3://dearosagyefo.com/index.html \
  --content-type "text/html; charset=utf-8"
```

---

## 🔍 Testing Checklist

After deployment:

1. **Test API:** `curl http://YOUR_EC2_IP:3000/api/health`
2. **Test S3 Site:** Open `http://dearosagyefo.com.s3-website-us-east-1.amazonaws.com`
3. **Check Browser Console:** Look for CORS or API errors
4. **Test Login:** Go to `/login.html`
5. **Test Writing:** Create a letter from dashboard
6. **Test Public View:** Check `/letters.html`

---

## 🆘 Common Issues

### CORS Error

**Problem:** Browser console shows CORS policy error

**Solution:** Update `server.js` on EC2:
```javascript
app.use(cors({
  origin: 'http://dearosagyefo.com.s3-website-us-east-1.amazonaws.com',
  credentials: true
}));
```
Then: `pm2 restart all`

### API Not Responding

**Problem:** API calls timeout or fail

**Checks:**
1. EC2 security group allows port 3000
2. PM2 process running: `pm2 status`
3. Check logs: `pm2 logs`
4. Test locally on EC2: `curl http://localhost:3000/api/health`

### Images Not Loading

**Problem:** Cover images don't display

**Solution:** Check S3 bucket policy allows public read:
```bash
aws s3api get-bucket-policy --bucket dearosagyefo.com
```

---

## 💰 Cost Calculator

- **EC2 t2.micro:** Free tier (750 hrs/month) or $8.50/month
- **S3:** $0.023/GB storage + $0.09/GB transfer = ~$1-5/month
- **Total:** $0-15/month for small traffic

---

## 📞 Get Your URLs

### EC2 Public IP
```bash
# From EC2 instance:
curl http://169.254.169.254/latest/meta-data/public-ipv4
```

### S3 Website URL
```
http://dearosagyefo.com.s3-website-us-east-1.amazonaws.com
```

### API Health Check
```
http://YOUR_EC2_IP:3000/api/health
```

---

## 🔄 Update Workflow

When you make code changes:

1. **Backend changes:**
   - Push to GitHub
   - SSH to EC2
   - `git pull && npm install && pm2 restart all`

2. **Frontend changes:**
   - Run `./deploy-s3-improved.sh`

---

## 📱 Mobile Testing

Test on mobile devices:
- Share S3 URL via QR code
- Test touch interactions
- Check responsive design

---

## 🎨 Custom Domain (Optional)

1. Register domain (e.g., on Route 53, Namecheap)
2. Create CloudFront distribution pointing to S3
3. Add SSL certificate (AWS Certificate Manager)
4. Point domain to CloudFront
5. Update CORS to include new domain

Cost: +$12/year (domain) + $0 (CloudFront free tier)

---

## 📚 Files Reference

- `DEPLOYMENT_GUIDE.md` - Complete step-by-step guide
- `deploy-s3-improved.sh` - S3 deployment script
- `ec2-setup.sh` - EC2 automated setup
- `update-api-urls.sh` - Update API URLs manually
- `s3-bucket-policy.json` - S3 permissions config

---

**Last Updated:** Use improved scripts for better experience!
