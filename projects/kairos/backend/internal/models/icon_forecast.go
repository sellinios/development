package models

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"time"
)

// ForecastData represents the weather forecast data stored in JSONB
type ForecastData struct {
	// Support multiple possible field names for the same data
	// Primary ICON-EU fields (actual names from processor)
	Temperature    float64 `json:"t_2m"`               // Celsius (not Kelvin!)
	Humidity       float64 `json:"relhum_2m"`          // %
	WindSpeedU     float64 `json:"u_10m"`              // U component of wind (m/s)
	WindSpeedV     float64 `json:"v_10m"`              // V component of wind (m/s)
	CloudCover     float64 `json:"clct"`               // % (total cloud cover)
	SurfacePressure float64 `json:"pmsl"`              // hPa (mean sea level pressure)
	Precipitation  float64 `json:"tot_prec"`           // mm (total precipitation)
	
	// Alternative field names (legacy or different formats)
	TemperatureAlt float64 `json:"tmp_level_2_m"`      // Kelvin
	HumidityAlt    float64 `json:"rh_level_2_m"`       // %
	WindSpeedUAlt  float64 `json:"ugrd_level_10_m"`    // U component of wind (m/s)
	WindSpeedVAlt  float64 `json:"vgrd_level_10_m"`    // V component of wind (m/s)
	CloudCoverAlt  float64 `json:"tcdc_level_entire"`  // % (using total cloud cover)

	// Additional alternative fields
	Temperature2Alt float64 `json:"2t_level_2"`        // Kelvin
	Humidity2Alt    float64 `json:"2r_level_2"`        // %
	WindSpeedU2Alt  float64 `json:"10u_level_10"`      // U component of wind (m/s)
	WindSpeedV2Alt  float64 `json:"10v_level_10"`      // V component of wind (m/s)
	CloudCover2Alt  float64 `json:"tcdc_level_0"`      // % (using total cloud cover)
	
	PrecipitationAlt float64 `json:"prate_level_surface"` // kg/m^2
	Precipitation2Alt float64 `json:"prate_level_0"`      // kg/m^2 (alternative name)
	SurfacePressureAlt float64 `json:"pres_level_surface"` // Pa
	SurfacePressure2Alt float64 `json:"prmsl_level_0"`     // Pa (alternative name)
	CAPE          float64 `json:"cape_level_surface"`      // J/kg
	CAPEAlt       float64 `json:"cape_level_0"`            // J/kg (alternative name)

	// Additional field to indicate data completeness
	HasFullData   bool    `json:"-"`                   // Internal field, not stored in JSON
}

// Helper functions for ForecastData

// max returns the maximum of the provided values, ignoring those below the threshold
func max(threshold float64, values ...float64) float64 {
	result := threshold
	for _, v := range values {
		if v > result {
			result = v
		}
	}
	if result == threshold {
		return 0 // If no values above threshold, return 0
	}
	return result
}

// GetEffectiveTemperature returns the temperature in Kelvin
// Handles various field names and ensures consistent units
func (fd *ForecastData) GetEffectiveTemperature() float64 {
	// Kelvin values for typical Earth temperatures (200K-333K or −73°C to 60°C)
	const MIN_KELVIN = 200.0
	const MAX_KELVIN = 333.0
	// Celsius values for typical Earth temperatures (-80°C to 60°C)
	const MIN_CELSIUS = -80.0
	const MAX_CELSIUS = 60.0
	
	// First check the primary temperature field (t_2m - in Celsius from ICON-EU)
	if fd.Temperature != 0 || (fd.Temperature == 0 && fd.Temperature > -0.1 && fd.Temperature < 0.1) {
		// Primary field is in Celsius, so convert to Kelvin
		if fd.Temperature >= MIN_CELSIUS && fd.Temperature <= MAX_CELSIUS {
			return fd.Temperature + 273.15
		}
	}
	
	// Check alternative temperature field (tmp_level_2_m - usually in Kelvin)
	if fd.TemperatureAlt > 0 {
		// Is it already in Kelvin?
		if fd.TemperatureAlt >= MIN_KELVIN && fd.TemperatureAlt <= MAX_KELVIN {
			return fd.TemperatureAlt // Return as Kelvin
		} else if fd.TemperatureAlt >= MIN_CELSIUS && fd.TemperatureAlt <= MAX_CELSIUS {
			// Convert from Celsius to Kelvin
			return fd.TemperatureAlt + 273.15
		}
	}
	
	// Check second alternative temperature field (2t_level_2)
	if fd.Temperature2Alt > 0 {
		// Is it already in Kelvin?
		if fd.Temperature2Alt >= MIN_KELVIN && fd.Temperature2Alt <= MAX_KELVIN {
			return fd.Temperature2Alt // Return as Kelvin
		} else if fd.Temperature2Alt >= MIN_CELSIUS && fd.Temperature2Alt <= MAX_CELSIUS {
			// Convert from Celsius to Kelvin
			return fd.Temperature2Alt + 273.15
		}
	}
	
	return 0 // No valid temperature data found or values were outside reasonable ranges
}

