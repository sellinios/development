package middleware

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"intranet/internal/database"
	"intranet/internal/models"
)

// JWTAuth middleware for authenticating tokens
func JWTAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get the Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			fmt.Printf("JWTAuth Debug - No Authorization header for path: %s, Method: %s\n", c.Request.URL.Path, c.Request.Method)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is required"})
			return
		}

		// Check if the format is Bearer {token}
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header format must be Bearer {token}"})
			return
		}

		// Get the token
		tokenString := parts[1]

		// Parse the token
		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			// Validate the algorithm
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}

			// Return the secret key
			jwtSecret := os.Getenv("JWT_SECRET")
			if jwtSecret == "" {
				jwtSecret = "epsilon_secure_key_change_me_in_production" // fallback
			}
			return []byte(jwtSecret), nil
		})

		if err != nil {
			// Log the specific error for debugging
			fmt.Printf("Token validation error: %v\n", err)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token", "details": err.Error()})
			return
		}

		// Check if the token is valid
		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			// Get the user ID from the claims
			userID := uint(claims["id"].(float64))

			// Find the user in the database
			var user models.UserNew
			if err := database.DB.First(&user, userID).Error; err != nil {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
				return
			}

			// Check if the user is active
			if !user.Active {
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "User is inactive"})
				return
			}

			// Set the user in the context for future use
			c.Set("user", user)
			c.Set("userID", userID)
			c.Set("userRole", claims["role"])
			
			// Debug logging
			fmt.Printf("Auth Debug - UserID: %v, Role: %v, Path: %s\n", userID, claims["role"], c.Request.URL.Path)

			// Continue
			c.Next()
		} else {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			return
		}
	}
}

// AdminOnly middleware for restricting access to admin users
func AdminOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("userRole")
		if !exists {
			fmt.Printf("AdminOnly Debug - No userRole found in context for path: %s\n", c.Request.URL.Path)
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			return
		}

		fmt.Printf("AdminOnly Debug - Role: %v, Path: %s\n", role, c.Request.URL.Path)
		// Allow both admin and superadmin
		if role != "admin" && role != "superadmin" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Access denied - admin role required"})
			return
		}

		c.Next()
	}
}

// SuperAdminOnly middleware for restricting access to superadmin users only
func SuperAdminOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("userRole")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
			return
		}

		if role != "superadmin" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Access denied - superadmin role required"})
			return
		}

		c.Next()
	}
}

// ManagerOnly middleware for restricting access to manager users
func ManagerOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("userRole")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}

		// Allow managers, admins, and superadmins
		if role != "manager" && role != "admin" && role != "superadmin" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Access denied"})
			return
		}

		c.Next()
	}
}

// HROnly middleware for restricting access to HR users
func HROnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("userRole")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}

		// Allow HR, managers, admins, and superadmins
		if role != "hr" && role != "manager" && role != "admin" && role != "superadmin" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Access denied - HR role required"})
			return
		}

		c.Next()
	}
}

// CORSMiddleware handles CORS for all routes
func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	}
}