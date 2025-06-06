package models

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"
)

// GeoEntity represents a geographic entity such as a country, city, or other place
type GeoEntity struct {
	ID           int64           `json:"id"`
	Name         string          `json:"name"`
	NameEN       sql.NullString  `json:"name_en,omitempty"`
	NameLocal    sql.NullString  `json:"name_local,omitempty"`
	OSMID        sql.NullInt64   `json:"osm_id,omitempty"`
	OSMType      sql.NullString  `json:"osm_type,omitempty"`
	EntityType   string          `json:"entity_type"`
	AdminLevel   sql.NullInt32   `json:"admin_level,omitempty"`
	ParentID     sql.NullInt64   `json:"parent_id,omitempty"`
	CountryCode  sql.NullString  `json:"country_code,omitempty"`
	Geometry     string          `json:"-"` // WKT representation of geography
	GeometryJSON json.RawMessage `json:"geometry,omitempty"`
	Centroid     sql.NullString  `json:"-"` // WKT representation of point
	CentroidJSON json.RawMessage `json:"centroid,omitempty"`
	Properties   json.RawMessage `json:"properties,omitempty"`
	AltNames     json.RawMessage `json:"alt_names,omitempty"`
	Timezone     sql.NullString  `json:"timezone,omitempty"`
	Population   sql.NullInt32   `json:"population,omitempty"`
	IsEnabled    bool            `json:"is_enabled"`
	CreatedAt    time.Time       `json:"created_at"`
	UpdatedAt    time.Time       `json:"updated_at"`
}

// GeoEntityRepository handles interactions with the geo_entities table
type GeoEntityRepository struct {
	DB *sql.DB
}

// NewGeoEntityRepository creates a new GeoEntityRepository
func NewGeoEntityRepository(db *sql.DB) *GeoEntityRepository {
	return &GeoEntityRepository{DB: db}
}

// FindAll returns all geographic entities
func (r *GeoEntityRepository) FindAll(limit, offset int) ([]GeoEntity, error) {
	query := `
		SELECT 
			id, name, name_en, name_local, osm_id, osm_type, entity_type, 
			admin_level, parent_id, country_code, 
			ST_AsText(geometry) as geometry, ST_AsGeoJSON(geometry) as geometry_json,
			ST_AsText(centroid) as centroid, ST_AsGeoJSON(centroid) as centroid_json,
			properties, alt_names, timezone, population, is_enabled, created_at, updated_at
		FROM geo_entities
		ORDER BY name
		LIMIT $1 OFFSET $2
	`

	rows, err := r.DB.Query(query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("query geo entities: %w", err)
	}
	defer rows.Close()

	var entities []GeoEntity
	for rows.Next() {
		var entity GeoEntity
		var geomJSON, centroidJSON sql.NullString
		if err := rows.Scan(
			&entity.ID, &entity.Name, &entity.NameEN, &entity.NameLocal,
			&entity.OSMID, &entity.OSMType, &entity.EntityType,
			&entity.AdminLevel, &entity.ParentID, &entity.CountryCode,
			&entity.Geometry, &geomJSON, &entity.Centroid, &centroidJSON,
			&entity.Properties, &entity.AltNames, &entity.Timezone,
			&entity.Population, &entity.IsEnabled, &entity.CreatedAt, &entity.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan geo entity: %w", err)
		}

		if geomJSON.Valid {
			entity.GeometryJSON = json.RawMessage(geomJSON.String)
		}

		if centroidJSON.Valid {
			entity.CentroidJSON = json.RawMessage(centroidJSON.String)
		}

		entities = append(entities, entity)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterating geo entities: %w", err)
	}

	return entities, nil
}