// GetEffectiveHumidity returns the humidity using whichever field is available
func (fd *ForecastData) GetEffectiveHumidity() float64 {
	if fd.Humidity > 0 {
		return fd.Humidity
	}
	if fd.HumidityAlt > 0 {
		return fd.HumidityAlt
	}
	if fd.Humidity2Alt > 0 {
		return fd.Humidity2Alt
	}
	return 0
}

// GetEffectiveWindSpeedU returns the U component of wind using whichever field is available
func (fd *ForecastData) GetEffectiveWindSpeedU() float64 {
	if fd.WindSpeedU != 0 {
		return fd.WindSpeedU
	}
	if fd.WindSpeedUAlt != 0 {
		return fd.WindSpeedUAlt
	}
	if fd.WindSpeedU2Alt != 0 {
		return fd.WindSpeedU2Alt
	}
	return 0
}

// GetEffectiveWindSpeedV returns the V component of wind using whichever field is available
func (fd *ForecastData) GetEffectiveWindSpeedV() float64 {
	if fd.WindSpeedV != 0 {
		return fd.WindSpeedV
	}
	if fd.WindSpeedVAlt != 0 {
		return fd.WindSpeedVAlt
	}
	if fd.WindSpeedV2Alt != 0 {
		return fd.WindSpeedV2Alt
	}
	return 0
}

// GetEffectiveCloudCover returns the cloud cover using whichever field is available
func (fd *ForecastData) GetEffectiveCloudCover() float64 {
	if fd.CloudCover >= 0 {
		return fd.CloudCover
	}
	if fd.CloudCoverAlt >= 0 {
		return fd.CloudCoverAlt
	}
	if fd.CloudCover2Alt >= 0 {
		return fd.CloudCover2Alt
	}
	return 0
}

// GetEffectivePrecipitation returns the precipitation using whichever field is available
// For ICON-EU data, tot_prec is already in mm (accumulated), not a rate
func (fd *ForecastData) GetEffectivePrecipitation() float64 {
	// Primary field (tot_prec) is in mm
	if fd.Precipitation >= 0 {
		return fd.Precipitation
	}
	// Alternative fields might be in kg/m²/s (equivalent to mm/s)
	if fd.PrecipitationAlt > 0 {
		return fd.PrecipitationAlt
	}
	if fd.Precipitation2Alt > 0 {
		return fd.Precipitation2Alt
	}
	return 0
}

// GetEffectivePrecipitationHourly returns the precipitation in mm/h 
// For ICON-EU, tot_prec is already accumulated precipitation in mm
func (fd *ForecastData) GetEffectivePrecipitationHourly() float64 {
	// For tot_prec, it's already in mm (accumulated)
	// We should not multiply by 3600 since it's not a rate
	if fd.Precipitation >= 0 {
		return fd.Precipitation // Already in mm
	}
	
	// For alternative fields that might be rates (kg/m²/s = mm/s)
	if fd.PrecipitationAlt > 0 {
		return fd.PrecipitationAlt * 3600.0 // Convert mm/s to mm/h
	}
	if fd.Precipitation2Alt > 0 {
		return fd.Precipitation2Alt * 3600.0 // Convert mm/s to mm/h
	}
	
	return 0
}

