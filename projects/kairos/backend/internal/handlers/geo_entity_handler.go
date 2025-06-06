package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/sellinios/aethra/internal/models"
)

// GeoEntityHandler handles requests related to geographic entities
type GeoEntityHandler struct {
	DB *sql.DB
}

// NewGeoEntityHandler creates a new GeoEntityHandler
func NewGeoEntityHandler(db *sql.DB) *GeoEntityHandler {
	return &GeoEntityHandler{DB: db}
}

// GetEntities returns geographic entities with pagination
func (h *GeoEntityHandler) GetEntities(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract pagination parameters from URL query
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	limit := 100 // Default limit
	if limitStr != "" {
		parsedLimit, err := strconv.Atoi(limitStr)
		if err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
		if limit > 1000 {
			limit = 1000 // Max limit
		}
	}

	offset := 0 // Default offset
	if offsetStr != "" {
		parsedOffset, err := strconv.Atoi(offsetStr)
		if err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	repo := models.NewGeoEntityRepository(h.DB)
	entities, err := repo.FindAll(limit, offset)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	h.sendJSON(w, map[string]interface{}{
		"results": entities,
		"limit":   limit,
		"offset":  offset,
		"count":   len(entities),
	})
}

// GetEntityByID returns a specific geographic entity by ID
func (h *GeoEntityHandler) GetEntityByID(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract ID from URL query parameters
	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		http.Error(w, "Missing id parameter", http.StatusBadRequest)
		return
	}

	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid id parameter", http.StatusBadRequest)
		return
	}

	repo := models.NewGeoEntityRepository(h.DB)
	entity, err := repo.FindByID(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if entity == nil {
		http.Error(w, "Entity not found", http.StatusNotFound)
		return
	}

	h.sendJSON(w, entity)
}

// SearchEntities searches for geographic entities by name
func (h *GeoEntityHandler) SearchEntities(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract search parameters from URL query
	query := r.URL.Query().Get("q")
	if query == "" {
		http.Error(w, "Missing q parameter", http.StatusBadRequest)
		return
	}

	limitStr := r.URL.Query().Get("limit")
	limit := 20 // Default limit
	if limitStr != "" {
		parsedLimit, err := strconv.Atoi(limitStr)
		if err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
		if limit > 100 {
			limit = 100 // Max limit for search
		}
	}

	repo := models.NewGeoEntityRepository(h.DB)
	entities, err := repo.FindByName(query, limit)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	h.sendJSON(w, map[string]interface{}{
		"results": entities,
		"query":   query,
		"count":   len(entities),
	})
}

// GetEntitiesByCoordinates returns geographic entities at specific coordinates
func (h *GeoEntityHandler) GetEntitiesByCoordinates(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract coordinates from URL query parameters
	latStr := r.URL.Query().Get("lat")
	lngStr := r.URL.Query().Get("lng")
	if latStr == "" || lngStr == "" {
		http.Error(w, "Missing lat or lng parameters", http.StatusBadRequest)
		return
	}

	lat, err := strconv.ParseFloat(latStr, 64)
	if err != nil {
		http.Error(w, "Invalid lat parameter", http.StatusBadRequest)
		return
	}

	lng, err := strconv.ParseFloat(lngStr, 64)
	if err != nil {
		http.Error(w, "Invalid lng parameter", http.StatusBadRequest)
		return
	}

	limitStr := r.URL.Query().Get("limit")
	limit := 10 // Default limit
	if limitStr != "" {
		parsedLimit, err := strconv.Atoi(limitStr)
		if err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
		if limit > 50 {
			limit = 50 // Max limit for coordinates search
		}
	}

	repo := models.NewGeoEntityRepository(h.DB)
	entities, err := repo.FindByCoordinates(lat, lng, limit)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if len(entities) == 0 {
		http.Error(w, "No entities found at these coordinates", http.StatusNotFound)
		return
	}

	h.sendJSON(w, map[string]interface{}{
		"results": entities,
		"lat":     lat,
		"lng":     lng,
		"count":   len(entities),
	})
}

