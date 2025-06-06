package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/sellinios/aethra/internal/models"
)

// ICONHandler handles requests related to ICON data
type ICONHandler struct {
	DB *sql.DB
}

// NewICONHandler creates a new ICONHandler
func NewICONHandler(db *sql.DB) *ICONHandler {
	return &ICONHandler{DB: db}
}

// GetCells returns all ICON cells
func (h *ICONHandler) GetCells(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	repo := models.NewICONCellRepository(h.DB)
	cells, err := repo.FindAll()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cells)
}

// GetCellByID returns a specific ICON cell by ID
func (h *ICONHandler) GetCellByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract ID from URL query parameters
	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		http.Error(w, "Missing id parameter", http.StatusBadRequest)
		return
	}

	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid id parameter", http.StatusBadRequest)
		return
	}

	repo := models.NewICONCellRepository(h.DB)
	cell, err := repo.FindByID(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if cell == nil {
		http.Error(w, "Cell not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cell)
}

// GetCellByCoordinates returns a ICON cell containing the given coordinates
func (h *ICONHandler) GetCellByCoordinates(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract coordinates from URL query parameters
	latStr := r.URL.Query().Get("lat")
	lngStr := r.URL.Query().Get("lng")
	if latStr == "" || lngStr == "" {
		http.Error(w, "Missing lat or lng parameters", http.StatusBadRequest)
		return
	}

	lat, err := strconv.ParseFloat(latStr, 64)
	if err != nil {
		http.Error(w, "Invalid lat parameter", http.StatusBadRequest)
		return
	}

	lng, err := strconv.ParseFloat(lngStr, 64)
	if err != nil {
		http.Error(w, "Invalid lng parameter", http.StatusBadRequest)
		return
	}

	repo := models.NewICONCellRepository(h.DB)
	cell, err := repo.FindByCoordinates(lat, lng)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if cell == nil {
		http.Error(w, "No cell found at these coordinates", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cell)
}

// GetForecast returns weather forecast data for a specific location
func (h *ICONHandler) GetForecast(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Check if we're looking up by city name
	cityName := r.URL.Query().Get("city")
	if cityName != "" {
		h.getForecastByCity(w, r, cityName)
		return
	}

	// Extract coordinates from URL query parameters
	latStr := r.URL.Query().Get("lat")
	lngStr := r.URL.Query().Get("lng")
	if latStr == "" || lngStr == "" {
		http.Error(w, "Missing parameters: either 'city' or both 'lat' and 'lng' are required", http.StatusBadRequest)
		return
	}

	lat, err := strconv.ParseFloat(latStr, 64)
	if err != nil {
		http.Error(w, "Invalid lat parameter", http.StatusBadRequest)
		return
	}

	lng, err := strconv.ParseFloat(lngStr, 64)
	if err != nil {
		http.Error(w, "Invalid lng parameter", http.StatusBadRequest)
		return
	}

	// Extract optional hours parameter (default to 24 hours)
	hoursStr := r.URL.Query().Get("hours")
	hours := 24 // Default: 24 hours of forecast
	if hoursStr != "" {
		parsedHours, err := strconv.Atoi(hoursStr)
		if err == nil && parsedHours > 0 {
			hours = parsedHours
		}
		
		if hours > 120 {
			hours = 120 // Max: 120 hours (5 days)
		}
	}

	// Find the cell for the given coordinates (implementation detail hidden from user)
	cellRepo := models.NewICONCellRepository(h.DB)
	cell, err := cellRepo.FindByCoordinates(lat, lng)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if cell == nil {
		http.Error(w, "No weather data available for this location", http.StatusNotFound)
		return
	}

	// Get the nearest place to provide a name for the location
	geoRepo := models.NewGeoEntityRepository(h.DB)
	places, err := geoRepo.FindByCoordinates(lat, lng, 1)
	var placeName string
	if err == nil && len(places) > 0 {
		placeName = places[0].NameEN.String
	}

	// Get forecasts for this cell
	forecastRepo := models.NewICONTileForecastRepository(h.DB)
	forecasts, err := forecastRepo.FindLatestForecastsByCellID(cell.ID, hours)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if len(forecasts) == 0 {
		http.Error(w, "No forecast data available for this location", http.StatusNotFound)
		return
	}

	// Transform the forecasts into a more user-friendly format
	type WeatherForecast struct {
		DateTime      time.Time `json:"datetime"`
		Temperature   float64   `json:"temperature"`   // Kelvin
		TempC         float64   `json:"temp_c"`        // Celsius
		TempF         float64   `json:"temp_f"`        // Fahrenheit
		Humidity      float64   `json:"humidity"`      // %
		WindSpeed     float64   `json:"wind_speed"`    // m/s
		WindDir       float64   `json:"wind_direction"` // degrees
		WindDirCardinal string  `json:"wind_direction_cardinal"` // N, NE, E, etc.
		Precipitation float64   `json:"precipitation"`  // mm
		Pressure      float64   `json:"pressure"`      // hPa
		CloudCover    float64   `json:"cloud_cover"`   // %
		DataQuality   string    `json:"data_quality,omitempty"` // Indicator of data completeness
	}

	type LocationWeather struct {
		Location struct {
			Latitude  float64 `json:"latitude"`
			Longitude float64 `json:"longitude"`
			Name      string  `json:"name,omitempty"`
			Timezone  string  `json:"timezone,omitempty"`
		} `json:"location"`
		ForecastTime time.Time         `json:"forecast_time"`
		RunTime      time.Time         `json:"run_time"`
		Forecasts    []WeatherForecast `json:"forecasts"`
	}

	// Create user-friendly response
	weather := LocationWeather{}
	weather.Location.Latitude = lat
	weather.Location.Longitude = lng
	weather.Location.Name = placeName
	
	if len(forecasts) > 0 {
		weather.ForecastTime = forecasts[0].ForecastDatetime
		weather.RunTime = forecasts[0].RunDate
	}

	weather.Forecasts = make([]WeatherForecast, len(forecasts))
	for i, f := range forecasts {
		// Default values to use when data is missing
		var tempK, tempC, tempF, humidity, windSpeed, windDir, precipitation, pressure, cloudCover float64
		var windDirCardinal string
		var dataQuality string

		// Handle temperature conversion using effective getter method
		tempK = f.ForecastData.GetEffectiveTemperature()
		if tempK >= 200 && tempK <= 333 {
			tempC = tempK - 273.15
			tempF = tempC*9/5 + 32
		} else if tempK >= -80 && tempK <= 60 {
			// Data might already be in Celsius, use as is
			tempC = tempK
			tempF = tempC*9/5 + 32
			// Convert back to Kelvin for consistency
			tempK = tempC + 273.15
		} else {
			// Temperature outside expected ranges
			tempC = 0
			tempF = 0
			tempK = 0
		}
		
		// Handle wind - use effective getter methods
		if f.ForecastData.HasWindData() {
			// If we have wind data, calculate it
			windSpeed = calcWindSpeed(f.ForecastData.GetEffectiveWindSpeedU(), f.ForecastData.GetEffectiveWindSpeedV())
			windDir = calcWindDirection(f.ForecastData.GetEffectiveWindSpeedU(), f.ForecastData.GetEffectiveWindSpeedV())
			windDirCardinal = getCardinalDirection(windDir)
		} else {
			// Mark as missing
			windSpeed = 0 // 0 indicates missing data
			windDir = 0
			windDirCardinal = "N/A" // "Not Available" for missing data
		}

		// Use effective getter methods for other parameters
		humidity = f.ForecastData.GetEffectiveHumidity()
		precipitation = f.ForecastData.GetEffectivePrecipitationHourly() // Use hourly rate (mm/h) instead of raw rate (mm/s)
		cloudCover = f.ForecastData.GetEffectiveCloudCover()

		// Pressure conversion if available (Pa to hPa)
		surfacePressure := f.ForecastData.GetEffectiveSurfacePressure()
		if surfacePressure > 0 {
			pressure = surfacePressure / 100.0
		}
		
		// Determine data quality flag
		hasTemp := f.ForecastData.HasTemperatureData()
		hasWind := f.ForecastData.HasWindData()
		if hasTemp && hasWind {
			dataQuality = "complete"
		} else if !hasTemp && !hasWind {
			dataQuality = "minimal"
		} else {
			dataQuality = "partial"
		}
		
		wf := WeatherForecast{
			DateTime:        f.ForecastDatetime,
			Temperature:     tempK,
			TempC:           tempC,
			TempF:           tempF,
			Humidity:        humidity,
			WindSpeed:       windSpeed,
			WindDir:         windDir,
			WindDirCardinal: windDirCardinal,
			Precipitation:   precipitation,
			Pressure:        pressure,
			CloudCover:      cloudCover,
			DataQuality:     dataQuality,
		}
		weather.Forecasts[i] = wf
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(weather)
}

// getForecastByCity gets forecast for a specific city name
func (h *ICONHandler) getForecastByCity(w http.ResponseWriter, r *http.Request, cityName string) {
	// Log the city name for debugging
	fmt.Printf("Looking up city with name: '%s'\n", cityName)

	// Try to get data for different case variations 
	variations := []string{
		cityName,                                                    // Original
		strings.ToLower(cityName),                                   // Lowercase
		strings.ToUpper(cityName),                                   // Uppercase
		strings.Title(strings.ToLower(cityName)),                    // Title Case
		strings.ToUpper(cityName[:1]) + strings.ToLower(cityName[1:]), // First Letter Uppercase
	}

	// Find the city by name with case variations
	geoRepo := models.NewGeoEntityRepository(h.DB)
	var cities []models.GeoEntity
	var err error

	for _, variation := range variations {
		fmt.Printf("Trying city name variation: '%s'\n", variation)
		cities, err = geoRepo.FindByName(variation, 1)
		if err == nil && len(cities) > 0 {
			fmt.Printf("Found city with name variation: '%s'\n", variation)
			break
		}
	}

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if len(cities) == 0 {
		fmt.Printf("No city found with name '%s' or any of its variations\n", cityName)
		http.Error(w, "City not found", http.StatusNotFound)
		return
	}

	city := cities[0]
	fmt.Printf("Selected entity: id=%d, name=%s, entity_type=%s\n", city.ID, city.Name, city.EntityType)
	
	// Extract lat/lng from city centroid
	var lat, lng float64
	err = h.DB.QueryRow("SELECT ST_Y(centroid::geometry), ST_X(centroid::geometry) FROM geo_entities WHERE id = $1", city.ID).Scan(&lat, &lng)
	if err != nil {
		http.Error(w, "Error getting city coordinates", http.StatusInternalServerError)
		return
	}

	// Extract optional hours parameter (default to 24 hours)
	hoursStr := r.URL.Query().Get("hours")
	hours := 24 // Default: 24 hours of forecast
	if hoursStr != "" {
		parsedHours, err := strconv.Atoi(hoursStr)
		if err == nil && parsedHours > 0 {
			hours = parsedHours
		}
		
		if hours > 120 {
			hours = 120 // Max: 120 hours (5 days)
		}
	}

	// Try to find the cell using the cell_id first (much faster)
	var cell *models.ICONCell
	cellRepo := models.NewICONCellRepository(h.DB)
	
	// Get the cell_id directly from the database to ensure we have the latest value
	var cellID sql.NullInt64
	err = h.DB.QueryRow("SELECT cell_id FROM geo_entities WHERE id = $1", city.ID).Scan(&cellID)
	if err != nil {
		http.Error(w, "Error getting cell_id", http.StatusInternalServerError)
		return
	}
	
	if cellID.Valid && cellID.Int64 > 0 {
		// Use the directly associated cell_id if available
		fmt.Printf("Using direct cell_id association (%d) for %s\n", cellID.Int64, city.Name)
		cell, err = cellRepo.FindByID(cellID.Int64)
		if err != nil {
			fmt.Printf("Error finding cell by ID: %v, falling back to coordinates lookup\n", err)
			// Fall back to coordinates if cell lookup fails
			cell, err = cellRepo.FindByCoordinates(lat, lng)
		}
	} else {
		// Fall back to spatial query if no cell_id
		fmt.Printf("No cell_id for %s, using spatial query with coordinates\n", city.Name)
		cell, err = cellRepo.FindByCoordinates(lat, lng)
	}
	
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if cell == nil {
		http.Error(w, "No weather data available for this city", http.StatusNotFound)
		return
	}

	// Get forecasts for this cell
	forecastRepo := models.NewICONTileForecastRepository(h.DB)
	forecasts, err := forecastRepo.FindLatestForecastsByCellID(cell.ID, hours)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if len(forecasts) == 0 {
		http.Error(w, "No forecast data available for this city", http.StatusNotFound)
		return
	}

	// Transform the forecasts into a more user-friendly format
	type WeatherForecast struct {
		DateTime      time.Time `json:"datetime"`
		Temperature   float64   `json:"temperature"`   // Kelvin
		TempC         float64   `json:"temp_c"`        // Celsius
		TempF         float64   `json:"temp_f"`        // Fahrenheit
		Humidity      float64   `json:"humidity"`      // %
		WindSpeed     float64   `json:"wind_speed"`    // m/s
		WindDir       float64   `json:"wind_direction"` // degrees
		WindDirCardinal string  `json:"wind_direction_cardinal"` // N, NE, E, etc.
		Precipitation float64   `json:"precipitation"`  // mm
		Pressure      float64   `json:"pressure"`      // hPa
		CloudCover    float64   `json:"cloud_cover"`   // %
		DataQuality   string    `json:"data_quality,omitempty"` // Indicator of data completeness
	}

	type CityWeather struct {
		City            string           `json:"city"`
		Country         string           `json:"country"`
		Datetime        time.Time        `json:"datetime"`
		Weather         WeatherForecast  `json:"weather"`
		HourlyForecasts []WeatherForecast `json:"hourly_forecasts,omitempty"`
		Timezone        string           `json:"timezone,omitempty"`
		Latitude        float64          `json:"latitude"`
		Longitude       float64          `json:"longitude"`
	}

	// Create user-friendly response
	weather := CityWeather{
		City:      city.NameEN.String,
		Country:   city.CountryCode.String,
		Timezone:  city.Timezone.String,
		Latitude:  lat,
		Longitude: lng,
		HourlyForecasts: []WeatherForecast{}, // Initialize empty array for hourly forecasts
	}

	if len(forecasts) > 0 {
		weather.Datetime = forecasts[0].ForecastDatetime
		
		// Current weather (first forecast)
		f := forecasts[0]
		
		// Default values to use when data is missing
		var tempK, tempC, tempF, humidity, windSpeed, windDir, precipitation, pressure, cloudCover float64
		var windDirCardinal string
		var dataQuality string

		// Handle temperature conversion using effective getter method
		tempK = f.ForecastData.GetEffectiveTemperature()
		if tempK >= 200 && tempK <= 333 {
			tempC = tempK - 273.15
			tempF = tempC*9/5 + 32
		} else if tempK >= -80 && tempK <= 60 {
			// Data might already be in Celsius, use as is
			tempC = tempK
			tempF = tempC*9/5 + 32
			// Convert back to Kelvin for consistency
			tempK = tempC + 273.15
		} else {
			// Temperature outside expected ranges
			tempC = 0
			tempF = 0
			tempK = 0
		}
		
		// Handle wind - use effective getter methods
		if f.ForecastData.HasWindData() {
			// If we have wind data, calculate it
			windSpeed = calcWindSpeed(f.ForecastData.GetEffectiveWindSpeedU(), f.ForecastData.GetEffectiveWindSpeedV())
			windDir = calcWindDirection(f.ForecastData.GetEffectiveWindSpeedU(), f.ForecastData.GetEffectiveWindSpeedV())
			windDirCardinal = getCardinalDirection(windDir)
		} else {
			// Mark as missing
			windSpeed = 0 // 0 indicates missing data
			windDir = 0
			windDirCardinal = "N/A" // "Not Available" for missing data
		}

		// Use effective getter methods for other parameters
		humidity = f.ForecastData.GetEffectiveHumidity()
		precipitation = f.ForecastData.GetEffectivePrecipitationHourly() // Use hourly rate (mm/h) instead of raw rate (mm/s)
		cloudCover = f.ForecastData.GetEffectiveCloudCover()

		// Pressure conversion if available (Pa to hPa)
		surfacePressureValue := f.ForecastData.GetEffectiveSurfacePressure()
		if surfacePressureValue > 0 {
			pressure = surfacePressureValue / 100.0
		}
		
		// Determine data quality flag
		hasTemp := f.ForecastData.HasTemperatureData()
		hasWind := f.ForecastData.HasWindData()
		if hasTemp && hasWind {
			dataQuality = "complete"
		} else if !hasTemp && !hasWind {
			dataQuality = "minimal"
		} else {
			dataQuality = "partial"
		}
		
		weather.Weather = WeatherForecast{
			DateTime:        f.ForecastDatetime,
			Temperature:     tempK,
			TempC:           tempC,
			TempF:           tempF,
			Humidity:        humidity,
			WindSpeed:       windSpeed,
			WindDir:         windDir,
			WindDirCardinal: windDirCardinal,
			Precipitation:   precipitation,
			Pressure:        pressure,
			CloudCover:      cloudCover,
			DataQuality:     dataQuality,
		}
		
		// Always include hourly forecasts
		weather.HourlyForecasts = make([]WeatherForecast, len(forecasts))
		for i, f := range forecasts {
			// Default values to use when data is missing
			var tempK, tempC, tempF, humidity, windSpeed, windDir, precipitation, pressure, cloudCover float64
			var windDirCardinal string
			var dataQuality string

			// Handle temperature conversion using effective getter method
			tempK = f.ForecastData.GetEffectiveTemperature()
			if tempK >= 200 && tempK <= 333 {
				tempC = tempK - 273.15
				tempF = tempC*9/5 + 32
			} else if tempK >= -80 && tempK <= 60 {
				// Data might already be in Celsius, use as is
				tempC = tempK
				tempF = tempC*9/5 + 32
				// Convert back to Kelvin for consistency
				tempK = tempC + 273.15
			} else {
				// Temperature outside expected ranges
				tempC = 0
				tempF = 0
				tempK = 0
			}
			
			// Handle wind - use effective getter methods
			if f.ForecastData.HasWindData() {
				// If we have wind data, calculate it
				windSpeed = calcWindSpeed(f.ForecastData.GetEffectiveWindSpeedU(), f.ForecastData.GetEffectiveWindSpeedV())
				windDir = calcWindDirection(f.ForecastData.GetEffectiveWindSpeedU(), f.ForecastData.GetEffectiveWindSpeedV())
				windDirCardinal = getCardinalDirection(windDir)
			} else {
				// Mark as missing
				windSpeed = 0 // 0 indicates missing data
				windDir = 0
				windDirCardinal = "N/A" // "Not Available" for missing data
			}

			// Use effective getter methods for other parameters
			humidity = f.ForecastData.GetEffectiveHumidity()
			precipitation = f.ForecastData.GetEffectivePrecipitationHourly()
			cloudCover = f.ForecastData.GetEffectiveCloudCover()

			// Pressure conversion if available (Pa to hPa)
			surfacePressure := f.ForecastData.GetEffectiveSurfacePressure()
			if surfacePressure > 0 {
				pressure = surfacePressure / 100.0
			}
			
			// Determine data quality flag
			hasTemp := f.ForecastData.HasTemperatureData()
			hasWind := f.ForecastData.HasWindData()
			if hasTemp && hasWind {
				dataQuality = "complete"
			} else if !hasTemp && !hasWind {
				dataQuality = "minimal"
			} else {
				dataQuality = "partial"
			}
			
			wf := WeatherForecast{
				DateTime:        f.ForecastDatetime,
				Temperature:     tempK,
				TempC:           tempC,
				TempF:           tempF, 
				Humidity:        humidity,
				WindSpeed:       windSpeed,
				WindDir:         windDir,
				WindDirCardinal: windDirCardinal,
				Precipitation:   precipitation,
				Pressure:        pressure,
				CloudCover:      cloudCover,
				DataQuality:     dataQuality,
			}
			weather.HourlyForecasts[i] = wf
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(weather)
}

// Helper functions for weather calculations
func calcWindSpeed(u, v float64) float64 {
	return math.Sqrt(u*u + v*v)
}

func calcWindDirection(u, v float64) float64 {
	// Calculate wind direction in degrees (meteorological convention)
	angle := math.Atan2(-u, -v) * (180.0 / math.Pi)
	if angle < 0 {
		angle += 360.0
	}
	return angle
}

// getCardinalDirection converts degrees to cardinal directions
func getCardinalDirection(degrees float64) string {
	// If degrees is NaN, return "N/A"
	if math.IsNaN(degrees) {
		return "N/A"
	}
	
	directions := []string{"N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"}
	index := int((degrees + 11.25) / 22.5) % 16
	return directions[index]
}