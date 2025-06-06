package processor

import (
	"compress/bzip2"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/nilsmagnus/grib/griblib"
	"github.com/sellinios/aethra/internal/config"
)

// Processor handles weather data processing
type Processor struct {
	db       *sql.DB
	cfg      *config.Config
	dataDir  string
	workers  int
	client   *http.Client
}

// New creates a new processor
func New(db *sql.DB, cfg *config.Config, dataDir string, workers int) *Processor {
	return &Processor{
		db:      db,
		cfg:     cfg,
		dataDir: dataDir,
		workers: workers,
		client: &http.Client{
			Timeout: 5 * time.Minute,
		},
	}
}

// Download fetches ICON-EU data from DWD
func (p *Processor) Download(ctx context.Context, runTime time.Time) error {
	baseURL := "https://opendata.dwd.de/weather/nwp/icon-eu/grib"
	runStr := runTime.Format("2006010215")
	
	log.Printf("Downloading ICON-EU run %s", runStr)
	
	// Essential weather variables
	variables := []string{
		"t_2m",      // Temperature
		"td_2m",     // Dewpoint
		"relhum_2m", // Humidity
		"u_10m",     // Wind U
		"v_10m",     // Wind V
		"pmsl",      // Pressure
		"tot_prec",  // Precipitation
		"clct",      // Cloud cover
	}
	
	// Create download tasks
	tasks := p.createDownloadTasks(runTime, variables, baseURL)
	
	// Download in parallel
	return p.downloadParallel(ctx, tasks)
}

// Process extracts Greece data from GRIB files
func (p *Processor) Process(ctx context.Context, runTime time.Time) error {
	runStr := runTime.Format("2006010215")
	inputDir := filepath.Join(p.dataDir, "ICON-EU", runStr)
	
	log.Printf("Processing GRIB files for Greece region")
	
	// Find all GRIB files
	files, err := filepath.Glob(filepath.Join(inputDir, "*.grib2"))
	if err != nil {
		return fmt.Errorf("failed to list files: %w", err)
	}
	
	if len(files) == 0 {
		return fmt.Errorf("no GRIB files found")
	}
	
	// Process each file
	data := make(map[string][]WeatherPoint)
	var mu sync.Mutex
	
	// Use worker pool for processing
	var wg sync.WaitGroup
	fileChan := make(chan string, len(files))
	
	// Start workers
	for i := 0; i < p.workers; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for file := range fileChan {
				points, err := p.processGRIBFile(file)
				if err != nil {
					log.Printf("Failed to process %s: %v", filepath.Base(file), err)
					continue
				}
				
				mu.Lock()
				for k, v := range points {
					data[k] = append(data[k], v...)
				}
				mu.Unlock()
			}
		}()
	}
	
	// Send files to process
	for _, file := range files {
		fileChan <- file
	}
	close(fileChan)
	
	wg.Wait()
	
	// Save processed data
	return p.saveProcessedData(runTime, data)
}

// Import loads processed data into database
func (p *Processor) Import(ctx context.Context, runTime time.Time) error {
	runStr := runTime.Format("2006010215")
	dataFile := filepath.Join(p.dataDir, "processed", runStr+".json")
	
	// Read processed data
	file, err := os.Open(dataFile)
	if err != nil {
		return fmt.Errorf("failed to open data file: %w", err)
	}
	defer file.Close()
	
	var data map[string][]WeatherPoint
	if err := json.NewDecoder(file).Decode(&data); err != nil {
		return fmt.Errorf("failed to decode data: %w", err)
	}
	
	// Import to database
	return p.importToDatabase(runTime, data)
}

// Cleanup removes old data
func (p *Processor) Cleanup(hoursToKeep int) error {
	// Clean files
	if err := p.cleanupFiles(hoursToKeep); err != nil {
		log.Printf("File cleanup failed: %v", err)
	}
	
	// Clean database
	if err := p.cleanupDatabase(hoursToKeep); err != nil {
		log.Printf("Database cleanup failed: %v", err)
	}
	
	return nil
}

// GetLatestRun determines the most recent ICON run
func GetLatestRun() time.Time {
	now := time.Now().UTC()
	hour := (now.Hour() / 3) * 3
	
	// Go back 6 hours to ensure availability
	return time.Date(now.Year(), now.Month(), now.Day(), hour, 0, 0, 0, time.UTC).Add(-6 * time.Hour)
}

