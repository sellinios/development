package main

import (
	"compress/bzip2"
	"database/sql"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	_ "github.com/lib/pq"
)

// Configuration
const (
	baseURL     = "https://opendata.dwd.de/weather/nwp/icon-eu/grib"
	workers     = 4
	importBatch = 100
)

// WeatherData represents the weather data structure
type WeatherData struct {
	T2m      float64 `json:"t_2m"`
	Relhum2m float64 `json:"relhum_2m"`
	U10m     float64 `json:"u_10m"`
	V10m     float64 `json:"v_10m"`
	Pmsl     float64 `json:"pmsl"`
	TotPrec  float64 `json:"tot_prec"`
	Clct     float64 `json:"clct"`
}

// DownloadJob represents a download task
type DownloadJob struct {
	URL      string
	FilePath string
	Variable string
	Step     string
}

// ImportRecord represents a database import record
type ImportRecord struct {
	CellID           int
	RunDate          string
	UTCCycleTime     string
	ForecastDatetime time.Time
	Data             json.RawMessage
}

func main() {
	if len(os.Args) < 2 {
		log.Fatal("Usage: icon_pipeline <command> [options]\nCommands: download, import, all")
	}

	command := os.Args[1]
	
	// Get data directory
	dataDir := "/tmp/icon_data"
	if len(os.Args) > 2 {
		dataDir = os.Args[2]
	}

	switch command {
	case "download":
		if err := downloadICON(dataDir); err != nil {
			log.Fatal(err)
		}
	case "import":
		if len(os.Args) < 4 {
			log.Fatal("Usage: icon_pipeline import <dataDir> <cycle>")
		}
		cycle := os.Args[3]
		if err := importICON(dataDir, cycle); err != nil {
			log.Fatal(err)
		}
	case "all":
		// Download
		if err := downloadICON(dataDir); err != nil {
			log.Fatal(err)
		}
		// Find latest cycle
		cycle, err := findLatestCycle(dataDir)
		if err != nil {
			log.Fatal(err)
		}
		// Import
		if err := importICON(dataDir, cycle); err != nil {
			log.Fatal(err)
		}
	default:
		log.Fatal("Unknown command: ", command)
	}
}

// Download functions
func downloadICON(dataDir string) error {
	// Get current UTC time
	now := time.Now().UTC()
	
	// ICON-EU runs at 00, 06, 12, 18 UTC
	// Find the latest available run (usually 2-3 hours behind)
	runTime := now.Add(-3 * time.Hour)
	runHour := (runTime.Hour() / 6) * 6 // Round down to nearest 6-hour interval
	
	runDate := runTime.Format("20060102")
	runHourStr := fmt.Sprintf("%02d", runHour)
	
	log.Printf("Current UTC time: %s", now.Format("2006-01-02 15:04"))
	log.Printf("Using ICON-EU run: %s %s:00 UTC", runDate, runHourStr)
	
	// Create run directory
	runDir := filepath.Join(dataDir, fmt.Sprintf("%s%s", runDate, runHourStr))
	if err := os.MkdirAll(runDir, 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	// Weather variables we need
	variables := map[string]string{
		"t_2m":      "T_2M",      // Temperature at 2m
		"relhum_2m": "RELHUM_2M", // Relative humidity at 2m
		"u_10m":     "U_10M",     // U-component of wind at 10m
		"v_10m":     "V_10M",     // V-component of wind at 10m
		"pmsl":      "PMSL",      // Pressure at mean sea level
		"tot_prec":  "TOT_PREC",  // Total precipitation
		"clct":      "CLCT",      // Cloud cover total
	}

	// Forecast steps - hourly data from 0 to 78, then 3-hourly to 120 hours (5 days)
	var steps []string
	// Hourly data from 0 to 78
	for i := 0; i <= 78; i++ {
		steps = append(steps, fmt.Sprintf("%03d", i))
	}
	// 3-hourly data from 81 to 120
	for i := 81; i <= 120; i += 3 {
		steps = append(steps, fmt.Sprintf("%03d", i))
	}

	// Create download jobs
	var jobs []DownloadJob
	for varPath, varName := range variables {
		for _, step := range steps {
			fileName := fmt.Sprintf("icon-eu_europe_regular-lat-lon_single-level_%s%s_%s_%s.grib2.bz2",
				runDate, runHourStr, step, varName)
			
			job := DownloadJob{
				URL:      fmt.Sprintf("%s/%s/%s/%s", baseURL, runHourStr, varPath, fileName),
				FilePath: filepath.Join(runDir, strings.TrimSuffix(fileName, ".bz2")),
				Variable: varName,
				Step:     step,
			}
			jobs = append(jobs, job)
		}
	}

	// Download with workers
	jobChan := make(chan DownloadJob, len(jobs))
	var wg sync.WaitGroup
	
	// Start workers
	for i := 0; i < workers; i++ {
		wg.Add(1)
		go downloadWorker(&wg, jobChan)
	}
	
	// Queue jobs
	for _, job := range jobs {
		jobChan <- job
	}
	close(jobChan)
	
	// Wait for completion
	wg.Wait()
	
	log.Printf("✅ Download complete for run %s %s", runDate, runHourStr)
	return nil
}

func downloadWorker(wg *sync.WaitGroup, jobs <-chan DownloadJob) {
	defer wg.Done()
	
	client := &http.Client{
		Timeout: 5 * time.Minute,
	}
	
	for job := range jobs {
		if err := downloadFile(client, job); err != nil {
			log.Printf("❌ Failed to download %s: %v", job.Variable, err)
		} else {
			log.Printf("✓ Downloaded %s step %s", job.Variable, job.Step)
		}
	}
}

func downloadFile(client *http.Client, job DownloadJob) error {
	// Check if already exists
	if _, err := os.Stat(job.FilePath); err == nil {
		return nil // Already downloaded
	}

	// Download file
	resp, err := client.Get(job.URL)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("HTTP %d", resp.StatusCode)
	}

	// Create temp file
	tempFile := job.FilePath + ".tmp"
	out, err := os.Create(tempFile)
	if err != nil {
		return err
	}
	defer out.Close()

	// Decompress bzip2 on the fly
	reader := bzip2.NewReader(resp.Body)
	
	// Copy decompressed data
	_, err = io.Copy(out, reader)
	if err != nil {
		os.Remove(tempFile)
		return err
	}

	// Rename to final name
	return os.Rename(tempFile, job.FilePath)
}

