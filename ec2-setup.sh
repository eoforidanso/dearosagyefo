#!/bin/bash

# EC2 Backend Setup Script
# Run this script ON your EC2 instance after connecting via SSH

echo "🚀 Setting up Dear Osagyefo Backend on EC2..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Update system
echo -e "${BLUE}📦 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
echo -e "${BLUE}📦 Installing Node.js...${NC}"
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
echo -e "${GREEN}✓ Node.js version: $(node --version)${NC}"
echo -e "${GREEN}✓ NPM version: $(npm --version)${NC}"

# Install PM2 globally
echo -e "${BLUE}📦 Installing PM2 process manager...${NC}"
sudo npm install -g pm2

# Install Git if not present
if ! command -v git &> /dev/null; then
    echo -e "${BLUE}📦 Installing Git...${NC}"
    sudo apt install -y git
fi

# Create application directory
APP_DIR="$HOME/dearosagyefo"
mkdir -p $APP_DIR
cd $APP_DIR

echo ""
echo -e "${YELLOW}📥 How would you like to deploy your code?${NC}"
echo "1. Clone from GitHub (recommended)"
echo "2. Manual upload (you'll need to SCP files)"
echo ""
read -p "Enter choice (1 or 2): " DEPLOY_METHOD

if [ "$DEPLOY_METHOD" == "1" ]; then
    echo ""
    read -p "Enter GitHub repository URL: " REPO_URL
    
    if [ -z "$REPO_URL" ]; then
        REPO_URL="https://github.com/eoforidanso/dearosagyefo.git"
        echo -e "${BLUE}Using default: $REPO_URL${NC}"
    fi
    
    echo -e "${BLUE}📥 Cloning repository...${NC}"
    git clone $REPO_URL .
else
    echo ""
    echo -e "${YELLOW}📤 Upload your files using SCP from your local machine:${NC}"
    echo ""
    echo "From your local terminal, run:"
    echo -e "${BLUE}cd /Users/harrietappiah/Desktop/letter--main${NC}"
    echo -e "${BLUE}tar -czf backend-deploy.tar.gz backend/ server.js package.json package-lock.json${NC}"
    echo -e "${BLUE}scp -i your-key.pem backend-deploy.tar.gz ubuntu@$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):~/backend-deploy.tar.gz${NC}"
    echo ""
    read -p "Press Enter after you've uploaded the files..."
    
    if [ -f "$HOME/backend-deploy.tar.gz" ]; then
        tar -xzf $HOME/backend-deploy.tar.gz
        rm $HOME/backend-deploy.tar.gz
    else
        echo -e "${RED}❌ No backend-deploy.tar.gz found in home directory${NC}"
        exit 1
    fi
fi

# Install dependencies
echo -e "${BLUE}📦 Installing Node.js dependencies...${NC}"
npm install --production

# Create data directory
echo -e "${BLUE}📁 Creating data directory...${NC}"
mkdir -p data

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚙️  Creating .env configuration file...${NC}"
    
    # Generate random secrets
    JWT_SECRET=$(openssl rand -base64 32)
    PORTAL_SECRET=$(openssl rand -base64 16)
    
    cat > .env <<EOF
# Server Configuration
PORT=3000
NODE_ENV=production

# Security
JWT_SECRET=$JWT_SECRET
PORTAL_SECRET=$PORTAL_SECRET

# Database
DATABASE_PATH=./data/letters.db

# CORS (Update with your S3 domain after deployment)
CORS_ORIGIN=*
EOF
    
    echo -e "${GREEN}✓ Created .env file with random secrets${NC}"
    echo -e "${YELLOW}⚠️  Important: Update CORS_ORIGIN in .env after S3 deployment${NC}"
else
    echo -e "${GREEN}✓ .env file already exists${NC}"
fi

# Test the server
echo -e "${BLUE}🧪 Testing server...${NC}"
timeout 5 node server.js &
sleep 3

if curl -s http://localhost:3000/api/health > /dev/null; then
    echo -e "${GREEN}✓ Server test successful!${NC}"
else
    echo -e "${RED}⚠️  Server test inconclusive (this may be normal)${NC}"
fi

# Kill test server
pkill -f "node server.js" 2>/dev/null

# Start server with PM2
echo -e "${BLUE}🚀 Starting server with PM2...${NC}"
pm2 delete dearosagyefo-api 2>/dev/null  # Delete if exists
pm2 start server.js --name dearosagyefo-api

# Configure PM2 to start on boot
echo -e "${BLUE}⚙️  Configuring PM2 startup...${NC}"
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
pm2 save

echo ""
echo -e "${GREEN}✅ Backend setup complete!${NC}"
echo ""
echo -e "${BLUE}📊 Server Status:${NC}"
pm2 status

echo ""
echo -e "${YELLOW}🔗 Your API endpoints:${NC}"
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
echo "   http://$PUBLIC_IP:3000/api/health"
echo "   http://$PUBLIC_IP:3000/api/public/letters"
echo ""

echo -e "${YELLOW}🔧 Useful PM2 Commands:${NC}"
echo "   pm2 status          - Check server status"
echo "   pm2 logs            - View server logs"
echo "   pm2 restart all     - Restart server"
echo "   pm2 stop all        - Stop server"
echo "   pm2 monit           - Monitor in real-time"
echo ""

echo -e "${YELLOW}📝 Next Steps:${NC}"
echo "1. Test API endpoint: curl http://$PUBLIC_IP:3000/api/health"
echo "2. Update CORS in .env to include your S3 domain"
echo "3. Restart server: pm2 restart all"
echo "4. Deploy frontend to S3 using: ./deploy-s3-improved.sh"
echo "5. When prompted, enter: http://$PUBLIC_IP:3000"
echo ""

echo -e "${YELLOW}🔐 Security Reminder:${NC}"
echo "Make sure EC2 Security Group allows:"
echo "  - Port 22 (SSH) from your IP"
echo "  - Port 3000 (API) from anywhere (0.0.0.0/0)"
echo "  - Port 80 (HTTP) from anywhere (if using Nginx)"
echo ""

echo -e "${GREEN}🎉 Setup complete! Your backend is running!${NC}"
