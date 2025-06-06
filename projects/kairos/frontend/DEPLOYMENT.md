# Deployment Guide for Kairos Weather Frontend

## Current Setup
- **Domain**: kairos.gr (managed by Cloudflare)
- **API**: api.kairos.gr (your backend server)
- **Frontend**: To be deployed on Cloudflare Pages

## Deployment Options

### Option 1: Cloudflare Pages (Recommended)

Since kairos.gr is already using Cloudflare, this is the best option:

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/kairos-weather-frontend.git
   git push -u origin main
   ```

2. **Deploy with Cloudflare Pages:**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Navigate to "Pages"
   - Click "Create a project"
   - Connect your GitHub repository
   - Configure build settings:
     - Build command: `npm run build`
     - Build output directory: `dist`
   - Click "Save and Deploy"

3. **Configure Custom Domain:**
   - In Cloudflare Pages project settings
   - Go to "Custom domains"
   - Add `kairos.gr` and `www.kairos.gr`
   - Cloudflare will automatically configure DNS

### Option 2: Manual Upload to Cloudflare Pages

1. **Build locally:**
   ```bash
   npm run build
   ```

2. **Upload via Dashboard:**
   - Go to Cloudflare Pages
   - Create new project
   - Upload `dist` folder
   - Configure custom domain as above

### Option 3: Deploy to Your Server

If you want to host on your own server instead:

1. **Update DNS in Cloudflare:**
   - Point kairos.gr A record to your server IP
   - Turn off Cloudflare proxy (gray cloud)

2. **Run deployment:**
   ```bash
   ./deploy.sh
   ```

3. **Install SSL:**
   ```bash
   sudo certbot --nginx -d kairos.gr -d www.kairos.gr
   ```

## Environment Variables

For production, update the API URL if needed:
- Create `.env.production` file
- Set `VITE_API_URL=https://api.kairos.gr`

## Current Status

The frontend is currently deployed on your server at `/var/www/kairos.gr` but since DNS is pointing to Cloudflare, you should use Cloudflare Pages for the best performance and integration.