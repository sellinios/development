#!/bin/bash

# Development Backup Script
# Creates incremental backups of development folder with rotation

# Configuration
SOURCE_DIR="$HOME/development"
BACKUP_BASE="$HOME/development/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_BASE/backup_$DATE"
LATEST_LINK="$BACKUP_BASE/latest"
MAX_BACKUPS=2  # Keep 2 backups

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_BASE"

# Exclusions file
EXCLUDE_FILE="$HOME/development/scripts/.backup-exclude"

# Create exclusions file if it doesn't exist
cat > "$EXCLUDE_FILE" << 'EOF'
# Exclude patterns for backup
# CRITICAL: Exclude backups directory to prevent recursive backup!
backups/
node_modules/
venv/
zeus_env/
__pycache__/
*.pyc
.git/objects/
*.log
*.tmp
*.swp
.DS_Store
# Large data files
*.grib2
*.grib2.*.idx
# Build artifacts
dist/
build/
*.o
*.so
*.exe
# IDE files
.idea/
.vscode/
# Go build cache
go/pkg/
# Database files (if you want to exclude them)
# *.db
EOF

echo "Starting backup of $SOURCE_DIR to $BACKUP_DIR"
echo "Excluding patterns from $EXCLUDE_FILE"

# Create new backup using rsync
# --link-dest creates hard links to unchanged files from latest backup
if [ -L "$LATEST_LINK" ] && [ -d "$(readlink -f "$LATEST_LINK")" ]; then
    # Incremental backup using hard links
    rsync -av --delete \
        --exclude-from="$EXCLUDE_FILE" \
        --link-dest="$(readlink -f "$LATEST_LINK")" \
        "$SOURCE_DIR/" "$BACKUP_DIR/"
else
    # Full backup (first time)
    rsync -av --delete \
        --exclude-from="$EXCLUDE_FILE" \
        "$SOURCE_DIR/" "$BACKUP_DIR/"
fi

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "Backup completed successfully"
    
    # Update latest symlink
    rm -f "$LATEST_LINK"
    ln -s "$BACKUP_DIR" "$LATEST_LINK"
    
    # Rotate old backups (keep only MAX_BACKUPS)
    BACKUP_COUNT=$(find "$BACKUP_BASE" -maxdepth 1 -type d -name "backup_*" | wc -l)
    if [ $BACKUP_COUNT -gt $MAX_BACKUPS ]; then
        # Remove oldest backups
        find "$BACKUP_BASE" -maxdepth 1 -type d -name "backup_*" | \
            sort | head -n -$MAX_BACKUPS | xargs rm -rf
        echo "Removed old backups, keeping last $MAX_BACKUPS"
    fi
    
    # Show backup statistics
    echo ""
    echo "Backup Statistics:"
    du -sh "$BACKUP_DIR"
    echo "Total backups: $(find "$BACKUP_BASE" -maxdepth 1 -type d -name "backup_*" | wc -l)"
    echo ""
    echo "Recent backups:"
    ls -lht "$BACKUP_BASE" | grep "backup_" | head -5
else
    echo "Backup failed!"
    exit 1
fi