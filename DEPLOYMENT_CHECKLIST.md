# ✅ Deployment Checklist - S3 + EC2

Use this checklist to track your deployment progress.

---

## 📋 Pre-Deployment

- [ ] AWS account created
- [ ] AWS CLI installed: `aws --version`
- [ ] AWS configured: `aws configure`
- [ ] GitHub repository pushed (if using Git deployment)
- [ ] Local servers tested and working
- [ ] Database has sample data

---

## 🖥️ EC2 Backend Deployment

### Step 1: Launch EC2 Instance
- [ ] Launched Ubuntu 22.04 LTS instance
- [ ] Instance type: t2.micro or t2.small
- [ ] Key pair created and downloaded (`.pem` file)
- [ ] Security Group configured:
  - [ ] SSH (22) - Your IP
  - [ ] Custom TCP (3000) - Anywhere (0.0.0.0/0)
  - [ ] HTTP (80) - Anywhere (optional, for Nginx)
- [ ] Instance is running
- [ ] Public IP noted: `________________`

### Step 2: Connect & Setup
- [ ] SSH connection successful: `ssh -i key.pem ubuntu@YOUR_EC2_IP`
- [ ] Uploaded `ec2-setup.sh` or cloned repo
- [ ] Ran setup script: `./ec2-setup.sh`
- [ ] Node.js installed: `node --version`
- [ ] PM2 installed: `pm2 --version`
- [ ] Dependencies installed: `npm install`

### Step 3: Configuration
- [ ] `.env` file created with:
  - [ ] PORT=3000
  - [ ] JWT_SECRET (random secret)
  - [ ] PORTAL_SECRET (random secret)
  - [ ] NODE_ENV=production
- [ ] Data directory created: `mkdir -p data`
- [ ] Database file copied or created

### Step 4: Start Server
- [ ] Server started with PM2: `pm2 start server.js --name dearosagyefo-api`
- [ ] PM2 status shows "online": `pm2 status`
- [ ] Startup script configured: `pm2 startup && pm2 save`
- [ ] API health check works: `curl http://localhost:3000/api/health`
- [ ] API accessible from outside: `curl http://YOUR_EC2_IP:3000/api/health`

### Step 5: Test API Endpoints
- [ ] Health: `http://YOUR_EC2_IP:3000/api/health`
- [ ] Letters: `http://YOUR_EC2_IP:3000/api/public/letters`
- [ ] No errors in logs: `pm2 logs`

**EC2 API URL:** `http://________________:3000`

---

## 🌐 S3 Frontend Deployment

### Step 1: Prepare Deployment
- [ ] Noted EC2 API URL from above
- [ ] Scripts are executable: `chmod +x deploy-s3-improved.sh`
- [ ] Reviewed `s3-bucket-policy.json`

### Step 2: Run Deployment
- [ ] Ran: `./deploy-s3-improved.sh`
- [ ] Entered EC2 API URL when prompted
- [ ] Bucket created successfully
- [ ] Files uploaded to S3
- [ ] No errors during upload

### Step 3: Verify S3 Deployment
- [ ] S3 website URL noted: `http://dearosagyefo.com.s3-website-us-east-1.amazonaws.com`
- [ ] Index page loads: Open URL in browser
- [ ] All pages accessible:
  - [ ] `/index.html`
  - [ ] `/letters.html`
  - [ ] `/write.html`
  - [ ] `/login.html`
  - [ ] `/dashboard.html`
  - [ ] `/about.html`
  - [ ] `/timeline.html`
- [ ] Images load correctly
- [ ] Audio files work (if applicable)
- [ ] CSS styles applied
- [ ] No 404 errors

**S3 Website URL:** `http://________________`

---

## 🔧 Integration & Testing

### CORS Configuration
- [ ] Updated `server.js` CORS settings (see `CORS_SETUP.md`)
- [ ] Added S3 domain to allowed origins
- [ ] Restarted PM2: `pm2 restart all`
- [ ] No CORS errors in browser console

