package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	_ "github.com/lib/pq"
	"github.com/sellinios/aethra/internal/config"
	"github.com/sellinios/aethra/internal/database"
	"github.com/sellinios/aethra/internal/processor"
)

func main() {
	// Command line flags
	var (
		mode         = flag.String("mode", "all", "Mode: download, process, import, or all")
		runTime      = flag.String("run", "", "Specific run time (YYYYMMDDHH)")
		workers      = flag.Int("workers", 8, "Number of parallel workers")
		dataDir      = flag.String("data-dir", "./data", "Data directory")
		cleanup      = flag.Bool("cleanup", false, "Clean up old data")
		keepHours    = flag.Int("keep-hours", 72, "Hours of data to keep")
		createTables = flag.Bool("create-tables", false, "Create database tables")
	)
	flag.Parse()

	// Load configuration
	cfg := config.NewConfig()
	logger := log.New(os.Stdout, "[PROCESSOR] ", log.LstdFlags)

	// Connect to database
	db, err := database.Connect(cfg.Database)
	if err != nil {
		logger.Fatalf("Database connection failed: %v", err)
	}
	defer db.Close()

	// Create tables if requested
	if *createTables {
		logger.Println("Creating database tables...")
		if err := database.CreateWeatherTables(db); err != nil {
			logger.Fatalf("Failed to create tables: %v", err)
		}
		logger.Println("Tables created successfully")
		return
	}

	// Set up context for cancellation
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Handle signals
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-sigChan
		logger.Println("Received shutdown signal")
		cancel()
	}()

	// Create processor
	proc := processor.New(db, cfg, *dataDir, *workers)

	// Determine run time
	var run time.Time
	if *runTime != "" {
		run, err = time.Parse("2006010215", *runTime)
		if err != nil {
			logger.Fatalf("Invalid run time format: %v", err)
		}
	} else {
		// Use latest available run
		run = processor.GetLatestRun()
	}

	logger.Printf("Processing ICON-EU data for Greece")
	logger.Printf("Run: %s", run.Format("2006-01-02 15:04 UTC"))
	logger.Printf("Mode: %s", *mode)

	// Execute based on mode
	switch *mode {
	case "download":
		if err := proc.Download(ctx, run); err != nil {
			logger.Fatalf("Download failed: %v", err)
		}
	case "process":
		if err := proc.Process(ctx, run); err != nil {
			logger.Fatalf("Processing failed: %v", err)
		}
	case "import":
		if err := proc.Import(ctx, run); err != nil {
			logger.Fatalf("Import failed: %v", err)
		}
	case "all":
		// Run complete pipeline
		if err := proc.Download(ctx, run); err != nil {
			logger.Fatalf("Download failed: %v", err)
		}
		if err := proc.Process(ctx, run); err != nil {
			logger.Fatalf("Processing failed: %v", err)
		}
		if err := proc.Import(ctx, run); err != nil {
			logger.Fatalf("Import failed: %v", err)
		}
	default:
		logger.Fatalf("Unknown mode: %s", *mode)
	}

	// Cleanup if requested
	if *cleanup {
		logger.Printf("Cleaning up data older than %d hours...", *keepHours)
		if err := proc.Cleanup(*keepHours); err != nil {
			logger.Printf("Cleanup failed: %v", err)
		}
	}

	logger.Println("Processing completed successfully")
}