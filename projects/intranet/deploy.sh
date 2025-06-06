#!/bin/bash

# Intranet Deployment Script
# This script builds and deploys both the React frontend and Go backend
# Usage: sudo ./deploy.sh [environment]
# Example: sudo ./deploy.sh production

set -e  # Exit on error

# Configuration
ENVIRONMENT=${1:-production}  # Default to production if not specified
DOMAIN="site.epsilonhellas.com/intranet"
API_PORT="8080"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if running as sudo for systemctl commands
if [ "$EUID" -ne 0 ]; then 
    print_error "Please run this script with sudo"
    exit 1
fi

print_status "Starting Intranet deployment..."

# 1. Build the Go backend
print_status "Building Go backend..."
cd /opt/projects/intranet

# Check if go.mod exists
if [ ! -f "go.mod" ]; then
    print_error "go.mod not found. Are you in the correct directory?"
    exit 1
fi

# Build the Go binary
go build -o bin/intranet-api cmd/api/main.go
if [ $? -eq 0 ]; then
    print_status "Go backend built successfully"
else
    print_error "Failed to build Go backend"
    exit 1
fi

# 2. Configure and Build the React frontend
print_status "Building React frontend..."
cd /opt/projects/intranet/intranet

# Check if package.json exists
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Are you in the correct directory?"
    exit 1
fi

# Check and update API baseURL if needed
print_status "Checking API configuration..."
API_CONFIG_FILE="src/lib/api.ts"
if [ -f "$API_CONFIG_FILE" ]; then
    CURRENT_BASE_URL=$(grep -o "baseURL:.*'[^']*'" "$API_CONFIG_FILE" | cut -d"'" -f2)
    EXPECTED_BASE_URL="https://site.epsilonhellas.com/intranet/api/"
    
    if [ "$CURRENT_BASE_URL" != "$EXPECTED_BASE_URL" ]; then
        print_warning "API baseURL needs updating:"
        print_warning "  Current:  $CURRENT_BASE_URL"
        print_warning "  Expected: $EXPECTED_BASE_URL"
        
        # Backup the file
        cp "$API_CONFIG_FILE" "$API_CONFIG_FILE.backup"
        
        # Update the baseURL
        sed -i "s|baseURL:.*'[^']*'|baseURL: '$EXPECTED_BASE_URL'|g" "$API_CONFIG_FILE"
        
        print_status "API baseURL updated to: $EXPECTED_BASE_URL"
    else
        print_status "API baseURL is correct: $CURRENT_BASE_URL"
    fi
else
    print_error "API configuration file not found at $API_CONFIG_FILE"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_status "Installing npm dependencies..."
    npm install
fi

# Build the React app
npm run build
if [ $? -eq 0 ]; then
    print_status "React frontend built successfully"
    
    # Show the new build hash
    NEW_JS=$(ls -1 dist/assets/index-*.js 2>/dev/null | head -1 | xargs basename)
    print_status "New JS file: $NEW_JS"
else
    print_error "Failed to build React frontend"
    exit 1
fi

# 3. Stop services
print_status "Stopping services..."
systemctl stop intranet-api
print_status "intranet-api service stopped"

# 4. Deploy the new binary
print_status "Deploying new Go binary..."
cp /opt/projects/intranet/bin/intranet-api /opt/projects/intranet/bin/intranet-api.backup
print_status "Backup created at /opt/projects/intranet/bin/intranet-api.backup"

# 5. Start the backend service
print_status "Starting intranet-api service..."
systemctl start intranet-api
sleep 2

# Check if service started successfully
if systemctl is-active --quiet intranet-api; then
    print_status "intranet-api service started successfully"
else
    print_error "Failed to start intranet-api service"
    print_status "Checking logs..."
    journalctl -u intranet-api -n 20 --no-pager
    exit 1
fi

# 6. Reload nginx to clear any caches
print_status "Reloading nginx..."
nginx -t  # Test configuration first
if [ $? -eq 0 ]; then
    systemctl reload nginx
    print_status "Nginx reloaded successfully"