// Import functions
func importICON(dataDir, cycle string) error {
	log.Printf("Importing ICON data for cycle: %s", cycle)
	
	// Connect to database
	db, err := connectDB()
	if err != nil {
		return fmt.Errorf("database connection failed: %w", err)
	}
	defer db.Close()

	// Parse cycle info
	var runDate, utcCycleTime string
	if strings.Contains(cycle, "_") {
		parts := strings.Split(cycle, "_")
		runDate = parts[0]
		utcCycleTime = parts[1]
	} else if len(cycle) == 10 {
		runDate = cycle[:8]
		utcCycleTime = cycle[8:]
	} else {
		return fmt.Errorf("invalid cycle format: %s", cycle)
	}

	// Find CSV files - handle both cycle formats (with and without underscore)
	processedDir := filepath.Join(dataDir, "filtered_tiles_data", cycle)
	files, err := filepath.Glob(filepath.Join(processedDir, "*.csv"))
	
	// If no files found and cycle has underscore, try without underscore
	if len(files) == 0 && strings.Contains(cycle, "_") {
		cycleNoUnderscore := strings.ReplaceAll(cycle, "_", "")
		processedDir = filepath.Join(dataDir, "filtered_tiles_data", cycleNoUnderscore)
		files, err = filepath.Glob(filepath.Join(processedDir, "*.csv"))
	}
	if err != nil {
		return fmt.Errorf("failed to find CSV files: %w", err)
	}

	if len(files) == 0 {
		return fmt.Errorf("no CSV files found in %s", processedDir)
	}

	log.Printf("Found %d CSV files to import", len(files))

	// Process each file
	totalRecords := 0
	for _, file := range files {
		count, err := importCSVFile(db, file, runDate, utcCycleTime)
		if err != nil {
			log.Printf("Error importing %s: %v", file, err)
			continue
		}
		totalRecords += count
	}

	log.Printf("✅ Import complete: %d records imported", totalRecords)
	return nil
}

func connectDB() (*sql.DB, error) {
	dbHost := os.Getenv("DB_HOST")
	if dbHost == "" {
		dbHost = "localhost"
	}
	dbUser := os.Getenv("DB_USER")
	if dbUser == "" {
		dbUser = "postgres"
	}
	dbPassword := os.Getenv("DB_PASSWORD")
	if dbPassword == "" {
		dbPassword = "postgres"
	}
	dbName := os.Getenv("DB_NAME")
	if dbName == "" {
		dbName = "kairos_db"
	}

	connStr := fmt.Sprintf("host=%s user=%s password=%s dbname=%s sslmode=disable",
		dbHost, dbUser, dbPassword, dbName)
	
	return sql.Open("postgres", connStr)
}

