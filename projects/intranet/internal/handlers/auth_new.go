package handlers

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"intranet/internal/database"
	"intranet/internal/models"
)

// LoginRequestNew represents the login request body with username
type LoginRequestNew struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// AuthResponseNew represents the authentication response
type AuthResponseNew struct {
	Token string            `json:"token"`
	User  models.UserNew   `json:"user"`
}

// LoginNew handles user login with username
func LoginNew(c *gin.Context) {
	var req LoginRequestNew
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Log login attempt for debugging
	log.Printf("Login attempt for username: %s from IP: %s", req.Username, c.ClientIP())

	// Find user by username
	var user models.UserNew
	if err := database.DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
		log.Printf("User not found: %s", req.Username)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		return
	}

	// Check if account is locked
	if user.IsLocked() {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Account is locked. Please try again later."})
		return
	}

	// Check if account is active
	if !user.Active {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Account is inactive"})
		return
	}

	// Check password
	if !user.CheckPassword(req.Password) {
		log.Printf("Invalid password for user: %s", req.Username)
		// Record failed login attempt
		user.RecordFailedLogin()
		database.DB.Save(&user)
		
		if user.IsLocked() {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Too many failed attempts. Account has been locked."})
		} else {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid username or password"})
		}
		return
	}

	// Record successful login
	user.RecordLogin()
	database.DB.Save(&user)

	// Generate JWT token
	token, err := generateTokenNew(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	// Load person data if exists
	if user.PersonID != nil {
		database.DB.Preload("Person").First(&user, user.ID)
	}

	// Hide password in response
	user.Password = ""

	// Return token and user data
	c.JSON(http.StatusOK, AuthResponseNew{
		Token: token,
		User:  user,
	})
}

// generateTokenNew generates a JWT token for the user
func generateTokenNew(user models.UserNew) (string, error) {
	// Create the Claims
	claims := jwt.MapClaims{
		"id":       user.ID,
		"username": user.Username,
		"email":    user.Email,
		"role":     user.Role,
		"exp":      time.Now().Add(time.Hour * 24).Unix(), // Token expires in 24 hours
	}

	// Create token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Generate encoded token
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		jwtSecret = "epsilon_secure_key_change_me_in_production" // fallback
	}
	tokenString, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}