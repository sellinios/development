# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important: System Architecture Update (June 3, 2025)

The Epsilon Docker containers have been shut down. The system now runs:
1. **Epsilon Frontend** - Next.js running as systemd service on port 3000
   - Service: `epsilon-frontend.service`
   - Location: `/opt/projects/intranet/epsilon/`
   - URL: https://site.epsilonhellas.com/
2. **Intranet** - Go + React at https://site.epsilonhellas.com/intranet/
   - API: Port 8080 (systemd service: intranet-api)
   - Frontend: Vite build served by nginx

Both are routed through the system nginx (NOT a Docker nginx container).

## Build/Lint/Test Commands

### Intranet Frontend (Vite + React)
- Dev: `cd /opt/projects/intranet/intranet && npm run dev`
- Build: `cd /opt/projects/intranet/intranet && npm run build`
- Lint: `cd /opt/projects/intranet/intranet && npm run lint`

### Intranet Backend (Go)
- Run: `cd /opt/projects/intranet && go run cmd/api/main.go`
- Build: `cd /opt/projects/intranet && go build -o api cmd/api/main.go`
- Test: `cd /opt/projects/intranet && go test ./...`

### Epsilon Frontend (Next.js)
- Dev: `cd /opt/projects/intranet/epsilon && npm run dev`
- Build: `cd /opt/projects/intranet/epsilon && npm run build`
- Start: `cd /opt/projects/intranet/epsilon && npm start`

## Service Management
```bash
# Check services
sudo systemctl status intranet-api
sudo systemctl status epsilon-frontend
sudo systemctl status nginx

# Restart services
sudo systemctl restart intranet-api
sudo systemctl restart epsilon-frontend
sudo systemctl restart nginx

# View logs
sudo journalctl -u intranet-api -f
sudo journalctl -u epsilon-frontend -f
```

## Important Paths
- Nginx config: `/etc/nginx/sites-enabled/site-epsilonhellas-system-fixed.conf`
- Intranet source: `/opt/projects/intranet/`
- Epsilon frontend: `/opt/projects/intranet/epsilon/`
- Intranet frontend build: `/opt/projects/intranet/intranet/dist/`

## Database
- PostgreSQL: localhost:5432, database: postgres
- User: postgres, Password: admin

## API Endpoints
- Intranet API: https://site.epsilonhellas.com/intranet/api/
- Career applications: POST to /intranet/api/career-applications (public)