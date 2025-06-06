#!/bin/bash
set -e

# Setup logging
LOG_DIR="/home/sellinios/development/projects/kairos/backend/logs"
mkdir -p "$LOG_DIR"
exec > >(tee -a "$LOG_DIR/icon_cron.log") 2>&1
echo "===== ICON-EU Pipeline Started: $(date) ====="

# Project paths
PROJECT_DIR="/home/sellinios/development/projects/kairos/backend"
CMD_DIR="$PROJECT_DIR/cmd/icon"
DATA_DIR="$PROJECT_DIR/data/ICON-EU"

# Configuration
MAX_CYCLES_TO_KEEP=2  # Number of ICON cycles to keep (most recent ones)
CLEANUP_DB=true       # Whether to clean up old data from the database
KEEP_ONLY_LATEST_CYCLE_IN_DB=true  # If true, removes past forecasts but keeps future dates

# Database configuration
export DB_PASSWORD="${DB_PASSWORD:-postgres}"
DB_HOST="localhost"
DB_USER="postgres"
DB_NAME="kairos_db"

# Function to handle failures
handle_error() {
    echo "ERROR: $1"
    echo "===== ICON-EU Pipeline FAILED: $(date) ====="
    exit 1
}

# Function to clean up old ICON data
cleanup_old_data() {
    echo "Cleaning up old ICON data..."
    
    # List all cycle directories (format: YYYYMMDD_HH)
    ALL_CYCLES=$(find "$DATA_DIR" -maxdepth 1 -type d -name "[0-9]*_[0-9]*" | sort -r)
    
    # Count total cycles
    TOTAL_CYCLES=$(echo "$ALL_CYCLES" | wc -l)
    
    # If we have more than MAX_CYCLES_TO_KEEP, remove older ones
    if [ "$TOTAL_CYCLES" -gt "$MAX_CYCLES_TO_KEEP" ]; then
        echo "Found $TOTAL_CYCLES cycles, keeping $MAX_CYCLES_TO_KEEP most recent ones"
        
        # Get cycles to remove (skip the first MAX_CYCLES_TO_KEEP)
        CYCLES_TO_REMOVE=$(echo "$ALL_CYCLES" | tail -n +$((MAX_CYCLES_TO_KEEP+1)))
        
        # Remove each old cycle directory
        for CYCLE_DIR in $CYCLES_TO_REMOVE; do
            CYCLE_NAME=$(basename "$CYCLE_DIR")
            echo "Removing cycle: $CYCLE_NAME"
            
            # Remove the main data directory
            rm -rf "$CYCLE_DIR"
            
            # Remove corresponding filtered_tiles_data directory
            FILTERED_DIR="$DATA_DIR/filtered_tiles_data/$CYCLE_NAME"
            if [ -d "$FILTERED_DIR" ]; then
                echo "Removing filtered data: $FILTERED_DIR"
                rm -rf "$FILTERED_DIR"
            fi
            
            # Clean up database if enabled
            if [ "$CLEANUP_DB" = true ]; then
                echo "Cleaning up database for cycle: $CYCLE_NAME"
                
                # Parse date and hour from cycle name
                DATE_PART=$(echo "$CYCLE_NAME" | cut -d'_' -f1)
                HOUR_PART=$(echo "$CYCLE_NAME" | cut -d'_' -f2)
                
                # Use psql to delete old data
                PGPASSWORD="$DB_PASSWORD"
                export PGPASSWORD
                psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "DELETE FROM icon_tile_forecasts WHERE run_date = '$DATE_PART'::date AND utc_cycle_time = '$HOUR_PART'" || handle_error "Database cleanup failed"
                
                echo "Database cleanup for cycle $CYCLE_NAME completed"
            fi
        done
        
        echo "Cleanup completed, kept $MAX_CYCLES_TO_KEEP most recent cycles"
    else
        echo "Only $TOTAL_CYCLES cycles found, no cleanup needed (keeping $MAX_CYCLES_TO_KEEP)"
    fi
}

# Step 1: Run the ICON downloader
echo "Step 1: Downloading ICON-EU data..."
cd $PROJECT_DIR

# Use the consolidated ICON pipeline
go run cmd/icon/icon_pipeline.go download "$DATA_DIR" || handle_error "Download step failed"

# Step 2: Process the downloaded ICON data with Python
echo "Step 2: Processing ICON-EU data..."

# Activate Python virtual environment if it exists
if [ -d "$PROJECT_DIR/venv" ]; then
    source "$PROJECT_DIR/venv/bin/activate"
