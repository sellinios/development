package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jinzhu/gorm"
)

// SystemModule represents a system module configuration
type SystemModule struct {
	ID          string    `json:"id" gorm:"primary_key"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Icon        string    `json:"icon"`
	Path        string    `json:"path"`
	Enabled     bool      `json:"enabled"`
	Order       int       `json:"order" gorm:"column:module_order"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// TableName sets the table name for SystemModule
func (SystemModule) TableName() string {
	return "system_modules"
}

// ModuleHandler handles module-related operations
type ModuleHandler struct {
	db *gorm.DB
}

// NewModuleHandler creates a new module handler
func NewModuleHandler(db *gorm.DB) *ModuleHandler {
	return &ModuleHandler{db: db}
}

// GetModules retrieves all system modules
func (h *ModuleHandler) GetModules(c *gin.Context) {
	var modules []SystemModule
	
	if err := h.db.Order("module_order ASC").Find(&modules).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch modules"})
		return
	}
	
	c.JSON(http.StatusOK, modules)
}

// UpdateModulesRequest represents the request to update modules
type UpdateModulesRequest struct {
	Modules []SystemModule `json:"modules"`
}

// UpdateModules updates the enabled status of system modules
func (h *ModuleHandler) UpdateModules(c *gin.Context) {
	var req UpdateModulesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Log the request for debugging
	fmt.Printf("UpdateModules: Received %d modules\n", len(req.Modules))
	
	// Start transaction
	tx := h.db.Begin()
	
	for _, module := range req.Modules {
		fmt.Printf("Updating module %s: enabled=%v, order=%d\n", module.ID, module.Enabled, module.Order)
		// Update only the enabled field and order
		if err := tx.Model(&SystemModule{}).
			Where("id = ?", module.ID).
			Updates(map[string]interface{}{
				"enabled":     module.Enabled,
				"module_order": module.Order,
				"updated_at":  time.Now(),
			}).Error; err != nil {
			fmt.Printf("Error updating module %s: %v\n", module.ID, err)
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update modules"})
			return
		}
	}
	
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save changes"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Modules updated successfully"})
}

// GetEnabledModules retrieves only enabled modules (for the home page)
func (h *ModuleHandler) GetEnabledModules(c *gin.Context) {
	var modules []SystemModule
	
	if err := h.db.Where("enabled = ?", true).Order("module_order ASC").Find(&modules).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch modules"})
		return
	}
	
	c.JSON(http.StatusOK, modules)
}