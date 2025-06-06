package handlers

import (
	"net/http"
	
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jinzhu/gorm"
	"intranet/internal/models"
)

// EntityHandler handles entity-related operations
type EntityHandler struct {
	db *gorm.DB
}

// NewEntityHandler creates a new entity handler
func NewEntityHandler(db *gorm.DB) *EntityHandler {
	return &EntityHandler{db: db}
}

// CreateEntityRequest represents the request to create a new entity
type CreateEntityRequest struct {
	ParentID    *uuid.UUID             `json:"parent_id"`
	Name        string                 `json:"name" binding:"required"`
	Code        string                 `json:"code" binding:"required"`
	Type        string                 `json:"type" binding:"required,oneof=company division department team"`
	Description string                 `json:"description"`
	Settings    models.EntitySettings  `json:"settings"`
}

// UpdateEntityRequest represents the request to update an entity
type UpdateEntityRequest struct {
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Active      *bool                  `json:"active"`
	Settings    models.EntitySettings  `json:"settings"`
}

// GetEntities retrieves all entities with optional filtering
func (h *EntityHandler) GetEntities(c *gin.Context) {
	var entities []models.Entity
	query := h.db.Preload("Parent").Preload("Creator")
	
	// Filter by parent_id
	if parentID := c.Query("parent_id"); parentID != "" {
		if parentID == "null" {
			query = query.Where("parent_id IS NULL")
		} else {
			query = query.Where("parent_id = ?", parentID)
		}
	}
	
	// Filter by type
	if entityType := c.Query("type"); entityType != "" {
		query = query.Where("type = ?", entityType)
	}
	
	// Filter by active status
	if active := c.Query("active"); active != "" {
		query = query.Where("active = ?", active == "true")
	}
	
	// Include children if requested
	if includeChildren := c.Query("include_children"); includeChildren == "true" {
		query = query.Preload("Children")
	}
	
	if err := query.Find(&entities).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch entities"})
		return
	}
	
	c.JSON(http.StatusOK, entities)
}

// GetEntity retrieves a single entity by ID
func (h *EntityHandler) GetEntity(c *gin.Context) {
	id := c.Param("id")
	entityID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid entity ID"})
		return
	}
	
	var entity models.Entity
	query := h.db.Preload("Parent").Preload("Creator").Preload("Children")
	
	if err := query.Where("id = ?", entityID).First(&entity).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Entity not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch entity"})
		return
	}
	
	c.JSON(http.StatusOK, entity)
}

// CreateEntity creates a new entity
func (h *EntityHandler) CreateEntity(c *gin.Context) {
	var req CreateEntityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}
	
	creatorID := userID.(uint)
	
	// Validate parent exists if provided
	if req.ParentID != nil {
		var parent models.Entity
		if err := h.db.Where("id = ?", req.ParentID).First(&parent).Error; err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Parent entity not found"})
			return
		}
	}
	
	entity := models.Entity{
		ParentID:    req.ParentID,
		Name:        req.Name,
		Code:        req.Code,
		Type:        req.Type,
		Description: req.Description,
		Settings:    req.Settings,
		CreatedBy:   &creatorID,
	}
	
	if entity.Settings == nil {
		entity.Settings = make(models.EntitySettings)
	}
	
	// Start transaction
	tx := h.db.Begin()
	
	if err := tx.Create(&entity).Error; err != nil {
		tx.Rollback()
		if err.Error() == "UNIQUE constraint failed: entities.code" {
			c.JSON(http.StatusConflict, gin.H{"error": "Entity code already exists"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create entity"})
		return
	}
	
	// Create audit log
	auditLog := models.EntityAuditLog{
		EntityID:  &entity.ID,
		UserID:    &creatorID,
		Action:    "create",
		Changes:   map[string]interface{}{"entity": entity},
		IPAddress: c.ClientIP(),
		UserAgent: c.Request.UserAgent(),
	}
	
	if err := tx.Create(&auditLog).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create audit log"})
		return
	}
	
	tx.Commit()
	
	// Reload with associations
	h.db.Preload("Parent").Preload("Creator").First(&entity, entity.ID)
	
	c.JSON(http.StatusCreated, entity)
}

// UpdateEntity updates an existing entity
func (h *EntityHandler) UpdateEntity(c *gin.Context) {
	id := c.Param("id")
	entityID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid entity ID"})
		return
	}
	
	var req UpdateEntityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Get user ID from context
	userID, _ := c.Get("userID")
	updaterID := userID.(uint)
	
	var entity models.Entity
	if err := h.db.Where("id = ?", entityID).First(&entity).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Entity not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch entity"})
		return
	}
	
	// Track changes for audit log
	changes := make(map[string]interface{})
	
	if req.Name != "" && req.Name != entity.Name {
		changes["name"] = map[string]interface{}{"old": entity.Name, "new": req.Name}
		entity.Name = req.Name
	}
	
	if req.Description != entity.Description {
		changes["description"] = map[string]interface{}{"old": entity.Description, "new": req.Description}
		entity.Description = req.Description
	}
	
	if req.Active != nil && *req.Active != entity.Active {
		changes["active"] = map[string]interface{}{"old": entity.Active, "new": *req.Active}
		entity.Active = *req.Active
	}
	
	if req.Settings != nil {
		changes["settings"] = map[string]interface{}{"old": entity.Settings, "new": req.Settings}
		entity.Settings = req.Settings
	}
	
	if len(changes) == 0 {
		c.JSON(http.StatusOK, gin.H{"message": "No changes to update"})
		return
	}
	
	// Start transaction
	tx := h.db.Begin()
	
	if err := tx.Save(&entity).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update entity"})
		return
	}
	
	// Create audit log
	auditLog := models.EntityAuditLog{
		EntityID:  &entity.ID,
		UserID:    &updaterID,
		Action:    "update",
		Changes:   changes,
		IPAddress: c.ClientIP(),
		UserAgent: c.Request.UserAgent(),
	}
	
	if err := tx.Create(&auditLog).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create audit log"})
		return
	}
	
	tx.Commit()
	
	// Reload with associations
	h.db.Preload("Parent").Preload("Creator").First(&entity, entity.ID)
	
	c.JSON(http.StatusOK, entity)
}