else
    print_error "Nginx configuration test failed"
    exit 1
fi

# 7. Clear any server-side caches (if applicable)
print_status "Clearing server-side caches..."

# If you have Redis or other caching systems, clear them here
# For example:
# redis-cli FLUSHDB

# 8. Test the deployment
print_status "Testing deployment..."

# Test the API health endpoint
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health)
if [ "$API_HEALTH" = "200" ]; then
    print_status "API health check passed"
else
    print_error "API health check failed (HTTP $API_HEALTH)"
fi

# Test the frontend
FRONTEND_CHECK=$(curl -s -o /dev/null -w "%{http_code}" https://site.epsilonhellas.com/intranet/)
if [ "$FRONTEND_CHECK" = "200" ]; then
    print_status "Frontend check passed"
else
    print_warning "Frontend check returned HTTP $FRONTEND_CHECK"
fi

# 9. Show service status
print_status "Current service status:"
systemctl status intranet-api --no-pager | head -10

# 10. Show recent logs
print_status "Recent API logs:"
journalctl -u intranet-api -n 10 --no-pager

# 11. Cache verification
print_status "Verifying deployment and cache status..."
echo ""

# Check what nginx is serving vs what we just built
SERVED_HTML=$(curl -s https://site.epsilonhellas.com/intranet/)
SERVED_JS=$(echo "$SERVED_HTML" | grep -o 'index-[^"]*\.js' | head -1)
LOCAL_JS=$(ls -1 /opt/projects/intranet/intranet/dist/assets/index-*.js 2>/dev/null | head -1 | xargs basename)

echo "Cache Status:"
echo "  Local build:  $LOCAL_JS"
echo "  Nginx serves: $SERVED_JS"

if [ "$LOCAL_JS" = "$SERVED_JS" ]; then
    print_status "✓ Cache is up to date - nginx is serving the latest build"
else
    print_warning "✗ Cache mismatch detected!"
    print_warning "  Nginx might still be serving old files"
    print_warning "  Trying additional cache clear..."
    
    # Force nginx to reload
    systemctl stop nginx
    sleep 1
    systemctl start nginx
    
    # Check again
    sleep 2
    SERVED_HTML=$(curl -s https://site.epsilonhellas.com/intranet/)
    SERVED_JS=$(echo "$SERVED_HTML" | grep -o 'index-[^"]*\.js' | head -1)
    
    if [ "$LOCAL_JS" = "$SERVED_JS" ]; then
        print_status "✓ Cache cleared successfully after nginx restart"
    else
        print_error "Cache still not updated. Manual intervention may be required."
    fi
fi

# Check API configuration in the built file
print_status "Checking API configuration in built files..."
if [ -f "/opt/projects/intranet/intranet/dist/assets/$LOCAL_JS" ]; then
    if grep -q "site.epsilonhellas.com/intranet/api" "/opt/projects/intranet/intranet/dist/assets/$LOCAL_JS"; then
        print_status "✓ API baseURL is correct in built files"
    else
        print_error "✗ API baseURL might be incorrect in built files"
    fi
fi

# 12. Reminder about browser caching
echo ""
print_warning "IMPORTANT: Users may need to clear their browser cache!"
print_warning "Instruct users to:"
print_warning "  1. Open Chrome DevTools (F12)"
print_warning "  2. Right-click the Refresh button"
print_warning "  3. Select 'Empty Cache and Hard Reload'"
echo ""

print_status "Deployment completed successfully!"
print_status "Frontend URL: https://site.epsilonhellas.com/intranet/"
print_status "API URL: https://site.epsilonhellas.com/intranet/api/"
echo ""
print_status "Build files:"
print_status "  JS:  $LOCAL_JS"
print_status "  CSS: $(ls -1 /opt/projects/intranet/intranet/dist/assets/index-*.css 2>/dev/null | head -1 | xargs basename)"

# Optional: Send notification (Slack, email, etc.)
# curl -X POST -H 'Content-type: application/json' \
#   --data '{"text":"Intranet deployment completed successfully!"}' \
#   YOUR_SLACK_WEBHOOK_URL