fi

# Run the Python processor
cd "$CMD_DIR"
python processor.py --data-dir "$DATA_DIR" || handle_error "Processing step failed"
PROCESSOR_EXIT=$?

# Find the most recent cycle directory (handles both YYYYMMDD_HH and YYYYMMDDHH formats)
LATEST_CYCLE=$(find "$DATA_DIR" -maxdepth 1 -type d -name "[0-9]*" | grep -E "[0-9]{8}(_[0-9]{2}|[0-9]{2})$" | sort -r | head -n 1)
if [ -z "$LATEST_CYCLE" ]; then
    handle_error "No cycle directories found"
fi

LATEST_CYCLE_NAME=$(basename "$LATEST_CYCLE")
echo "Latest ICON-EU cycle: $LATEST_CYCLE_NAME"

# Normalize cycle name for database (convert YYYYMMDDHH to YYYYMMDD_HH)
if [[ "$LATEST_CYCLE_NAME" =~ ^[0-9]{10}$ ]]; then
    # Format: YYYYMMDDHH
    DB_DATE="${LATEST_CYCLE_NAME:0:8}"
    DB_HOUR="${LATEST_CYCLE_NAME:8:2}"
    NORMALIZED_CYCLE="${DB_DATE}_${DB_HOUR}"
else
    # Format: YYYYMMDD_HH
    DB_DATE="${LATEST_CYCLE_NAME:0:8}"
    DB_HOUR="${LATEST_CYCLE_NAME:9:2}"
    NORMALIZED_CYCLE="$LATEST_CYCLE_NAME"
fi

# Check if processed data exists
PROCESSED_DATA_DIR="$DATA_DIR/filtered_tiles_data/$LATEST_CYCLE_NAME"
if [ ! -d "$PROCESSED_DATA_DIR" ]; then
    handle_error "Processed data directory not found: $PROCESSED_DATA_DIR"
fi

CSV_COUNT=$(find "$PROCESSED_DATA_DIR" -name "*.csv" | wc -l)
if [ "$CSV_COUNT" -lt 1 ]; then
    handle_error "No processed CSV files found in $PROCESSED_DATA_DIR"
fi
echo "Found $CSV_COUNT processed CSV files ready for import"

# If we're configured to keep only the latest cycle in the DB, clean up before importing
if [ "$KEEP_ONLY_LATEST_CYCLE_IN_DB" = true ] && [ -n "$LATEST_CYCLE_NAME" ]; then
    echo "Pre-import cleanup: Removing old forecast data from database..."
    
    # Use normalized date and hour for database operations
    # Delete old forecast data but preserve future dates
    # This keeps forecasts that are still in the future, even from older runs
    PGPASSWORD="$DB_PASSWORD"
    export PGPASSWORD
    CURRENT_DATE=$(date -u +%Y-%m-%d)
    
    # Delete data where:
    # 1. The forecast_datetime is in the past (already occurred)
    # 2. OR the run is older than 24 hours (to prevent accumulating too many overlapping forecasts)
    psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "
        DELETE FROM icon_tile_forecasts 
        WHERE forecast_datetime < '$CURRENT_DATE'::timestamp 
           OR (run_date < '$DB_DATE'::date - INTERVAL '1 day')
    " || handle_error "Pre-import database cleanup failed"
    
    echo "Database cleanup complete: removed past forecasts and runs older than 24 hours"
fi

# Step 3: Import the processed data into the database
echo "Step 3: Importing ICON-EU data..."
cd $PROJECT_DIR
# Pass the normalized cycle name for import
go run cmd/icon/icon_pipeline.go import "$DATA_DIR" "$NORMALIZED_CYCLE" || handle_error "Import step failed"

# Verify data was imported
PGPASSWORD="$DB_PASSWORD"
export PGPASSWORD
ROW_COUNT=$(psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM icon_tile_forecasts")
ROW_COUNT=$(echo $ROW_COUNT | xargs)  # Trim whitespace
echo "Verified database import: $ROW_COUNT total rows in the database"
if [ "$ROW_COUNT" -lt 1000 ]; then
    handle_error "Database import seems incomplete. Expected at least 1000 rows, found $ROW_COUNT"
else
    echo "Database has sufficient data: $ROW_COUNT rows"
fi

# Step 4: Clean up old data
echo "Step 4: Cleaning up old data..."
cleanup_old_data

echo "===== ICON-EU Pipeline COMPLETED SUCCESSFULLY: $(date) ====="