# Google Cloud Deployment Guide

This guide will help you deploy the Letter to Osagyefo backend to Google Cloud Platform.

## Options

1. **Google Cloud Run** (Recommended - Easiest, serverless)
2. **Google App Engine** (Simple deployment)
3. **Google Cloud SQL** (For database migration)

---

## Option 1: Deploy to Google Cloud Run (Recommended)

Google Cloud Run is perfect for this project - serverless, auto-scaling, pay only for what you use.

### Prerequisites

- Google Cloud Account (free tier available)
- `gcloud` CLI installed: https://cloud.google.com/sdk/docs/install

### Step 1: Create a Google Cloud Project

```bash
# Login to Google Cloud
gcloud auth login

# Set your project ID
gcloud config set project YOUR_PROJECT_ID

# Or create a new project
gcloud projects create my-letter-app --name="Letter to Osagyefo"
gcloud config set project my-letter-app
```

### Step 2: Enable Required APIs

```bash
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### Step 3: Prepare for Deployment

Create a `.gcloudignore` file in the root directory:
```
# .gcloudignore
node_modules/
npm-debug.log
.git
.gitignore
```

Update `server.js` to use port from environment:
```javascript
const PORT = process.env.PORT || 3000;
```
(Already done in the provided server.js)

### Step 4: Deploy to Cloud Run

```bash
# From the project root directory
gcloud run deploy letter-to-osagyefo \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --timeout 3600
```

**Flags explained:**
- `--source .` - Deploy from current directory
- `--platform managed` - Use managed Cloud Run
- `--region us-central1` - US region (change as needed)
- `--allow-unauthenticated` - Publicly accessible
- `--memory 512Mi` - Memory allocation
- `--timeout 3600` - 1-hour timeout for PDF generation

### Step 5: Get Your URL

After deployment, you'll see the service URL. Example:
```
https://letter-to-osagyefo-xxxxx-uc.a.run.app
```

Update your frontend to use this URL:
```javascript
const API_BASE_URL = 'https://letter-to-osagyefo-xxxxx-uc.a.run.app/api';
```

---

## Option 2: Deploy to Google App Engine

App Engine is simpler but less flexible than Cloud Run.

### Step 1: Create `app.yaml`

```yaml
runtime: nodejs18

env: standard

entrypoint: npm start

handlers:
  - url: /.*
    script: auto

env_variables:
  JWT_SECRET: "your-secure-jwt-secret-here"
  NODE_ENV: "production"
```

### Step 2: Deploy

```bash
gcloud app deploy
```

Your app will be available at: `https://YOUR_PROJECT_ID.appspot.com`

---

## Option 3: Use Google Cloud SQL (For Production)

Replace SQLite with Cloud SQL for better scalability.

### Step 1: Create Cloud SQL Instance

```bash
gcloud sql instances create letter-db \
  --database-version=MYSQL_8_0 \
  --tier=db-f1-micro \
  --region=us-central1
```

### Step 2: Create Database

```bash
gcloud sql databases create letters --instance=letter-db
```

### Step 3: Create Database User

```bash
gcloud sql users create dbuser --instance=letter-db --password
```

### Step 4: Update Backend

Install MySQL driver:
```bash
npm install mysql2
```

Update `backend/config/database.js`:
```javascript
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.CLOUD_SQL_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 5
});

module.exports = pool.promise();
```

### Step 5: Update Cloud Run Deployment

```bash
gcloud run deploy letter-to-osagyefo \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars CLOUD_SQL_HOST=YOUR_CLOUD_SQL_IP,DB_USER=dbuser,DB_PASSWORD=YOUR_PASSWORD,DB_NAME=letters
```

---

## Environment Variables

Set these for your deployment:

```bash
# For Cloud Run
gcloud run services update letter-to-osagyefo \
  --set-env-vars JWT_SECRET=your-secure-secret,NODE_ENV=production
```

