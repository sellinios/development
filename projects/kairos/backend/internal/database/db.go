package database

import (
	"database/sql"
	"fmt"
	"log"

	"github.com/sellinios/aethra/internal/config"
	_ "github.com/lib/pq" // PostgreSQL driver
)

// DB encapsulates the database connection
type DB struct {
	*sql.DB
}

// NewDBConnection establishes and returns a database connection
func NewDBConnection(cfg *config.Config) (*DB, error) {
	connStr := fmt.Sprintf(
		"host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		cfg.Database.Host,
		cfg.Database.Port,
		cfg.Database.User,
		cfg.Database.Password,
		cfg.Database.Name,
		cfg.Database.SSLMode,
	)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Println("Successfully connected to database")
	return &DB{db}, nil
}

// Close closes the database connection
func (db *DB) Close() error {
	return db.DB.Close()
}