// Download task structure
type downloadTask struct {
	URL      string
	DestPath string
	Variable string
	Hour     int
}

// Weather point structure
type WeatherPoint struct {
	Lat       float64            `json:"lat"`
	Lon       float64            `json:"lon"`
	Time      time.Time          `json:"time"`
	Variables map[string]float64 `json:"variables"`
}

// Create download tasks
func (p *Processor) createDownloadTasks(runTime time.Time, variables []string, baseURL string) []downloadTask {
	var tasks []downloadTask
	runStr := runTime.Format("2006010215")
	runDir := filepath.Join(p.dataDir, "ICON-EU", runStr)
	
	// Create directory
	os.MkdirAll(runDir, 0755)
	
	// Variable name mapping
	varMap := map[string]string{
		"t_2m":      "T_2M",
		"td_2m":     "TD_2M",
		"relhum_2m": "RELHUM_2M",
		"u_10m":     "U_10M",
		"v_10m":     "V_10M",
		"pmsl":      "PMSL",
		"tot_prec":  "TOT_PREC",
		"clct":      "CLCT",
	}
	
	// Create tasks for each variable and hour
	for _, variable := range variables {
		dwdVar := varMap[variable]
		
		// First 48 hours hourly, then 3-hourly
		for hour := 0; hour <= 120; hour++ {
			if hour > 48 && hour%3 != 0 {
				continue
			}
			
			filename := fmt.Sprintf("icon-eu_europe_regular-lat-lon_single-level_%s_%03d_%s.grib2",
				runStr, hour, dwdVar)
			
			task := downloadTask{
				URL:      fmt.Sprintf("%s/%02d/%s/%s.bz2", baseURL, hour, variable, filename),
				DestPath: filepath.Join(runDir, filename),
				Variable: variable,
				Hour:     hour,
			}
			tasks = append(tasks, task)
		}
	}
	
	return tasks
}

// Download files in parallel
func (p *Processor) downloadParallel(ctx context.Context, tasks []downloadTask) error {
	var wg sync.WaitGroup
	taskChan := make(chan downloadTask, len(tasks))
	
	// Start workers
	for i := 0; i < p.workers; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			for task := range taskChan {
				if err := p.downloadFile(ctx, task); err != nil {
					log.Printf("Worker %d: Failed to download %s: %v", id, filepath.Base(task.DestPath), err)
				}
			}
		}(i)
	}
	
	// Send tasks
	for _, task := range tasks {
		select {
		case taskChan <- task:
		case <-ctx.Done():
			close(taskChan)
			return ctx.Err()
		}
	}
	close(taskChan)
	
	wg.Wait()
	return nil
}

// Download single file
func (p *Processor) downloadFile(ctx context.Context, task downloadTask) error {
	// Skip if exists
	if _, err := os.Stat(task.DestPath); err == nil {
		return nil
	}
	
	// Create request
	req, err := http.NewRequestWithContext(ctx, "GET", task.URL, nil)
	if err != nil {
		return err
	}
	
	// Download
	resp, err := p.client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("HTTP %d", resp.StatusCode)
	}
	
	// Create temp file
	tmpPath := task.DestPath + ".tmp"
	tmpFile, err := os.Create(tmpPath)
	if err != nil {
		return err
	}
	defer os.Remove(tmpPath)
	
	// Decompress and save
	reader := bzip2.NewReader(resp.Body)
	if _, err := io.Copy(tmpFile, reader); err != nil {
		tmpFile.Close()
		return err
	}
	tmpFile.Close()
	
	// Move to final location
	return os.Rename(tmpPath, task.DestPath)
}

// Process GRIB file
func (p *Processor) processGRIBFile(filename string) (map[string][]WeatherPoint, error) {
	file, err := os.Open(filename)
	if err != nil {
		return nil, err
	}
	defer file.Close()
	
	messages, err := griblib.ReadMessages(file)
	if err != nil {
		return nil, err
	}
	
	result := make(map[string][]WeatherPoint)
	
	for _, msg := range messages {
		// Extract data for Greece region
		points := p.extractGreeceData(msg)
		if len(points) > 0 {
			key := fmt.Sprintf("%d", msg.Section1.RefTime.Unix())
			result[key] = append(result[key], points...)
		}
	}
	
	return result, nil
}

