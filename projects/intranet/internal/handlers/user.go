package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"intranet/internal/database"
	"intranet/internal/models"
)

// UserResponse represents a user response without sensitive data
type UserResponse struct {
	ID            uint           `json:"id"`
	FirstName     string         `json:"first_name"`
	LastName      string         `json:"last_name"`
	Email         string         `json:"email"`
	Role          string         `json:"role"`
	EntityID      *string        `json:"entity_id"`
	Entity        *models.Entity `json:"entity,omitempty"`
	PositionID    uint           `json:"position_id"`
	Position      models.Position   `json:"position,omitempty"`
	DateHired     string         `json:"date_hired"`
	LeaveBalance  float64        `json:"leave_balance"`
	ProfilePicture string         `json:"profile_picture"`
	PhoneNumber   string         `json:"phone_number"`
	Address       string         `json:"address"`
	Active        bool           `json:"active"`
	Entities      []models.UserEntity `json:"entities,omitempty"`
}

// CreateUserRequest represents the create user request body
type CreateUserRequest struct {
	FirstName     string  `json:"first_name" binding:"required"`
	LastName      string  `json:"last_name" binding:"required"`
	Email         string  `json:"email" binding:"required,email"`
	Password      string  `json:"password" binding:"required,min=6"`
	Role          string  `json:"role" binding:"required"`
	EntityID      string  `json:"entity_id"` // UUID as string from frontend
	PositionID    uint    `json:"position_id"`
	LeaveBalance  float64 `json:"leave_balance"`
	ProfilePicture string  `json:"profile_picture"`
	PhoneNumber   string  `json:"phone_number"`
	Address       string  `json:"address"`
}

// UpdateUserRequest represents the update user request body
type UpdateUserRequest struct {
	FirstName     string  `json:"first_name"`
	LastName      string  `json:"last_name"`
	Email         string  `json:"email" binding:"omitempty,email"`
	Password      string  `json:"password" binding:"omitempty,min=6"`
	Role          string  `json:"role"`
	EntityID      string  `json:"entity_id"` // UUID as string from frontend
	PositionID    uint    `json:"position_id"`
	LeaveBalance  float64 `json:"leave_balance"`
	ProfilePicture string  `json:"profile_picture"`
	PhoneNumber   string  `json:"phone_number"`
	Address       string  `json:"address"`
	Active        *bool   `json:"active"`
}

// UpdateProfileRequest represents the update profile request body
type UpdateProfileRequest struct {
	FirstName     string `json:"first_name"`
	LastName      string `json:"last_name"`
	PhoneNumber   string `json:"phone_number"`
	Address       string `json:"address"`
	ProfilePicture string `json:"profile_picture"`
	Password      string `json:"password" binding:"omitempty,min=6"`
}

// GetUsers handles getting all users
func GetUsers(c *gin.Context) {
	var users []models.User

	// Get query parameters
	query := c.DefaultQuery("q", "")
	entityID := c.DefaultQuery("entity", "")
	position := c.DefaultQuery("position", "")
	role := c.DefaultQuery("role", "")
	active := c.DefaultQuery("active", "")

	// Base query
	db := database.DB.Preload("Entity").Preload("Position").Preload("Entities.Entity")

	// Apply filters if provided
	if query != "" {
		db = db.Where("first_name ILIKE ? OR last_name ILIKE ? OR email ILIKE ?", 
			"%"+query+"%", "%"+query+"%", "%"+query+"%")
	}
	
	if entityID != "" {
		db = db.Where("entity_id = ?", entityID)
	}
	
	if position != "" {
		db = db.Where("position_id = ?", position)
	}
	
	if role != "" {
		db = db.Where("role = ?", role)
	}
	
	if active != "" {
		activeValue := active == "true"
		db = db.Where("active = ?", activeValue)
	}

	// Execute the query
	if err := db.Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get users"})
		return
	}

	// Convert to response format (excluding password)
	var response []UserResponse
	for _, user := range users {
		response = append(response, convertUserToResponse(user))
	}

	c.JSON(http.StatusOK, response)
}

// GetUser handles getting a single user by ID
func GetUser(c *gin.Context) {
	id := c.Param("id")
	
	var user models.User
	if err := database.DB.Preload("Entity").Preload("Position").First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, convertUserToResponse(user))
}

// CreateUser handles creating a new user
func CreateUser(c *gin.Context) {
	var req CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if email is already taken
	var existingUser models.User
	result := database.DB.Where("email = ?", req.Email).First(&existingUser)
	if result.Error == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email already in use"})
		return
	}

	// Create new user
	user := models.User{
		FirstName:      req.FirstName,
		LastName:       req.LastName,
		Email:          req.Email,
		Password:       req.Password,
		Role:           req.Role,
		// EntityID handled separately below
		PositionID:     req.PositionID,
		DateHired:      time.Now(),
		LeaveBalance:   req.LeaveBalance,
		ProfilePicture: req.ProfilePicture,
		PhoneNumber:    req.PhoneNumber,
		Address:        req.Address,
		Active:         true,
	}

	// Handle EntityID if provided
	if req.EntityID != "" {
		entityUUID, err := uuid.Parse(req.EntityID)
		if err == nil {
			user.EntityID = &entityUUID
		}
	}

	// Hash password
	if err := user.HashPassword(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Save user
	if err := database.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	// Get the user with relationships
	database.DB.Preload("Entity").Preload("Position").First(&user, user.ID)

	c.JSON(http.StatusCreated, convertUserToResponse(user))
}

