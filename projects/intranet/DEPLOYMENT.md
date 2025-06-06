# Intranet Deployment Guide for intranet.aethra.dev

This guide explains how to deploy the intranet application to intranet.aethra.dev.

## Prerequisites

1. **Server Requirements:**
   - Ubuntu/Debian server
   - Go 1.19+ installed
   - Node.js 18+ and npm installed
   - PostgreSQL installed and running
   - Nginx installed
   - Certbot for SSL certificates

2. **Database Setup:**
   - PostgreSQL database named `intranet`
   - User with proper permissions
   - Update `.env` file with database credentials

3. **DNS Configuration:**
   - A record for `intranet.aethra.dev` pointing to your server IP

## Initial Setup

1. **Clone the repository:**
   ```bash
   cd /home/sellinios/development/projects
   git clone git@github.com:sellinios/intranet.git
   cd intranet
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   nano .env
   ```

3. **Run the setup script:**
   ```bash
   sudo ./setup-aethra.sh
   ```

   This script will:
   - Build the Go backend
   - Build the React frontend
   - Install systemd service
   - Configure nginx
   - Start the services

## SSL Certificate Setup

1. **Install SSL certificate:**
   ```bash
   sudo certbot certonly --nginx -d intranet.aethra.dev
   ```

   Or for wildcard certificate:
   ```bash
   sudo certbot certonly --manual --preferred-challenges=dns -d *.aethra.dev -d aethra.dev
   ```

2. **Update nginx configuration if paths differ:**
   ```bash
   sudo nano /etc/nginx/sites-available/intranet.aethra.dev.conf
   # Update ssl_certificate and ssl_certificate_key paths
   ```

## Deployment Process

For subsequent deployments, use the deploy script:

```bash
sudo ./deploy.sh production
```

This will:
1. Build new backend and frontend
2. Stop services gracefully
3. Deploy new builds
4. Restart services
5. Verify deployment

## Service Management

**Start/Stop/Restart services:**
```bash
sudo systemctl start intranet-api
sudo systemctl stop intranet-api
sudo systemctl restart intranet-api
sudo systemctl status intranet-api
```

**View logs:**
```bash
# API logs
sudo journalctl -u intranet-api -f

# Nginx logs
sudo tail -f /var/log/nginx/intranet.aethra.dev.access.log
sudo tail -f /var/log/nginx/intranet.aethra.dev.error.log
```

## Troubleshooting

1. **API not responding:**
   - Check service status: `sudo systemctl status intranet-api`
   - Check logs: `sudo journalctl -u intranet-api -n 50`
   - Verify port 8080 is not in use: `sudo lsof -i :8080`

2. **Frontend not loading:**
   - Check nginx status: `sudo systemctl status nginx`
   - Test nginx config: `sudo nginx -t`
   - Check file permissions in dist folder

3. **Database connection issues:**
   - Verify PostgreSQL is running: `sudo systemctl status postgresql`
   - Check credentials in `.env` file
   - Test connection: `psql -U postgres -d intranet -h localhost`

## Security Considerations

1. **Update JWT secret in production:**
   ```bash
   # Generate a secure secret
   openssl rand -base64 32
   # Update JWT_SECRET in .env
   ```

2. **Database security:**
   - Use strong passwords
   - Restrict database access to localhost
   - Regular backups

3. **File permissions:**
   - Ensure uploads directory is writable by www-data
   - Restrict access to configuration files

## Backup and Recovery

1. **Database backup:**
   ```bash
   pg_dump -U postgres intranet > backup_$(date +%Y%m%d).sql
   ```

2. **Application backup:**
   ```bash
   tar -czf intranet_backup_$(date +%Y%m%d).tar.gz \
     --exclude='node_modules' \
     --exclude='dist' \
     --exclude='bin' \
     /home/sellinios/development/projects/intranet
   ```

## Monitoring

1. **Health check endpoint:**
   - https://intranet.aethra.dev/health
   - https://intranet.aethra.dev/api/health

2. **System monitoring:**
   ```bash
   # Check memory usage
   free -h
   
   # Check disk usage
   df -h
   
   # Check CPU usage
   top
   ```

## Updates and Maintenance

1. **Update dependencies:**
   ```bash
   # Backend
   go mod tidy
   go mod download
   
   # Frontend
   cd intranet
   npm update
   ```

2. **Database migrations:**
   - Migrations run automatically on startup
   - Check logs for migration status

For more information, see the main README.md file.