// DeleteEntity deletes an entity
func (h *EntityHandler) DeleteEntity(c *gin.Context) {
	id := c.Param("id")
	entityID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid entity ID"})
		return
	}
	
	// Get user ID from context
	userID, _ := c.Get("userID")
	deleterID := userID.(uint)
	
	// Check if entity has children
	var childCount int64
	h.db.Model(&models.Entity{}).Where("parent_id = ?", entityID).Count(&childCount)
	if childCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete entity with children"})
		return
	}
	
	// Check if entity has users
	var userCount int64
	h.db.Model(&models.UserEntity{}).Where("entity_id = ?", entityID).Count(&userCount)
	if userCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete entity with assigned users"})
		return
	}
	
	var entity models.Entity
	if err := h.db.Where("id = ?", entityID).First(&entity).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Entity not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch entity"})
		return
	}
	
	// Start transaction
	tx := h.db.Begin()
	
	// Create audit log before deletion
	auditLog := models.EntityAuditLog{
		EntityID:  &entity.ID,
		UserID:    &deleterID,
		Action:    "delete",
		Changes:   map[string]interface{}{"entity": entity},
		IPAddress: c.ClientIP(),
		UserAgent: c.Request.UserAgent(),
	}
	
	if err := tx.Create(&auditLog).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create audit log"})
		return
	}
	
	if err := tx.Delete(&entity).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete entity"})
		return
	}
	
	tx.Commit()
	
	c.JSON(http.StatusOK, gin.H{"message": "Entity deleted successfully"})
}

// GetEntityHierarchy retrieves the full hierarchy path for an entity
func (h *EntityHandler) GetEntityHierarchy(c *gin.Context) {
	id := c.Param("id")
	entityID, err := uuid.Parse(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid entity ID"})
		return
	}
	
	var entity models.Entity
	if err := h.db.Where("id = ?", entityID).First(&entity).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Entity not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch entity"})
		return
	}
	
	path, err := entity.GetPath(h.db)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get entity path"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"entity": entity,
		"path":   path,
	})
}

// GetEntityTree is now implemented in entity_tree_fix.go to handle integer IDs
// func (h *EntityHandler) GetEntityTree(c *gin.Context) {
// 	// Build tree starting from root entities
// 	var rootEntities []models.Entity
// 	if err := h.db.Where("parent_id IS NULL").Preload("Children").Find(&rootEntities).Error; err != nil {
// 		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch entity tree"})
// 		return
// 	}
// 	
// 	// Recursively load all children
// 	var loadChildren func(entities []models.Entity)
// 	loadChildren = func(entities []models.Entity) {
// 		for i := range entities {
// 			h.db.Preload("Children").Find(&entities[i].Children, "parent_id = ?", entities[i].ID)
// 			if len(entities[i].Children) > 0 {
// 				loadChildren(entities[i].Children)
// 			}
// 		}
// 	}
// 	
// 	loadChildren(rootEntities)
// 	
// 	c.JSON(http.StatusOK, rootEntities)
// }