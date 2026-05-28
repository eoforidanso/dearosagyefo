# CloudFront API Proxy Setup

This guide sets up CloudFront to proxy API requests to your EC2 backend.

## How it works

1. **User visits**: `https://dearosagyefo.com`
2. **Frontend calls**: `/api/public/letters` (relative path, no IP address)
3. **CloudFront receives**: `https://dearosagyefo.com/api/public/letters`
4. **CloudFront forwards**: → `http://3.89.242.41:3000/api/public/letters`
5. **EC2 responds**: ← data
6. **User receives**: secure HTTPS response

## Setup Steps

### Step 1: Get current CloudFront config

```bash
aws cloudfront get-distribution-config --id E58CG4PIUEE3V --query 'DistributionConfig' > cf-config.json
aws cloudfront get-distribution-config --id E58CG4PIUEE3V --query 'ETag' --output text > cf-etag.txt
```

### Step 2: Add EC2 origin (manual edit required)

Open `cf-config.json` and find the `"Origins"` section. Add this new origin:

```json
{
  "Id": "EC2-Backend",
  "DomainName": "3.89.242.41",
  "CustomOriginConfig": {
    "HTTPPort": 3000,
    "HTTPSPort": 443,
    "OriginProtocolPolicy": "http-only"
  }
}
```

**Result:** Your `"Origins"` should have 2 items now (S3 + EC2).

### Step 3: Add API behavior (manual edit required)

In `cf-config.json`, find `"CacheBehaviors"` and add:

```json
{
  "PathPattern": "/api/*",
  "TargetOriginId": "EC2-Backend",
  "ViewerProtocolPolicy": "redirect-to-https",
  "AllowedMethods": {
    "Quantity": 7,
    "Items": ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
    "CachedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"]
    }
  },
  "Compress": false,
  "ForwardedValues": {
    "QueryString": true,
    "Cookies": {
      "Forward": "all"
    },
    "Headers": {
      "Quantity": 4,
      "Items": ["Authorization", "Content-Type", "x-admin-secret", "Origin"]
    }
  },
  "MinTTL": 0,
  "DefaultTTL": 0,
  "MaxTTL": 0
}
```

### Step 4: Update CloudFront

```bash
aws cloudfront update-distribution \
  --id E58CG4PIUEE3V \
  --if-match $(cat cf-etag.txt) \
  --distribution-config file://cf-config.json
```

### Step 5: Upload updated api-config.js

```bash
aws s3 cp api-config.js s3://dearosagyefo.com/
aws cloudfront create-invalidation --distribution-id E58CG4PIUEE3V --paths "/api-config.js"
```

### Step 6: Wait for deployment

```bash
aws cloudfront get-distribution --id E58CG4PIUEE3V --query 'Distribution.Status'
# Wait until it says "Deployed" (5-10 minutes)
```

## Testing

Once deployed:

```bash
# Test API through CloudFront
curl https://dearosagyefo.com/api/public/letters

# Should return the same as:
curl http://3.89.242.41:3000/api/public/letters
```

## Security Benefits

✅ No need to open EC2 port 3000 to public  
✅ All traffic encrypted (HTTPS)  
✅ No mixed content warnings  
✅ CloudFront caching for better performance  
✅ DDoS protection via CloudFront  

## Next Steps

After CloudFront deploys, test login at:
- https://dearosagyefo.com/login.html
