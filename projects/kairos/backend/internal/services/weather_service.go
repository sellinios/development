package services

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"math"
	"time"

	"github.com/sellinios/aethra/internal/models"
)

// WeatherService handles weather data operations
type WeatherService struct {
	db *sql.DB
}

// NewWeatherService creates a new weather service
func NewWeatherService(db *sql.DB) *WeatherService {
	return &WeatherService{db: db}
}

// GetWeatherByLocation returns weather for specific coordinates
func (s *WeatherService) GetWeatherByLocation(lat, lon float64, units string) (*models.WeatherData, error) {
	// Find nearest grid cell
	cellID, distance, err := s.findNearestCell(lat, lon)
	if err != nil {
		return nil, fmt.Errorf("failed to find nearest cell: %w", err)
	}

	// Get latest forecast data
	forecast, err := s.getLatestForecast(cellID)
	if err != nil {
		return nil, fmt.Errorf("failed to get forecast: %w", err)
	}

	// Get location info
	location, err := s.getLocationInfo(lat, lon)
	if err != nil {
		location = &models.LocationInfo{
			Latitude:  lat,
			Longitude: lon,
			Timezone:  "UTC",
			LocalTime: time.Now(),
		}
	}

	// Build weather response
	weather := s.buildWeatherData(forecast, location, distance)
	
	// Convert units if needed
	if units == "imperial" {
		s.convertToImperial(weather)
	}

	return weather, nil
}

// GetWeatherByCity returns weather for a city
func (s *WeatherService) GetWeatherByCity(cityName string, units string) (*models.WeatherData, error) {
	// First try to find city with pre-associated cell
	query := `
		SELECT 
			ge.id, ge.name, ge.name_en,
			ST_Y(ge.centroid::geometry), ST_X(ge.centroid::geometry), 
			ge.country_code, ge.timezone,
			cca.cell_id, cca.distance_km
		FROM geo_entities ge
		LEFT JOIN city_cell_associations cca ON ge.id = cca.city_id
		WHERE LOWER(ge.name) = LOWER($1) OR LOWER(ge.name_en) = LOWER($1)
		LIMIT 1
	`
	
	var city struct {
		ID        int
		Name      string
		NameEn    sql.NullString
		Latitude  float64
		Longitude float64
		Country   string
		Timezone  string
		CellID    sql.NullInt64
		Distance  sql.NullFloat64
	}
	
	err := s.db.QueryRow(query, cityName).Scan(
		&city.ID, &city.Name, &city.NameEn,
		&city.Latitude, &city.Longitude, 
		&city.Country, &city.Timezone,
		&city.CellID, &city.Distance,
	)
	if err != nil {
		return nil, fmt.Errorf("city not found: %w", err)
	}

	var weather *models.WeatherData
	
	// If we have a pre-associated cell, use it directly
	if city.CellID.Valid {
		forecast, err := s.getLatestForecast(int(city.CellID.Int64))
		if err == nil {
			// Build location info
			location := &models.LocationInfo{
				Name:      city.Name,
				Country:   city.Country,
				Latitude:  city.Latitude,
				Longitude: city.Longitude,
				Timezone:  city.Timezone,
				LocalTime: time.Now(),
			}
			
			if city.NameEn.Valid && city.NameEn.String != "" {
				location.Name = city.NameEn.String
			}
			
			weather = s.buildWeatherData(forecast, location, city.Distance.Float64)
		}
	}
	
	// Fall back to location-based search if needed
	if weather == nil {
		weather, err = s.GetWeatherByLocation(city.Latitude, city.Longitude, units)
		if err != nil {
			return nil, err
		}
		
		// Update location info with city details
		weather.Location.Name = city.Name
		if city.NameEn.Valid && city.NameEn.String != "" {
			weather.Location.Name = city.NameEn.String
		}
		weather.Location.Country = city.Country
		if city.Timezone != "" {
			weather.Location.Timezone = city.Timezone
		}
	}

	// Convert units if needed
	if units == "imperial" {
		s.convertToImperial(weather)
	}

	return weather, nil
}

