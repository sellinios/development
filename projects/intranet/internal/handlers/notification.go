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

// GetNotifications returns notifications for the current user
func GetNotifications(c *gin.Context) {
	userInterface, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	user := userInterface.(models.UserNew)
	
	var notifications []models.Notification
	query := database.DB.Where("user_id = ?", user.ID).Order("created_at DESC")
	
	// Filter by read status if requested
	if readStatus := c.Query("read"); readStatus != "" {
		if readStatus == "false" {
			query = query.Where("read = ?", false)
		} else if readStatus == "true" {
			query = query.Where("read = ?", true)
		}
	}
	
	// Limit results
	limit := 20
	if limitStr := c.Query("limit"); limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}
	
	if err := query.Limit(limit).Find(&notifications).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch notifications"})
		return
	}
	
	// Get unread count
	var unreadCount int64
	database.DB.Model(&models.Notification{}).Where("user_id = ? AND read = ?", user.ID, false).Count(&unreadCount)
	
	c.JSON(http.StatusOK, gin.H{
		"notifications": notifications,
		"unread_count": unreadCount,
	})
}

// MarkNotificationRead marks a notification as read
func MarkNotificationRead(c *gin.Context) {
	userInterface, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	user := userInterface.(models.UserNew)
	notificationID := c.Param("id")
	
	var notification models.Notification
	if err := database.DB.Where("id = ? AND user_id = ?", notificationID, user.ID).First(&notification).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Notification not found"})
		return
	}
	
	now := time.Now()
	notification.Read = true
	notification.ReadAt = &now
	
	if err := database.DB.Save(&notification).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark notification as read"})
		return
	}
	
	c.JSON(http.StatusOK, notification)
}

// MarkAllNotificationsRead marks all notifications as read for the current user
func MarkAllNotificationsRead(c *gin.Context) {
	userInterface, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	user := userInterface.(models.UserNew)
	now := time.Now()
	
	if err := database.DB.Model(&models.Notification{}).
		Where("user_id = ? AND read = ?", user.ID, false).
		Updates(map[string]interface{}{
			"read": true,
			"read_at": now,
		}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to mark notifications as read"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "All notifications marked as read"})
}

// CreateNotificationForSuperAdmins creates a notification for all superadmins
func CreateNotificationForSuperAdmins(notificationType, title, message, relatedType string, relatedID uint) error {
	var superAdmins []models.UserNew
	if err := database.DB.Where("role = ? AND active = ?", "superadmin", true).Find(&superAdmins).Error; err != nil {
		return fmt.Errorf("failed to fetch superadmins: %v", err)
	}
	
	for _, admin := range superAdmins {
		notification := models.Notification{
			UserID:      admin.ID,
			Type:        notificationType,
			Title:       title,
			Message:     message,
			RelatedType: relatedType,
			RelatedID:   relatedID,
		}
		
		if err := database.DB.Create(&notification).Error; err != nil {
			return fmt.Errorf("failed to create notification for user %d: %v", admin.ID, err)
		}
	}
	
	return nil
}

// CreateNotificationForAdmins creates a notification for all admins and superadmins
func CreateNotificationForAdmins(notificationType, title, message, relatedType string, relatedID uint) error {
	var admins []models.UserNew
	if err := database.DB.Where("(role = ? OR role = ?) AND active = ?", "admin", "superadmin", true).Find(&admins).Error; err != nil {
		return fmt.Errorf("failed to fetch admins: %v", err)
	}
	
	for _, admin := range admins {
		notification := models.Notification{
			UserID:      admin.ID,
			Type:        notificationType,
			Title:       title,
			Message:     message,
			RelatedType: relatedType,
			RelatedID:   relatedID,
		}
		
		if err := database.DB.Create(&notification).Error; err != nil {
			return fmt.Errorf("failed to create notification for user %d: %v", admin.ID, err)
		}
	}
	
	return nil
}