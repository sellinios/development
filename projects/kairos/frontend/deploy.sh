#!/bin/bash
# Deploy Kairos Weather Frontend to kairos.gr

set -e

echo "🚀 Deploying Kairos Weather Frontend..."

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

# Copy nginx config if not exists
if [ ! -f /etc/nginx/sites-available/kairos.gr ]; then
    echo "📝 Installing nginx configuration..."
    sudo cp deployments/nginx/kairos.gr.conf /etc/nginx/sites-available/kairos.gr
    sudo ln -sf /etc/nginx/sites-available/kairos.gr /etc/nginx/sites-enabled/
fi

# Test nginx configuration
echo "🧪 Testing nginx configuration..."
sudo nginx -t

# Reload nginx
echo "🔄 Reloading nginx..."
sudo systemctl reload nginx

echo "✅ Deployment complete!"
echo "🌐 Visit https://kairos.gr to see your site"