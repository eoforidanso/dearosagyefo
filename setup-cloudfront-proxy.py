#!/usr/bin/env python3
"""
CloudFront API Proxy Configuration Script

This script automates adding an EC2 backend origin and /api/* behavior to CloudFront.
"""

import json
import subprocess
import sys

DISTRIBUTION_ID = "E58CG4PIUEE3V"
EC2_DOMAIN = "api.dearosagyefo.com"  # DNS record pointing to EC2
EC2_PORT = 3000

def run_command(cmd, capture=True):
    """Run shell command and return output"""
    print(f"Running: {' '.join(cmd)}")
    if capture:
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode != 0:
            print(f"Error: {result.stderr}")
            sys.exit(1)
        return result.stdout.strip()
    else:
        subprocess.run(cmd, check=True)

def get_distribution_config():
    """Fetch current CloudFront configuration"""
    print("\n📥 Fetching CloudFront configuration...")
    
    # Get config
    config_json = run_command([
        "aws", "cloudfront", "get-distribution-config",
        "--id", DISTRIBUTION_ID,
        "--query", "DistributionConfig"
    ])
    
    # Get ETag
    etag = run_command([
        "aws", "cloudfront", "get-distribution-config",
        "--id", DISTRIBUTION_ID,
        "--query", "ETag",
        "--output", "text"
    ])
    
    return json.loads(config_json), etag

def add_ec2_origin(config):
    """Add EC2 as a custom origin"""
    print("\n🔧 Adding EC2 backend origin...")
    
    ec2_origin = {
        "Id": "EC2-Backend",
        "DomainName": EC2_DOMAIN,
        "OriginPath": "",
        "CustomHeaders": {
            "Quantity": 0,
            "Items": []
        },
        "CustomOriginConfig": {
            "HTTPPort": EC2_PORT,
            "HTTPSPort": 443,
            "OriginProtocolPolicy": "http-only",
            "OriginSslProtocols": {
                "Quantity": 1,
                "Items": ["TLSv1.2"]
            },
            "OriginReadTimeout": 30,
            "OriginKeepaliveTimeout": 5
        }
    }
    
    # Check if EC2 origin already exists
    existing_ids = [origin["Id"] for origin in config["Origins"]["Items"]]
    if "EC2-Backend" in existing_ids:
        print("   ℹ️  EC2 origin already exists, skipping...")
        return False
    
    # Add origin
    config["Origins"]["Items"].append(ec2_origin)
    config["Origins"]["Quantity"] = len(config["Origins"]["Items"])
    print(f"   ✅ Added EC2 origin: {EC2_DOMAIN}:{EC2_PORT}")
    return True

def add_api_behavior(config):
    """Add /api/* cache behavior"""
    print("\n🔧 Adding /api/* behavior...")
    
    # Initialize CacheBehaviors if it doesn't exist
    if "CacheBehaviors" not in config:
        config["CacheBehaviors"] = {"Quantity": 0, "Items": []}
    
    # Check if Items exists, if not create it
    if "Items" not in config["CacheBehaviors"]:
        config["CacheBehaviors"]["Items"] = []
    
    # Check if /api/* behavior already exists
    existing_patterns = [b.get("PathPattern", "") for b in config["CacheBehaviors"]["Items"]]
    if "/api/*" in existing_patterns:
        print("   ℹ️  /api/* behavior already exists, skipping...")
        return False
    
    api_behavior = {
        "PathPattern": "/api/*",
        "TargetOriginId": "EC2-Backend",
        "TrustedSigners": {
            "Enabled": False,
            "Quantity": 0
        },
        "TrustedKeyGroups": {
            "Enabled": False,
            "Quantity": 0
        },
        "ViewerProtocolPolicy": "redirect-to-https",
        "AllowedMethods": {
            "Quantity": 7,
            "Items": ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
            "CachedMethods": {
                "Quantity": 2,
                "Items": ["GET", "HEAD"]
            }
        },
        "SmoothStreaming": False,
        "Compress": False,
        "LambdaFunctionAssociations": {
            "Quantity": 0
        },
        "FunctionAssociations": {
            "Quantity": 0
        },
        "FieldLevelEncryptionId": "",
        "ForwardedValues": {
            "QueryString": True,
            "Cookies": {
                "Forward": "all"
            },
            "Headers": {
                "Quantity": 5,
                "Items": ["Authorization", "Content-Type", "x-admin-secret", "Origin", "Accept"]
            },
            "QueryStringCacheKeys": {
                "Quantity": 0
            }
        },
        "MinTTL": 0,
        "DefaultTTL": 0,
        "MaxTTL": 0
    }
    
    # Add behavior
    config["CacheBehaviors"]["Items"].append(api_behavior)
    config["CacheBehaviors"]["Quantity"] = len(config["CacheBehaviors"]["Items"])
    print("   ✅ Added /api/* → EC2-Backend behavior")
    return True

def update_distribution(config, etag):
    """Update CloudFront distribution"""
    print("\n📤 Updating CloudFront distribution...")
    
    # Save config to temp file
    with open("cf-config-updated.json", "w") as f:
        json.dump(config, f, indent=2)
    
    # Update distribution
    run_command([
        "aws", "cloudfront", "update-distribution",
        "--id", DISTRIBUTION_ID,
        "--if-match", etag,
        "--distribution-config", "file://cf-config-updated.json"
    ])
    
    print("   ✅ CloudFront distribution updated!")
    print(f"   ℹ️  Distribution ID: {DISTRIBUTION_ID}")

def wait_for_deployment():
    """Wait for CloudFront deployment to complete"""
    print("\n⏳ Waiting for deployment (this takes 5-10 minutes)...")
    print("   You can check status with:")
    print(f"   aws cloudfront get-distribution --id {DISTRIBUTION_ID} --query 'Distribution.Status'")

def upload_api_config():
    """Upload updated api-config.js to S3"""
    print("\n📤 Uploading api-config.js to S3...")
    
    run_command([
        "aws", "s3", "cp",
        "api-config.js",
        "s3://dearosagyefo.com/api-config.js"
    ])
    
    print("   ✅ Uploaded api-config.js")
    
    # Invalidate cache
    print("\n🔄 Invalidating CloudFront cache...")
    result = run_command([
        "aws", "cloudfront", "create-invalidation",
        "--distribution-id", DISTRIBUTION_ID,
        "--paths", "/api-config.js"
    ])
    
    invalidation = json.loads(result)
    print(f"   ✅ Invalidation created: {invalidation['Invalidation']['Id']}")

def main():
    print("=" * 60)
    print("CloudFront API Proxy Configuration")
    print("=" * 60)
    
    # Get current config
    config, etag = get_distribution_config()
    
    # Make changes
    origin_added = add_ec2_origin(config)
    behavior_added = add_api_behavior(config)
    
    if not origin_added and not behavior_added:
        print("\n✅ Configuration already complete! No changes needed.")
        return
    
    # Update CloudFront
    update_distribution(config, etag)
    
    # Upload api-config.js
    upload_api_config()
    
    # Instructions
    wait_for_deployment()
    
    print("\n" + "=" * 60)
    print("✅ SETUP COMPLETE!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Wait 5-10 minutes for CloudFront to deploy")
    print("2. Test API: curl https://dearosagyefo.com/api/public/letters")
    print("3. Try logging in: https://dearosagyefo.com/login.html")
    print("\n📝 Config saved to: cf-config-updated.json")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        sys.exit(1)