func importCSVFile(db *sql.DB, filename, runDate, utcCycleTime string) (int, error) {
	file, err := os.Open(filename)
	if err != nil {
		return 0, err
	}
	defer file.Close()

	reader := csv.NewReader(file)
	headers, err := reader.Read()
	if err != nil {
		return 0, err
	}

	// Map headers to indices
	headerMap := make(map[string]int)
	for i, h := range headers {
		headerMap[h] = i
	}

	// Group records by cell_id and forecast_datetime
	recordMap := make(map[string]*ImportRecord)
	
	for {
		row, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			return 0, err
		}

		cellID, _ := strconv.Atoi(row[headerMap["cell_id"]])
		// Parse datetime - handle multiple formats
		dtStr := row[headerMap["forecast_datetime"]]
		var forecastDT time.Time
		var parseErr error
		
		// Try different datetime formats
		formats := []string{
			time.RFC3339,              // 2006-01-02T15:04:05Z07:00
			"2006-01-02T15:04:05",     // ISO format without timezone
			"2006-01-02 15:04:05",     // Space-separated format
		}
		
		for _, format := range formats {
			forecastDT, parseErr = time.Parse(format, dtStr)
			if parseErr == nil {
				break
			}
		}
		
		if parseErr != nil {
			log.Printf("Error parsing datetime %s: %v", dtStr, parseErr)
			continue
		}
		
		key := fmt.Sprintf("%d_%s", cellID, forecastDT.Format("2006-01-02 15:04:05"))
		
		if _, exists := recordMap[key]; !exists {
			recordMap[key] = &ImportRecord{
				CellID:           cellID,
				RunDate:          runDate,
				UTCCycleTime:     utcCycleTime,
				ForecastDatetime: forecastDT,
				Data:             json.RawMessage("{}"),
			}
		}

		// Update weather data
		var data WeatherData
		json.Unmarshal(recordMap[key].Data, &data)
		
		// Handle both "parameter" and "parameter_name" column names
		paramCol := "parameter"
		if _, exists := headerMap["parameter_name"]; exists {
			paramCol = "parameter_name"
		}
		
		paramName := row[headerMap[paramCol]]
		value, _ := strconv.ParseFloat(row[headerMap["value"]], 64)
		
		// Handle both uppercase and lowercase parameter names
		switch strings.ToUpper(paramName) {
		case "T_2M":
			data.T2m = value
		case "RELHUM_2M":
			data.Relhum2m = value
		case "U_10M":
			data.U10m = value
		case "V_10M":
			data.V10m = value
		case "PMSL":
			data.Pmsl = value
		case "TOT_PREC":
			data.TotPrec = value
		case "CLCT":
			data.Clct = value
		}
		
		jsonData, _ := json.Marshal(data)
		recordMap[key].Data = jsonData
	}

	// Import records in batches
	count := 0
	batch := make([]*ImportRecord, 0, importBatch)
	
	for _, record := range recordMap {
		batch = append(batch, record)
		
		if len(batch) >= importBatch {
			if err := insertBatch(db, batch); err != nil {
				return count, err
			}
			count += len(batch)
			batch = batch[:0]
		}
	}
	
	// Insert remaining records
	if len(batch) > 0 {
		if err := insertBatch(db, batch); err != nil {
			return count, err
		}
		count += len(batch)
	}
	
	return count, nil
}

func insertBatch(db *sql.DB, records []*ImportRecord) error {
	query := `
		INSERT INTO icon_tile_forecasts (cell_id, run_date, utc_cycle_time, forecast_datetime, forecast_data)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (cell_id, run_date, utc_cycle_time, forecast_datetime)
		DO UPDATE SET forecast_data = EXCLUDED.forecast_data, updated_at = now()
	`
	
	stmt, err := db.Prepare(query)
	if err != nil {
		return err
	}
	defer stmt.Close()
	
	for _, record := range records {
		_, err := stmt.Exec(
			record.CellID,
			record.RunDate,
			record.UTCCycleTime,
			record.ForecastDatetime,
			record.Data,
		)
		if err != nil {
			return err
		}
	}
	
	return nil
}

func findLatestCycle(dataDir string) (string, error) {
	entries, err := os.ReadDir(dataDir)
	if err != nil {
		return "", err
	}

	var cycles []string
	for _, entry := range entries {
		if entry.IsDir() && len(entry.Name()) >= 10 {
			cycles = append(cycles, entry.Name())
		}
	}

	if len(cycles) == 0 {
		return "", fmt.Errorf("no cycle directories found")
	}

	// Sort and return the latest
	sort.Strings(cycles)
	return cycles[len(cycles)-1], nil
}