package handlers

import (
	"net/http"
	"time"
	
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jinzhu/gorm"
	"intranet/internal/models"
)

// UserEntityHandler handles user-entity relationship operations
type UserEntityHandler struct {
	db *gorm.DB
}

// NewUserEntityHandler creates a new user-entity handler
func NewUserEntityHandler(db *gorm.DB) *UserEntityHandler {
	return &UserEntityHandler{db: db}
}

// AssignUserRequest represents the request to assign a user to an entity
type AssignUserRequest struct {
	UserID    uint   `json:"user_id" binding:"required"`
	Role      string `json:"role" binding:"required,oneof=admin manager member viewer"`
	IsPrimary bool   `json:"is_primary"`
}

// UpdateUserEntityRequest represents the request to update a user-entity relationship
type UpdateUserEntityRequest struct {
	Role      string `json:"role" binding:"oneof=admin manager member viewer"`
	IsPrimary *bool  `json:"is_primary"`
}

// GetEntityUsers retrieves all users assigned to an entity
func (h *UserEntityHandler) GetEntityUsers(c *gin.Context) {
	entityID := c.Param("entity_id")
	entityUUID, err := uuid.Parse(entityID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid entity ID"})
		return
	}
	
	var userEntities []models.UserEntity
	query := h.db.Preload("User").Preload("User.Department").Preload("User.Position").
		Where("entity_id = ?", entityUUID)
	
	// Filter by role
	if role := c.Query("role"); role != "" {
		query = query.Where("role = ?", role)
	}
	
	if err := query.Find(&userEntities).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch entity users"})
		return
	}
	
	c.JSON(http.StatusOK, userEntities)
}

// GetUserEntities retrieves all entities assigned to a user
func (h *UserEntityHandler) GetUserEntities(c *gin.Context) {
	userID := c.Param("user_id")
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}
	
	var userEntities []models.UserEntity
	if err := h.db.Preload("Entity").Where("user_id = ?", userUUID).Find(&userEntities).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user entities"})
		return
	}
	
	c.JSON(http.StatusOK, userEntities)
}

// AssignUserToEntity assigns a user to an entity with a specific role
func (h *UserEntityHandler) AssignUserToEntity(c *gin.Context) {
	entityID := c.Param("entity_id")
	entityUUID, err := uuid.Parse(entityID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid entity ID"})
		return
	}
	
	var req AssignUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Get assigner ID from context
	assignerID, _ := c.Get("userID")
	assignerUserID := assignerID.(uint)
	
	// Check if entity exists
	var entity models.Entity
	if err := h.db.Where("id = ?", entityUUID).First(&entity).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Entity not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch entity"})
		return
	}
	
	// Check if user exists
	var user models.User
	if err := h.db.Where("id = ?", req.UserID).First(&user).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user"})
		return
	}
	
	// Check if assignment already exists
	var existingAssignment models.UserEntity
	err = h.db.Where("user_id = ? AND entity_id = ?", req.UserID, entityUUID).First(&existingAssignment).Error
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "User is already assigned to this entity"})
		return
	}
	
	// Start transaction
	tx := h.db.Begin()
	
	// If this should be primary, remove primary flag from other entities
	if req.IsPrimary {
		if err := tx.Model(&models.UserEntity{}).
			Where("user_id = ? AND is_primary = ?", req.UserID, true).
			Update("is_primary", false).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update primary entity"})
			return
		}
	}
	
	// Create the assignment
	userEntity := models.UserEntity{
		UserID:     req.UserID,
		EntityID:   entityUUID,
		Role:       req.Role,
		IsPrimary:  req.IsPrimary,
		AssignedBy: &assignerUserID,
	}
	
	if err := tx.Create(&userEntity).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign user to entity"})
		return
	}
	
	// Create audit log
	auditLog := models.EntityAuditLog{
		EntityID:  &entityUUID,
		UserID:    &assignerUserID,
		Action:    "assign_user",
		Changes: map[string]interface{}{
			"user_id": req.UserID,
			"role":    req.Role,
		},
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
	h.db.Preload("User").Preload("Entity").First(&userEntity, userEntity.ID)
	
	c.JSON(http.StatusCreated, userEntity)
}