Or in `app.yaml`:
```yaml
env_variables:
  JWT_SECRET: "your-secure-jwt-secret"
  NODE_ENV: "production"
```

---

## Monitoring

### View Logs

```bash
# Cloud Run logs
gcloud run services log read letter-to-osagyefo --limit 50

# App Engine logs
gcloud app logs read
```

### Monitor Performance

Visit Google Cloud Console:
https://console.cloud.google.com

Monitor:
- CPU usage
- Memory usage
- Request rates
- Error rates

---

## Costs

### Cloud Run (Recommended)
- **Free tier**: 2 million requests/month + 360,000 GB-seconds/month
- **Cost after free tier**: $0.40 per 1M requests + $0.00001667 per GB-second

### App Engine
- **Free tier**: 28 frontend instance hours/day + 9 backend instance hours/day
- Cost after: ~$0.05-$0.10 per day

### Cloud SQL
- **db-f1-micro**: ~$9/month
- **db-n1-standard-1**: ~$100/month

---

## Custom Domain

### Set Up Custom Domain

1. Go to Cloud Run in Google Cloud Console
2. Click on your service
3. Go to "Manage Custom Domains"
4. Click "Add Mapping"
5. Follow the DNS setup instructions

Update DNS records with your registrar to point to Cloud Run IP.

---

## Advanced: Continuous Deployment

### Automatic Deployment on Git Push

Create `cloudbuild.yaml`:
```yaml
steps:
  # Build image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/letter-app', '.']
  
  # Push image
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/letter-app']
  
  # Deploy to Cloud Run
  - name: 'gcr.io/cloud-builders/gke-deploy'
    args: ['run', '-f=k8s/', '-i', 'gcr.io/$PROJECT_ID/letter-app', '-l', 'gke-center', '-n', 'production']
```

Connect your GitHub repo to Cloud Build for automatic deployments.

---

## Troubleshooting

### "Exec format error"
- Ensure Dockerfile is Linux-compatible
- Check Node.js version compatibility

### "Cannot find module"
- Run `npm install` before deploying
- Check `package.json` is in root directory

### "Port already in use"
- Cloud Run automatically assigns ports
- Use `process.env.PORT` in code

### Database connection fails
- Verify Cloud SQL IP whitelist
- Check environment variables are set
- Ensure SSL certificates are valid

### Slow PDF generation
- Increase timeout or memory
- Use different Puppeteer configuration
- Consider async PDF generation and storage

---

## Rollback Deployment

```bash
# Show recent revisions
gcloud run revisions list --service letter-to-osagyefo

# Traffic to specific revision
gcloud run services update-traffic letter-to-osagyefo --to-revisions REVISION_NAME=100
```

---

## Securing Your Deployment

1. **Update JWT Secret**
```bash
openssl rand -base64 32
```

2. **Set environment to production**
```bash
--set-env-vars NODE_ENV=production
```

3. **Enable Authentication (optional)**
```bash
gcloud run services remove-iam-policy-binding letter-to-osagyefo \
  --member allUsers \
  --role roles/run.invoker
```

4. **Use Secret Manager for sensitive data**
```bash
echo -n "your-jwt-secret" | gcloud secrets create jwt-secret --data-file=-

# Reference in Cloud Run
gcloud run services create letter-to-osagyefo \
  --set-env-vars JWT_SECRET=/run/secrets/jwt-secret
```

---

## Next Steps

1. Deploy your backend to Cloud Run
2. Update frontend API_BASE_URL
3. Test all API endpoints
4. Set up custom domain
5. Enable monitoring and logging
6. Consider database migration to Cloud SQL for production scale

---

## Support & Resources

- Google Cloud Documentation: https://cloud.google.com/docs
- Cloud Run Guide: https://cloud.google.com/run/docs
- App Engine Guide: https://cloud.google.com/appengine/docs
- Cloud SQL Documentation: https://cloud.google.com/sql/docs

**Your backend is Google Cloud ready! 🚀**
