package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"intranet/internal/database"
	"intranet/internal/models"
)

// PermissionRequired creates a middleware that checks if the user has the required permission
func PermissionRequired(resource string, action string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user from context
		user, exists := c.Get("user")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		userModel := user.(models.UserNew)

		// Admin and superadmin have all permissions
		if userModel.Role == "admin" || userModel.Role == "superadmin" {
			c.Next()
			return
		}

		// Get user roles
		var userRoles []models.UserRole
		if err := database.DB.Preload("Role").Where("user_id = ?", userModel.ID).Find(&userRoles).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check permissions"})
			c.Abort()
			return
		}

		// Check if any role has the required permission
		hasPermission := false
		for _, userRole := range userRoles {
			if userRole.Role.HasPermission(resource, action) {
				hasPermission = true
				break
			}
		}

		if !hasPermission {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// HasAnyRole checks if the user has any of the specified roles
func HasAnyRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user from context
		user, exists := c.Get("user")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		userModel := user.(models.User)

		// Get user roles
		var userRoles []models.UserRole
		if err := database.DB.Preload("Role").Where("user_id = ?", userModel.ID).Find(&userRoles).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check roles"})
			c.Abort()
			return
		}

		// Check if user has any of the required roles
		hasRole := false
		for _, userRole := range userRoles {
			for _, requiredRole := range roles {
				if userRole.Role.Name == requiredRole {
					hasRole = true
					break
				}
			}
			if hasRole {
				break
			}
		}

		if !hasRole {
			c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient role privileges"})
			c.Abort()
			return
		}

		c.Next()
	}
}

// GetUserPermissions returns all permissions for a user
func GetUserPermissions(userID uint) (models.Permissions, error) {
	permissions := make(models.Permissions)

	// Get user roles
	var userRoles []models.UserRole
	if err := database.DB.Preload("Role").Where("user_id = ?", userID).Find(&userRoles).Error; err != nil {
		return permissions, err
	}

	// Aggregate permissions from all roles
	for _, userRole := range userRoles {
		if userRole.Role.Permissions != nil {
			for resource, actions := range userRole.Role.Permissions {
				if permissions[resource] == nil {
					permissions[resource] = []string{}
				}
				// Add unique actions
				for _, action := range actions {
					found := false
					for _, existingAction := range permissions[resource] {
						if existingAction == action {
							found = true
							break
						}
					}
					if !found {
						permissions[resource] = append(permissions[resource], action)
					}
				}
			}
		}
	}

	return permissions, nil
}