// GetEffectiveSurfacePressure returns the surface pressure using whichever field is available
func (fd *ForecastData) GetEffectiveSurfacePressure() float64 {
	// Primary field (pmsl) is already in hPa
	if fd.SurfacePressure > 0 {
		return fd.SurfacePressure * 100.0 // Convert hPa to Pa for consistency
	}
	// Alternative fields are in Pa
	if fd.SurfacePressureAlt > 0 {
		return fd.SurfacePressureAlt
	}
	if fd.SurfacePressure2Alt > 0 {
		return fd.SurfacePressure2Alt
	}
	return 0
}

// HasWindData returns true if any wind data is available
func (fd *ForecastData) HasWindData() bool {
	return fd.WindSpeedU != 0 || fd.WindSpeedV != 0 || 
		   fd.WindSpeedUAlt != 0 || fd.WindSpeedVAlt != 0 ||
		   fd.WindSpeedU2Alt != 0 || fd.WindSpeedV2Alt != 0
}

// HasTemperatureData returns true if any temperature data is available
func (fd *ForecastData) HasTemperatureData() bool {
	// Check for non-zero temperature (including negative values)
	return fd.Temperature != 0 || fd.TemperatureAlt > 0 || fd.Temperature2Alt > 0
}

// ICONTileForecast represents a weather forecast for a specific ICON cell
type ICONTileForecast struct {
	ID               int64         `json:"id"`
	CellID           int64         `json:"cell_id"`
	RunDate          time.Time     `json:"run_date"`
	UTCCycleTime     string        `json:"utc_cycle_time"` // 00, 06, 12, 18
	ForecastDatetime time.Time     `json:"forecast_datetime"`
	ForecastData     ForecastData  `json:"forecast_data"`
	RawForecastData  []byte        `json:"-"` // Raw JSONB data
	CreatedAt        time.Time     `json:"created_at"`
	UpdatedAt        time.Time     `json:"updated_at"`
}

// ICONTileForecastRepository handles interactions with the icon_tile_forecasts table
type ICONTileForecastRepository struct {
	DB *sql.DB
}

// NewICONTileForecastRepository creates a new ICONTileForecastRepository
func NewICONTileForecastRepository(db *sql.DB) *ICONTileForecastRepository {
	return &ICONTileForecastRepository{DB: db}
}

// FindByCellID returns all forecasts for a specific cell
func (r *ICONTileForecastRepository) FindByCellID(cellID int64) ([]ICONTileForecast, error) {
	query := `
		SELECT id, cell_id, run_date, utc_cycle_time, forecast_datetime, forecast_data, created_at, updated_at
		FROM icon_tile_forecasts
		WHERE cell_id = $1
		ORDER BY forecast_datetime
	`

	rows, err := r.DB.Query(query, cellID)
	if err != nil {
		return nil, fmt.Errorf("query forecasts by cell id: %w", err)
	}
	defer rows.Close()

	var forecasts []ICONTileForecast
	for rows.Next() {
		var forecast ICONTileForecast
		if err := rows.Scan(
			&forecast.ID,
			&forecast.CellID,
			&forecast.RunDate,
			&forecast.UTCCycleTime,
			&forecast.ForecastDatetime,
			&forecast.RawForecastData,
			&forecast.CreatedAt,
			&forecast.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan forecast: %w", err)
		}

		// Parse JSONB forecast data
		if err := json.Unmarshal(forecast.RawForecastData, &forecast.ForecastData); err != nil {
			return nil, fmt.Errorf("unmarshal forecast data: %w", err)
		}

		forecasts = append(forecasts, forecast)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterating forecasts: %w", err)
	}

	return forecasts, nil
}

