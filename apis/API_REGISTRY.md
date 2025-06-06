# API Registry

This directory contains documentation for all APIs running in the development environment.

## Overview

| API Name | Port | Status | URL | Technology | Database |
|----------|------|--------|-----|------------|----------|
| Intranet API | 8080 | Active | https://intranet.aethra.dev/api | Go/Gin | intranet_db |
| Kairos Weather API | 8000 | Inactive | https://api.kairos.gr | Go | kairos_db |
| Aethra Frontend | 3000 | Unknown | https://aethra.dev | Next.js | N/A |

## API Documentation Files

- [Intranet API](./intranet-api.md) - Company intranet system
- [Kairos API](./kairos-api.md) - Weather forecasting service
- [Aethra Frontend](./aethra-frontend.md) - Main website frontend

## Service Management

### Check all API statuses:
```bash
# Intranet API
sudo systemctl status intranet-api

# Kairos API (if exists)
sudo systemctl status kairos-api

# Aethra Frontend
sudo systemctl status aethra-frontend
```

### View logs:
```bash
# Intranet API logs
sudo journalctl -u intranet-api -f

# View error logs
sudo tail -f /var/log/intranet-api.error.log
```

## Port Usage

| Port | Service | Description |
|------|---------|-------------|
| 80 | Nginx | HTTP traffic |
| 443 | Nginx | HTTPS traffic |
| 3000 | Aethra Frontend | Next.js development |
| 5432 | PostgreSQL 17 | Database server |
| 8080 | Intranet API | Go REST API |

## Development URLs

- **Intranet**: https://intranet.aethra.dev
- **Aethra Main Site**: https://aethra.dev
- **Kairos Weather**: https://kairos.gr

Last updated: June 6, 2025