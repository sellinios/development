package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"intranet/internal/database"
	"intranet/internal/models"
)

// UserNewResponse represents a user response for the new structure
type UserNewResponse struct {
	ID                  uint       `json:"id"`
	Username            string     `json:"username"`
	Email               string     `json:"email"`
	PersonID            *uint      `json:"person_id"`
	Role                string     `json:"role"`
	Active              bool       `json:"active"`
	LastLogin           *time.Time `json:"last_login"`
	FailedLoginAttempts int        `json:"failed_login_attempts"`
	LockedUntil         *time.Time `json:"locked_until"`
	CreatedAt           time.Time  `json:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at"`
	
	// Optional related data
	Person *models.Person `json:"person,omitempty"`
}

// CreateUserNewRequest represents the create user request for new structure
type CreateUserNewRequest struct {
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
	PersonID *uint  `json:"person_id"`
	Role     string `json:"role" binding:"required"`
}

// UpdateUserNewRequest represents the update user request for new structure
type UpdateUserNewRequest struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
	PersonID *uint  `json:"person_id"`
	Role     string `json:"role"`
	Active   *bool  `json:"active"`
}

// GetUsersNew handles getting all users with the new structure
func GetUsersNew(c *gin.Context) {
	var users []models.UserNew
	
	// Build query
	db := database.DB
	
	// Apply filters from query params
	if search := c.Query("search"); search != "" {
		db = db.Where("username LIKE ? OR email LIKE ?", "%"+search+"%", "%"+search+"%")
	}
	
	if role := c.Query("role"); role != "" {
		db = db.Where("role = ?", role)
	}
	
	if active := c.Query("active"); active != "" {
		db = db.Where("active = ?", active == "true")
	}
	
	// Load with person relationship - use left join to include users without persons
	if err := db.Preload("Person").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get users: " + err.Error()})
		return
	}
	
	// Log for debugging
	fmt.Printf("Found %d users\n", len(users))
	
	// Convert to response
	var response []UserNewResponse
	for _, user := range users {
		response = append(response, convertUserNewToResponse(user))
	}
	
	c.JSON(http.StatusOK, response)
}

// GetUserNew handles getting a single user by ID
func GetUserNew(c *gin.Context) {
	id := c.Param("id")
	
	var user models.UserNew
	if err := database.DB.Preload("Person").First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	
	c.JSON(http.StatusOK, convertUserNewToResponse(user))
}

// CreateUserNew handles creating a new user
func CreateUserNew(c *gin.Context) {
	var req CreateUserNewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Check if username already exists (excluding soft-deleted)
	var existingUser models.UserNew
	if err := database.DB.Where("username = ? AND deleted_at IS NULL", req.Username).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Username already exists"})
		return
	}
	
	// Check if email already exists (excluding soft-deleted)
	if err := database.DB.Where("email = ? AND deleted_at IS NULL", req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email already exists"})
		return
	}
	
	// Create new user
	user := models.UserNew{
		Username: req.Username,
		Email:    req.Email,
		Password: req.Password,
		PersonID: req.PersonID,
		Role:     req.Role,
		Active:   true,
	}
	
	// Hash password
	if err := user.HashPassword(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}
	
	// Save user
	if err := database.DB.Create(&user).Error; err != nil {
		// Log the actual error for debugging
		fmt.Printf("Error creating user: %v\n", err)
		
		// Check for specific constraint violations
		if err.Error() == `pq: duplicate key value violates unique constraint "users_username_key"` {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Username already exists"})
			return
		}
		if err.Error() == `pq: duplicate key value violates unique constraint "users_email_key"` {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Email already exists"})
			return
		}
		
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}
	
	// Load with relationships
	database.DB.Preload("Person").First(&user, user.ID)
	
	c.JSON(http.StatusCreated, convertUserNewToResponse(user))
}

// UpdateUserNew handles updating a user
func UpdateUserNew(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}
	
	var req UpdateUserNewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Get existing user
	var user models.UserNew
	if err := database.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	
	// Check if username/email is taken by another user
	if req.Username != "" && req.Username != user.Username {
		var existingUser models.UserNew
		if err := database.DB.Where("username = ? AND id != ?", req.Username, id).First(&existingUser).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Username already in use"})
			return
		}
	}
	
	if req.Email != "" && req.Email != user.Email {
		var existingUser models.UserNew
		if err := database.DB.Where("email = ? AND id != ?", req.Email, id).First(&existingUser).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Email already in use"})
			return
		}
	}
	
	// Update fields
	if req.Username != "" {
		user.Username = req.Username
	}
	if req.Email != "" {
		user.Email = req.Email
	}
	if req.Role != "" {
		user.Role = req.Role
	}
	if req.PersonID != nil {
		user.PersonID = req.PersonID
	}
	if req.Active != nil {
		user.Active = *req.Active
	}
	
	// Update password if provided
	if req.Password != "" {
		user.Password = req.Password
		if err := user.HashPassword(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
			return
		}
	}
	
	// Save changes
	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}
	
	// Load with relationships
	database.DB.Preload("Person").First(&user, user.ID)
	
	c.JSON(http.StatusOK, convertUserNewToResponse(user))
}

// DeleteUserNew handles deleting a user
func DeleteUserNew(c *gin.Context) {
	id := c.Param("id")
	
	var user models.UserNew
	if err := database.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	
	// Hard delete - permanently remove from database
	if err := database.DB.Unscoped().Delete(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

// Helper function to convert UserNew to response
func convertUserNewToResponse(user models.UserNew) UserNewResponse {
	return UserNewResponse{
		ID:                  user.ID,
		Username:            user.Username,
		Email:               user.Email,
		PersonID:            user.PersonID,
		Role:                user.Role,
		Active:              user.Active,
		LastLogin:           user.LastLogin,
		FailedLoginAttempts: user.FailedLoginAttempts,
		LockedUntil:         user.LockedUntil,
		CreatedAt:           user.CreatedAt,
		UpdatedAt:           user.UpdatedAt,
		Person:              user.Person,
	}
}

// UnlockUser unlocks a user account
func UnlockUser(c *gin.Context) {
	id := c.Param("id")
	
	var user models.UserNew
	if err := database.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	
	user.Unlock()
	
	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unlock user"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "User unlocked successfully"})
}

// ResetLoginAttempts resets failed login attempts for a user
func ResetLoginAttempts(c *gin.Context) {
	id := c.Param("id")
	
	var user models.UserNew
	if err := database.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	
	user.FailedLoginAttempts = 0
	
	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to reset login attempts"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Login attempts reset successfully"})
}