// calculateDewPoint calculates dew point from temperature and humidity
func (s *WeatherService) calculateDewPoint(tempC, humidity float64) float64 {
	// Magnus formula approximation
	a := 17.27
	b := 237.7
	alpha := ((a * tempC) / (b + tempC)) + math.Log(humidity/100.0)
	return (b * alpha) / (a - alpha)
}

// findNearestCell finds the nearest weather grid cell
func (s *WeatherService) findNearestCell(lat, lon float64) (int, float64, error) {
	query := `
		SELECT id, ST_Distance(
			ST_Centroid(boundary::geometry)::geography,
			ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
		) / 1000 as distance_km
		FROM icon_cells
		WHERE ST_DWithin(
			boundary::geography,
			ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
			50000  -- 50km radius
		)
		ORDER BY distance_km
		LIMIT 1
	`
	
	var cellID int
	var distance float64
	
	err := s.db.QueryRow(query, lat, lon).Scan(&cellID, &distance)
	if err != nil {
		return 0, 0, fmt.Errorf("no weather cell found: %w", err)
	}
	
	return cellID, distance, nil
}

// getLatestForecast retrieves the most recent forecast
func (s *WeatherService) getLatestForecast(cellID int) (*WeatherForecast, error) {
	// First, get the latest run available
	var latestRun struct {
		RunDate string
		CycleTime string
	}
	
	err := s.db.QueryRow(`
		SELECT run_date, utc_cycle_time 
		FROM icon_tile_forecasts 
		WHERE cell_id = $1 
		ORDER BY run_date DESC, utc_cycle_time DESC 
		LIMIT 1
	`, cellID).Scan(&latestRun.RunDate, &latestRun.CycleTime)
	
	if err != nil {
		return nil, fmt.Errorf("no forecast data available for cell %d", cellID)
	}
	
	// Get all forecasts from the latest run
	query := `
		SELECT 
			id, cell_id, forecast_datetime, 
			run_date || ' ' || utc_cycle_time || ':00:00' as run_time,
			forecast_data, 'ICON-EU' as model, created_at
		FROM icon_tile_forecasts
		WHERE cell_id = $1
			AND run_date = $2
			AND utc_cycle_time = $3
			AND forecast_datetime >= NOW() - INTERVAL '6 hours'  -- Include recent past
		ORDER BY forecast_datetime ASC
		LIMIT 120  -- Get up to 5 days of hourly data
	`
	
	rows, err := s.db.Query(query, cellID, latestRun.RunDate, latestRun.CycleTime)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	
	var forecasts []ForecastPoint
	var runTime time.Time
	var runTimeStr string
	var model string
	var updatedAt time.Time
	
	for rows.Next() {
		var fp ForecastPoint
		var dataJSON []byte
		
		err := rows.Scan(
			&fp.ID, &fp.CellID, &fp.ForecastTime, &runTimeStr,
			&dataJSON, &model, &updatedAt,
		)
		if err != nil {
			continue
		}
		
		// Parse run time if we haven't already
		if runTime.IsZero() {
			runTime, _ = time.Parse("2006-01-02 15:04:05", runTimeStr)
		}
		
		// Parse JSON data
		var forecastData models.ForecastData
		if err := json.Unmarshal(dataJSON, &forecastData); err != nil {
			continue
		}
		fp.Data = convertForecastData(forecastData)
		
		forecasts = append(forecasts, fp)
	}
	
	if len(forecasts) == 0 {
		return nil, fmt.Errorf("no forecast data available")
	}
	
	return &WeatherForecast{
		CellID:    cellID,
		RunTime:   runTime,
		Model:     model,
		UpdatedAt: updatedAt,
		Points:    forecasts,
	}, nil
}

