package handlers

import (
	"net/http"
)

// SwaggerHandler serves the Swagger UI
type SwaggerHandler struct{}

// NewSwaggerHandler creates a new SwaggerHandler
func NewSwaggerHandler() *SwaggerHandler {
	return &SwaggerHandler{}
}

// ServeHTTP serves the Swagger UI HTML
func (h *SwaggerHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write([]byte(swaggerHTML))
}

const swaggerHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Kairos Weather API - Interactive Documentation</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css">
    <style>
        body {
            margin: 0;
            padding: 0;
        }
        .swagger-ui .topbar {
            display: none;
        }
        .swagger-ui .info {
            margin: 50px 0;
        }
        .swagger-ui .info .title {
            color: #667eea;
        }
        .swagger-ui .btn.authorize {
            background-color: #667eea;
            border-color: #667eea;
        }
        .swagger-ui .btn.execute {
            background-color: #667eea;
            border-color: #667eea;
        }
        .swagger-ui select {
            border-color: #667eea;
        }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-standalone-preset.js"></script>
    <script>
    window.onload = function() {
        window.ui = SwaggerUIBundle({
            spec: {
                "openapi": "3.0.0",
                "info": {
                    "title": "Kairos Weather API",
                    "description": "High-resolution weather data for Greece powered by ICON-EU model from DWD (German Weather Service)\n\n## Features\n- 🌡️ Real-time weather data with 7km resolution\n- 📍 Coverage for all of Greece (34°N-42°N, 19°E-30°E)\n- 🔄 Updates every 3 hours\n- 📊 5-day forecasts with hourly data\n- 🏛️ Major Greek cities supported\n\n## Data Source\nICON-EU model provides high-quality meteorological forecasts updated 8 times daily.",
                    "version": "1.0.0",
                    "contact": {
                        "name": "Kairos Weather",
                        "url": "https://kairos.gr"
                    }
                },
                "servers": [
                    {
                        "url": "https://api.kairos.gr",
                        "description": "Production server"
                    }
                ],
                "paths": {
                    "/api/v1/weather": {
                        "get": {
                            "summary": "Get complete weather data",
                            "description": "Returns current conditions, hourly and daily forecasts for a location",
                            "tags": ["Weather"],
                            "parameters": [
                                {
                                    "name": "city",
                                    "in": "query",
                                    "description": "City name (e.g., Athens, Thessaloniki)",
                                    "required": false,
                                    "schema": {
                                        "type": "string",
                                        "example": "Athens"
                                    }
                                },
                                {
                                    "name": "lat",
                                    "in": "query",
                                    "description": "Latitude",
                                    "required": false,
                                    "schema": {
                                        "type": "number",
                                        "format": "float",
                                        "example": 37.9838
                                    }
                                },
                                {
                                    "name": "lon",
                                    "in": "query",
                                    "description": "Longitude",
                                    "required": false,
                                    "schema": {
                                        "type": "number",
                                        "format": "float",
                                        "example": 23.7275
                                    }
                                },
                                {
                                    "name": "units",
                                    "in": "query",
                                    "description": "Units system",
                                    "required": false,
                                    "schema": {
                                        "type": "string",
                                        "enum": ["metric", "imperial"],
                                        "default": "metric"
                                    }
                                }
                            ],
                            "responses": {
                                "200": {
                                    "description": "Weather data retrieved successfully",
                                    "content": {
                                        "application/json": {
                                            "schema": {
                                                "$ref": "#/components/schemas/WeatherResponse"
                                            },
                                            "example": {
                                                "location": {
                                                    "name": "Αθήνα",
                                                    "latitude": 37.9838,
                                                    "longitude": 23.7275,
                                                    "timezone": "Europe/Athens",
                                                    "country": "GR",
                                                    "local_time": "2025-06-02T22:57:31Z"
                                                },
                                                "current": {
                                                    "temperature": 19.29,
                                                    "feels_like": 19.29,
                                                    "humidity": 68,
                                                    "pressure": 1019.7,
                                                    "wind": {
                                                        "speed": 0.58,
                                                        "direction": 53,
                                                        "unit": "m/s"
                                                    },
                                                    "weather": {
                                                        "description": "clear sky",
                                                        "icon": "clear",
                                                        "emoji": "☀️"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                },
                                "404": {
                                    "description": "City not found"
                                }
                            }
                        }
                    },
                    "/api/v1/weather/current": {
                        "get": {
                            "summary": "Get current weather only",
                            "tags": ["Weather"],
                            "parameters": [
                                {
                                    "name": "city",
                                    "in": "query",
                                    "required": true,
                                    "schema": {
                                        "type": "string",
                                        "example": "Athens"
                                    }
                                }
                            ],
                            "responses": {
                                "200": {
                                    "description": "Current weather data"
                                }
                            }
                        }
                    },
                    "/api/v1/weather/forecast": {
                        "get": {
                            "summary": "Get weather forecast",
                            "tags": ["Weather"],
                            "parameters": [
                                {
                                    "name": "city",
                                    "in": "query",
                                    "required": true,
                                    "schema": {
                                        "type": "string"
                                    }
                                },
                                {
                                    "name": "type",
                                    "in": "query",
                                    "schema": {
                                        "type": "string",
                                        "enum": ["hourly", "daily"],
                                        "default": "hourly"
                                    }
                                },
                                {
                                    "name": "hours",
                                    "in": "query",
                                    "schema": {
                                        "type": "integer",
                                        "default": 48
                                    }
                                }
                            ],
                            "responses": {
                                "200": {
                                    "description": "Forecast data"
                                }
                            }
                        }
                    },
                    "/api/v1/weather/bulk": {
                        "get": {
                            "summary": "Get weather for multiple cities",
                            "tags": ["Weather"],
                            "parameters": [
                                {
                                    "name": "cities",
                                    "in": "query",
                                    "required": true,
                                    "description": "Comma-separated list of cities",
                                    "schema": {
                                        "type": "string",
                                        "example": "Athens,Thessaloniki,Patras"
                                    }
                                }
                            ],
                            "responses": {
                                "200": {
                                    "description": "Weather data for all cities"
                                }
                            }
                        }
                    },
                    "/api/places": {
                        "get": {
                            "summary": "List geographic locations",
                            "tags": ["Geographic"],
                            "parameters": [
                                {
                                    "name": "limit",
                                    "in": "query",
                                    "schema": {
                                        "type": "integer",
                                        "default": 100
                                    }
                                },
                                {
                                    "name": "offset",
                                    "in": "query",
                                    "schema": {
                                        "type": "integer",
                                        "default": 0
                                    }
                                }
                            ],
                            "responses": {
                                "200": {
                                    "description": "List of places"
                                }
                            }
                        }
                    },
                    "/api/places/search": {
                        "get": {
                            "summary": "Search locations by name",
                            "tags": ["Geographic"],
                            "parameters": [
                                {
                                    "name": "q",
                                    "in": "query",
                                    "required": true,
                                    "schema": {
                                        "type": "string"
                                    }
                                }
                            ],
                            "responses": {
                                "200": {
                                    "description": "Search results"
                                }
                            }
                        }
                    },
                    "/health": {
                        "get": {
                            "summary": "Health check",
                            "tags": ["System"],
                            "responses": {
                                "200": {
                                    "description": "Service is healthy",
                                    "content": {
                                        "application/json": {
                                            "example": {
                                                "status": "healthy",
                                                "service": "kairos-weather"
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                "components": {
                    "schemas": {
                        "WeatherResponse": {
                            "type": "object",
                            "properties": {
                                "location": {
                                    "type": "object",
                                    "properties": {
                                        "name": { "type": "string" },
                                        "latitude": { "type": "number" },
                                        "longitude": { "type": "number" },
                                        "timezone": { "type": "string" },
                                        "country": { "type": "string" },
                                        "local_time": { "type": "string", "format": "date-time" }
                                    }
                                },
                                "current": {
                                    "type": "object",
                                    "properties": {
                                        "temperature": { "type": "number" },
                                        "feels_like": { "type": "number" },
                                        "humidity": { "type": "integer" },
                                        "pressure": { "type": "number" },
                                        "wind": {
                                            "type": "object",
                                            "properties": {
                                                "speed": { "type": "number" },
                                                "direction": { "type": "integer" },
                                                "unit": { "type": "string" }
                                            }
                                        },
                                        "weather": {
                                            "type": "object",
                                            "properties": {
                                                "description": { "type": "string" },
                                                "icon": { "type": "string" },
                                                "emoji": { "type": "string" }
                                            }
                                        }
                                    }
                                },
                                "hourly": {
                                    "type": "array",
                                    "items": {
                                        "type": "object"
                                    }
                                },
                                "daily": {
                                    "type": "array",
                                    "items": {
                                        "type": "object"
                                    }
                                },
                                "data_source": {
                                    "type": "object",
                                    "properties": {
                                        "model": { "type": "string" },
                                        "resolution": { "type": "number" },
                                        "updated_at": { "type": "string", "format": "date-time" }
                                    }
                                }
                            }
                        }
                    }
                },
                "tags": [
                    {
                        "name": "Weather",
                        "description": "Weather data endpoints"
                    },
                    {
                        "name": "Geographic", 
                        "description": "Location search and information"
                    },
                    {
                        "name": "System",
                        "description": "System health and status"
                    }
                ]
            },
            dom_id: '#swagger-ui',
            deepLinking: true,
            presets: [
                SwaggerUIBundle.presets.apis,
                SwaggerUIStandalonePreset
            ],
            plugins: [
                SwaggerUIBundle.plugins.DownloadUrl
            ],
            layout: "StandaloneLayout",
            tryItOutEnabled: true,
            supportedSubmitMethods: ['get'],
            onComplete: function() {
                console.log("Swagger UI loaded");
            }
        });
    };
    </script>
</body>
</html>`