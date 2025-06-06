package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/sellinios/aethra/internal/models"
)

// GetForecastByDateRange returns weather forecast data for a specific location and date range
func (h *ICONHandler) GetForecastByDateRange(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Check if we're looking up by city name
	cityName := r.URL.Query().Get("city")
	var lat, lng float64
	var cityEntity *models.GeoEntity
	var err error
	
	if cityName != "" {
		// Find the city by name
		geoRepo := models.NewGeoEntityRepository(h.DB)
		cities, err := geoRepo.FindByName(cityName, 1)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		if len(cities) == 0 {
			http.Error(w, "City not found", http.StatusNotFound)
			return
		}

		cityEntity = &cities[0]
		
		// Extract lat/lng from city centroid
		err = h.DB.QueryRow("SELECT ST_Y(centroid::geometry), ST_X(centroid::geometry) FROM geo_entities WHERE id = $1", cityEntity.ID).Scan(&lat, &lng)
		if err != nil {
			http.Error(w, "Error getting city coordinates", http.StatusInternalServerError)
			return
		}
	} else {
		// Extract coordinates from URL query parameters
		latStr := r.URL.Query().Get("lat")
		lngStr := r.URL.Query().Get("lng")
		if latStr == "" || lngStr == "" {
			http.Error(w, "Missing parameters: either 'city' or both 'lat' and 'lng' are required", http.StatusBadRequest)
			return
		}

		var err error
		lat, err = strconv.ParseFloat(latStr, 64)
		if err != nil {
			http.Error(w, "Invalid lat parameter", http.StatusBadRequest)
			return
		}

		lng, err = strconv.ParseFloat(lngStr, 64)
		if err != nil {
			http.Error(w, "Invalid lng parameter", http.StatusBadRequest)
			return
		}
		
		// Get the nearest place to provide a name for the location
		geoRepo := models.NewGeoEntityRepository(h.DB)
		places, err := geoRepo.FindByCoordinates(lat, lng, 1)
		if err == nil && len(places) > 0 {
			cityEntity = &places[0]
		}
	}

	// Parse dates (ISO 8601 format or simple dates)
	var start, end time.Time
	startStr := r.URL.Query().Get("start")
	endStr := r.URL.Query().Get("end")

	if startStr == "" || endStr == "" {
		// Default to 5 days if not specified
		start = time.Now()
		end = start.Add(5 * 24 * time.Hour)
	} else {
		var err error
		// Try standard ISO format first
		start, err = time.Parse(time.RFC3339, startStr)
		if err != nil {
			// Try simple date format (YYYY-MM-DD)
			start, err = time.Parse("2006-01-02", startStr)
			if err != nil {
				http.Error(w, "Invalid start date (use YYYY-MM-DD format)", http.StatusBadRequest)
				return
			}
		}

		end, err = time.Parse(time.RFC3339, endStr)
		if err != nil {
			// Try simple date format (YYYY-MM-DD)
			end, err = time.Parse("2006-01-02", endStr)
			if err != nil {
				http.Error(w, "Invalid end date (use YYYY-MM-DD format)", http.StatusBadRequest)
				return
			}
			// If only date is provided, set time to end of day
			end = end.Add(23 * time.Hour + 59 * time.Minute + 59 * time.Second)
		}
	}

	// Find the cell for the given coordinates
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

	// Get forecasts for this cell within the date range
	forecastRepo := models.NewICONTileForecastRepository(h.DB)
	forecasts, err := forecastRepo.FindForecastsByDateRange(cell.ID, start, end)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if len(forecasts) == 0 {
		http.Error(w, "No forecast data available for this location and date range", http.StatusNotFound)
		return
	}

	// Transform the forecasts
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

	// Group forecasts by day for daily summary
	type DailyForecast struct {
		Date       time.Time `json:"date"`
		MinTempC   float64   `json:"min_temp_c"`
		MaxTempC   float64   `json:"max_temp_c"`
		AvgTempC   float64   `json:"avg_temp_c"`
		AvgHumidity float64  `json:"avg_humidity"`
		TotalPrecip float64  `json:"total_precipitation"`
		Forecasts  []WeatherForecast `json:"hourly_forecasts"`
	}

	// Create response object
	type ForecastResponse struct {
		Location struct {
			Latitude  float64 `json:"latitude"`
			Longitude float64 `json:"longitude"`
			City      string  `json:"city,omitempty"`
			Country   string  `json:"country,omitempty"`
		} `json:"location"`
		Period struct {
			Start time.Time `json:"start"`
			End   time.Time `json:"end"`
		} `json:"period"`
		Days []DailyForecast `json:"days"`
	}

	response := ForecastResponse{}
	response.Location.Latitude = lat
	response.Location.Longitude = lng
	if cityEntity != nil {
		response.Location.City = cityEntity.NameEN.String
		response.Location.Country = cityEntity.CountryCode.String
	}
	response.Period.Start = start
	response.Period.End = end

	// Group forecasts by day
	dailyForecasts := make(map[string]*DailyForecast)
	
	for _, f := range forecasts {
		date := f.ForecastDatetime.Format("2006-01-02")
		
		// Create daily forecast if it doesn't exist
		if _, exists := dailyForecasts[date]; !exists {
			dailyForecasts[date] = &DailyForecast{
				Date:      time.Date(f.ForecastDatetime.Year(), f.ForecastDatetime.Month(), f.ForecastDatetime.Day(), 0, 0, 0, 0, f.ForecastDatetime.Location()),
				MinTempC:  1000, // Start with high value
				MaxTempC:  -1000, // Start with low value
				Forecasts: []WeatherForecast{},
			}
		}
		
		// Calculate weather data
		tempK := f.ForecastData.GetEffectiveTemperature()
		tempC := 0.0
		tempF := 0.0
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
		
		var windSpeed, windDir float64
		var windDirCardinal string
		var dataQuality string
		
		// Handle wind
		if f.ForecastData.HasWindData() {
			// Calculate wind from components
			windSpeed = calcWindSpeed(f.ForecastData.GetEffectiveWindSpeedU(), f.ForecastData.GetEffectiveWindSpeedV())
			windDir = calcWindDirection(f.ForecastData.GetEffectiveWindSpeedU(), f.ForecastData.GetEffectiveWindSpeedV())
			windDirCardinal = getCardinalDirection(windDir)
		} else {
			// Mark data as unavailable
			windSpeed = 0
			windDir = 0
			windDirCardinal = "N/A"
		}
		
		// Determine data quality
		hasTemp := f.ForecastData.HasTemperatureData()
		hasWind := f.ForecastData.HasWindData()
		if hasTemp && hasWind {
			dataQuality = "complete"
		} else if !hasTemp && !hasWind {
			dataQuality = "minimal"
		} else {
			dataQuality = "partial"
		}
		
		// Use effective getters for other fields
		humidity := f.ForecastData.GetEffectiveHumidity()
		precipitation := f.ForecastData.GetEffectivePrecipitationHourly() // Use mm/h instead of mm/s
		cloudCover := f.ForecastData.GetEffectiveCloudCover()
		pressure := 0.0
		if surfacePressure := f.ForecastData.GetEffectiveSurfacePressure(); surfacePressure > 0 {
			pressure = surfacePressure / 100.0
		}
		
		// Update min/max temperatures
		daily := dailyForecasts[date]
		if tempC < daily.MinTempC && tempC != 0 {
			daily.MinTempC = tempC
		}
		if tempC > daily.MaxTempC {
			daily.MaxTempC = tempC
		}
		
		// Add to totals for averaging later
		daily.AvgTempC += tempC
		daily.AvgHumidity += humidity
		daily.TotalPrecip += precipitation
		
		// Add hourly forecast
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
		daily.Forecasts = append(daily.Forecasts, wf)
	}
	
	// Calculate averages and create sorted days list
	for _, daily := range dailyForecasts {
		if len(daily.Forecasts) > 0 {
			daily.AvgTempC /= float64(len(daily.Forecasts))
			daily.AvgHumidity /= float64(len(daily.Forecasts))
		}
		
		// Handle case where we didn't find a real min/max
		if daily.MinTempC > 900 {
			daily.MinTempC = 0
		}
		if daily.MaxTempC < -900 {
			daily.MaxTempC = 0
		}
		
		response.Days = append(response.Days, *daily)
	}
	
	// Sort days by date (simple bubble sort)
	for i := 0; i < len(response.Days); i++ {
		for j := i + 1; j < len(response.Days); j++ {
			if response.Days[i].Date.After(response.Days[j].Date) {
				response.Days[i], response.Days[j] = response.Days[j], response.Days[i]
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GetCitiesWithTemperatures returns all cities with their current temperatures
func (h *ICONHandler) GetCitiesWithTemperatures(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Find all cities
	var cities []models.GeoEntity
	rows, err := h.DB.Query("SELECT id, name, name_en, country_code FROM geo_entities WHERE entity_type = 'city' AND is_enabled = true")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var city models.GeoEntity
		err := rows.Scan(&city.ID, &city.Name, &city.NameEN, &city.CountryCode)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		cities = append(cities, city)
	}

	// Prepare response
	type CityTemperature struct {
		Name        string  `json:"name"`
		Country     string  `json:"country"`
		TempC       float64 `json:"temp_c"`
		TempF       float64 `json:"temp_f"`
		DateTime    time.Time `json:"datetime"`
		DataQuality string  `json:"data_quality,omitempty"`
	}

	response := struct {
		Cities []CityTemperature `json:"cities"`
	}{
		Cities: []CityTemperature{},
	}

	// For each city, get current temperature
	for _, city := range cities {
		var lat, lng float64
		err = h.DB.QueryRow("SELECT ST_Y(centroid::geometry), ST_X(centroid::geometry) FROM geo_entities WHERE id = $1", city.ID).Scan(&lat, &lng)
		if err != nil {
			continue // Skip this city if error
		}

		// Find the ICON cell for this city
		var cellID int64
		err = h.DB.QueryRow(`
			SELECT c.id 
			FROM icon_cells c 
			WHERE ST_DWithin(c.boundary, 
				ST_GeogFromText('POINT(' || $1 || ' ' || $2 || ')'), 50000) 
			LIMIT 1
		`, lng, lat).Scan(&cellID)
		if err != nil {
			continue // Skip this city if no cell found
		}

		// Get latest forecast for this cell
		var rawData []byte
		var forecastTime time.Time
		err = h.DB.QueryRow(`
			SELECT f.forecast_datetime, f.forecast_data
			FROM icon_tile_forecasts f
			WHERE f.cell_id = $1 AND f.forecast_datetime >= NOW()
			ORDER BY f.forecast_datetime
			LIMIT 1
		`, cellID).Scan(&forecastTime, &rawData)
		if err != nil {
			continue // Skip this city if no forecast found
		}

		// Parse the forecast data
		var forecastData models.ForecastData
		if err := json.Unmarshal(rawData, &forecastData); err != nil {
			continue // Skip if can't parse JSON
		}

		// Get temperature
		tempK := forecastData.GetEffectiveTemperature()
		tempC := 0.0
		tempF := 0.0
		dataQuality := "minimal"

		if tempK >= 200 && tempK <= 333 {
			tempC = tempK - 273.15
			tempF = tempC*9/5 + 32
			
			// Determine data quality
			if forecastData.HasWindData() {
				dataQuality = "complete"
			} else {
				dataQuality = "partial"
			}
		} else if tempK >= -80 && tempK <= 60 {
			// Data might already be in Celsius, use as is
			tempC = tempK
			tempF = tempC*9/5 + 32
			// Convert back to Kelvin for consistency
			tempK = tempC + 273.15
			
			// Determine data quality
			if forecastData.HasWindData() {
				dataQuality = "complete"
			} else {
				dataQuality = "partial"
			}
		} else {
			// Temperature outside expected ranges
			tempC = 0
			tempF = 0
			tempK = 0
		}

		// Only include cities with valid temperature data
		if tempK > 0 {
			response.Cities = append(response.Cities, CityTemperature{
				Name:        city.NameEN.String,
				Country:     city.CountryCode.String,
				TempC:       tempC,
				TempF:       tempF,
				DateTime:    forecastTime,
				DataQuality: dataQuality,
			})
		}
	}

	// Sort cities by temperature (descending)
	for i := 0; i < len(response.Cities); i++ {
		for j := i + 1; j < len(response.Cities); j++ {
			if response.Cities[i].TempC < response.Cities[j].TempC {
				response.Cities[i], response.Cities[j] = response.Cities[j], response.Cities[i]
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// GetPlacesWithPrecipitation returns places with precipitation in the next 24 hours
func (h *ICONHandler) GetPlacesWithPrecipitation(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Get threshold from query params (default 0.5mm)
	thresholdStr := r.URL.Query().Get("threshold")
	threshold := 0.5
	if thresholdStr != "" {
		parsedThreshold, err := strconv.ParseFloat(thresholdStr, 64)
		if err == nil && parsedThreshold > 0 {
			threshold = parsedThreshold
		}
	}

	// Extract hours parameter (default 24 hours)
	hoursStr := r.URL.Query().Get("hours")
	hours := 24
	if hoursStr != "" {
		parsedHours, err := strconv.Atoi(hoursStr)
		if err == nil && parsedHours > 0 {
			hours = parsedHours
		}
		if hours > 120 {
			hours = 120 // Max 5 days
		}
	}

	// Find places with precipitation
	rows, err := h.DB.Query(`
		WITH forecasts AS (
			SELECT 
				g.id AS place_id,
				g.name_en AS place_name,
				g.country_code,
				f.forecast_datetime,
				f.forecast_data,
				CASE 
					WHEN f.forecast_data->>'prate_level_surface' IS NOT NULL THEN CAST(f.forecast_data->>'prate_level_surface' AS FLOAT) * 3600 -- Convert mm/s to mm/h
					WHEN f.forecast_data->>'prate_level_0' IS NOT NULL THEN CAST(f.forecast_data->>'prate_level_0' AS FLOAT) * 3600 -- Convert mm/s to mm/h
					ELSE 0
				END AS precipitation,
				CASE 
					WHEN f.forecast_data->>'tmp_level_2_m' IS NOT NULL AND CAST(f.forecast_data->>'tmp_level_2_m' AS FLOAT) BETWEEN 200 AND 333 THEN CAST(f.forecast_data->>'tmp_level_2_m' AS FLOAT) - 273.15
					WHEN f.forecast_data->>'2t_level_2' IS NOT NULL AND CAST(f.forecast_data->>'2t_level_2' AS FLOAT) BETWEEN 200 AND 333 THEN CAST(f.forecast_data->>'2t_level_2' AS FLOAT) - 273.15
					WHEN f.forecast_data->>'tmp_level_2_m' IS NOT NULL AND CAST(f.forecast_data->>'tmp_level_2_m' AS FLOAT) BETWEEN -80 AND 60 THEN CAST(f.forecast_data->>'tmp_level_2_m' AS FLOAT)
					WHEN f.forecast_data->>'2t_level_2' IS NOT NULL AND CAST(f.forecast_data->>'2t_level_2' AS FLOAT) BETWEEN -80 AND 60 THEN CAST(f.forecast_data->>'2t_level_2' AS FLOAT)
					ELSE 0
				END AS temperature_c
			FROM 
				geo_entities g
				JOIN icon_cells c ON ST_DWithin(c.boundary, g.centroid, 50000)
				JOIN icon_tile_forecasts f ON c.id = f.cell_id
			WHERE 
				g.entity_type = 'city'
				AND f.forecast_datetime >= NOW()
				AND f.forecast_datetime <= NOW() + ($1 || ' hours')::INTERVAL
				AND (
					(f.forecast_data->>'prate_level_surface' IS NOT NULL AND CAST(f.forecast_data->>'prate_level_surface' AS FLOAT) * 3600 > $2)
					OR
					(f.forecast_data->>'prate_level_0' IS NOT NULL AND CAST(f.forecast_data->>'prate_level_0' AS FLOAT) * 3600 > $2)
				)
		)
		SELECT 
			place_id, 
			place_name, 
			country_code, 
			forecast_datetime, 
			forecast_data,
			precipitation, 
			temperature_c
		FROM 
			forecasts
		ORDER BY 
			precipitation DESC
	`, hours, threshold)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type PrecipitationForecast struct {
		PlaceID       int64          `json:"-"`
		Name          string         `json:"name"`
		Country       string         `json:"country"`
		DateTime      time.Time      `json:"datetime"`
		Precipitation float64        `json:"precipitation"`
		TemperatureC  float64        `json:"temperature_c"`
		DataQuality   string         `json:"data_quality,omitempty"`
		RawData       []byte         `json:"-"`
	}

	var forecasts []PrecipitationForecast
	for rows.Next() {
		var f PrecipitationForecast
		var placeName sql.NullString
		var countryCode sql.NullString
		err := rows.Scan(&f.PlaceID, &placeName, &countryCode, &f.DateTime, &f.RawData, &f.Precipitation, &f.TemperatureC)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		
		if placeName.Valid {
			f.Name = placeName.String
		}
		
		if countryCode.Valid {
			f.Country = countryCode.String
		}
		
		// Parse forecast data to check if it has wind data
		var forecastData models.ForecastData
		if err := json.Unmarshal(f.RawData, &forecastData); err == nil {
			// Determine data quality
			hasTemp := forecastData.HasTemperatureData()
			hasWind := forecastData.HasWindData()
			if hasTemp && hasWind {
				f.DataQuality = "complete"
			} else if !hasTemp && !hasWind {
				f.DataQuality = "minimal"
			} else {
				f.DataQuality = "partial"
			}
		} else {
			f.DataQuality = "minimal"
		}
		
		forecasts = append(forecasts, f)
	}

	// Group by place for a more user-friendly response
	type PlaceForecasts struct {
		Name      string                `json:"name"`
		Country   string                `json:"country"`
		Forecasts []PrecipitationForecast `json:"forecasts"`
	}

	placeMap := make(map[int64]*PlaceForecasts)
	
	for _, f := range forecasts {
		if _, exists := placeMap[f.PlaceID]; !exists {
			placeMap[f.PlaceID] = &PlaceForecasts{
				Name:    f.Name,
				Country: f.Country,
				Forecasts: []PrecipitationForecast{},
			}
		}
		
		// Add forecast to place (without raw data)
		f.RawData = nil // Don't include raw data in response
		placeMap[f.PlaceID].Forecasts = append(placeMap[f.PlaceID].Forecasts, f)
	}

	// Convert map to slice
	places := make([]PlaceForecasts, 0, len(placeMap))
	for _, place := range placeMap {
		places = append(places, *place)
	}

	// Sort places by max precipitation (descending)
	for i := 0; i < len(places); i++ {
		for j := i + 1; j < len(places); j++ {
			maxI := 0.0
			maxJ := 0.0
			
			for _, f := range places[i].Forecasts {
				if f.Precipitation > maxI {
					maxI = f.Precipitation
				}
			}
			
			for _, f := range places[j].Forecasts {
				if f.Precipitation > maxJ {
					maxJ = f.Precipitation
				}
			}
			
			if maxI < maxJ {
				places[i], places[j] = places[j], places[i]
			}
		}
	}

	response := struct {
		Threshold float64         `json:"threshold"`
		Hours     int             `json:"hours"`
		Places    []PlaceForecasts `json:"places"`
	}{
		Threshold: threshold,
		Hours:     hours,
		Places:    places,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}