// FindByID returns a specific geographic entity by ID
func (r *GeoEntityRepository) FindByID(id int64) (*GeoEntity, error) {
	query := `
		SELECT 
			id, name, name_en, name_local, osm_id, osm_type, entity_type, 
			admin_level, parent_id, country_code, 
			ST_AsText(geometry) as geometry, ST_AsGeoJSON(geometry) as geometry_json,
			ST_AsText(centroid) as centroid, ST_AsGeoJSON(centroid) as centroid_json,
			properties, alt_names, timezone, population, is_enabled, created_at, updated_at
		FROM geo_entities
		WHERE id = $1
	`

	var entity GeoEntity
	var geomJSON, centroidJSON sql.NullString
	err := r.DB.QueryRow(query, id).Scan(
		&entity.ID, &entity.Name, &entity.NameEN, &entity.NameLocal,
		&entity.OSMID, &entity.OSMType, &entity.EntityType,
		&entity.AdminLevel, &entity.ParentID, &entity.CountryCode,
		&entity.Geometry, &geomJSON, &entity.Centroid, &centroidJSON,
		&entity.Properties, &entity.AltNames, &entity.Timezone,
		&entity.Population, &entity.IsEnabled, &entity.CreatedAt, &entity.UpdatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil // No entity found
		}
		return nil, fmt.Errorf("query geo entity by id: %w", err)
	}

	if geomJSON.Valid {
		entity.GeometryJSON = json.RawMessage(geomJSON.String)
	}

	if centroidJSON.Valid {
		entity.CentroidJSON = json.RawMessage(centroidJSON.String)
	}

	return &entity, nil
}

// FindByName searches for geographic entities by name
func (r *GeoEntityRepository) FindByName(name string, limit int) ([]GeoEntity, error) {
	query := `
		SELECT 
			id, name, name_en, name_local, osm_id, osm_type, entity_type, 
			admin_level, parent_id, country_code, 
			ST_AsText(geometry) as geometry, ST_AsGeoJSON(geometry) as geometry_json,
			ST_AsText(centroid) as centroid, ST_AsGeoJSON(centroid) as centroid_json,
			properties, alt_names, timezone, population, is_enabled, created_at, updated_at
		FROM geo_entities
		WHERE 
			name ILIKE $1 OR 
			name_en ILIKE $1 OR 
			name_local ILIKE $1 OR
			alt_names::text ILIKE $1
		ORDER BY 
			CASE WHEN name ILIKE $2 THEN 0
				 WHEN name ILIKE $1 THEN 1
				 WHEN name_en ILIKE $2 THEN 2
				 WHEN name_en ILIKE $1 THEN 3
				 WHEN name_local ILIKE $2 THEN 4
				 WHEN name_local ILIKE $1 THEN 5
				 ELSE 6
			END,
			population DESC NULLS LAST
		LIMIT $3
	`

	rows, err := r.DB.Query(query, "%"+name+"%", name, limit)
	if err != nil {
		return nil, fmt.Errorf("search geo entities by name: %w", err)
	}
	defer rows.Close()

	var entities []GeoEntity
	for rows.Next() {
		var entity GeoEntity
		var geomJSON, centroidJSON sql.NullString
		if err := rows.Scan(
			&entity.ID, &entity.Name, &entity.NameEN, &entity.NameLocal,
			&entity.OSMID, &entity.OSMType, &entity.EntityType,
			&entity.AdminLevel, &entity.ParentID, &entity.CountryCode,
			&entity.Geometry, &geomJSON, &entity.Centroid, &centroidJSON,
			&entity.Properties, &entity.AltNames, &entity.Timezone,
			&entity.Population, &entity.IsEnabled, &entity.CreatedAt, &entity.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan geo entity: %w", err)
		}

		if geomJSON.Valid {
			entity.GeometryJSON = json.RawMessage(geomJSON.String)
		}

		if centroidJSON.Valid {
			entity.CentroidJSON = json.RawMessage(centroidJSON.String)
		}

		entities = append(entities, entity)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterating geo entities: %w", err)
	}

	return entities, nil
}

