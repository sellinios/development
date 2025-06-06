package handlers

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"intranet/internal/database"
	"intranet/internal/models"
)

// GetUserPermissionsNew returns permissions for the authenticated user using the new user model
func GetUserPermissionsNew(c *gin.Context) {
	// Get the user from the context
	currentUser, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	
	user := currentUser.(models.UserNew)
	
	// For superadmin and admin, return all permissions
	if user.Role == "superadmin" || user.Role == "admin" {
		// Return all possible permissions for super/admin users
		allPermissions := models.Permissions{
			"dashboard": []string{"view"},
			"users": []string{"create", "read", "update", "delete", "view"},
			"roles": []string{"create", "read", "update", "delete", "view"}, 
			"entities": []string{"create", "read", "update", "delete", "view"},
			"hr": []string{"view", "create", "edit", "delete", "approve"},
			"applicants": []string{"view", "create", "edit", "delete"},
			"employees": []string{"view", "create", "edit", "delete"},
			"leaves": []string{"view", "create", "edit", "delete", "approve"},
			"crm": []string{"view", "create", "edit", "delete"},
			"projects": []string{"view", "create", "edit", "delete"},
			"assets": []string{"view", "create", "edit", "delete"},
			"ships": []string{"view", "create", "edit", "delete"},
			"reports": []string{"view", "generate", "export"},
			"support": []string{"view", "create", "manage"},
			"admin": []string{"view", "manage"},
			"websites": []string{"view", "create", "edit", "delete"},
			"content": []string{"view", "create", "edit", "delete", "publish"},
		}
		
		response := gin.H{
			"user_id": user.ID,
			"email": user.Email,
			"role": user.Role,
			"roles": []gin.H{
				{
					"role": gin.H{
						"name": user.Role,
						"description": "System " + user.Role,
					},
				},
			},
			"permissions": allPermissions,
		}
		
		c.JSON(http.StatusOK, response)
		return
	}
	
	// For other users, get permissions from their assigned roles
	var userRoles []models.UserRole
	if err := database.DB.Preload("Role").Where("user_id = ?", user.ID).Find(&userRoles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user roles"})
		return
	}
	
	// Aggregate permissions from all roles
	permissions := make(models.Permissions)
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
	
	// Return user permissions along with role information
	response := gin.H{
		"user_id": user.ID,
		"email": user.Email,
		"role": user.Role,
		"roles": userRoles,
		"permissions": permissions,
	}
	
	c.JSON(http.StatusOK, response)
}

// GetProfileNew handles getting the current user's profile using the new user model
func GetProfileNew(c *gin.Context) {
	// Get the user from the context (set by the authentication middleware)
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get the user with relationships
	var fullUser models.UserNew
	if err := database.DB.Preload("Person").Preload("Entities.Entity").First(&fullUser, user.(models.UserNew).ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user profile"})
		return
	}

	// Hide password
	fullUser.Password = ""

	c.JSON(http.StatusOK, fullUser)
}

// UpdateProfileNew handles updating the current user's profile using the new user model
func UpdateProfileNew(c *gin.Context) {
	// Get the user from the context
	currentUser, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	
	user := currentUser.(models.UserNew)

	var req UpdateUserNewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Get the full user record
	var fullUser models.UserNew
	if err := database.DB.First(&fullUser, user.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user"})
		return
	}

	// Update allowed fields
	if req.Email != "" {
		fullUser.Email = req.Email
	}
	
	// Update password if provided
	if req.Password != "" {
		fullUser.Password = req.Password
		if err := fullUser.HashPassword(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
			return
		}
	}
	
	// Save changes
	if err := database.DB.Save(&fullUser).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}
	
	// Load with relationships
	database.DB.Preload("Person").First(&fullUser, fullUser.ID)
	
	// Hide password
	fullUser.Password = ""
	
	c.JSON(http.StatusOK, fullUser)
}