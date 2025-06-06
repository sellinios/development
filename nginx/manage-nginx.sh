#!/bin/bash

# Nginx Management Script for Development Environment
# This script helps manage nginx configurations centrally

NGINX_DEV_DIR="/home/sellinios/development/nginx/sites-available"
NGINX_SITES_AVAILABLE="/etc/nginx/sites-available"
NGINX_SITES_ENABLED="/etc/nginx/sites-enabled"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to list all sites
list_sites() {
    echo "=== Development Nginx Configurations ==="
    ls -la $NGINX_DEV_DIR/
    echo ""
    echo "=== System Nginx Sites Available ==="
    ls -la $NGINX_SITES_AVAILABLE/
    echo ""
    echo "=== Enabled Sites ==="
    ls -la $NGINX_SITES_ENABLED/
}

# Function to deploy a site configuration
deploy_site() {
    local site=$1
    if [ -z "$site" ]; then
        print_error "Please specify a site name"
        return 1
    fi
    
    if [ ! -f "$NGINX_DEV_DIR/$site" ]; then
        print_error "Site configuration not found: $NGINX_DEV_DIR/$site"
        return 1
    fi
    
    # Copy to sites-available
    sudo cp "$NGINX_DEV_DIR/$site" "$NGINX_SITES_AVAILABLE/$site"
    print_status "Copied $site to nginx sites-available"
    
    # Test configuration
    sudo nginx -t
    if [ $? -eq 0 ]; then
        print_status "Nginx configuration test passed"
    else
        print_error "Nginx configuration test failed"
        return 1
    fi
}

# Function to enable a site
enable_site() {
    local site=$1
    if [ -z "$site" ]; then
        print_error "Please specify a site name"
        return 1
    fi
    
    if [ ! -f "$NGINX_SITES_AVAILABLE/$site" ]; then
        print_error "Site not found in sites-available: $site"
        return 1
    fi
    
    if [ -L "$NGINX_SITES_ENABLED/$site" ]; then
        print_warning "Site already enabled: $site"
        return 0
    fi
    
    sudo ln -s "$NGINX_SITES_AVAILABLE/$site" "$NGINX_SITES_ENABLED/$site"
    print_status "Enabled site: $site"
    
    sudo systemctl reload nginx
    print_status "Nginx reloaded"
}

# Function to disable a site
disable_site() {
    local site=$1
    if [ -z "$site" ]; then
        print_error "Please specify a site name"
        return 1
    fi
    
    if [ ! -L "$NGINX_SITES_ENABLED/$site" ]; then
        print_warning "Site not enabled: $site"
        return 0
    fi
    
    sudo rm "$NGINX_SITES_ENABLED/$site"
    print_status "Disabled site: $site"
    
    sudo systemctl reload nginx
    print_status "Nginx reloaded"
}

# Function to test nginx configuration
test_config() {
    sudo nginx -t
}

# Function to reload nginx
reload_nginx() {
    sudo systemctl reload nginx
    print_status "Nginx reloaded"
}

# Function to show site status
show_status() {
    echo "=== Nginx Service Status ==="
    sudo systemctl status nginx --no-pager | head -10
    echo ""
    echo "=== Port Usage ==="
    sudo lsof -i :80 -i :443 -i :8080 -i :8001 -i :3000 | grep LISTEN
}

# Main menu
case "$1" in
    list)
        list_sites
        ;;
    deploy)
        deploy_site "$2"
        ;;
    enable)
        enable_site "$2"
        ;;
    disable)
        disable_site "$2"
        ;;
    test)
        test_config
        ;;
    reload)
        reload_nginx
        ;;
    status)
        show_status
        ;;
    *)
        echo "Nginx Management Script"
        echo ""
        echo "Usage: $0 {list|deploy|enable|disable|test|reload|status} [site-name]"
        echo ""
        echo "Commands:"
        echo "  list              - List all site configurations"
        echo "  deploy <site>     - Deploy a site from dev to nginx"
        echo "  enable <site>     - Enable a site"
        echo "  disable <site>    - Disable a site"
        echo "  test              - Test nginx configuration"
        echo "  reload            - Reload nginx"
        echo "  status            - Show nginx and port status"
        echo ""
        echo "Example:"
        echo "  $0 deploy api.kairos.gr"
        echo "  $0 enable api.kairos.gr"
        ;;
esac