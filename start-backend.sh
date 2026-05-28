#!/bin/bash

# Backend Setup and Start Script for Dear Osagyefo
# This script sets up and starts the backend server

echo "🇬🇭 Dear Osagyefo - Backend Setup Script"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  No .env file found. Creating one..."
    cat > .env << EOF
PORT=3000
JWT_SECRET=$(openssl rand -hex 32)
PORTAL_SECRET=$(openssl rand -hex 32)
NODE_ENV=development
EOF
    echo "✅ Created .env file with secure random secrets"
else
    echo "✅ .env file already exists"
fi
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo ""

# Create data directory
if [ ! -d "data" ]; then
    echo "📁 Creating data directory..."
    mkdir -p data
    echo "✅ Data directory created"
else
    echo "✅ Data directory exists"
fi
echo ""

# Start the server
echo "🚀 Starting backend server..."
echo "   Server will be available at: http://localhost:3000"
echo "   API endpoint: http://localhost:3000/api"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start
