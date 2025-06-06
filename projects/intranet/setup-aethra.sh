#!/bin/bash

# Setup script for intranet.aethra.dev
# This script sets up the environment, builds the application, and configures the server

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

print_info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

# Check if running as sudo
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run this script with sudo"
    exit 1
fi

print_status "Starting setup for intranet.aethra.dev..."

# 1. Create necessary directories
print_status "Creating necessary directories..."
mkdir -p /home/sellinios/development/projects/intranet/bin
mkdir -p /home/sellinios/development/projects/intranet/uploads/media
mkdir -p /var/log/nginx

# 2. Set correct permissions
print_status "Setting permissions..."
chown -R www-data:www-data /home/sellinios/development/projects/intranet/uploads
chmod -R 755 /home/sellinios/development/projects/intranet/uploads

# 3. Build the Go backend
print_status "Building Go backend..."
cd /home/sellinios/development/projects/intranet
go build -o bin/intranet-api cmd/api/main.go
if [ $? -eq 0 ]; then
    print_status "Go backend built successfully"
else
    print_error "Failed to build Go backend"
    exit 1
fi

# 4. Install frontend dependencies and build
print_status "Installing frontend dependencies..."
cd /home/sellinios/development/projects/intranet/intranet
npm install

print_status "Building frontend..."
npm run build
if [ $? -eq 0 ]; then
    print_status "Frontend built successfully"
else
    print_error "Failed to build frontend"
    exit 1
fi

# 5. Copy systemd service file
print_status "Installing systemd service..."
cp /home/sellinios/development/projects/intranet/intranet-api.service /etc/systemd/system/
systemctl daemon-reload

# 6. Copy nginx configuration
print_status "Installing nginx configuration..."
cp /home/sellinios/development/projects/intranet/nginx-intranet-aethra.conf /etc/nginx/sites-available/intranet.aethra.dev.conf
ln -sf /etc/nginx/sites-available/intranet.aethra.dev.conf /etc/nginx/sites-enabled/

# 7. Test nginx configuration
print_status "Testing nginx configuration..."
nginx -t
if [ $? -ne 0 ]; then
    print_error "Nginx configuration test failed"
    exit 1
fi

# 8. Create SSL certificate (if not exists)
print_status "Checking SSL certificate..."
if [ ! -f "/etc/letsencrypt/live/aethra.dev/fullchain.pem" ]; then
    print_warning "SSL certificate not found for aethra.dev"
    print_info "You need to create an SSL certificate. Run:"
    print_info "  certbot certonly --nginx -d intranet.aethra.dev"
    print_info "Or if you want a wildcard certificate:"
    print_info "  certbot certonly --manual --preferred-challenges=dns -d *.aethra.dev -d aethra.dev"
fi

# 9. Start services
print_status "Starting services..."
systemctl start intranet-api
systemctl enable intranet-api

# 10. Reload nginx
print_status "Reloading nginx..."
systemctl reload nginx

# 11. Check service status
print_status "Checking service status..."
if systemctl is-active --quiet intranet-api; then
    print_status "intranet-api service is running"
else
    print_error "intranet-api service failed to start"
    journalctl -u intranet-api -n 20 --no-pager
    exit 1
fi

# 12. Test the deployment
print_status "Testing deployment..."
sleep 2

# Test API health
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health)
if [ "$API_HEALTH" = "200" ]; then
    print_status "API health check passed"
else
    print_error "API health check failed (HTTP $API_HEALTH)"
fi

# 13. Display summary
echo ""
print_status "Setup completed!"
echo ""
print_info "Service Status:"
systemctl status intranet-api --no-pager | head -5
echo ""
print_info "URLs:"
print_info "  Frontend: https://intranet.aethra.dev/"
print_info "  API: https://intranet.aethra.dev/api/"
print_info "  Health: https://intranet.aethra.dev/health"
echo ""
print_info "Logs:"
print_info "  API logs: journalctl -u intranet-api -f"
print_info "  Nginx access: tail -f /var/log/nginx/intranet.aethra.dev.access.log"
print_info "  Nginx error: tail -f /var/log/nginx/intranet.aethra.dev.error.log"
echo ""
print_warning "Next steps:"
print_warning "1. Ensure DNS is configured to point intranet.aethra.dev to this server"
print_warning "2. Create SSL certificate if not already done"
print_warning "3. Update firewall rules if needed (ports 80, 443)"
print_warning "4. Test the application at https://intranet.aethra.dev/"