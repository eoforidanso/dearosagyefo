# Deploy to Glitch - Updated Instructions

## Option 1: Import from GitHub (Recommended)

1. **Go to Glitch**: https://glitch.com
2. **Sign in** with your GitHub account (if not already)
3. **Click your profile picture** (top right)
4. **Click "New Project"** from the dropdown
5. **Select "Import from GitHub"**
6. **Enter repository URL**: `https://github.com/eoforidanso/dearosagyefo`
7. **Wait for import** (may take 1-2 minutes)

## Option 2: Clone to Glitch Terminal

1. Go to https://glitch.com
2. Click "New Project" → "glitch-hello-node" (basic Node.js template)
3. Click "Tools" → "Terminal" at bottom
4. Run these commands:
   ```bash
   git remote add github https://github.com/eoforidanso/dearosagyefo.git
   git pull github main
   refresh
   ```

## After Import - Configure Environment Variables

1. Click **".env"** file in Glitch
2. Add these variables:
   ```
   JWT_SECRET=Gh@na-Osagyefo-Xk9mP2vL7wQ4rT8j2026
   PORTAL_SECRET=atokd
   ADMIN_SECRET=osagyefo-admin-review-2026
   NODE_ENV=production
   PORT=3000
   ```

## Check Your Live URL

- Click **"Share"** button (top right)
- Copy the **Live site** URL (format: `https://PROJECT-NAME.glitch.me`)
- Test: `https://PROJECT-NAME.glitch.me/login`

## Troubleshooting

If you don't see "Import from GitHub":
- Make sure you're signed in with GitHub
- Try: https://glitch.com/edit/#!/import/github/eoforidanso/dearosagyefo

## Alternative: Use Render.com (Free, Easy)

Render might be easier:
1. Go to https://render.com
2. Sign up with GitHub
3. "New" → "Web Service"
4. Connect: eoforidanso/dearosagyefo
5. Settings:
   - Build Command: `npm install`
   - Start Command: `node server.js`
6. Add environment variables (same as above)
7. Deploy!

Your site will be live at: `https://dearosagyefo.onrender.com`