// FindByCoordinates finds geographic entities that contain the given coordinates
func (r *GeoEntityRepository) FindByCoordinates(lat, lng float64, limit int) ([]GeoEntity, error) {
	// Optimized query that uses the spatial index and only gets the most relevant entities
	// 1. Uses ST_DWithin with a small radius for faster initial filtering
	// 2. Then applies ST_Contains only on the filtered subset
	// 3. Gets only essential fields in the first query
	// 4. Fetches full data only for the limited set of matching entities
	
	// First, find matching entity IDs using a fast query with minimal fields
	fastQuery := `
		WITH candidate_entities AS (
			SELECT id
			FROM geo_entities
			WHERE ST_DWithin(
				geometry::geography, 
				ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
				1000, -- 1km initial search radius
				false
			)
			ORDER BY 
				ST_Distance(
					geometry::geography, 
					ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
				)
			LIMIT 100 -- Pre-filter to a reasonable number for the more expensive contains check
		)
		SELECT id
		FROM candidate_entities ce
		JOIN geo_entities ge ON ce.id = ge.id
		WHERE ST_Contains(ge.geometry::geometry, ST_SetSRID(ST_MakePoint($1, $2), 4326))
		ORDER BY admin_level DESC, population DESC NULLS LAST
		LIMIT $3
	`
	
	// Execute the fast query to get IDs
	idRows, err := r.DB.Query(fastQuery, lng, lat, limit) // Note: PostGIS uses longitude, latitude order
	if err != nil {
		return nil, fmt.Errorf("query geo entities by coordinates (fast query): %w", err)
	}
	
	// Collect matching entity IDs
	var entityIDs []int64
	for idRows.Next() {
		var id int64
		if err := idRows.Scan(&id); err != nil {
			idRows.Close()
			return nil, fmt.Errorf("scan entity ID: %w", err)
		}
		entityIDs = append(entityIDs, id)
	}
	idRows.Close()
	
	if err := idRows.Err(); err != nil {
		return nil, fmt.Errorf("iterating entity IDs: %w", err)
	}
	
	// If no entities found, return empty array
	if len(entityIDs) == 0 {
		return []GeoEntity{}, nil
	}
	
	// Now fetch full entity data for the matched IDs
	// Build a query with the collected IDs
	// Create placeholder string like $1,$2,$3 for the IN clause
	placeholders := make([]string, len(entityIDs))
	args := make([]interface{}, len(entityIDs))
	for i, id := range entityIDs {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
		args[i] = id
	}
	
	detailQuery := fmt.Sprintf(`
		SELECT 
			id, name, name_en, name_local, osm_id, osm_type, entity_type, 
			admin_level, parent_id, country_code, 
			ST_AsText(geometry) as geometry, ST_AsGeoJSON(geometry) as geometry_json,
			ST_AsText(centroid) as centroid, ST_AsGeoJSON(centroid) as centroid_json,
			properties, alt_names, timezone, population, is_enabled, created_at, updated_at
		FROM geo_entities
		WHERE id IN (%s)
		ORDER BY admin_level DESC, population DESC NULLS LAST
	`, strings.Join(placeholders, ","))
	
	// Execute the detail query
	rows, err := r.DB.Query(detailQuery, args...)
	if err != nil {
		return nil, fmt.Errorf("query geo entities by IDs: %w", err)
	}
	defer rows.Close()
	
	// Process the results
	var entities []GeoEntity
	for rows.Next() {
		var entity GeoEntity
		var geomJSON, centroidJSON sql.NullString
		if err := rows.Scan(
			&entity.ID, &entity.Name, &entity.NameEN, &entity.NameLocal,
			&entity.OSMID, &entity.OSMType, &entity.EntityType,
			&entity.AdminLevel, &entity.ParentID, &entity.CountryCode,
			&entity.Geometry, &geomJSON, &entity.Centroid, &centroidJSON,
			&entity.Properties, &entity.AltNames, &entity.Timezone,
			&entity.Population, &entity.IsEnabled, &entity.CreatedAt, &entity.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan geo entity: %w", err)
		}

		if geomJSON.Valid {
			entity.GeometryJSON = json.RawMessage(geomJSON.String)
		}

		if centroidJSON.Valid {
			entity.CentroidJSON = json.RawMessage(centroidJSON.String)
		}

		entities = append(entities, entity)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterating geo entities: %w", err)
	}

	return entities, nil
}

