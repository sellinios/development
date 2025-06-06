# Intranet API Documentation

## Overview
- **Name**: Intranet API
- **Type**: REST API
- **Technology**: Go with Gin framework
- **Port**: 8080
- **Base URL**: https://intranet.aethra.dev/api
- **Database**: PostgreSQL 17 - intranet_db
- **Service**: intranet-api.service

## Configuration
- **Config File**: `/home/sellinios/development/projects/intranet/.env`
- **Binary**: `/home/sellinios/development/projects/intranet/bin/intranet-api`
- **Source**: `/home/sellinios/development/projects/intranet/cmd/api/main.go`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/validate-token/:token` - Validate reset token

### Public Endpoints
- `GET /health` - Health check
- `POST /api/career-applications` - Submit job application
- `GET /api/public/articles` - Get public articles
- `GET /api/public/articles/:slug` - Get article by slug
- `GET /api/public/categories` - Get categories
- `GET /api/public/tags` - Get tags

### Protected Endpoints (Require Authentication)

#### User Management
- `GET /api/users` - List users
- `GET /api/users/:id` - Get user details
- `POST /api/users` - Create user (Admin only)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (Admin only)
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update profile

#### Entity Management
- `GET /api/entities` - List entities
- `GET /api/entities/tree` - Get entity hierarchy
- `GET /api/entities/:id` - Get entity details
- `POST /api/entities` - Create entity (Admin only)
- `PUT /api/entities/:id` - Update entity (Admin only)
- `DELETE /api/entities/:id` - Delete entity (Admin only)

#### Employee Management
- `GET /api/employees` - List employees
- `GET /api/employees/:id` - Get employee details
- `POST /api/employees` - Create employee (HR only)
- `PUT /api/employees/:id` - Update employee (HR only)
- `DELETE /api/employees/:id` - Delete employee (Admin only)

#### CRM Endpoints
- `GET /api/customers` - List customers
- `GET /api/contacts` - List contacts
- `GET /api/opportunities` - List opportunities
- `GET /api/ships` - List ships
- `GET /api/principals` - List principals

#### Project Management
- `GET /api/projects` - List projects
- `GET /api/projects/:id` - Get project details
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project (Admin only)

#### Website Management
- `GET /api/websites` - List websites
- `GET /api/websites/:id/articles` - Get website articles
- `POST /api/websites/:id/articles` - Create article
- `GET /api/websites/:id/media` - Get media files
- `POST /api/websites/:id/media` - Upload media

## Authentication
- **Type**: JWT Bearer Token
- **Header**: `Authorization: Bearer <token>`
- **Token Expiry**: 24 hours

## Default Credentials
- **Username**: admin
- **Password**: admin123

## Service Management

### Start/Stop Service
```bash
sudo systemctl start intranet-api
sudo systemctl stop intranet-api
sudo systemctl restart intranet-api
sudo systemctl status intranet-api
```

### View Logs
```bash
# Service logs
sudo journalctl -u intranet-api -f

# Error logs
sudo tail -f /var/log/intranet-api.error.log
```

### Build from Source
```bash
cd /home/sellinios/development/projects/intranet
go build -o bin/intranet-api cmd/api/main.go
```

## Environment Variables
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=intranet_db
PORT=8080
APP_ENV=production
JWT_SECRET=your_secure_jwt_secret_here
BASE_URL=https://intranet.aethra.dev
```

## Error Codes
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Recent Updates
- June 6, 2025: Upgraded to PostgreSQL 17.5
- June 6, 2025: Renamed database to intranet_db
- June 6, 2025: Updated domain to intranet.aethra.dev