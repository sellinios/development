package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"net/smtp"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"intranet/internal/database"
	"intranet/internal/models"
)

// PasswordResetToken represents a password reset token
type PasswordResetToken struct {
	ID        uint      `gorm:"primary_key" json:"id"`
	UserID    uint      `gorm:"not null" json:"user_id"`
	Token     string    `gorm:"type:varchar(255);unique;not null" json:"token"`
	ExpiresAt time.Time `gorm:"not null" json:"expires_at"`
	Used      bool      `gorm:"default:false" json:"used"`
	CreatedAt time.Time `json:"created_at"`
	
	// Relationships
	User models.UserNew `gorm:"foreignkey:UserID" json:"user,omitempty"`
}

// ForgotPasswordNewRequest represents the forgot password request
type ForgotPasswordNewRequest struct {
	Username string `json:"username" binding:"required"`
}

// ResetPasswordNewRequest represents the reset password request
type ResetPasswordNewRequest struct {
	Token    string `json:"token" binding:"required"`
	Password string `json:"password" binding:"required,min=6"`
}

// ForgotPasswordNew handles password recovery request
func ForgotPasswordNew(c *gin.Context) {
	var req ForgotPasswordNewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find user by username
	var user models.UserNew
	if err := database.DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
		// Don't reveal if user exists or not for security
		c.JSON(http.StatusOK, gin.H{"message": "If an account exists with this username, a password reset link has been sent to the registered email."})
		return
	}

	// Generate reset token
	token, err := generateResetToken()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate reset token"})
		return
	}

	// Save token to database
	resetToken := PasswordResetToken{
		UserID:    user.ID,
		Token:     token,
		ExpiresAt: time.Now().Add(1 * time.Hour), // Token expires in 1 hour
		Used:      false,
	}

	if err := database.DB.Create(&resetToken).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create reset token"})
		return
	}

	// Send email
	if err := sendPasswordResetEmail(user.Email, user.Username, token); err != nil {
		// Log error but don't reveal to user
		fmt.Printf("Failed to send password reset email: %v\n", err)
	}

	c.JSON(http.StatusOK, gin.H{"message": "If an account exists with this username, a password reset link has been sent to the registered email."})
}

// ResetPasswordNew handles password reset with token
func ResetPasswordNew(c *gin.Context) {
	var req ResetPasswordNewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Find valid token
	var resetToken PasswordResetToken
	if err := database.DB.Where("token = ? AND used = ? AND expires_at > ?", req.Token, false, time.Now()).First(&resetToken).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid or expired reset token"})
		return
	}

	// Get user
	var user models.UserNew
	if err := database.DB.First(&user, resetToken.UserID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User not found"})
		return
	}

	// Update password
	user.Password = req.Password
	if err := user.HashPassword(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	// Reset failed login attempts when password is reset
	user.FailedLoginAttempts = 0
	user.LockedUntil = nil

	if err := database.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	// Mark token as used
	resetToken.Used = true
	database.DB.Save(&resetToken)

	c.JSON(http.StatusOK, gin.H{"message": "Password has been reset successfully"})
}

// ValidateResetToken checks if a reset token is valid
func ValidateResetToken(c *gin.Context) {
	token := c.Param("token")

	var resetToken PasswordResetToken
	if err := database.DB.Where("token = ? AND used = ? AND expires_at > ?", token, false, time.Now()).First(&resetToken).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"valid": false, "error": "Invalid or expired token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"valid": true})
}

// generateResetToken generates a secure random token
func generateResetToken() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// sendPasswordResetEmail sends the password reset email
func sendPasswordResetEmail(email, username, token string) error {
	// Get SMTP configuration from environment
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	smtpUser := os.Getenv("SMTP_USER")
	smtpPass := os.Getenv("SMTP_PASS")
	fromEmail := os.Getenv("SMTP_FROM")
	
	// Default values for development
	if smtpHost == "" {
		smtpHost = "localhost"
	}
	if smtpPort == "" {
		smtpPort = "1025" // MailHog default port
	}
	if fromEmail == "" {
		fromEmail = "noreply@epsilonhellas.com"
	}

	// Get base URL for the reset link
	baseURL := os.Getenv("BASE_URL")
	if baseURL == "" {
		baseURL = "https://site.epsilonhellas.com/intranet"
	}

	resetLink := fmt.Sprintf("%s/reset-password?token=%s", baseURL, token)

	// Email content
	subject := "Password Reset Request - Epsilon Hellas Intranet"
	body := fmt.Sprintf(`
Hello %s,

You have requested to reset your password for the Epsilon Hellas Intranet.

Please click the following link to reset your password:
%s

This link will expire in 1 hour.

If you did not request this password reset, please ignore this email.

Best regards,
Epsilon Hellas IT Team
`, username, resetLink)

	// Prepare email
	msg := []byte(fmt.Sprintf("To: %s\r\n"+
		"From: %s\r\n"+
		"Subject: %s\r\n"+
		"\r\n"+
		"%s\r\n", email, fromEmail, subject, body))

	// Send email
	var auth smtp.Auth
	if smtpUser != "" && smtpPass != "" {
		auth = smtp.PlainAuth("", smtpUser, smtpPass, smtpHost)
	}

	err := smtp.SendMail(smtpHost+":"+smtpPort, auth, fromEmail, []string{email}, msg)
	if err != nil {
		// For development, just log the reset link
		fmt.Printf("Password reset link for %s: %s\n", username, resetLink)
		// Don't return error in development
		if os.Getenv("APP_ENV") == "development" {
			return nil
		}
	}
	
	return err
}

// Create the password_reset_tokens table
func init() {
	// This will be run when the package is imported
	// You should add this to your migration
	/*
	CREATE TABLE password_reset_tokens (
		id SERIAL PRIMARY KEY,
		user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
		token VARCHAR(255) UNIQUE NOT NULL,
		expires_at TIMESTAMP NOT NULL,
		used BOOLEAN DEFAULT false,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	
	CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
	CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
	*/
}