// GetEntitiesByType returns geographic entities of a specific type
func (h *GeoEntityHandler) GetEntitiesByType(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract type from URL query parameters
	entityType := r.URL.Query().Get("type")
	if entityType == "" {
		http.Error(w, "Missing type parameter", http.StatusBadRequest)
		return
	}

	// Extract pagination parameters from URL query
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	limit := 100 // Default limit
	if limitStr != "" {
		parsedLimit, err := strconv.Atoi(limitStr)
		if err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
		if limit > 1000 {
			limit = 1000 // Max limit
		}
	}

	offset := 0 // Default offset
	if offsetStr != "" {
		parsedOffset, err := strconv.Atoi(offsetStr)
		if err == nil && parsedOffset >= 0 {
			offset = parsedOffset
		}
	}

	repo := models.NewGeoEntityRepository(h.DB)
	entities, err := repo.FindByType(entityType, limit, offset)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	h.sendJSON(w, map[string]interface{}{
		"results": entities,
		"type":    entityType,
		"limit":   limit,
		"offset":  offset,
		"count":   len(entities),
	})
}

// GetChildEntities returns child entities of a parent entity
func (h *GeoEntityHandler) GetChildEntities(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract parent ID from URL query parameters
	parentIDStr := r.URL.Query().Get("parent_id")
	if parentIDStr == "" {
		http.Error(w, "Missing parent_id parameter", http.StatusBadRequest)
		return
	}

	parentID, err := strconv.ParseInt(parentIDStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid parent_id parameter", http.StatusBadRequest)
		return
	}

	repo := models.NewGeoEntityRepository(h.DB)
	entities, err := repo.FindChildren(parentID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	h.sendJSON(w, map[string]interface{}{
		"results":   entities,
		"parent_id": parentID,
		"count":     len(entities),
	})
}

// CreateEntity creates a new geographic entity
func (h *GeoEntityHandler) CreateEntity(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse request body
	var entity models.GeoEntity
	err := json.NewDecoder(r.Body).Decode(&entity)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if entity.Name == "" {
		http.Error(w, "Name is required", http.StatusBadRequest)
		return
	}
	if entity.EntityType == "" {
		http.Error(w, "Entity type is required", http.StatusBadRequest)
		return
	}
	if entity.Geometry == "" {
		http.Error(w, "Geometry is required", http.StatusBadRequest)
		return
	}

	repo := models.NewGeoEntityRepository(h.DB)
	err = repo.Create(&entity)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	h.sendJSON(w, entity)
}

// UpdateEntity updates an existing geographic entity
func (h *GeoEntityHandler) UpdateEntity(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut && r.Method != http.MethodPatch {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract ID from URL query parameters
	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		http.Error(w, "Missing id parameter", http.StatusBadRequest)
		return
	}

	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid id parameter", http.StatusBadRequest)
		return
	}

	// Get existing entity
	repo := models.NewGeoEntityRepository(h.DB)
	existingEntity, err := repo.FindByID(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if existingEntity == nil {
		http.Error(w, "Entity not found", http.StatusNotFound)
		return
	}

	// Parse request body
	var updatedEntity models.GeoEntity
	err = json.NewDecoder(r.Body).Decode(&updatedEntity)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Update entity fields
	updatedEntity.ID = id
	if updatedEntity.Name == "" {
		updatedEntity.Name = existingEntity.Name
	}
	if updatedEntity.EntityType == "" {
		updatedEntity.EntityType = existingEntity.EntityType
	}
	if updatedEntity.Geometry == "" {
		updatedEntity.Geometry = existingEntity.Geometry
	}

	err = repo.Update(&updatedEntity)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	h.sendJSON(w, updatedEntity)
}

// DeleteEntity deletes a geographic entity
func (h *GeoEntityHandler) DeleteEntity(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Extract ID from URL query parameters
	idStr := r.URL.Query().Get("id")
	if idStr == "" {
		http.Error(w, "Missing id parameter", http.StatusBadRequest)
		return
	}

	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		http.Error(w, "Invalid id parameter", http.StatusBadRequest)
		return
	}

	repo := models.NewGeoEntityRepository(h.DB)
	err = repo.Delete(id)
	if err != nil {
		if strings.Contains(err.Error(), "no geo entity found") {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Helper method to send JSON response with proper formatting
func (h *GeoEntityHandler) sendJSON(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	
	// Pretty print JSON for better readability
	jsonData, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
	
	w.Write(jsonData)
}