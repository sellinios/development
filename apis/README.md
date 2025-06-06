# APIs Documentation

This directory contains comprehensive documentation for all APIs and services in the development environment.

## Structure

```
/apis/
├── README.md                 # This file
├── API_REGISTRY.md          # Overview of all APIs
├── intranet-api.md          # Intranet REST API documentation
├── kairos-api.md            # Weather API documentation
└── aethra-frontend.md       # Frontend service documentation
```

## Quick Links

- [API Registry](./API_REGISTRY.md) - Overview and status of all services
- [Intranet API](./intranet-api.md) - Internal company systems API
- [Kairos API](./kairos-api.md) - Weather forecasting service
- [Aethra Frontend](./aethra-frontend.md) - Main website

## Adding New API Documentation

When adding a new API to the system:

1. Create a new markdown file: `{api-name}-api.md`
2. Update the API_REGISTRY.md with the new service
3. Follow the template structure used in existing files

## API Documentation Template

```markdown
# [API Name] Documentation

## Overview
- **Name**: 
- **Type**: REST API / GraphQL / WebSocket
- **Technology**: 
- **Port**: 
- **Base URL**: 
- **Database**: 
- **Service**: 

## Configuration
- **Config File**: 
- **Source Directory**: 

## API Endpoints
[List all endpoints]

## Authentication
[Authentication method and requirements]

## Service Management
[Commands for managing the service]

## Notes
[Any additional information]
```

## Related Documentation

- [Database Information](/home/sellinios/development/databases/DATABASE_INFO.md)
- [PostgreSQL Upgrade Guide](/home/sellinios/development/databases/postgresql_upgrade_guide.md)

Last updated: June 6, 2025