package handlers

import (
	"encoding/json"
	"net/http"
)

// OpenAPIHandler serves the OpenAPI specification
type OpenAPIHandler struct{}

// NewOpenAPIHandler creates a new OpenAPIHandler
func NewOpenAPIHandler() *OpenAPIHandler {
	return &OpenAPIHandler{}
}

// ServeHTTP serves the OpenAPI JSON specification
func (h *OpenAPIHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(openAPISpec)
}

var openAPISpec = map[string]interface{}{
	"openapi": "3.0.0",
	"info": map[string]interface{}{
		"title":       "Kairos Weather API",
		"version":     "1.0.0",
		"description": "Real-time weather forecasts for Greece using ICON-EU model data with 7km resolution",
		"contact": map[string]string{
			"name":  "Kairos Weather",
			"url":   "https://kairos.gr",
			"email": "api@kairos.gr",
		},
	},
	"servers": []map[string]string{
		{
			"url":         "https://api.kairos.gr",
			"description": "Production API",
		},
	},
	"tags": []map[string]string{
		{
			"name":        "Weather",
			"description": "Weather forecast endpoints",
		},
		{
			"name":        "Locations",
			"description": "Geographic location services",
		},
		{
			"name":        "System",
			"description": "System health and status endpoints",
		},
	},
	"paths": map[string]interface{}{
		"/api/v1/weather": map[string]interface{}{
			"get": map[string]interface{}{
				"tags":        []string{"Weather"},
				"summary":     "Get complete weather data",
				"description": "Returns current conditions and forecasts for a location specified by city name or coordinates",
				"operationId": "getWeather",
				"parameters": []map[string]interface{}{
					{
						"name":        "city",
						"in":          "query",
						"description": "City name (e.g., Athens, Thessaloniki)",
						"required":    false,
						"schema": map[string]interface{}{
							"type":    "string",
							"example": "Athens",
						},
					},
					{
						"name":        "lat",
						"in":          "query",
						"description": "Latitude in decimal degrees",
						"required":    false,
						"schema": map[string]interface{}{
							"type":    "number",
							"format":  "float",
							"example": 37.9838,
						},
					},
					{
						"name":        "lon",
						"in":          "query",
						"description": "Longitude in decimal degrees",
						"required":    false,
						"schema": map[string]interface{}{
							"type":    "number",
							"format":  "float",
							"example": 23.7275,
						},
					},
					{
						"name":        "units",
						"in":          "query",
						"description": "Units for temperature and wind speed",
						"required":    false,
						"schema": map[string]interface{}{
							"type":    "string",
							"enum":    []string{"metric", "imperial"},
							"default": "metric",
						},
					},
				},
				"responses": map[string]interface{}{
					"200": map[string]interface{}{
						"description": "Successful response",
						"content": map[string]interface{}{
							"application/json": map[string]interface{}{
								"schema": map[string]interface{}{
									"$ref": "#/components/schemas/WeatherResponse",
								},
							},
						},
					},
					"400": map[string]interface{}{
						"description": "Bad request - missing or invalid parameters",
						"content": map[string]interface{}{
							"application/json": map[string]interface{}{
								"schema": map[string]interface{}{
									"$ref": "#/components/schemas/ErrorResponse",
								},
							},
						},
					},
					"404": map[string]interface{}{
						"description": "Location not found",
						"content": map[string]interface{}{
							"application/json": map[string]interface{}{
								"schema": map[string]interface{}{
									"$ref": "#/components/schemas/ErrorResponse",
								},
							},
						},
					},
				},
			},
		},
		"/api/v1/weather/current": map[string]interface{}{
			"get": map[string]interface{}{
				"tags":        []string{"Weather"},
				"summary":     "Get current weather only",
				"description": "Returns only the current weather conditions without forecast",
				"operationId": "getCurrentWeather",
				"parameters": []map[string]interface{}{
					{
						"name":        "city",
						"in":          "query",
						"description": "City name",
						"required":    false,
						"schema": map[string]interface{}{
							"type": "string",
						},
					},
					{
						"name":        "lat",
						"in":          "query",
						"description": "Latitude in decimal degrees",
						"required":    false,
						"schema": map[string]interface{}{
							"type":    "number",
							"format":  "float",
						},
					},
					{
						"name":        "lon",
						"in":          "query",
						"description": "Longitude in decimal degrees",
						"required":    false,
						"schema": map[string]interface{}{
							"type":    "number",
							"format":  "float",
						},
					},
					{
						"name":        "units",
						"in":          "query",
						"description": "Units for temperature and wind speed",
						"required":    false,
						"schema": map[string]interface{}{
							"type":    "string",
							"enum":    []string{"metric", "imperial"},
							"default": "metric",
						},
					},
				},
				"responses": map[string]interface{}{
					"200": map[string]interface{}{
						"description": "Current weather data",
						"content": map[string]interface{}{
							"application/json": map[string]interface{}{
								"schema": map[string]interface{}{
									"$ref": "#/components/schemas/CurrentWeatherResponse",
								},
							},
						},
					},
					"400": map[string]interface{}{
						"description": "Bad request - either city or lat/lon required",
						"content": map[string]interface{}{
							"application/json": map[string]interface{}{
								"schema": map[string]interface{}{
									"$ref": "#/components/schemas/ErrorResponse",
								},
							},
						},
					},
					"404": map[string]interface{}{
						"description": "Location not found",
						"content": map[string]interface{}{
							"application/json": map[string]interface{}{
								"schema": map[string]interface{}{
									"$ref": "#/components/schemas/ErrorResponse",
								},
							},
						},
					},
				},
			},
		},
		"/api/v1/weather/forecast": map[string]interface{}{
			"get": map[string]interface{}{
				"tags":        []string{"Weather"},
				"summary":     "Get weather forecast",
				"description": "Returns hourly or daily weather forecast for a location",
				"operationId": "getForecast",
				"parameters": []map[string]interface{}{
					{
						"name":        "city",
						"in":          "query",
						"description": "City name",
						"required":    false,
						"schema": map[string]interface{}{
							"type": "string",
						},
					},
					{
						"name":        "lat",
						"in":          "query",
						"description": "Latitude in decimal degrees",
						"required":    false,
						"schema": map[string]interface{}{
							"type":    "number",
							"format":  "float",
						},
					},
					{
						"name":        "lon",
						"in":          "query",
						"description": "Longitude in decimal degrees",
						"required":    false,
						"schema": map[string]interface{}{
							"type":    "number",
							"format":  "float",
						},
					},
					{
						"name":        "type",
						"in":          "query",
						"description": "Forecast type",
						"required":    false,
						"schema": map[string]interface{}{
							"type":    "string",
							"enum":    []string{"hourly", "daily"},
							"default": "hourly",
						},
					},
					{
						"name":        "hours",
						"in":          "query",
						"description": "Number of hours for hourly forecast (max 120)",
						"required":    false,
						"schema": map[string]interface{}{
							"type":    "integer",
							"minimum": 1,
							"maximum": 120,
							"default": 24,
						},
					},
					{
						"name":        "days",
						"in":          "query",
						"description": "Number of days for daily forecast (max 5)",
						"required":    false,
						"schema": map[string]interface{}{
							"type":    "integer",
							"minimum": 1,
							"maximum": 5,
							"default": 7,
						},
					},
				},
				"responses": map[string]interface{}{
					"200": map[string]interface{}{
						"description": "Forecast data",
						"content": map[string]interface{}{
							"application/json": map[string]interface{}{
								"schema": map[string]interface{}{
									"$ref": "#/components/schemas/ForecastResponse",
								},
							},
						},
					},
					"400": map[string]interface{}{
						"description": "Bad request",
						"content": map[string]interface{}{
							"application/json": map[string]interface{}{
								"schema": map[string]interface{}{
									"$ref": "#/components/schemas/ErrorResponse",
								},
							},
						},
					},
					"404": map[string]interface{}{
						"description": "Location not found",
						"content": map[string]interface{}{
							"application/json": map[string]interface{}{
								"schema": map[string]interface{}{
									"$ref": "#/components/schemas/ErrorResponse",
								},
							},
						},
					},
				},
			},
		},
		"/api/v1/weather/bulk": map[string]interface{}{
			"get": map[string]interface{}{
				"tags":        []string{"Weather"},
				"summary":     "Get weather for multiple cities",
				"description": "Returns weather data for multiple cities in a single request",
				"operationId": "getBulkWeather",
				"parameters": []map[string]interface{}{
					{
						"name":        "cities",
						"in":          "query",
						"description": "Comma-separated list of city names",
						"required":    true,
						"schema": map[string]interface{}{
							"type":    "string",
							"example": "Athens,Thessaloniki,Patras",
						},
					},
					{
						"name":        "units",
						"in":          "query",
						"description": "Units for temperature and wind speed",
						"required":    false,
						"schema": map[string]interface{}{
							"type":    "string",
							"enum":    []string{"metric", "imperial"},
							"default": "metric",
						},
					},
				},
				"responses": map[string]interface{}{
					"200": map[string]interface{}{
						"description": "Bulk weather data",
						"content": map[string]interface{}{
							"application/json": map[string]interface{}{
								"schema": map[string]interface{}{
									"$ref": "#/components/schemas/BulkWeatherResponse",
								},
							},
						},
					},
					"400": map[string]interface{}{
						"description": "Cities parameter required",
						"content": map[string]interface{}{
							"application/json": map[string]interface{}{
								"schema": map[string]interface{}{
									"$ref": "#/components/schemas/ErrorResponse",
								},
							},
						},
					},
				},
			},
		},
		"/api/v1/weather/map": map[string]interface{}{
			"get": map[string]interface{}{
				"tags":        []string{"Weather"},
				"summary":     "Get weather data for map visualization",
				"description": "Returns weather data points for map visualization within a bounding box",
				"operationId": "getWeatherMap",
				"parameters": []map[string]interface{}{
					{
						"name":        "bbox",
						"in":          "query",
						"description": "Bounding box as south,west,north,east coordinates",
						"required":    true,
						"schema": map[string]interface{}{
							"type":    "string",
							"example": "34,19,42,30",
						},
					},
					{
						"name":        "zoom",
						"in":          "query",
						"description": "Zoom level for data density",
						"required":    false,
						"schema": map[string]interface{}{
							"type":    "integer",
							"minimum": 1,
							"maximum": 18,
							"default": 8,
						},
					},
				},
				"responses": map[string]interface{}{
					"200": map[string]interface{}{
						"description": "GeoJSON weather data",
						"content": map[string]interface{}{
							"application/json": map[string]interface{}{
								"schema": map[string]interface{}{
									"$ref": "#/components/schemas/WeatherMapResponse",
								},
							},
						},
					},
					"400": map[string]interface{}{
						"description": "Bounding box required",
						"content": map[string]interface{}{
							"application/json": map[string]interface{}{
								"schema": map[string]interface{}{
									"$ref": "#/components/schemas/ErrorResponse",
								},
							},
						},
					},
				},
			},
		},
		"/api/v1/weather/alerts": map[string]interface{}{
			"get": map[string]interface{}{
				"tags":        []string{"Weather"},
				"summary":     "Get active weather alerts",
				"description": "Returns active weather alerts for a region",
				"operationId": "getWeatherAlerts",
				"parameters": []map[string]interface{}{
					{
						"name":        "region",
						"in":          "query",
						"description": "Region name",
						"required":    false,
						"schema": map[string]interface{}{
							"type":    "string",
							"default": "Greece",
						},
					},
				},
				"responses": map[string]interface{}{
					"200": map[string]interface{}{
						"description": "Weather alerts data",
						"content": map[string]interface{}{
							"application/json": map[string]interface{}{
								"schema": map[string]interface{}{
									"$ref": "#/components/schemas/WeatherAlertsResponse",
								},
							},
						},
					},
				},
			},
		},
		"/api/places": map[string]interface{}{
			"get": map[string]interface{}{
				"tags":        []string{"Locations"},
				"summary":     "List available locations",
				"description": "Get a list of cities and locations with weather data",
				"operationId": "getPlaces",
				"parameters": []map[string]interface{}{
					{
						"name":        "limit",
						"in":          "query",
						"description": "Maximum number of results",
						"required":    false,
						"schema": map[string]interface{}{
							"type":    "integer",
							"minimum": 1,
							"maximum": 1000,
							"default": 100,
						},
					},
					{
						"name":        "offset",
						"in":          "query",
						"description": "Number of results to skip",
						"required":    false,
						"schema": map[string]interface{}{
							"type":    "integer",
							"minimum": 0,
							"default": 0,
						},
					},
				},
				"responses": map[string]interface{}{
					"200": map[string]interface{}{
						"description": "List of locations",
						"content": map[string]interface{}{
							"application/json": map[string]interface{}{
								"schema": map[string]interface{}{
									"$ref": "#/components/schemas/PlacesResponse",
								},
							},
						},
					},
				},
			},
		},
		"/api/places/search": map[string]interface{}{
			"get": map[string]interface{}{
				"tags":        []string{"Locations"},
				"summary":     "Search locations",
				"description": "Search for cities and locations by name",
				"operationId": "searchPlaces",
				"parameters": []map[string]interface{}{
					{
						"name":        "q",
						"in":          "query",
						"description": "Search query",
						"required":    true,
						"schema": map[string]interface{}{
							"type": "string",
						},
					},
					{
						"name":        "limit",
						"in":          "query",
						"description": "Maximum number of results",
						"required":    false,
						"schema": map[string]interface{}{
							"type":    "integer",
							"minimum": 1,
							"maximum": 100,
							"default": 20,
						},
					},
				},
				"responses": map[string]interface{}{
					"200": map[string]interface{}{
						"description": "Search results",
						"content": map[string]interface{}{
							"application/json": map[string]interface{}{
								"schema": map[string]interface{}{
									"$ref": "#/components/schemas/PlaceSearchResponse",
								},
							},
						},
					},
					"400": map[string]interface{}{
						"description": "Search query required",
						"content": map[string]interface{}{
							"application/json": map[string]interface{}{
								"schema": map[string]interface{}{
									"$ref": "#/components/schemas/ErrorResponse",
								},
							},
						},
					},
				},
			},
		},
		"/api/places/coordinates": map[string]interface{}{
			"get": map[string]interface{}{
				"tags":        []string{"Locations"},
				"summary":     "Find places by coordinates",
				"description": "Find cities and locations near specific coordinates",
				"operationId": "getPlacesByCoordinates",
				"parameters": []map[string]interface{}{
					{
						"name":        "lat",
						"in":          "query",
						"description": "Latitude in decimal degrees",
						"required":    true,
						"schema": map[string]interface{}{
							"type":   "number",
							"format": "float",
						},
					},
					{
						"name":        "lng",
						"in":          "query",
						"description": "Longitude in decimal degrees",
						"required":    true,
						"schema": map[string]interface{}{
							"type":   "number",
							"format": "float",
						},
					},
					{
						"name":        "limit",
						"in":          "query",
						"description": "Maximum number of results",
						"required":    false,
						"schema": map[string]interface{}{
							"type":    "integer",
							"minimum": 1,
							"maximum": 50,
							"default": 10,
						},
					},
				},
				"responses": map[string]interface{}{
					"200": map[string]interface{}{
						"description": "Places near coordinates",
						"content": map[string]interface{}{
							"application/json": map[string]interface{}{
								"schema": map[string]interface{}{
									"$ref": "#/components/schemas/PlacesByCoordinatesResponse",
								},
							},
						},
					},
					"400": map[string]interface{}{
						"description": "Latitude and longitude required",
						"content": map[string]interface{}{
							"application/json": map[string]interface{}{
								"schema": map[string]interface{}{
									"$ref": "#/components/schemas/ErrorResponse",
								},
							},
						},
					},
					"404": map[string]interface{}{
						"description": "No places found at these coordinates",
						"content": map[string]interface{}{
							"application/json": map[string]interface{}{
								"schema": map[string]interface{}{
									"$ref": "#/components/schemas/ErrorResponse",
								},
							},
						},
					},
				},
			},
		},
		"/api/system": map[string]interface{}{
			"get": map[string]interface{}{
				"tags":        []string{"System"},
				"summary":     "Get system health status",
				"description": "Returns the health status and metrics of the API system",
				"operationId": "getSystemHealth",
				"responses": map[string]interface{}{
					"200": map[string]interface{}{
						"description": "System health status",
						"content": map[string]interface{}{
							"application/json": map[string]interface{}{
								"schema": map[string]interface{}{
									"$ref": "#/components/schemas/SystemHealthResponse",
								},
							},
						},
					},
				},
			},
		},
		"/health": map[string]interface{}{
			"get": map[string]interface{}{
				"tags":        []string{"System"},
				"summary":     "Basic health check",
				"description": "Returns basic health status of the API",
				"operationId": "getHealth",
				"responses": map[string]interface{}{
					"200": map[string]interface{}{
						"description": "Service is healthy",
						"content": map[string]interface{}{
							"application/json": map[string]interface{}{
								"schema": map[string]interface{}{
									"type": "object",
									"properties": map[string]interface{}{
										"status": map[string]interface{}{
											"type":    "string",
											"example": "healthy",
										},
										"service": map[string]interface{}{
											"type":    "string",
											"example": "kairos-weather",
										},
									},
								},
							},
						},
					},
				},
			},
		},
	},
	"components": map[string]interface{}{
		"schemas": map[string]interface{}{
			"WeatherResponse": map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"location": map[string]interface{}{
						"$ref": "#/components/schemas/Location",
					},
					"current": map[string]interface{}{
						"$ref": "#/components/schemas/CurrentWeather",
					},
					"hourly": map[string]interface{}{
						"type": "array",
						"items": map[string]interface{}{
							"$ref": "#/components/schemas/HourlyWeather",
						},
					},
					"daily": map[string]interface{}{
						"type": "array",
						"items": map[string]interface{}{
							"$ref": "#/components/schemas/DailyWeather",
						},
					},
					"data_source": map[string]interface{}{
						"$ref": "#/components/schemas/DataSource",
					},
				},
			},
			"CurrentWeatherResponse": map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"location": map[string]interface{}{
						"$ref": "#/components/schemas/Location",
					},
					"current": map[string]interface{}{
						"$ref": "#/components/schemas/CurrentWeather",
					},
					"data_source": map[string]interface{}{
						"$ref": "#/components/schemas/DataSource",
					},
				},
			},
			"ForecastResponse": map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"message": map[string]interface{}{
						"type":    "string",
						"example": "Forecast endpoint - implementation pending",
					},
					"type": map[string]interface{}{
						"type":    "string",
						"example": "hourly",
					},
				},
			},
			"BulkWeatherResponse": map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"count": map[string]interface{}{
						"type":    "integer",
						"example": 3,
					},
					"results": map[string]interface{}{
						"type": "array",
						"items": map[string]interface{}{
							"type": "object",
							"properties": map[string]interface{}{
								"city": map[string]interface{}{
									"type":    "string",
									"example": "Athens",
								},
								"weather": map[string]interface{}{
									"$ref": "#/components/schemas/WeatherResponse",
								},
								"error": map[string]interface{}{
									"type":    "string",
									"example": "City not found",
								},
							},
						},
					},
				},
			},
			"WeatherMapResponse": map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"type": map[string]interface{}{
						"type":    "string",
						"example": "FeatureCollection",
					},
					"features": map[string]interface{}{
						"type": "array",
						"items": map[string]interface{}{
							"type": "object",
						},
					},
					"properties": map[string]interface{}{
						"type": "object",
						"properties": map[string]interface{}{
							"zoom": map[string]interface{}{
								"type":    "integer",
								"example": 8,
							},
							"bbox": map[string]interface{}{
								"type":    "string",
								"example": "34,19,42,30",
							},
						},
					},
				},
			},
			"WeatherAlertsResponse": map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"region": map[string]interface{}{
						"type":    "string",
						"example": "Greece",
					},
					"alerts": map[string]interface{}{
						"type": "array",
						"items": map[string]interface{}{
							"type": "object",
						},
					},
				},
			},
			"PlacesResponse": map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"results": map[string]interface{}{
						"type": "array",
						"items": map[string]interface{}{
							"$ref": "#/components/schemas/GeoEntity",
						},
					},
					"limit": map[string]interface{}{
						"type":    "integer",
						"example": 100,
					},
					"offset": map[string]interface{}{
						"type":    "integer",
						"example": 0,
					},
					"count": map[string]interface{}{
						"type":    "integer",
						"example": 25,
					},
				},
			},
			"PlaceSearchResponse": map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"results": map[string]interface{}{
						"type": "array",
						"items": map[string]interface{}{
							"$ref": "#/components/schemas/GeoEntity",
						},
					},
					"query": map[string]interface{}{
						"type":    "string",
						"example": "Athens",
					},
					"count": map[string]interface{}{
						"type":    "integer",
						"example": 5,
					},
				},
			},
			"PlacesByCoordinatesResponse": map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"results": map[string]interface{}{
						"type": "array",
						"items": map[string]interface{}{
							"$ref": "#/components/schemas/GeoEntity",
						},
					},
					"lat": map[string]interface{}{
						"type":    "number",
						"example": 37.9838,
					},
					"lng": map[string]interface{}{
						"type":    "number",
						"example": 23.7275,
					},
					"count": map[string]interface{}{
						"type":    "integer",
						"example": 3,
					},
				},
			},
			"SystemHealthResponse": map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"status": map[string]interface{}{
						"type":    "string",
						"example": "ok",
					},
					"timestamp": map[string]interface{}{
						"type":   "string",
						"format": "date-time",
					},
					"api_connected": map[string]interface{}{
						"type":    "boolean",
						"example": true,
					},
					"database_status": map[string]interface{}{
						"type":    "string",
						"example": "connected",
					},
					"memory_usage": map[string]interface{}{
						"type":    "string",
						"example": "45.2 MB",
					},
					"num_goroutines": map[string]interface{}{
						"type":    "integer",
						"example": 12,
					},
					"icon_data_status": map[string]interface{}{
						"type":    "string",
						"example": "available",
					},
					"last_forecast_run": map[string]interface{}{
						"type":   "string",
						"format": "date-time",
					},
				},
			},
			"GeoEntity": map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"id": map[string]interface{}{
						"type":    "integer",
						"example": 1,
					},
					"name": map[string]interface{}{
						"type":    "string",
						"example": "Αθήνα",
					},
					"name_en": map[string]interface{}{
						"type":    "string",
						"example": "Athens",
					},
					"entity_type": map[string]interface{}{
						"type":    "string",
						"example": "city",
					},
					"country_code": map[string]interface{}{
						"type":    "string",
						"example": "GR",
					},
					"timezone": map[string]interface{}{
						"type":    "string",
						"example": "Europe/Athens",
					},
					"latitude": map[string]interface{}{
						"type":    "number",
						"example": 37.9838,
					},
					"longitude": map[string]interface{}{
						"type":    "number",
						"example": 23.7275,
					},
				},
			},
			"Location": map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"name": map[string]interface{}{
						"type":        "string",
						"description": "Location name",
						"example":     "Αθήνα",
					},
					"latitude": map[string]interface{}{
						"type":    "number",
						"example": 37.9838,
					},
					"longitude": map[string]interface{}{
						"type":    "number",
						"example": 23.7275,
					},
					"timezone": map[string]interface{}{
						"type":    "string",
						"example": "Europe/Athens",
					},
					"country": map[string]interface{}{
						"type":    "string",
						"example": "GR",
					},
				},
			},
			"CurrentWeather": map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"temperature": map[string]interface{}{
						"type":        "object",
						"description": "Temperature with unit",
						"properties": map[string]interface{}{
							"value": map[string]interface{}{
								"type":    "number",
								"example": 25.5,
							},
							"unit": map[string]interface{}{
								"type":    "string",
								"example": "C",
							},
						},
					},
					"humidity": map[string]interface{}{
						"type":        "integer",
						"description": "Relative humidity percentage",
						"example":     65,
					},
					"wind": map[string]interface{}{
						"$ref": "#/components/schemas/Wind",
					},
					"weather": map[string]interface{}{
						"type": "object",
						"properties": map[string]interface{}{
							"description": map[string]interface{}{
								"type":    "string",
								"example": "clear sky",
							},
							"icon": map[string]interface{}{
								"type":    "string",
								"example": "clear",
							},
							"emoji": map[string]interface{}{
								"type":    "string",
								"example": "☀️",
							},
						},
					},
				},
			},
			"HourlyWeather": map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"time": map[string]interface{}{
						"type":    "string",
						"format":  "date-time",
						"example": "2025-06-03T12:00:00+02:00",
					},
					"temperature": map[string]interface{}{
						"type":    "number",
						"example": 22.5,
					},
					"humidity": map[string]interface{}{
						"type":    "integer",
						"example": 65,
					},
					"wind": map[string]interface{}{
						"$ref": "#/components/schemas/Wind",
					},
					"precipitation": map[string]interface{}{
						"type":        "number",
						"description": "Precipitation in mm",
						"example":     0.5,
					},
				},
			},
			"DailyWeather": map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"date": map[string]interface{}{
						"type":   "string",
						"format": "date",
					},
					"temperature": map[string]interface{}{
						"type": "object",
						"properties": map[string]interface{}{
							"min": map[string]interface{}{
								"type":    "number",
								"example": 18.2,
							},
							"max": map[string]interface{}{
								"type":    "number",
								"example": 28.5,
							},
						},
					},
					"weather": map[string]interface{}{
						"type": "object",
						"properties": map[string]interface{}{
							"description": map[string]interface{}{
								"type":    "string",
								"example": "partly cloudy",
							},
							"icon": map[string]interface{}{
								"type":    "string",
								"example": "partly_cloudy",
							},
						},
					},
				},
			},
			"Wind": map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"speed": map[string]interface{}{
						"type":        "number",
						"description": "Wind speed",
						"example":     3.5,
					},
					"direction": map[string]interface{}{
						"type":        "integer",
						"description": "Wind direction in degrees",
						"example":     180,
					},
					"unit": map[string]interface{}{
						"type":    "string",
						"enum":    []string{"m/s", "km/h", "mph"},
						"example": "m/s",
					},
				},
			},
			"DataSource": map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"model": map[string]interface{}{
						"type":    "string",
						"example": "ICON-EU",
					},
					"resolution": map[string]interface{}{
						"type":        "number",
						"description": "Grid resolution in kilometers",
						"example":     7,
					},
					"updated_at": map[string]interface{}{
						"type":   "string",
						"format": "date-time",
					},
				},
			},
			"ErrorResponse": map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"error": map[string]interface{}{
						"type":    "string",
						"example": "Location not found",
					},
					"message": map[string]interface{}{
						"type":    "string",
						"example": "The requested location could not be found in our database",
					},
					"code": map[string]interface{}{
						"type":    "integer",
						"example": 404,
					},
				},
			},
		},
	},
}