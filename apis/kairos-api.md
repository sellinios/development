# Kairos Weather API Documentation

## Overview
- **Name**: Kairos Weather API
- **Type**: REST API
- **Technology**: Go
- **Port**: 8000 (when active)
- **Base URL**: https://api.kairos.gr
- **Database**: PostgreSQL 17 - kairos_db
- **Service**: kairos-api.service (currently disabled)

## Configuration
- **Source Directory**: `/home/sellinios/development/projects/kairos/backend/`
- **Config File**: `/home/sellinios/development/projects/kairos/backend/.env`

## Status
**Currently INACTIVE** - Service was disabled due to port conflict with intranet-api

## API Endpoints (when active)

### Weather Data
- `GET /api/v1/weather` - Get weather data
- `GET /api/v1/weather?city={city}` - Get weather by city
- `GET /api/v1/forecast` - Get weather forecast
- `GET /api/v1/locations` - Get supported locations

### ICON Model Data
- `GET /api/v1/icon/cells` - Get ICON model cells
- `GET /api/v1/icon/forecast` - Get ICON forecast data

## Database Schema
The kairos_db contains:
- Weather observation data
- ICON model forecasts
- Geographic entities (requires PostGIS)
- Cell boundary data

## Known Issues
- PostGIS extension missing after PostgreSQL 17 upgrade
- Needs to be reconfigured to use a different port

## Service Management

### Enable and Start Service
```bash
# First, change the port in configuration
# Then:
sudo systemctl enable kairos-api
sudo systemctl start kairos-api
```

### Check Status
```bash
sudo systemctl status kairos-api
```

## Database Size
- **Current Size**: 797 MB
- **Tables**: geo_entities, icon_cells, icon_forecasts, etc.

## Notes
- Uses ICON-EU weather model data
- Requires PostGIS for geographic operations
- Originally developed for kairos.gr weather service
- Need to install PostGIS 17 extension to restore full functionality

## TODO
1. Install PostGIS for PostgreSQL 17
2. Configure service to use different port (e.g., 8001)
3. Re-enable service
4. Update nginx configuration for api.kairos.gr