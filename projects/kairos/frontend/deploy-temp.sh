#!/bin/bash
# Deploy Kairos Weather Frontend to kairos.gr (temporary without SSL)

set -e

echo "🚀 Deploying Kairos Weather Frontend (HTTP only for now)..."

# Build the frontend
echo "📦 Building frontend..."
npm run build

# Create web directory
echo "📁 Creating web directory..."
sudo mkdir -p /var/www/kairos.gr

# Copy files to web directory
echo "📋 Copying files..."
sudo cp -r dist/* /var/www/kairos.gr/

# Set proper permissions
echo "🔒 Setting permissions..."
sudo chown -R www-data:www-data /var/www/kairos.gr
sudo chmod -R 755 /var/www/kairos.gr

# Remove old config if exists
if [ -f /etc/nginx/sites-enabled/kairos.gr ]; then
    echo "🗑️ Removing old configuration..."
    sudo rm /etc/nginx/sites-enabled/kairos.gr
fi

# Copy temporary nginx config
echo "📝 Installing temporary nginx configuration..."
sudo cp deployments/nginx/kairos.gr-temp.conf /etc/nginx/sites-available/kairos.gr
sudo ln -sf /etc/nginx/sites-available/kairos.gr /etc/nginx/sites-enabled/

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
sudo nginx -t

# Reload nginx
echo "🔄 Reloading nginx..."
sudo systemctl reload nginx

echo "✅ Deployment complete!"
echo "🌐 Visit http://kairos.gr to see your site"
echo ""
echo "⚠️  Next steps:"
echo "1. Set up DNS: Point kairos.gr to this server's IP"
echo "2. Install SSL certificate:"
echo "   sudo certbot --nginx -d kairos.gr -d www.kairos.gr"
echo "3. Update nginx config to use HTTPS"