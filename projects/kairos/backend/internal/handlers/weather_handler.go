package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/sellinios/aethra/internal/services"
)

// WeatherHandler handles weather-related HTTP requests
type WeatherHandler struct {
	weatherService *services.WeatherService
}

// NewWeatherHandler creates a new weather handler
func NewWeatherHandler(db *sql.DB) *WeatherHandler {
	return &WeatherHandler{
		weatherService: services.NewWeatherService(db),
	}
}

// HandleWeather routes weather requests
func (h *WeatherHandler) HandleWeather(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.GetWeather(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// GetWeather returns weather data for a location
// GET /api/weather?lat=37.9838&lon=23.7275&units=metric
// GET /api/weather?city=Athens&units=metric
func (h *WeatherHandler) GetWeather(w http.ResponseWriter, r *http.Request) {
	// Parse query parameters
	query := r.URL.Query()
	units := query.Get("units")
	if units == "" {
		units = "metric"
	}

	// Check if request is by coordinates
	latStr := query.Get("lat")
	lonStr := query.Get("lon")
	if latStr != "" && lonStr != "" {
		lat, err := strconv.ParseFloat(latStr, 64)
		if err != nil {
			http.Error(w, "Invalid latitude", http.StatusBadRequest)
			return
		}

		lon, err := strconv.ParseFloat(lonStr, 64)
		if err != nil {
			http.Error(w, "Invalid longitude", http.StatusBadRequest)
			return
		}

		// Get weather by coordinates
		weather, err := h.weatherService.GetWeatherByLocation(lat, lon, units)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		h.sendJSON(w, weather)
		return
	}

	// Check if request is by city
	city := query.Get("city")
	if city != "" {
		weather, err := h.weatherService.GetWeatherByCity(city, units)
		if err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}

		h.sendJSON(w, weather)
		return
	}

	http.Error(w, "Either lat/lon or city parameter is required", http.StatusBadRequest)
}

// HandleCurrentWeather returns only current conditions
// GET /api/weather/current?city=Athens
func (h *WeatherHandler) HandleCurrentWeather(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	query := r.URL.Query()
	units := query.Get("units")
	if units == "" {
		units = "metric"
	}

	// Get full weather data
	var weather interface{}
	var err error

	city := query.Get("city")
	if city != "" {
		weather, err = h.weatherService.GetWeatherByCity(city, units)
	} else {
		latStr := query.Get("lat")
		lonStr := query.Get("lon")
		if latStr == "" || lonStr == "" {
			http.Error(w, "Either city or lat/lon required", http.StatusBadRequest)
			return
		}

		lat, _ := strconv.ParseFloat(latStr, 64)
		lon, _ := strconv.ParseFloat(lonStr, 64)
		weather, err = h.weatherService.GetWeatherByLocation(lat, lon, units)
	}

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Extract only current weather
	if weatherData, ok := weather.(map[string]interface{}); ok {
		current := map[string]interface{}{
			"location": weatherData["location"],
			"current":  weatherData["current"],
			"data_source": weatherData["data_source"],
		}
		h.sendJSON(w, current)
		return
	}

	h.sendJSON(w, weather)
}

// HandleForecast returns hourly/daily forecast
// GET /api/weather/forecast?city=Athens&type=hourly&hours=24
// GET /api/weather/forecast?city=Athens&type=daily&days=7
func (h *WeatherHandler) HandleForecast(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	query := r.URL.Query()
	forecastType := query.Get("type")
	if forecastType == "" {
		forecastType = "hourly"
	}

	// Implementation similar to GetWeather but returns only forecast data
	h.sendJSON(w, map[string]string{
		"message": "Forecast endpoint - implementation pending",
		"type":    forecastType,
	})
}

// HandleBulkWeather returns weather for multiple cities
// GET /api/weather/bulk?cities=Athens,Thessaloniki,Patras
func (h *WeatherHandler) HandleBulkWeather(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	citiesParam := r.URL.Query().Get("cities")
	if citiesParam == "" {
		http.Error(w, "Cities parameter required", http.StatusBadRequest)
		return
	}

	cities := strings.Split(citiesParam, ",")
	units := r.URL.Query().Get("units")
	if units == "" {
		units = "metric"
	}

	results := make([]map[string]interface{}, 0, len(cities))

	for _, city := range cities {
		city = strings.TrimSpace(city)
		weather, err := h.weatherService.GetWeatherByCity(city, units)
		
		result := map[string]interface{}{
			"city": city,
		}
		
		if err != nil {
			result["error"] = err.Error()
		} else {
			result["weather"] = weather
		}
		
		results = append(results, result)
	}

	h.sendJSON(w, map[string]interface{}{
		"count":   len(results),
		"results": results,
	})
}

// HandleWeatherMap returns weather data for map visualization
// GET /api/weather/map?bbox=34,19,42,30&zoom=8
func (h *WeatherHandler) HandleWeatherMap(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse bounding box
	bbox := r.URL.Query().Get("bbox")
	if bbox == "" {
		http.Error(w, "Bounding box required", http.StatusBadRequest)
		return
	}

	// Parse zoom level for data density
	zoomStr := r.URL.Query().Get("zoom")
	zoom, _ := strconv.Atoi(zoomStr)
	if zoom == 0 {
		zoom = 8
	}

	// This would return weather data points for map visualization
	h.sendJSON(w, map[string]interface{}{
		"type": "FeatureCollection",
		"features": []interface{}{
			// GeoJSON features with weather data
		},
		"properties": map[string]interface{}{
			"zoom": zoom,
			"bbox": bbox,
		},
	})
}

// HandleWeatherAlerts returns active weather alerts
// GET /api/weather/alerts?region=Greece
func (h *WeatherHandler) HandleWeatherAlerts(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	region := r.URL.Query().Get("region")
	if region == "" {
		region = "Greece"
	}

	// This would return active weather alerts
	h.sendJSON(w, map[string]interface{}{
		"region": region,
		"alerts": []interface{}{
			// Active weather alerts
		},
	})
}

// Helper method to send JSON response
func (h *WeatherHandler) sendJSON(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.Header().Set("Cache-Control", "public, max-age=300") // 5 minute cache
	
	// Pretty print JSON for better readability
	jsonData, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
	
	w.Write(jsonData)
}