// FindLatestForecastsByCellID returns the latest forecasts for a specific cell
func (r *ICONTileForecastRepository) FindLatestForecastsByCellID(cellID int64, limit int) ([]ICONTileForecast, error) {
	// Find the latest run date and cycle time
	var latestRunDate time.Time
	var latestCycleTime string

	latestRunQuery := `
		SELECT run_date, utc_cycle_time
		FROM icon_tile_forecasts
		WHERE cell_id = $1
		ORDER BY run_date DESC, utc_cycle_time DESC
		LIMIT 1
	`

	err := r.DB.QueryRow(latestRunQuery, cellID).Scan(&latestRunDate, &latestCycleTime)
	if err != nil {
		if err == sql.ErrNoRows {
			return []ICONTileForecast{}, nil // No forecasts found
		}
		return nil, fmt.Errorf("query latest run date: %w", err)
	}

	// Get forecasts from the latest run
	query := `
		SELECT id, cell_id, run_date, utc_cycle_time, forecast_datetime, forecast_data, created_at, updated_at
		FROM icon_tile_forecasts
		WHERE cell_id = $1 AND run_date = $2 AND utc_cycle_time = $3
		ORDER BY forecast_datetime
		LIMIT $4
	`

	rows, err := r.DB.Query(query, cellID, latestRunDate, latestCycleTime, limit)
	if err != nil {
		return nil, fmt.Errorf("query latest forecasts: %w", err)
	}
	defer rows.Close()

	var forecasts []ICONTileForecast
	for rows.Next() {
		var forecast ICONTileForecast
		if err := rows.Scan(
			&forecast.ID,
			&forecast.CellID,
			&forecast.RunDate,
			&forecast.UTCCycleTime,
			&forecast.ForecastDatetime,
			&forecast.RawForecastData,
			&forecast.CreatedAt,
			&forecast.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan forecast: %w", err)
		}

		// Debug: print raw JSON
		fmt.Printf("Raw forecast data: %s\n", string(forecast.RawForecastData))

		// Parse JSONB forecast data
		if err := json.Unmarshal(forecast.RawForecastData, &forecast.ForecastData); err != nil {
			return nil, fmt.Errorf("unmarshal forecast data: %w", err)
		}

		// Debug: print unmarshaled values
		fmt.Printf("Unmarshaled temperature: %f\n", forecast.ForecastData.Temperature)

		forecasts = append(forecasts, forecast)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterating forecasts: %w", err)
	}

	return forecasts, nil
}

// FindForecastsByDateRange returns forecasts for a specific cell within a date range
func (r *ICONTileForecastRepository) FindForecastsByDateRange(cellID int64, start, end time.Time) ([]ICONTileForecast, error) {
	query := `
		SELECT id, cell_id, run_date, utc_cycle_time, forecast_datetime, forecast_data, created_at, updated_at
		FROM icon_tile_forecasts
		WHERE cell_id = $1 AND forecast_datetime BETWEEN $2 AND $3
		ORDER BY forecast_datetime
	`

	rows, err := r.DB.Query(query, cellID, start, end)
	if err != nil {
		return nil, fmt.Errorf("query forecasts by date range: %w", err)
	}
	defer rows.Close()

	var forecasts []ICONTileForecast
	for rows.Next() {
		var forecast ICONTileForecast
		if err := rows.Scan(
			&forecast.ID,
			&forecast.CellID,
			&forecast.RunDate,
			&forecast.UTCCycleTime,
			&forecast.ForecastDatetime,
			&forecast.RawForecastData,
			&forecast.CreatedAt,
			&forecast.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan forecast: %w", err)
		}

		// Parse JSONB forecast data
		if err := json.Unmarshal(forecast.RawForecastData, &forecast.ForecastData); err != nil {
			return nil, fmt.Errorf("unmarshal forecast data: %w", err)
		}

		forecasts = append(forecasts, forecast)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterating forecasts: %w", err)
	}

	return forecasts, nil
}