// UpdateUserEntityRole updates a user's role in an entity
func (h *UserEntityHandler) UpdateUserEntityRole(c *gin.Context) {
	entityID := c.Param("entity_id")
	userID := c.Param("user_id")
	
	entityUUID, err := uuid.Parse(entityID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid entity ID"})
		return
	}
	
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}
	
	var req UpdateUserEntityRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Get updater ID from context
	updaterID, _ := c.Get("userID")
	updaterUserID := updaterID.(uint)
	
	var userEntity models.UserEntity
	if err := h.db.Where("user_id = ? AND entity_id = ?", userUUID, entityUUID).First(&userEntity).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "User is not assigned to this entity"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch assignment"})
		return
	}
	
	// Track changes
	changes := make(map[string]interface{})
	
	if req.Role != "" && req.Role != userEntity.Role {
		changes["role"] = map[string]interface{}{"old": userEntity.Role, "new": req.Role}
		userEntity.Role = req.Role
	}
	
	if req.IsPrimary != nil && *req.IsPrimary != userEntity.IsPrimary {
		changes["is_primary"] = map[string]interface{}{"old": userEntity.IsPrimary, "new": *req.IsPrimary}
		
		// If setting as primary, remove primary flag from other entities
		if *req.IsPrimary {
			h.db.Model(&models.UserEntity{}).
				Where("user_id = ? AND is_primary = ? AND id != ?", userUUID, true, userEntity.ID).
				Update("is_primary", false)
		}
		
		userEntity.IsPrimary = *req.IsPrimary
	}
	
	if len(changes) == 0 {
		c.JSON(http.StatusOK, gin.H{"message": "No changes to update"})
		return
	}
	
	// Start transaction
	tx := h.db.Begin()
	
	if err := tx.Save(&userEntity).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update assignment"})
		return
	}
	
	// Create audit log
	auditLog := models.EntityAuditLog{
		EntityID:  &entityUUID,
		UserID:    &updaterUserID,
		Action:    "update_user_role",
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
	h.db.Preload("User").Preload("Entity").First(&userEntity, userEntity.ID)
	
	c.JSON(http.StatusOK, userEntity)
}

// RemoveUserFromEntity removes a user from an entity
func (h *UserEntityHandler) RemoveUserFromEntity(c *gin.Context) {
	entityID := c.Param("entity_id")
	userID := c.Param("user_id")
	
	entityUUID, err := uuid.Parse(entityID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid entity ID"})
		return
	}
	
	userUUID, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}
	
	// Get remover ID from context
	removerID, _ := c.Get("userID")
	removerUserID := removerID.(uint)
	
	var userEntity models.UserEntity
	if err := h.db.Where("user_id = ? AND entity_id = ?", userUUID, entityUUID).First(&userEntity).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "User is not assigned to this entity"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch assignment"})
		return
	}
	
	// Start transaction
	tx := h.db.Begin()
	
	// Create audit log before deletion
	auditLog := models.EntityAuditLog{
		EntityID:  &entityUUID,
		UserID:    &removerUserID,
		Action:    "remove_user",
		Changes: map[string]interface{}{
			"user_id": userUUID,
			"role":    userEntity.Role,
		},
		IPAddress: c.ClientIP(),
		UserAgent: c.Request.UserAgent(),
	}
	
	if err := tx.Create(&auditLog).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create audit log"})
		return
	}
	
	if err := tx.Delete(&userEntity).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove user from entity"})
		return
	}
	
	// If this was the user's current entity, clear it
	var user models.User
	if err := tx.Where("id = ?", userUUID).First(&user).Error; err == nil {
		if user.CurrentEntityID != nil && *user.CurrentEntityID == entityUUID {
			user.CurrentEntityID = nil
			tx.Save(&user)
		}
	}
	
	tx.Commit()
	
	c.JSON(http.StatusOK, gin.H{"message": "User removed from entity successfully"})
}

// SwitchUserEntity switches a user's current entity context
func (h *UserEntityHandler) SwitchUserEntity(c *gin.Context) {
	userID, _ := c.Get("userID")
	userUUID := userID.(uint)
	
	entityID := c.Param("entity_id")
	entityUUID, err := uuid.Parse(entityID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid entity ID"})
		return
	}
	
	// Check if user is assigned to this entity
	var userEntity models.UserEntity
	if err := h.db.Where("user_id = ? AND entity_id = ?", userUUID, entityUUID).First(&userEntity).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusForbidden, gin.H{"error": "You are not assigned to this entity"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to verify entity access"})
		return
	}
	
	// Update user's current entity
	now := time.Now()
	if err := h.db.Model(&models.User{}).Where("id = ?", userUUID).Updates(map[string]interface{}{
		"current_entity_id": entityUUID,
		"last_entity_switch": now,
	}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to switch entity"})
		return
	}
	
	// Get updated user with entity
	var user models.User
	h.db.Preload("CurrentEntity").Where("id = ?", userUUID).First(&user)
	
	c.JSON(http.StatusOK, gin.H{
		"message": "Entity switched successfully",
		"current_entity": user.CurrentEntity,
		"role": userEntity.Role,
	})
}