// FindByType returns geographic entities of a specific type
func (r *GeoEntityRepository) FindByType(entityType string, limit, offset int) ([]GeoEntity, error) {
	query := `
		SELECT 
			id, name, name_en, name_local, osm_id, osm_type, entity_type, 
			admin_level, parent_id, country_code, 
			ST_AsText(geometry) as geometry, ST_AsGeoJSON(geometry) as geometry_json,
			ST_AsText(centroid) as centroid, ST_AsGeoJSON(centroid) as centroid_json,
			properties, alt_names, timezone, population, is_enabled, created_at, updated_at
		FROM geo_entities
		WHERE entity_type = $1
		ORDER BY population DESC NULLS LAST, name
		LIMIT $2 OFFSET $3
	`

	rows, err := r.DB.Query(query, entityType, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("query geo entities by type: %w", err)
	}
	defer rows.Close()

	var entities []GeoEntity
	for rows.Next() {
		var entity GeoEntity
		var geomJSON, centroidJSON sql.NullString
		if err := rows.Scan(
			&entity.ID, &entity.Name, &entity.NameEN, &entity.NameLocal,
			&entity.OSMID, &entity.OSMType, &entity.EntityType,
			&entity.AdminLevel, &entity.ParentID, &entity.CountryCode,
			&entity.Geometry, &geomJSON, &entity.Centroid, &centroidJSON,
			&entity.Properties, &entity.AltNames, &entity.Timezone,
			&entity.Population, &entity.IsEnabled, &entity.CreatedAt, &entity.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan geo entity: %w", err)
		}

		if geomJSON.Valid {
			entity.GeometryJSON = json.RawMessage(geomJSON.String)
		}

		if centroidJSON.Valid {
			entity.CentroidJSON = json.RawMessage(centroidJSON.String)
		}

		entities = append(entities, entity)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterating geo entities: %w", err)
	}

	return entities, nil
}

// FindChildren returns child entities of a parent entity
func (r *GeoEntityRepository) FindChildren(parentID int64) ([]GeoEntity, error) {
	query := `
		SELECT 
			id, name, name_en, name_local, osm_id, osm_type, entity_type, 
			admin_level, parent_id, country_code, 
			ST_AsText(geometry) as geometry, ST_AsGeoJSON(geometry) as geometry_json,
			ST_AsText(centroid) as centroid, ST_AsGeoJSON(centroid) as centroid_json,
			properties, alt_names, timezone, population, is_enabled, created_at, updated_at
		FROM geo_entities
		WHERE parent_id = $1
		ORDER BY admin_level, name
	`

	rows, err := r.DB.Query(query, parentID)
	if err != nil {
		return nil, fmt.Errorf("query children geo entities: %w", err)
	}
	defer rows.Close()

	var entities []GeoEntity
	for rows.Next() {
		var entity GeoEntity
		var geomJSON, centroidJSON sql.NullString
		if err := rows.Scan(
			&entity.ID, &entity.Name, &entity.NameEN, &entity.NameLocal,
			&entity.OSMID, &entity.OSMType, &entity.EntityType,
			&entity.AdminLevel, &entity.ParentID, &entity.CountryCode,
			&entity.Geometry, &geomJSON, &entity.Centroid, &centroidJSON,
			&entity.Properties, &entity.AltNames, &entity.Timezone,
			&entity.Population, &entity.IsEnabled, &entity.CreatedAt, &entity.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("scan geo entity: %w", err)
		}

		if geomJSON.Valid {
			entity.GeometryJSON = json.RawMessage(geomJSON.String)
		}

		if centroidJSON.Valid {
			entity.CentroidJSON = json.RawMessage(centroidJSON.String)
		}

		entities = append(entities, entity)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("iterating geo entities: %w", err)
	}

	return entities, nil
}

// Create adds a new geographic entity to the database
func (r *GeoEntityRepository) Create(entity *GeoEntity) error {
	query := `
		INSERT INTO geo_entities (
			name, name_en, name_local, osm_id, osm_type, entity_type, admin_level,
			parent_id, country_code, geometry, centroid, properties, alt_names,
			timezone, population, is_enabled
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, 
			ST_GeogFromText($10), 
			CASE WHEN $11 = '' THEN NULL ELSE ST_GeogFromText($11) END,
			$12, $13, $14, $15, $16
		)
		RETURNING id, created_at, updated_at
	`

	err := r.DB.QueryRow(
		query,
		entity.Name, entity.NameEN, entity.NameLocal,
		entity.OSMID, entity.OSMType, entity.EntityType,
		entity.AdminLevel, entity.ParentID, entity.CountryCode,
		entity.Geometry,
		entity.Centroid.String, // If null, empty string will be passed
		entity.Properties, entity.AltNames,
		entity.Timezone, entity.Population, entity.IsEnabled,
	).Scan(&entity.ID, &entity.CreatedAt, &entity.UpdatedAt)

	if err != nil {
		return fmt.Errorf("insert geo entity: %w", err)
	}

	return nil
}

