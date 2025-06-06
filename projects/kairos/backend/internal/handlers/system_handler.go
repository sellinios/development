package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"runtime"
	"time"
)

// SystemHandler handles requests related to system health and status
type SystemHandler struct {
	DB *sql.DB
}

// NewSystemHandler creates a new SystemHandler
func NewSystemHandler(db *sql.DB) *SystemHandler {
	return &SystemHandler{DB: db}
}

// SystemHealth contains information about the system's health
type SystemHealth struct {
	Status          string    `json:"status"`
	Timestamp       time.Time `json:"timestamp"`
	ServerUptime    string    `json:"server_uptime,omitempty"`
	APIConnected    bool      `json:"api_connected"`
	DatabaseStatus  string    `json:"database_status"`
	MemoryUsage     string    `json:"memory_usage,omitempty"`
	NumGoroutines   int       `json:"num_goroutines,omitempty"`
	ICONDataStatus  string    `json:"icon_data_status,omitempty"`
	LastForecastRun time.Time `json:"last_forecast_run,omitempty"`
}

// GetSystemHealth returns the health status of the system
func (h *SystemHandler) GetSystemHealth(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var health SystemHealth
	health.Status = "ok"
	health.Timestamp = time.Now()
	health.APIConnected = true

	// Check database connection
	err := h.DB.Ping()
	if err != nil {
		health.Status = "degraded"
		health.DatabaseStatus = "error: " + err.Error()
	} else {
		health.DatabaseStatus = "connected"
	}

	// Get runtime stats
	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)
	health.MemoryUsage = formatMemory(memStats.Alloc)
	health.NumGoroutines = runtime.NumGoroutine()

	// Check ICON data status
	var lastUpdate time.Time
	var numCells int
	err = h.DB.QueryRow("SELECT MAX(run_date), COUNT(DISTINCT cell_id) FROM icon_tile_forecasts").Scan(&lastUpdate, &numCells)
	if err != nil {
		health.ICONDataStatus = "unknown"
	} else if numCells == 0 {
		health.ICONDataStatus = "no data"
	} else {
		health.ICONDataStatus = "available"
		health.LastForecastRun = lastUpdate
	}

	// Return health status as JSON
	h.sendJSON(w, health)
}

// Helper function to format memory usage
func formatMemory(bytes uint64) string {
	const (
		_         = iota
		KB uint64 = 1 << (10 * iota)
		MB
		GB
	)

	var size string
	switch {
	case bytes >= GB:
		size = formatSize(bytes, GB, "GB")
	case bytes >= MB:
		size = formatSize(bytes, MB, "MB")
	case bytes >= KB:
		size = formatSize(bytes, KB, "KB")
	default:
		size = formatSize(bytes, 1, "bytes")
	}
	return size
}

// formatSize formats the size with proper unit
func formatSize(bytes, unit uint64, unitName string) string {
	if bytes%unit == 0 {
		return formatWithoutDecimals(bytes/unit) + " " + unitName
	}
	return formatWithDecimals(float64(bytes)/float64(unit)) + " " + unitName
}

// formatWithDecimals formats float value with two decimal places
func formatWithDecimals(value float64) string {
	return floatToString(value)
}

// formatWithoutDecimals formats integer value without decimal places
func formatWithoutDecimals(value uint64) string {
	return uintToString(value)
}

// floatToString converts float64 to string with 2 decimals
func floatToString(value float64) string {
	return sprintf("%.2f", value)
}

// uintToString converts uint64 to string
func uintToString(value uint64) string {
	return sprintf("%d", value)
}

// sprintf is a helper function for formatting
func sprintf(format string, args ...interface{}) string {
	return fmt.Sprintf(format, args...)
}

// Helper method to send JSON response with proper formatting
func (h *SystemHandler) sendJSON(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	
	// Pretty print JSON for better readability
	jsonData, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
	
	w.Write(jsonData)
}