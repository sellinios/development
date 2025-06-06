package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

// Config holds application configuration
type Config struct {
	Database DatabaseConfig
	Server   ServerConfig
	Weather  WeatherConfig
}

// DatabaseConfig holds database connection settings
type DatabaseConfig struct {
	Host     string
	Port     int
	User     string
	Password string
	Name     string
	SSLMode  string
}

// ServerConfig holds API server settings
type ServerConfig struct {
	Port int
}

// WeatherConfig holds weather data configuration
type WeatherConfig struct {
	Model       string      // Weather model (ICON-EU)
	Resolution  float64     // Grid resolution in degrees
	UpdateCycle int         // Update cycle in hours
	Region      string      // Geographic region
	BoundingBox BoundingBox // Area of coverage
}

// BoundingBox defines geographic boundaries
type BoundingBox struct {
	MinLat float64
	MaxLat float64
	MinLon float64
	MaxLon float64
}

// LoadEnv loads environment variables from .env file
func LoadEnv() error {
	return godotenv.Load()
}

// NewConfig creates and returns a new Config with values from environment variables
func NewConfig() *Config {
	dbPort, err := strconv.Atoi(getEnv("POSTGRES_PORT", "5432"))
	if err != nil {
		dbPort = 5432 // Default if conversion fails
	}

	serverPort, err := strconv.Atoi(getEnv("SERVER_PORT", "8080"))
	if err != nil {
		serverPort = 8080 // Default if conversion fails
	}

	// Parse weather configuration
	resolution, _ := strconv.ParseFloat(getEnv("WEATHER_RESOLUTION", "0.0625"), 64)
	updateCycle, _ := strconv.Atoi(getEnv("WEATHER_UPDATE_CYCLE", "3"))
	
	// Parse bounding box for Greece
	minLat, _ := strconv.ParseFloat(getEnv("GREECE_MIN_LAT", "34.0"), 64)
	maxLat, _ := strconv.ParseFloat(getEnv("GREECE_MAX_LAT", "42.0"), 64)
	minLon, _ := strconv.ParseFloat(getEnv("GREECE_MIN_LON", "19.0"), 64)
	maxLon, _ := strconv.ParseFloat(getEnv("GREECE_MAX_LON", "30.0"), 64)

	return &Config{
		Database: DatabaseConfig{
			Host:     getEnv("POSTGRES_HOST", "localhost"),
			Port:     dbPort,
			User:     getEnv("POSTGRES_USER", "kairos"),
			Password: getEnv("POSTGRES_PASSWORD", ""),
			Name:     getEnv("POSTGRES_DB", "kairosdb"),
			SSLMode:  getEnv("POSTGRES_SSLMODE", "disable"),
		},
		Server: ServerConfig{
			Port: serverPort,
		},
		Weather: WeatherConfig{
			Model:       getEnv("WEATHER_MODEL", "ICON-EU"),
			Resolution:  resolution,
			UpdateCycle: updateCycle,
			Region:      getEnv("WEATHER_REGION", "Greece"),
			BoundingBox: BoundingBox{
				MinLat: minLat,
				MaxLat: maxLat,
				MinLon: minLon,
				MaxLon: maxLon,
			},
		},
	}
}

// GetEnv is a helper function to get environment variables with defaults
// Making this method public so it can be used by other packages
func (c *Config) GetEnv(key, defaultValue string) string {
	return getEnv(key, defaultValue)
}

// Helper function to get environment variables with defaults
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}