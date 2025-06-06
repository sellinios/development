package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"intranet/internal/database"
	"intranet/internal/models"
)

// RoleResponse represents a role response
type RoleResponse struct {
	ID          uint                 `json:"id"`
	Name        string              `json:"name"`
	DisplayName string              `json:"display_name"`
	Description string              `json:"description"`
	Permissions models.Permissions  `json:"permissions"`
	UserCount   int                 `json:"user_count"`
	CreatedAt   string              `json:"created_at"`
	UpdatedAt   string              `json:"updated_at"`
}

// CreateRoleRequest represents the create role request
type CreateRoleRequest struct {
	Name        string             `json:"name" binding:"required"`
	DisplayName string             `json:"display_name" binding:"required"`
	Description string             `json:"description"`
	Permissions models.Permissions `json:"permissions"`
}

// UpdateRoleRequest represents the update role request
type UpdateRoleRequest struct {
	DisplayName string             `json:"display_name"`
	Description string             `json:"description"`
	Permissions models.Permissions `json:"permissions"`
}

// AssignRoleRequest represents the assign role request
type AssignRoleRequest struct {
	UserID uint `json:"user_id" binding:"required"`
	RoleID uint `json:"role_id" binding:"required"`
}

// GetRoles handles getting all roles
func GetRoles(c *gin.Context) {
	var roles []models.Role
	
	if err := database.DB.Find(&roles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get roles"})
		return
	}
	
	// Convert to response format with user counts
	var response []RoleResponse
	for _, role := range roles {
		var userCount int
		database.DB.Model(&models.UserRole{}).Where("role_id = ?", role.ID).Count(&userCount)
		
		response = append(response, RoleResponse{
			ID:          role.ID,
			Name:        role.Name,
			DisplayName: role.DisplayName,
			Description: role.Description,
			Permissions: role.Permissions,
			UserCount:   userCount,
			CreatedAt:   role.CreatedAt.Format("2006-01-02 15:04:05"),
			UpdatedAt:   role.UpdatedAt.Format("2006-01-02 15:04:05"),
		})
	}
	
	c.JSON(http.StatusOK, response)
}

// GetRole handles getting a single role
func GetRole(c *gin.Context) {
	id := c.Param("id")
	
	var role models.Role
	if err := database.DB.First(&role, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Role not found"})
		return
	}
	
	var userCount int
	database.DB.Model(&models.UserRole{}).Where("role_id = ?", role.ID).Count(&userCount)
	
	response := RoleResponse{
		ID:          role.ID,
		Name:        role.Name,
		DisplayName: role.DisplayName,
		Description: role.Description,
		Permissions: role.Permissions,
		UserCount:   userCount,
		CreatedAt:   role.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt:   role.UpdatedAt.Format("2006-01-02 15:04:05"),
	}
	
	c.JSON(http.StatusOK, response)
}

// CreateRole handles creating a new role
func CreateRole(c *gin.Context) {
	var req CreateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Check if role name already exists
	var existingRole models.Role
	result := database.DB.Where("name = ?", req.Name).First(&existingRole)
	if result.Error == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Role name already exists"})
		return
	}
	
	// Create new role
	role := models.Role{
		Name:        req.Name,
		DisplayName: req.DisplayName,
		Description: req.Description,
		Permissions: req.Permissions,
	}
	
	if role.Permissions == nil {
		role.Permissions = make(models.Permissions)
	}
	
	if err := database.DB.Create(&role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create role"})
		return
	}
	
	c.JSON(http.StatusCreated, role)
}

// UpdateRole handles updating a role
func UpdateRole(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid role ID"})
		return
	}
	
	var req UpdateRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Check if role exists
	var role models.Role
	if err := database.DB.First(&role, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Role not found"})
		return
	}
	
	// Don't allow updating system roles
	if role.Name == "superadmin" || role.Name == "admin" || role.Name == "employee" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Cannot modify system roles"})
		return
	}
	
	// Update fields if provided
	if req.DisplayName != "" {
		role.DisplayName = req.DisplayName
	}
	if req.Description != "" {
		role.Description = req.Description
	}
	if req.Permissions != nil {
		role.Permissions = req.Permissions
	}
	
	role.UpdatedAt = time.Now()
	
	if err := database.DB.Save(&role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update role"})
		return
	}
	
	c.JSON(http.StatusOK, role)
}

// DeleteRole handles deleting a role
func DeleteRole(c *gin.Context) {
	id := c.Param("id")
	
	// Check if role exists
	var role models.Role
	if err := database.DB.First(&role, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Role not found"})
		return
	}
	
	// Don't allow deleting system roles
	if role.Name == "superadmin" || role.Name == "admin" || role.Name == "manager" || role.Name == "employee" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Cannot delete system roles"})
		return
	}
	
	// Check if role is assigned to any users
	var userCount int
	database.DB.Model(&models.UserRole{}).Where("role_id = ?", role.ID).Count(&userCount)
	if userCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete role that is assigned to users"})
		return
	}
	
	// Delete the role
	if err := database.DB.Delete(&role).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete role"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Role deleted successfully"})
}

// GetUserRoles handles getting roles for a specific user
func GetUserRoles(c *gin.Context) {
	userID := c.Param("userId")
	
	var userRoles []models.UserRole
	if err := database.DB.Preload("Role").Where("user_id = ?", userID).Find(&userRoles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user roles"})
		return
	}
	
	var roles []models.Role
	for _, ur := range userRoles {
		roles = append(roles, ur.Role)
	}
	
	c.JSON(http.StatusOK, roles)
}

// AssignRole handles assigning a role to a user
func AssignRole(c *gin.Context) {
	var req AssignRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Get current user from context
	currentUser, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	user := currentUser.(models.User)
	
	// Check if user and role exist
	var targetUser models.User
	if err := database.DB.First(&targetUser, req.UserID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	
	var role models.Role
	if err := database.DB.First(&role, req.RoleID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Role not found"})
		return
	}
	
	// Check if assignment already exists
	var existingAssignment models.UserRole
	result := database.DB.Where("user_id = ? AND role_id = ?", req.UserID, req.RoleID).First(&existingAssignment)
	if result.Error == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User already has this role"})
		return
	}
	
	// Create new assignment
	userRole := models.UserRole{
		UserID:     req.UserID,
		RoleID:     req.RoleID,
		AssignedAt: time.Now(),
		AssignedBy: &user.ID,
	}
	
	if err := database.DB.Create(&userRole).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign role"})
		return
	}
	
	c.JSON(http.StatusCreated, gin.H{"message": "Role assigned successfully"})
}

// RemoveRole handles removing a role from a user
func RemoveRole(c *gin.Context) {
	userID := c.Param("userId")
	roleID := c.Param("roleId")
	
	// Find the assignment
	var userRole models.UserRole
	if err := database.DB.Where("user_id = ? AND role_id = ?", userID, roleID).First(&userRole).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Role assignment not found"})
		return
	}
	
	// Check if this is the last role for the user
	var roleCount int
	database.DB.Model(&models.UserRole{}).Where("user_id = ?", userID).Count(&roleCount)
	if roleCount <= 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot remove last role from user"})
		return
	}
	
	// Delete the assignment
	if err := database.DB.Delete(&userRole).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove role"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Role removed successfully"})
}