// Create adds a new ICON tile forecast to the database
func (r *ICONTileForecastRepository) Create(forecast *ICONTileForecast) error {
	// Convert ForecastData to JSON
	forecastDataJSON, err := json.Marshal(forecast.ForecastData)
	if err != nil {
		return fmt.Errorf("marshal forecast data: %w", err)
	}

	query := `
		INSERT INTO icon_tile_forecasts (
			cell_id, run_date, utc_cycle_time, forecast_datetime, forecast_data
		) VALUES ($1, $2, $3, $4, $5)
		RETURNING id, created_at, updated_at
	`

	err = r.DB.QueryRow(
		query,
		forecast.CellID,
		forecast.RunDate,
		forecast.UTCCycleTime,
		forecast.ForecastDatetime,
		forecastDataJSON,
	).Scan(&forecast.ID, &forecast.CreatedAt, &forecast.UpdatedAt)

	if err != nil {
		return fmt.Errorf("insert forecast: %w", err)
	}

	forecast.RawForecastData = forecastDataJSON
	return nil
}

// BatchCreate adds multiple ICON tile forecasts to the database in a single transaction
func (r *ICONTileForecastRepository) BatchCreate(forecasts []ICONTileForecast) error {
	tx, err := r.DB.Begin()
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare(`
		INSERT INTO icon_tile_forecasts (
			cell_id, run_date, utc_cycle_time, forecast_datetime, forecast_data
		) VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (cell_id, forecast_datetime, run_date, utc_cycle_time) 
		DO UPDATE SET forecast_data = EXCLUDED.forecast_data, updated_at = NOW()
	`)
	if err != nil {
		return fmt.Errorf("prepare statement: %w", err)
	}
	defer stmt.Close()

	for i := range forecasts {
		// Convert ForecastData to JSON
		forecastDataJSON, err := json.Marshal(forecasts[i].ForecastData)
		if err != nil {
			return fmt.Errorf("marshal forecast data: %w", err)
		}

		_, err = stmt.Exec(
			forecasts[i].CellID,
			forecasts[i].RunDate,
			forecasts[i].UTCCycleTime,
			forecasts[i].ForecastDatetime,
			forecastDataJSON,
		)
		if err != nil {
			return fmt.Errorf("insert forecast: %w", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit transaction: %w", err)
	}

	return nil
}

// Update updates an existing ICON tile forecast
func (r *ICONTileForecastRepository) Update(forecast *ICONTileForecast) error {
	// Convert ForecastData to JSON
	forecastDataJSON, err := json.Marshal(forecast.ForecastData)
	if err != nil {
		return fmt.Errorf("marshal forecast data: %w", err)
	}

	query := `
		UPDATE icon_tile_forecasts
		SET forecast_data = $1, updated_at = NOW()
		WHERE id = $2
		RETURNING updated_at
	`

	err = r.DB.QueryRow(
		query,
		forecastDataJSON,
		forecast.ID,
	).Scan(&forecast.UpdatedAt)

	if err != nil {
		return fmt.Errorf("update forecast: %w", err)
	}

	forecast.RawForecastData = forecastDataJSON
	return nil
}

// Delete removes an ICON tile forecast from the database
func (r *ICONTileForecastRepository) Delete(id int64) error {
	query := `
		DELETE FROM icon_tile_forecasts
		WHERE id = $1
	`

	result, err := r.DB.Exec(query, id)
	if err != nil {
		return fmt.Errorf("delete forecast: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("checking affected rows: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("no forecast found with id %d", id)
	}

	return nil
}

// DeleteOutdatedForecasts removes forecasts older than a specified date
func (r *ICONTileForecastRepository) DeleteOutdatedForecasts(cutoffDate time.Time) (int64, error) {
	query := `
		DELETE FROM icon_tile_forecasts
		WHERE run_date < $1
	`

	result, err := r.DB.Exec(query, cutoffDate)
	if err != nil {
		return 0, fmt.Errorf("delete outdated forecasts: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return 0, fmt.Errorf("checking affected rows: %w", err)
	}

	return rowsAffected, nil
}