// UpdateUser handles updating a user
func UpdateUser(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if user exists
	var user models.User
	if err := database.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Check if email is taken by another user
	if req.Email != "" && req.Email != user.Email {
		var existingUser models.User
		result := database.DB.Where("email = ? AND id != ?", req.Email, id).First(&existingUser)
		if result.Error == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Email already in use"})
			return
		}
	}

	// Update fields if provided
	if req.FirstName != "" {
		user.FirstName = req.FirstName
	}
	if req.LastName != "" {
		user.LastName = req.LastName
	}
	if req.Email != "" {
		user.Email = req.Email
	}
	if req.Role != "" {
		user.Role = req.Role
	}
	if req.EntityID != "" {
		entityUUID, err := uuid.Parse(req.EntityID)
		if err == nil {
			user.EntityID = &entityUUID
		}
	}
	if req.PositionID != 0 {
		user.PositionID = req.PositionID
	}
	if req.PhoneNumber != "" {
		user.PhoneNumber = req.PhoneNumber
	}
	if req.Address != "" {
		user.Address = req.Address
	}
	if req.ProfilePicture != "" {
		user.ProfilePicture = req.ProfilePicture
	}
	if req.Active != nil {
		user.Active = *req.Active
	}
	if req.LeaveBalance >= 0 {
		user.LeaveBalance = req.LeaveBalance
	}
	
	// Handle date_hired if it's set but was previously zero
	if user.DateHired.IsZero() || user.DateHired.Year() < 1900 {
		user.DateHired = time.Now()
	}

	// Update password if provided
	if req.Password != "" {
		user.Password = req.Password
		if err := user.HashPassword(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
			return
		}
	}

	// Save user
	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	// Get the updated user with relationships
	database.DB.Preload("Entity").Preload("Position").First(&user, user.ID)

	c.JSON(http.StatusOK, convertUserToResponse(user))
}

// DeleteUser handles deleting a user
func DeleteUser(c *gin.Context) {
	id := c.Param("id")
	
	// Since we're using a view, we need to use raw SQL to delete
	var result struct {
		Success bool
	}
	
	// Call the delete function
	err := database.DB.Raw("SELECT delete_user_cascade(?) as success", id).Scan(&result).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}
	
	if !result.Success {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found or deletion failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User deleted successfully"})
}

// GetProfile handles getting the current user's profile
func GetProfile(c *gin.Context) {
	// Get the user from the context (set by the authentication middleware)
	user, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Get the user with relationships
	var fullUser models.User
	if err := database.DB.Preload("Entity").Preload("Position").First(&fullUser, user.(models.User).ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user profile"})
		return
	}

	c.JSON(http.StatusOK, convertUserToResponse(fullUser))
}

// UpdateProfile handles updating the current user's profile
func UpdateProfile(c *gin.Context) {
	// Get the user from the context
	currentUser, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	
	user := currentUser.(models.User)

	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update fields if provided
	if req.FirstName != "" {
		user.FirstName = req.FirstName
	}
	if req.LastName != "" {
		user.LastName = req.LastName
	}
	if req.PhoneNumber != "" {
		user.PhoneNumber = req.PhoneNumber
	}
	if req.Address != "" {
		user.Address = req.Address
	}
	if req.ProfilePicture != "" {
		user.ProfilePicture = req.ProfilePicture
	}

	// Update password if provided
	if req.Password != "" {
		user.Password = req.Password
		if err := user.HashPassword(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
			return
		}
	}

	// Save user
	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
		return
	}

	// Get the updated user with relationships
	var fullUser models.User
	if err := database.DB.Preload("Entity").Preload("Position").First(&fullUser, user.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get updated profile"})
		return
	}

	c.JSON(http.StatusOK, convertUserToResponse(fullUser))
}

// Helper function to convert User to UserResponse
func convertUserToResponse(user models.User) UserResponse {
	var entityIDStr *string
	if user.EntityID != nil {
		str := user.EntityID.String()
		entityIDStr = &str
	}
	
	// Format date properly - if it's the zero value, return empty string
	dateHired := ""
	if !user.DateHired.IsZero() && user.DateHired.Year() > 1900 {
		dateHired = user.DateHired.Format("2006-01-02")
	}
	
	return UserResponse{
		ID:             user.ID,
		FirstName:      user.FirstName,
		LastName:       user.LastName,
		Email:          user.Email,
		Role:           user.Role,
		EntityID:       entityIDStr,
		Entity:         user.Entity,
		PositionID:     user.PositionID,
		Position:       user.Position,
		DateHired:      dateHired,
		LeaveBalance:   user.LeaveBalance,
		ProfilePicture: user.ProfilePicture,
		PhoneNumber:    user.PhoneNumber,
		Address:        user.Address,
		Active:         user.Active,
		Entities:       user.Entities,
	}
}

// GetUserPermissions returns the current user's permissions
func GetUserPermissions(c *gin.Context) {
	// Get the user from the context
	currentUser, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	
	user := currentUser.(models.User)
	
	// Get all user roles
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
		"roles": userRoles,
		"permissions": permissions,
	}
	
	c.JSON(http.StatusOK, response)
}