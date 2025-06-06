# Nginx Configuration Management

This directory contains centralized nginx configurations for all development projects.

## Directory Structure

```
/nginx/
├── README.md                 # This file
├── NGINX_REGISTRY.md        # Domain mapping and port allocation
├── manage-nginx.sh          # Management script
└── sites-available/         # All nginx configurations
    ├── intranet.aethra.dev  # Intranet application
    ├── api.kairos.gr        # Kairos Weather API
    ├── kairos.gr            # Kairos frontend
    └── aethra.dev           # Main company site (TODO)
```

## Quick Start

### Using the Management Script

```bash
# List all configurations
./manage-nginx.sh list

# Deploy a configuration to nginx
./manage-nginx.sh deploy api.kairos.gr

# Enable a site
./manage-nginx.sh enable api.kairos.gr

# Disable a site
./manage-nginx.sh disable old-site.conf

# Test nginx configuration
./manage-nginx.sh test

# Reload nginx
./manage-nginx.sh reload

# Show status
./manage-nginx.sh status
```

## Current Domain Mapping

| Domain | Application | Port | Status |
|--------|-------------|------|--------|
| intranet.aethra.dev | Intranet (Frontend + API) | 8080 | ✅ Active |
| api.kairos.gr | Kairos Weather API | 8001 (planned) | 🔧 Maintenance |
| kairos.gr | Kairos Weather Frontend | Static | ✅ Active |
| aethra.dev | Company Website | 3000 | ❓ Needs config |

## Workflow

1. **Create/Edit Configuration**: Edit files in `sites-available/`
2. **Deploy**: Use `./manage-nginx.sh deploy <site>` to copy to nginx
3. **Enable**: Use `./manage-nginx.sh enable <site>` to activate
4. **Test**: Always test with `./manage-nginx.sh test`
5. **Reload**: Apply changes with `./manage-nginx.sh reload`

## Important Notes

- All configurations are stored here for version control
- Use the management script to deploy changes
- Always test before reloading nginx
- Check NGINX_REGISTRY.md for port allocations

## SSL/TLS Strategy

- **Cloudflare Proxied**: intranet.aethra.dev, aethra.dev
- **Direct SSL**: api.kairos.gr, kairos.gr (needs setup)

## Troubleshooting

### Site not loading
1. Check if site is enabled: `ls -la /etc/nginx/sites-enabled/`
2. Check nginx error logs: `sudo tail -f /var/log/nginx/error.log`
3. Test configuration: `sudo nginx -t`
4. Check if service is running on expected port: `sudo lsof -i :PORT`

### Port conflicts
- See NGINX_REGISTRY.md for port allocation
- Update service configurations to use assigned ports

Last updated: June 6, 2025