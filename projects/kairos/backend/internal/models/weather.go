package models

import (
	"time"
)

// WeatherData represents complete weather information for a location
type WeatherData struct {
	Location     LocationInfo     `json:"location"`
	Current      *CurrentWeather  `json:"current,omitempty"`
	Hourly       []HourlyWeather  `json:"hourly,omitempty"`
	Daily        []DailyWeather   `json:"daily,omitempty"`
	Alerts       []WeatherAlert   `json:"alerts,omitempty"`
	DataSource   DataSourceInfo   `json:"data_source"`
}

// LocationInfo contains location details
type LocationInfo struct {
	Name        string    `json:"name"`
	Latitude    float64   `json:"latitude"`
	Longitude   float64   `json:"longitude"`
	Elevation   float64   `json:"elevation,omitempty"`
	Timezone    string    `json:"timezone"`
	Country     string    `json:"country,omitempty"`
	Region      string    `json:"region,omitempty"`
	LocalTime   time.Time `json:"local_time"`
}

// CurrentWeather represents current conditions
type CurrentWeather struct {
	Time          time.Time        `json:"time"`
	Temperature   Temperature      `json:"temperature"`
	FeelsLike     float64          `json:"feels_like"`
	Humidity      int              `json:"humidity"`
	DewPoint      float64          `json:"dew_point"`
	Pressure      Pressure         `json:"pressure"`
	Wind          Wind             `json:"wind"`
	Clouds        CloudCover       `json:"clouds"`
	Visibility    float64          `json:"visibility"`
	Precipitation Precipitation    `json:"precipitation"`
	Weather       WeatherCondition `json:"weather"`
	UV            float64          `json:"uv_index,omitempty"`
	AirQuality    *AirQuality      `json:"air_quality,omitempty"`
}

// HourlyWeather represents hourly forecast
type HourlyWeather struct {
	Time          time.Time        `json:"time"`
	Temperature   float64          `json:"temperature"`
	FeelsLike     float64          `json:"feels_like"`
	Humidity      int              `json:"humidity"`
	DewPoint      float64          `json:"dew_point"`
	Pressure      float64          `json:"pressure"`
	Wind          Wind             `json:"wind"`
	Clouds        int              `json:"clouds"`
	Pop           float64          `json:"pop"` // Probability of precipitation
	Precipitation Precipitation    `json:"precipitation"`
	Weather       WeatherCondition `json:"weather"`
	Visibility    float64          `json:"visibility,omitempty"`
}

// DailyWeather represents daily forecast
type DailyWeather struct {
	Date          time.Time        `json:"date"`
	Temperature   DayTemperature   `json:"temperature"`
	FeelsLike     DayTemperature   `json:"feels_like"`
	Humidity      int              `json:"humidity"`
	DewPoint      float64          `json:"dew_point"`
	Pressure      float64          `json:"pressure"`
	Wind          Wind             `json:"wind"`
	Clouds        int              `json:"clouds"`
	Pop           float64          `json:"pop"`
	Precipitation Precipitation    `json:"precipitation"`
	Weather       WeatherCondition `json:"weather"`
	UV            float64          `json:"uv_index,omitempty"`
	Sunrise       time.Time        `json:"sunrise"`
	Sunset        time.Time        `json:"sunset"`
	Moonrise      time.Time        `json:"moonrise,omitempty"`
	Moonset       time.Time        `json:"moonset,omitempty"`
	MoonPhase     float64          `json:"moon_phase,omitempty"`
}

// Temperature with unit support
type Temperature struct {
	Value   float64 `json:"value"`
	Unit    string  `json:"unit"` // "C" or "F"
	Celsius float64 `json:"celsius"`
}

// DayTemperature for daily min/max
type DayTemperature struct {
	Min     float64 `json:"min"`
	Max     float64 `json:"max"`
	Morning float64 `json:"morning"`
	Day     float64 `json:"day"`
	Evening float64 `json:"evening"`
	Night   float64 `json:"night"`
}

// Pressure with unit support
type Pressure struct {
	Value float64 `json:"value"`
	Unit  string  `json:"unit"` // "hPa", "mb", "inHg"
	HPa   float64 `json:"hPa"`
}

// Wind information
type Wind struct {
	Speed     float64 `json:"speed"`
	Gust      float64 `json:"gust,omitempty"`
	Direction int     `json:"direction"`
	Unit      string  `json:"unit"` // "m/s", "km/h", "mph"
}

// CloudCover details
type CloudCover struct {
	Total int `json:"total"` // Percentage
	Low   int `json:"low,omitempty"`
	Mid   int `json:"mid,omitempty"`
	High  int `json:"high,omitempty"`
}

// Precipitation details
type Precipitation struct {
	Total    float64 `json:"total"`    // mm
	Rain     float64 `json:"rain,omitempty"`
	Snow     float64 `json:"snow,omitempty"`
	Sleet    float64 `json:"sleet,omitempty"`
	Duration float64 `json:"duration,omitempty"` // hours
}

// WeatherCondition describes the weather
type WeatherCondition struct {
	ID          int    `json:"id"`
	Main        string `json:"main"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Emoji       string `json:"emoji,omitempty"`
}

// WeatherAlert for severe weather
type WeatherAlert struct {
	ID          string    `json:"id"`
	Event       string    `json:"event"`
	Start       time.Time `json:"start"`
	End         time.Time `json:"end"`
	Severity    string    `json:"severity"` // "minor", "moderate", "severe", "extreme"
	Urgency     string    `json:"urgency"`  // "immediate", "expected", "future"
	Description string    `json:"description"`
	Tags        []string  `json:"tags,omitempty"`
}

// AirQuality information
type AirQuality struct {
	AQI     int             `json:"aqi"`
	PM25    float64         `json:"pm2_5"`
	PM10    float64         `json:"pm10"`
	O3      float64         `json:"o3"`
	NO2     float64         `json:"no2"`
	SO2     float64         `json:"so2"`
	CO      float64         `json:"co"`
	Quality string          `json:"quality"` // "good", "moderate", "unhealthy"
}

// DataSourceInfo metadata
type DataSourceInfo struct {
	Model       string    `json:"model"`       // "ICON-EU", "GFS"
	Resolution  float64   `json:"resolution"`  // Grid resolution in km
	RunTime     time.Time `json:"run_time"`    // Model run time
	UpdatedAt   time.Time `json:"updated_at"`  // When data was processed
	ForecastEnd time.Time `json:"forecast_end"` // How far forecast extends
}

// WeatherIcon mappings for conditions
var WeatherIcons = map[string]string{
	"clear_day":          "☀️",
	"clear_night":        "🌙",
	"partly_cloudy_day":  "⛅",
	"partly_cloudy_night": "☁️",
	"cloudy":             "☁️",
	"rain":               "🌧️",
	"heavy_rain":         "⛈️",
	"snow":               "❄️",
	"thunderstorm":       "⛈️",
	"fog":                "🌫️",
	"wind":               "💨",
}

// GetWeatherIcon returns appropriate icon for conditions
func GetWeatherIcon(condition string, isDay bool) string {
	if icon, ok := WeatherIcons[condition]; ok {
		return icon
	}
	if isDay {
		return "☀️"
	}
	return "🌙"
}

// ConvertWindDirection converts degrees to compass direction
func ConvertWindDirection(degrees int) string {
	directions := []string{"N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", 
		"S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"}
	index := int((float64(degrees) + 11.25) / 22.5) % 16
	return directions[index]
}