// Extract data for Greece region
func (p *Processor) extractGreeceData(msg *griblib.Message) []WeatherPoint {
	// Implementation would extract data points within Greece bounds
	// This is simplified for brevity
	return []WeatherPoint{}
}

// Save processed data
func (p *Processor) saveProcessedData(runTime time.Time, data map[string][]WeatherPoint) error {
	runStr := runTime.Format("2006010215")
	outputDir := filepath.Join(p.dataDir, "processed")
	os.MkdirAll(outputDir, 0755)
	
	outputFile := filepath.Join(outputDir, runStr+".json")
	
	file, err := os.Create(outputFile)
	if err != nil {
		return err
	}
	defer file.Close()
	
	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	return encoder.Encode(data)
}

// Import to database
func (p *Processor) importToDatabase(runTime time.Time, data map[string][]WeatherPoint) error {
	tx, err := p.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()
	
	stmt, err := tx.Prepare(`
		INSERT INTO weather_data (
			model, run_time, forecast_time, 
			latitude, longitude, location,
			temperature, humidity, pressure,
			wind_u, wind_v, precipitation,
			cloud_cover, data_json, created_at
		) VALUES (
			$1, $2, $3, $4, $5, 
			ST_SetSRID(ST_MakePoint($5, $4), 4326),
			$6, $7, $8, $9, $10, $11, $12, $13, $14
		) ON CONFLICT (model, run_time, forecast_time, latitude, longitude) 
		DO UPDATE SET
			temperature = EXCLUDED.temperature,
			humidity = EXCLUDED.humidity,
			pressure = EXCLUDED.pressure,
			wind_u = EXCLUDED.wind_u,
			wind_v = EXCLUDED.wind_v,
			precipitation = EXCLUDED.precipitation,
			cloud_cover = EXCLUDED.cloud_cover,
			data_json = EXCLUDED.data_json,
			created_at = EXCLUDED.created_at
	`)
	if err != nil {
		return err
	}
	defer stmt.Close()
	
	count := 0
	for _, points := range data {
		for _, point := range points {
			jsonData, _ := json.Marshal(point.Variables)
			
			_, err := stmt.Exec(
				p.cfg.Weather.Model,
				runTime,
				point.Time,
				point.Lat,
				point.Lon,
				point.Variables["temperature"],
				point.Variables["humidity"],
				point.Variables["pressure"],
				point.Variables["wind_u"],
				point.Variables["wind_v"],
				point.Variables["precipitation"],
				point.Variables["cloud_cover"],
				jsonData,
				time.Now(),
			)
			if err != nil {
				log.Printf("Failed to insert point: %v", err)
				continue
			}
			count++
		}
	}
	
	if err := tx.Commit(); err != nil {
		return err
	}
	
	log.Printf("Imported %d weather points", count)
	return nil
}

// Cleanup old files
func (p *Processor) cleanupFiles(hoursToKeep int) error {
	cutoff := time.Now().Add(-time.Duration(hoursToKeep) * time.Hour)
	
	iconDir := filepath.Join(p.dataDir, "ICON-EU")
	entries, err := os.ReadDir(iconDir)
	if err != nil {
		return err
	}
	
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		
		runTime, err := time.Parse("2006010215", entry.Name())
		if err != nil {
			continue
		}
		
		if runTime.Before(cutoff) {
			path := filepath.Join(iconDir, entry.Name())
			log.Printf("Removing old run: %s", entry.Name())
			os.RemoveAll(path)
		}
	}
	
	return nil
}

// Cleanup old database records
func (p *Processor) cleanupDatabase(hoursToKeep int) error {
	query := `
		DELETE FROM weather_data 
		WHERE forecast_time < NOW() - INTERVAL '%d hours'
	`
	
	result, err := p.db.Exec(fmt.Sprintf(query, hoursToKeep))
	if err != nil {
		return err
	}
	
	rows, _ := result.RowsAffected()
	log.Printf("Deleted %d old weather records", rows)
	
	return nil
}