// Update updates an existing geographic entity
func (r *GeoEntityRepository) Update(entity *GeoEntity) error {
	query := `
		UPDATE geo_entities
		SET 
			name = $1, 
			name_en = $2, 
			name_local = $3, 
			osm_id = $4, 
			osm_type = $5, 
			entity_type = $6,
			admin_level = $7,
			parent_id = $8,
			country_code = $9,
			geometry = ST_GeogFromText($10),
			centroid = CASE WHEN $11 = '' THEN NULL ELSE ST_GeogFromText($11) END,
			properties = $12,
			alt_names = $13,
			timezone = $14,
			population = $15,
			is_enabled = $16,
			updated_at = NOW()
		WHERE id = $17
		RETURNING updated_at
	`

	err := r.DB.QueryRow(
		query,
		entity.Name, entity.NameEN, entity.NameLocal,
		entity.OSMID, entity.OSMType, entity.EntityType,
		entity.AdminLevel, entity.ParentID, entity.CountryCode,
		entity.Geometry,
		entity.Centroid.String, // If null, empty string will be passed
		entity.Properties, entity.AltNames,
		entity.Timezone, entity.Population, entity.IsEnabled,
		entity.ID,
	).Scan(&entity.UpdatedAt)

	if err != nil {
		return fmt.Errorf("update geo entity: %w", err)
	}

	return nil
}

// Delete removes a geographic entity from the database
func (r *GeoEntityRepository) Delete(id int64) error {
	query := `
		DELETE FROM geo_entities
		WHERE id = $1
	`

	result, err := r.DB.Exec(query, id)
	if err != nil {
		return fmt.Errorf("delete geo entity: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("checking affected rows: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("no geo entity found with id %d", id)
	}

	return nil
}

// BatchCreate adds multiple geographic entities to the database in a single transaction
func (r *GeoEntityRepository) BatchCreate(entities []GeoEntity) error {
	tx, err := r.DB.Begin()
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback()

	stmt, err := tx.Prepare(`
		INSERT INTO geo_entities (
			name, name_en, name_local, osm_id, osm_type, entity_type, admin_level,
			parent_id, country_code, geometry, centroid, properties, alt_names,
			timezone, population, is_enabled
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, 
			ST_GeogFromText($10), 
			CASE WHEN $11 = '' THEN NULL ELSE ST_GeogFromText($11) END,
			$12, $13, $14, $15, $16
		)
		ON CONFLICT (osm_id, osm_type) 
		DO UPDATE SET 
			name = EXCLUDED.name,
			name_en = EXCLUDED.name_en,
			name_local = EXCLUDED.name_local,
			entity_type = EXCLUDED.entity_type,
			admin_level = EXCLUDED.admin_level,
			parent_id = EXCLUDED.parent_id,
			country_code = EXCLUDED.country_code,
			geometry = EXCLUDED.geometry,
			centroid = EXCLUDED.centroid,
			properties = EXCLUDED.properties,
			alt_names = EXCLUDED.alt_names,
			timezone = EXCLUDED.timezone,
			population = EXCLUDED.population,
			is_enabled = EXCLUDED.is_enabled,
			updated_at = NOW()
	`)
	if err != nil {
		return fmt.Errorf("prepare statement: %w", err)
	}
	defer stmt.Close()

	for i := range entities {
		_, err = stmt.Exec(
			entities[i].Name, entities[i].NameEN, entities[i].NameLocal,
			entities[i].OSMID, entities[i].OSMType, entities[i].EntityType,
			entities[i].AdminLevel, entities[i].ParentID, entities[i].CountryCode,
			entities[i].Geometry,
			entities[i].Centroid.String, // If null, empty string will be passed
			entities[i].Properties, entities[i].AltNames,
			entities[i].Timezone, entities[i].Population, entities[i].IsEnabled,
		)
		if err != nil {
			return fmt.Errorf("insert geo entity: %w", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("commit transaction: %w", err)
	}

	return nil
}
