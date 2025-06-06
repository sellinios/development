package models

import (
	"database/sql"
	"fmt"
	"time"
)

// ICONCell represents an ICON cell in the database
type ICONCell struct {
	ID        int64     `json:"id"`
	CellName  string    `json:"cell_name"`
	Boundary  string    `json:"-"` // Stores the WKT representation of the geography
	IsEnabled bool      `json:"is_enabled"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ICONCellRepository handles interactions with the icon_cells table
type ICONCellRepository struct {
	DB *sql.DB
}

// NewICONCellRepository creates a new ICONCellRepository
func NewICONCellRepository(db *sql.DB) *ICONCellRepository {
	return &ICONCellRepository{DB: db}
}

// FindAll returns all ICON cells
func (r *ICONCellRepository) FindAll() ([]ICONCell, error) {
	query := `
		SELECT id, cell_name, ST_AsText(boundary), is_enabled, created_at, updated_at
		FROM icon_cells
		ORDER BY cell_name
	`

	rows, err := r.DB.Query(query)
	if err != nil {
		return nil, fmt.Errorf("query icon cells: %w", err)
	}
	defer rows.Close()

	var cells []ICONCell
	for rows.Next() {
		var cell ICONCell
		if err := rows.Scan(
			&cell.ID,
			&cell.CellName,
			&cell.Boundary,
			&cell.IsEnabled,
			&cell.CreatedAt,
			&cell.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan icon cell: %w", err)
		}
		cells = append(cells, cell)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterating icon cells: %w", err)
	}

	return cells, nil
}

// FindByID returns a specific ICON cell by ID
func (r *ICONCellRepository) FindByID(id int64) (*ICONCell, error) {
	query := `
		SELECT id, cell_name, ST_AsText(boundary), is_enabled, created_at, updated_at
		FROM icon_cells
		WHERE id = $1
	`

	var cell ICONCell
	err := r.DB.QueryRow(query, id).Scan(
		&cell.ID,
		&cell.CellName,
		&cell.Boundary,
		&cell.IsEnabled,
		&cell.CreatedAt,
		&cell.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // No cell found
		}
		return nil, fmt.Errorf("query icon cell by id: %w", err)
	}

	return &cell, nil
}

// FindByName returns a specific ICON cell by name
func (r *ICONCellRepository) FindByName(name string) (*ICONCell, error) {
	query := `
		SELECT id, cell_name, ST_AsText(boundary), is_enabled, created_at, updated_at
		FROM icon_cells
		WHERE cell_name = $1
	`

	var cell ICONCell
	err := r.DB.QueryRow(query, name).Scan(
		&cell.ID,
		&cell.CellName,
		&cell.Boundary,
		&cell.IsEnabled,
		&cell.CreatedAt,
		&cell.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // No cell found
		}
		return nil, fmt.Errorf("query icon cell by name: %w", err)
	}

	return &cell, nil
}

// FindByCoordinates returns an ICON cell containing the given coordinates
func (r *ICONCellRepository) FindByCoordinates(lat, lng float64) (*ICONCell, error) {
	query := `
		SELECT id, cell_name, ST_AsText(boundary), is_enabled, created_at, updated_at
		FROM icon_cells
		WHERE ST_Contains(boundary::geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326))
	`

	var cell ICONCell
	err := r.DB.QueryRow(query, lng, lat).Scan( // Note: PostGIS uses longitude, latitude order
		&cell.ID,
		&cell.CellName,
		&cell.Boundary,
		&cell.IsEnabled,
		&cell.CreatedAt,
		&cell.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // No cell found
		}
		return nil, fmt.Errorf("query icon cell by coordinates: %w", err)
	}

	return &cell, nil
}

// Create adds a new ICON cell to the database
func (r *ICONCellRepository) Create(cell *ICONCell) error {
	query := `
		INSERT INTO icon_cells (cell_name, boundary, is_enabled)
		VALUES ($1, ST_GeogFromText($2), $3)
		RETURNING id, created_at, updated_at
	`

	err := r.DB.QueryRow(
		query,
		cell.CellName,
		cell.Boundary,
		cell.IsEnabled,
	).Scan(&cell.ID, &cell.CreatedAt, &cell.UpdatedAt)

	if err != nil {
		return fmt.Errorf("insert icon cell: %w", err)
	}

	return nil
}

// Update updates an existing ICON cell
func (r *ICONCellRepository) Update(cell *ICONCell) error {
	query := `
		UPDATE icon_cells
		SET cell_name = $1, boundary = ST_GeogFromText($2), is_enabled = $3, updated_at = NOW()
		WHERE id = $4
		RETURNING updated_at
	`

	err := r.DB.QueryRow(
		query,
		cell.CellName,
		cell.Boundary,
		cell.IsEnabled,
		cell.ID,
	).Scan(&cell.UpdatedAt)

	if err != nil {
		return fmt.Errorf("update icon cell: %w", err)
	}

	return nil
}

// Delete removes an ICON cell from the database
func (r *ICONCellRepository) Delete(id int64) error {
	query := `
		DELETE FROM icon_cells
		WHERE id = $1
	`

	result, err := r.DB.Exec(query, id)
	if err != nil {
		return fmt.Errorf("delete icon cell: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("checking affected rows: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("no icon cell found with id %d", id)
	}

	return nil
}