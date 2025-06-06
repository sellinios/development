package database

import (
	"fmt"
	"log"
)

// Migration represents a database migration
type Migration struct {
	ID      int
	Name    string
	SQL     string
	Applied bool
}

// RunMigrations runs all database migrations
func (db *DB) RunMigrations() error {
	log.Println("Running database migrations...")

	// Create migrations table if it doesn't exist
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS migrations (
			id SERIAL PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
		)
	`)
	if err != nil {
		return fmt.Errorf("failed to create migrations table: %w", err)
	}

	// Define migrations
	migrations := []Migration{
		{
			ID:   1,
			Name: "create_postgis_extension",
			SQL: `
				CREATE EXTENSION IF NOT EXISTS postgis;
			`,
		},
		{
			ID:   2,
			Name: "create_icon_cells_table",
			SQL: `
				CREATE TABLE IF NOT EXISTS icon_cells (
					id BIGSERIAL PRIMARY KEY,
					cell_name VARCHAR(100) UNIQUE NOT NULL,
					boundary GEOGRAPHY(POLYGON, 4326) NOT NULL,
					is_enabled BOOLEAN DEFAULT TRUE,
					created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
					updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
				)
			`,
		},
		{
			ID:   3,
			Name: "create_icon_tile_forecasts_table",
			SQL: `
				CREATE TABLE IF NOT EXISTS icon_tile_forecasts (
					id BIGSERIAL PRIMARY KEY,
					cell_id BIGINT NOT NULL REFERENCES icon_cells(id) ON DELETE CASCADE,
					run_date DATE NOT NULL,
					utc_cycle_time VARCHAR(2) NOT NULL,
					forecast_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
					forecast_data JSONB NOT NULL,
					created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
					updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
					UNIQUE(cell_id, forecast_datetime, run_date, utc_cycle_time)
				)
			`,
		},
		{
			ID:   4,
			Name: "create_locations_table",
			SQL: `
				CREATE TABLE IF NOT EXISTS locations (
					id BIGSERIAL PRIMARY KEY,
					name VARCHAR(255) NOT NULL,
					latitude DOUBLE PRECISION NOT NULL,
					longitude DOUBLE PRECISION NOT NULL,
					region VARCHAR(255),
					country VARCHAR(100),
					created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
				)
			`,
		},
		{
			ID:   5,
			Name: "create_users_table",
			SQL: `
				CREATE TABLE IF NOT EXISTS users (
					id BIGSERIAL PRIMARY KEY,
					username VARCHAR(100) NOT NULL UNIQUE,
					email VARCHAR(255) NOT NULL UNIQUE,
					password_hash VARCHAR(255) NOT NULL,
					created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
					updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
				)
			`,
		},
		{
			ID:   6,
			Name: "create_index_on_icon_tile_forecasts",
			SQL: `
				CREATE INDEX IF NOT EXISTS idx_icon_tile_forecasts_forecast_datetime 
				ON icon_tile_forecasts(forecast_datetime);
				
				CREATE INDEX IF NOT EXISTS idx_icon_tile_forecasts_run_date_cycle 
				ON icon_tile_forecasts(run_date, utc_cycle_time);
			`,
		},
		{
			ID:   7,
			Name: "create_geo_entities_table",
			SQL: `
				CREATE TABLE IF NOT EXISTS geo_entities (
					id BIGSERIAL PRIMARY KEY,
					name VARCHAR(255) NOT NULL,
					name_en VARCHAR(255),
					name_local VARCHAR(255),
					osm_id BIGINT,
					osm_type VARCHAR(50),
					entity_type VARCHAR(100) NOT NULL,
					admin_level INTEGER,
					parent_id BIGINT REFERENCES geo_entities(id) ON DELETE SET NULL,
					country_code VARCHAR(2),
					geometry GEOGRAPHY(GEOMETRY, 4326) NOT NULL,
					centroid GEOGRAPHY(POINT, 4326),
					properties JSONB,
					alt_names JSONB,
					timezone VARCHAR(100),
					population INTEGER,
					is_enabled BOOLEAN DEFAULT TRUE,
					created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
					updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
				)
			`,
		},
		{
			ID:   8,
			Name: "create_geo_entities_indices",
			SQL: `
				CREATE INDEX IF NOT EXISTS idx_geo_entities_name ON geo_entities(name);
				CREATE INDEX IF NOT EXISTS idx_geo_entities_name_en ON geo_entities(name_en);
				CREATE INDEX IF NOT EXISTS idx_geo_entities_entity_type ON geo_entities(entity_type);
				CREATE INDEX IF NOT EXISTS idx_geo_entities_admin_level ON geo_entities(admin_level);
				CREATE INDEX IF NOT EXISTS idx_geo_entities_country_code ON geo_entities(country_code);
				CREATE INDEX IF NOT EXISTS idx_geo_entities_parent_id ON geo_entities(parent_id);
				CREATE INDEX IF NOT EXISTS idx_geo_entities_osm_id ON geo_entities(osm_id);
				CREATE INDEX IF NOT EXISTS idx_geo_entities_geometry ON geo_entities USING GIST((geometry::geometry));
				CREATE INDEX IF NOT EXISTS idx_geo_entities_centroid ON geo_entities USING GIST((centroid::geometry));
			`,
		},
	}

	// Check which migrations have been applied
	for i := range migrations {
		var count int
		err := db.QueryRow("SELECT COUNT(*) FROM migrations WHERE name = $1", migrations[i].Name).Scan(&count)
		if err != nil {
			return fmt.Errorf("failed to check migration status: %w", err)
		}
		migrations[i].Applied = count > 0
	}

	// Apply unapplied migrations
	for _, migration := range migrations {
		if migration.Applied {
			log.Printf("Migration %d: %s already applied", migration.ID, migration.Name)
			continue
		}

		log.Printf("Applying migration %d: %s", migration.ID, migration.Name)
		
		// Start a transaction
		tx, err := db.Begin()
		if err != nil {
			return fmt.Errorf("failed to start transaction: %w", err)
		}

		// Execute migration
		_, err = tx.Exec(migration.SQL)
		if err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to apply migration %s: %w", migration.Name, err)
		}

		// Record migration
		_, err = tx.Exec("INSERT INTO migrations (name) VALUES ($1)", migration.Name)
		if err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to record migration %s: %w", migration.Name, err)
		}

		// Commit transaction
		if err := tx.Commit(); err != nil {
			return fmt.Errorf("failed to commit transaction: %w", err)
		}

		log.Printf("Migration %d: %s applied successfully", migration.ID, migration.Name)
	}

	log.Println("Database migrations completed successfully")
	return nil
}