# DNS Fix: Connect Google Domains to AWS Route53

## Problem
Your domain `dearosagyefo.com` is registered with Google Domains but DNS records are in AWS Route53. They're not connected!

**Current Name Servers (Google):**
- ns-cloud-c1.googledomains.com
- ns-cloud-c2.googledomains.com
- ns-cloud-c3.googledomains.com
- ns-cloud-c4.googledomains.com

**Required Name Servers (AWS Route53):**
- ns-94.awsdns-11.com
- ns-687.awsdns-21.net
- ns-1208.awsdns-23.org
- ns-1944.awsdns-51.co.uk

---

## Solution: Update Name Servers

### Option A: Google Domains (If still active)

1. Go to https://domains.google.com
2. Click on `dearosagyefo.com`
3. Click **DNS** in the left menu
4. Scroll to **Name servers**
5. Click **Use custom name servers**
6. Enter these 4 name servers:
   ```
   ns-94.awsdns-11.com
   ns-687.awsdns-21.net
   ns-1208.awsdns-23.org
   ns-1944.awsdns-51.co.uk
   ```
7. Click **Save**

### Option B: Squarespace Domains (If Google Domains migrated)

Google Domains was sold to Squarespace. If your domain migrated:

1. Go to https://domains.squarespace.com
2. Find `dearosagyefo.com`
3. Go to **DNS Settings**
4. Change **Name Servers** to:
   ```
   ns-94.awsdns-11.com
   ns-687.awsdns-21.net
   ns-1208.awsdns-23.org
   ns-1944.awsdns-51.co.uk
   ```
5. Save changes

---

## Verify After Changing

Wait 5-60 minutes, then run:

```bash
# Check name servers
dig NS dearosagyefo.com +short

# Should show AWS name servers:
# ns-94.awsdns-11.com.
# ns-687.awsdns-21.net.
# ns-1208.awsdns-23.org.
# ns-1944.awsdns-51.co.uk.
```

Once name servers are correct, test the site:

```bash
# Should resolve to CloudFront IPs
dig dearosagyefo.com +short

# Should load the site
curl -I https://dearosagyefo.com
```

---

## Alternative: Use Google Domains DNS (Not Recommended)

If you want to keep using Google Domains for DNS, you'd need to:
1. Delete the Route53 hosted zone
2. Manually recreate all DNS records in Google Domains:
   - A record: `@` → CloudFront distribution
   - A record: `www` → CloudFront distribution
   - A record: `api` → `3.89.242.41`

**This is more complex** because Google Domains doesn't support ALIAS records to CloudFront easily. AWS Route53 is the better choice.

---

## Timeline

- **Name server update**: Immediate at registrar
- **Propagation**: 5-60 minutes globally
- **Full DNS cache clear**: Up to 48 hours (but usually much faster)

---

**Recommended**: Update to AWS Route53 name servers. All your DNS records are already configured there!