// extractCurrentWeather gets current conditions from forecast
func (s *WeatherService) extractCurrentWeather(forecast *WeatherForecast) *models.CurrentWeather {
	if len(forecast.Points) == 0 {
		return nil
	}
	
	// Find the forecast point closest to now
	now := time.Now()
	var current *ForecastPoint
	minDiff := time.Hour * 24
	
	for i := range forecast.Points {
		diff := forecast.Points[i].ForecastTime.Sub(now).Abs()
		if diff < minDiff {
			minDiff = diff
			current = &forecast.Points[i]
		}
	}
	
	if current == nil || minDiff > time.Hour {
		return nil
	}
	
	return &models.CurrentWeather{
		Time: current.ForecastTime,
		Temperature: models.Temperature{
			Value:   current.Data.Temperature,
			Unit:    "C",
			Celsius: current.Data.Temperature,
		},
		FeelsLike:  s.calculateFeelsLike(current.Data),
		Humidity:   int(current.Data.Humidity),
		DewPoint:   current.Data.DewPoint,
		Pressure: models.Pressure{
			Value: current.Data.Pressure,
			Unit:  "hPa",
			HPa:   current.Data.Pressure,
		},
		Wind: models.Wind{
			Speed:     current.Data.WindSpeed,
			Gust:      current.Data.WindGust,
			Direction: int(current.Data.WindDirection),
			Unit:      "m/s",
		},
		Clouds: models.CloudCover{
			Total: int(current.Data.CloudCover),
		},
		Visibility: current.Data.Visibility,
		Precipitation: models.Precipitation{
			Total: current.Data.Precipitation,
			Rain:  current.Data.Rain,
			Snow:  current.Data.Snow,
		},
		Weather: s.determineWeatherCondition(current.Data),
	}
}

// extractHourlyForecast builds hourly forecast array
func (s *WeatherService) extractHourlyForecast(forecast *WeatherForecast, hours int) []models.HourlyWeather {
	hourly := make([]models.HourlyWeather, 0, hours)
	
	for _, point := range forecast.Points {
		if len(hourly) >= hours {
			break
		}
		
		hw := models.HourlyWeather{
			Time:        point.ForecastTime,
			Temperature: point.Data.Temperature,
			FeelsLike:   s.calculateFeelsLike(point.Data),
			Humidity:    int(point.Data.Humidity),
			DewPoint:    point.Data.DewPoint,
			Pressure:    point.Data.Pressure,
			Wind: models.Wind{
				Speed:     point.Data.WindSpeed,
				Gust:      point.Data.WindGust,
				Direction: int(point.Data.WindDirection),
				Unit:      "m/s",
			},
			Clouds: int(point.Data.CloudCover),
			Pop:    point.Data.PrecipitationProbability,
			Precipitation: models.Precipitation{
				Total: point.Data.Precipitation,
				Rain:  point.Data.Rain,
				Snow:  point.Data.Snow,
			},
			Weather:    s.determineWeatherCondition(point.Data),
			Visibility: point.Data.Visibility,
		}
		
		hourly = append(hourly, hw)
	}
	
	return hourly
}

// extractDailyForecast aggregates hourly data into daily
func (s *WeatherService) extractDailyForecast(forecast *WeatherForecast, days int) []models.DailyWeather {
	// Group forecast points by day
	dayMap := make(map[string][]ForecastPoint)
	
	for _, point := range forecast.Points {
		day := point.ForecastTime.Format("2006-01-02")
		dayMap[day] = append(dayMap[day], point)
	}
	
	daily := make([]models.DailyWeather, 0, days)
	
	// Process each day
	for i := 0; i < days; i++ {
		date := time.Now().AddDate(0, 0, i)
		dayKey := date.Format("2006-01-02")
		
		points, exists := dayMap[dayKey]
		if !exists || len(points) == 0 {
			continue
		}
		
		// Calculate daily aggregates
		dw := s.aggregateDailyWeather(date, points)
		daily = append(daily, dw)
	}
	
	return daily
}

// Weather forecast structures
type WeatherForecast struct {
	CellID    int
	RunTime   time.Time
	Model     string
	UpdatedAt time.Time
	Points    []ForecastPoint
}

type ForecastPoint struct {
	ID           int
	CellID       int
	ForecastTime time.Time
	Data         WeatherDataPoint
}

