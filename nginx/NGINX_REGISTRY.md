# Nginx Configuration Registry

This directory contains all nginx configurations for the development environment.

## Domain Mapping

| Domain | Type | Proxy Target | SSL | Config File | Status |
|--------|------|--------------|-----|-------------|--------|
| intranet.aethra.dev | Frontend + API | localhost:8080 (API) | Cloudflare Flexible | intranet.aethra.dev.conf | ✅ Active |
| api.kairos.gr | API | localhost:8001 | Cloudflare Flexible | api.kairos.gr | ✅ Active |
| kairos.gr | Frontend | /var/www/kairos | No | kairos.gr-temp | ✅ Active |
| aethra.dev | Frontend | localhost:3000 | Cloudflare | Not configured | ❓ Unknown |

## Port Allocation

| Port | Service | Description |
|------|---------|-------------|
| 80 | Nginx | HTTP |
| 443 | Nginx | HTTPS |
| 3000 | Aethra Frontend | Next.js |
| 5432 | PostgreSQL | Database |
| 8080 | Intranet API | Currently in use |
| 8001 | Kairos API | Proposed new port |

## Configuration Files

### Active Configurations
1. **intranet.aethra.dev.conf** - Intranet application (frontend + API)
2. **kairos.gr-temp** - Kairos weather frontend
3. **api.kairos.gr** - Kairos API (needs update)

### Proposed Structure
```
/home/sellinios/development/nginx/
├── NGINX_REGISTRY.md          # This file
├── sites-available/           # All site configurations
│   ├── intranet.aethra.dev
│   ├── api.kairos.gr
│   ├── kairos.gr
│   └── aethra.dev
└── ssl/                       # SSL certificates info
    └── certificates.md
```

## Quick Commands

### Test nginx configuration:
```bash
sudo nginx -t
```

### Reload nginx:
```bash
sudo systemctl reload nginx
```

### List enabled sites:
```bash
ls -la /etc/nginx/sites-enabled/
```

### Enable a site:
```bash
sudo ln -s /etc/nginx/sites-available/[site] /etc/nginx/sites-enabled/
```

### Disable a site:
```bash
sudo rm /etc/nginx/sites-enabled/[site]
```

## Issues to Fix

1. **Kairos API Service** - Not running on port 8001
   - Solution: Configure and start kairos-api.service on port 8001
   - Update nginx config to proxy to active service

2. **aethra.dev** - No nginx configuration found
   - Solution: Create nginx config for main site

3. **SSL Certificates** - Mix of Cloudflare and local configs
   - Solution: Document SSL strategy

## Recent Updates

- **api.kairos.gr** - Fixed HTTPS configuration (June 6, 2025)
  - Configured for Cloudflare Flexible SSL
  - Returns maintenance JSON response
  - Ready to proxy to port 8001 when service is active

Last updated: June 6, 2025