### End-to-End Testing
- [ ] **Login Page:**
  - [ ] Opens correctly
  - [ ] Can log in with credentials
  - [ ] JWT token stored in session
  - [ ] Redirects to dashboard

- [ ] **Dashboard:**
  - [ ] User name displays correctly
  - [ ] Stats load properly
  - [ ] Can create new letter
  - [ ] Rich text editor works
  - [ ] Image upload works
  - [ ] Can save draft
  - [ ] Can publish letter

- [ ] **Letters Page:**
  - [ ] Published letters display
  - [ ] Images load correctly
  - [ ] Modal opens when clicking letter
  - [ ] Letter formatting correct (salutation, body, closing)

- [ ] **Write Page (Public):**
  - [ ] Form loads correctly
  - [ ] Can submit letter
  - [ ] Submission appears in dashboard (pending)

- [ ] **Mobile Testing:**
  - [ ] Responsive design works
  - [ ] Touch interactions smooth
  - [ ] Images scale properly

### Performance
- [ ] Page load time < 3 seconds
- [ ] Images compressed and optimized
- [ ] No console errors
- [ ] API response time < 1 second

---

## 🔐 Security

- [ ] EC2 security group limits SSH to your IP
- [ ] JWT_SECRET is strong and random
- [ ] PORTAL_SECRET is strong and random
- [ ] S3 bucket policy allows only public read (not write)
- [ ] No sensitive data in environment variables exposed to frontend
- [ ] `.env` file not uploaded to S3
- [ ] Database file not accessible via web

---

## 🎨 Optional Enhancements

- [ ] Custom domain purchased
- [ ] CloudFront distribution created
- [ ] SSL certificate configured
- [ ] Domain DNS pointing to CloudFront
- [ ] HTTPS working
- [ ] Nginx reverse proxy on EC2 (optional)
- [ ] EC2 Elastic IP assigned (prevent IP change on restart)
- [ ] Automatic database backups configured
- [ ] CloudWatch monitoring enabled
- [ ] S3 versioning enabled

---

## 📊 Monitoring & Maintenance

### Daily Checks
- [ ] PM2 status: `pm2 status`
- [ ] Check logs: `pm2 logs --lines 50`
- [ ] Disk space: `df -h`
- [ ] Memory usage: `free -m`

### Weekly Checks
- [ ] EC2 system updates: `sudo apt update && sudo apt upgrade`
- [ ] Database backup created
- [ ] Review API logs for errors
- [ ] Check S3 access logs (if enabled)

### Monthly Checks
- [ ] Review AWS bill
- [ ] Update Node.js dependencies: `npm update`
- [ ] Security patches applied
- [ ] Performance optimization

---

## 🆘 Troubleshooting Log

**Issue 1:**
- Problem: _______________
- Solution: _______________
- Date: _______________

**Issue 2:**
- Problem: _______________
- Solution: _______________
- Date: _______________

---

## 📞 Important URLs & Info

| Item | Value |
|------|-------|
| EC2 Public IP | `________________` |
| EC2 Key Pair | `________________.pem` |
| S3 Bucket Name | `dearosagyefo.com` |
| S3 Website URL | `http://________________` |
| API Base URL | `http://________________:3000` |
| AWS Region | `us-east-1` |
| CloudFront URL | `________________` (if configured) |
| Custom Domain | `________________` (if configured) |

---

## ✅ Deployment Complete!

- [ ] All checklist items completed
- [ ] Website is live and functional
- [ ] Backend API is running
- [ ] Users can access the site
- [ ] Documentation saved for future reference

**Deployment Date:** _______________

**Deployed By:** _______________

**Notes:**
```
_______________________________________________
_______________________________________________
_______________________________________________
```

---

🎉 **Congratulations! Your Dear Osagyefo platform is now live!**