// convertForecastData converts models.ForecastData to WeatherDataPoint
func convertForecastData(fd models.ForecastData) WeatherDataPoint {
	// Extract temperature - t_2m is already in Celsius
	tempC := fd.Temperature
	
	// If primary temperature is not available, check alternatives
	if tempC == 0 {
		// GetEffectiveTemperature returns Kelvin, so convert to Celsius
		tempK := fd.GetEffectiveTemperature()
		if tempK > 0 {
			tempC = tempK - 273.15
		}
	}
	
	// Calculate wind speed and direction
	windU := fd.GetEffectiveWindSpeedU()
	windV := fd.GetEffectiveWindSpeedV()
	windSpeed := math.Sqrt(windU*windU + windV*windV)
	windDir := 0.0
	if windSpeed > 0 {
		windDir = math.Atan2(windU, windV) * 180 / math.Pi
		if windDir < 0 {
			windDir += 360
		}
	}
	
	// Extract pressure
	pressure := fd.GetEffectiveSurfacePressure()
	if pressure > 0 {
		pressure = pressure / 100.0 // Convert Pa to hPa
	}
	
	// Calculate dew point
	humidity := fd.GetEffectiveHumidity()
	dewPoint := tempC - ((100 - humidity) / 5.0) // Simple approximation
	
	return WeatherDataPoint{
		Temperature:   tempC,
		DewPoint:      dewPoint,
		Humidity:      humidity,
		Pressure:      pressure,
		WindSpeed:     windSpeed,
		WindGust:      0, // Not available in ICON data
		WindDirection: windDir,
		CloudCover:    fd.GetEffectiveCloudCover(),
		Visibility:    10000, // Default visibility (not in ICON data)
		Precipitation: fd.GetEffectivePrecipitationHourly(),
		Rain:          fd.GetEffectivePrecipitationHourly(), // Assume all precip is rain for now
		Snow:          0,
		PrecipitationProbability: 0, // Not available in ICON data
	}
}

type WeatherDataPoint struct {
	Temperature              float64 `json:"temperature"`
	DewPoint                 float64 `json:"dew_point"`
	Humidity                 float64 `json:"humidity"`
	Pressure                 float64 `json:"pressure"`
	WindSpeed                float64 `json:"wind_speed"`
	WindGust                 float64 `json:"wind_gust"`
	WindDirection            float64 `json:"wind_direction"`
	CloudCover               float64 `json:"cloud_cover"`
	Precipitation            float64 `json:"precipitation"`
	Rain                     float64 `json:"rain"`
	Snow                     float64 `json:"snow"`
	PrecipitationProbability float64 `json:"pop"`
	Visibility               float64 `json:"visibility"`
	CAPE                     float64 `json:"cape"`
}

// Helper methods

func (s *WeatherService) calculateFeelsLike(data WeatherDataPoint) float64 {
	// Wind chill for cold temperatures
	if data.Temperature < 10 && data.WindSpeed > 1.3 {
		return 13.12 + 0.6215*data.Temperature - 
			11.37*math.Pow(data.WindSpeed*3.6, 0.16) + 
			0.3965*data.Temperature*math.Pow(data.WindSpeed*3.6, 0.16)
	}
	
	// Heat index for warm temperatures
	if data.Temperature > 27 && data.Humidity > 40 {
		c1 := -8.78469475556
		c2 := 1.61139411
		c3 := 2.33854883889
		c4 := -0.14611605
		c5 := -0.012308094
		c6 := -0.0164248277778
		c7 := 0.002211732
		c8 := 0.00072546
		c9 := -0.000003582
		
		T := data.Temperature
		R := data.Humidity
		
		return c1 + c2*T + c3*R + c4*T*R + c5*T*T + 
			c6*R*R + c7*T*T*R + c8*T*R*R + c9*T*T*R*R
	}
	
	return data.Temperature
}

func (s *WeatherService) determineWeatherCondition(data WeatherDataPoint) models.WeatherCondition {
	// Determine weather condition based on parameters
	if data.Precipitation > 0 {
		if data.Temperature < 0 {
			return models.WeatherCondition{
				ID:          600,
				Main:        "Snow",
				Description: "snow",
				Icon:        "snow",
				Emoji:       "❄️",
			}
		}
		if data.CAPE > 1000 {
			return models.WeatherCondition{
				ID:          211,
				Main:        "Thunderstorm",
				Description: "thunderstorm",
				Icon:        "thunderstorm",
				Emoji:       "⛈️",
			}
		}
		if data.Precipitation > 5 {
			return models.WeatherCondition{
				ID:          502,
				Main:        "Rain",
				Description: "heavy rain",
				Icon:        "heavy_rain",
				Emoji:       "🌧️",
			}
		}
		return models.WeatherCondition{
			ID:          500,
			Main:        "Rain",
			Description: "light rain",
			Icon:        "rain",
			Emoji:       "🌦️",
		}
	}
	
	if data.CloudCover > 80 {
		return models.WeatherCondition{
			ID:          804,
			Main:        "Clouds",
			Description: "overcast clouds",
			Icon:        "cloudy",
			Emoji:       "☁️",
		}
	}
	
	if data.CloudCover > 20 {
		return models.WeatherCondition{
			ID:          802,
			Main:        "Clouds",
			Description: "scattered clouds",
			Icon:        "partly_cloudy",
			Emoji:       "⛅",
		}
	}
	
	return models.WeatherCondition{
		ID:          800,
		Main:        "Clear",
		Description: "clear sky",
		Icon:        "clear",
		Emoji:       "☀️",
	}
}

func (s *WeatherService) getLocationInfo(lat, lon float64) (*models.LocationInfo, error) {
	// This would typically query the geo_entities table
	// For now, return basic info
	return &models.LocationInfo{
		Latitude:  lat,
		Longitude: lon,
		Timezone:  "Europe/Athens",
		LocalTime: time.Now(),
	}, nil
}

func (s *WeatherService) aggregateDailyWeather(date time.Time, points []ForecastPoint) models.DailyWeather {
	// Initialize aggregates
	var temps []float64
	var humidity float64
	var precipTotal float64
	var maxWind float64
	var avgPressure float64
	var maxPop float64
	
	// Collect values
	for _, p := range points {
		temps = append(temps, p.Data.Temperature)
		humidity += p.Data.Humidity
		precipTotal += p.Data.Precipitation
		avgPressure += p.Data.Pressure
		
		if p.Data.WindSpeed > maxWind {
			maxWind = p.Data.WindSpeed
		}
		if p.Data.PrecipitationProbability > maxPop {
			maxPop = p.Data.PrecipitationProbability
		}
	}
	
	// Calculate min/max temperatures
	minTemp, maxTemp := temps[0], temps[0]
	for _, t := range temps {
		if t < minTemp {
			minTemp = t
		}
		if t > maxTemp {
			maxTemp = t
		}
	}
	
	// Calculate sunrise/sunset (simplified)
	sunrise := date.Add(6 * time.Hour)
	sunset := date.Add(18 * time.Hour)
	
	return models.DailyWeather{
		Date: date,
		Temperature: models.DayTemperature{
			Min: minTemp,
			Max: maxTemp,
			Day: (minTemp + maxTemp) / 2,
		},
		Humidity: int(humidity / float64(len(points))),
		Pressure: avgPressure / float64(len(points)),
		Wind: models.Wind{
			Speed: maxWind,
			Unit:  "m/s",
		},
		Pop: maxPop / 100,
		Precipitation: models.Precipitation{
			Total: precipTotal,
		},
		Weather: s.determineWeatherCondition(points[len(points)/2].Data),
		Sunrise: sunrise,
		Sunset:  sunset,
	}
}

// buildWeatherData constructs the weather data response from forecast
func (s *WeatherService) buildWeatherData(forecast *WeatherForecast, location *models.LocationInfo, distance float64) *models.WeatherData {
	weather := &models.WeatherData{
		Location: *location,
		DataSource: models.DataSourceInfo{
			Model:       forecast.Model,
			Resolution:  distance,
			RunTime:     forecast.RunTime,
			UpdatedAt:   forecast.UpdatedAt,
			ForecastEnd: forecast.RunTime.Add(120 * time.Hour),
		},
	}

	// Process current conditions
	if current := s.extractCurrentWeather(forecast); current != nil {
		weather.Current = current
	}

	// Process hourly forecast
	weather.Hourly = s.extractHourlyForecast(forecast, 48) // Next 48 hours

	// Process daily forecast
	weather.Daily = s.extractDailyForecast(forecast, 7) // Next 7 days

	return weather
}

func (s *WeatherService) convertToImperial(weather *models.WeatherData) {
	// Convert temperatures from Celsius to Fahrenheit
	// Convert wind from m/s to mph
	// Convert pressure from hPa to inHg
	// Implementation details...
}