package handlers

import (
	"net/http"
	"strconv"
	"time"
	
	"github.com/gin-gonic/gin"
	"intranet/internal/database"
	"intranet/internal/models"
)

// GetSocialAccounts returns all social accounts for a website
func GetSocialAccounts(c *gin.Context) {
	websiteID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid website ID"})
		return
	}
	
	var accounts []models.SocialAccount
	if err := database.DB.Where("website_id = ?", websiteID).Find(&accounts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch social accounts"})
		return
	}
	
	c.JSON(http.StatusOK, accounts)
}

// CreateSocialAccount creates a new social account
func CreateSocialAccount(c *gin.Context) {
	websiteID, err := strconv.Atoi(c.Param("websiteId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid website ID"})
		return
	}
	
	var req struct {
		Platform    string `json:"platform" binding:"required"`
		AccountName string `json:"account_name" binding:"required"`
		AccountURL  string `json:"account_url"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	account := models.SocialAccount{
		WebsiteID:   uint(websiteID),
		Platform:    req.Platform,
		AccountName: req.AccountName,
		AccountURL:  req.AccountURL,
		Active:      true,
	}
	
	if err := database.DB.Create(&account).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create social account"})
		return
	}
	
	c.JSON(http.StatusCreated, account)
}

// UpdateSocialAccount updates a social account
func UpdateSocialAccount(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	
	var account models.SocialAccount
	if err := database.DB.First(&account, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Social account not found"})
		return
	}
	
	var req struct {
		Platform    string `json:"platform"`
		AccountName string `json:"account_name"`
		AccountURL  string `json:"account_url"`
		Active      *bool  `json:"active"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Update fields
	if req.Platform != "" {
		account.Platform = req.Platform
	}
	if req.AccountName != "" {
		account.AccountName = req.AccountName
	}
	account.AccountURL = req.AccountURL
	if req.Active != nil {
		account.Active = *req.Active
	}
	
	if err := database.DB.Save(&account).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update social account"})
		return
	}
	
	c.JSON(http.StatusOK, account)
}

// DeleteSocialAccount deletes a social account
func DeleteSocialAccount(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	
	if err := database.DB.Delete(&models.SocialAccount{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete social account"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Social account deleted successfully"})
}

// GetSocialPosts returns social posts for a website
func GetSocialPosts(c *gin.Context) {
	websiteID, err := strconv.Atoi(c.Param("websiteId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid website ID"})
		return
	}
	
	var posts []models.SocialPost
	query := database.DB.Where("website_id = ?", websiteID)
	
	// Filter by status
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	
	// Filter by date range
	if from := c.Query("from"); from != "" {
		if t, err := time.Parse(time.RFC3339, from); err == nil {
			query = query.Where("scheduled_at >= ? OR published_at >= ?", t, t)
		}
	}
	if to := c.Query("to"); to != "" {
		if t, err := time.Parse(time.RFC3339, to); err == nil {
			query = query.Where("scheduled_at <= ? OR published_at <= ?", t, t)
		}
	}
	
	// Pagination
	page := 1
	limit := 20
	if p := c.Query("page"); p != "" {
		if pageNum, err := strconv.Atoi(p); err == nil && pageNum > 0 {
			page = pageNum
		}
	}
	
	offset := (page - 1) * limit
	
	var total int64
	query.Model(&models.SocialPost{}).Count(&total)
	
	if err := query.Preload("Article").Preload("Creator").
		Order("COALESCE(scheduled_at, created_at) DESC").
		Limit(limit).Offset(offset).Find(&posts).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch social posts"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"posts": posts,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// CreateSocialPost creates a new social post
func CreateSocialPost(c *gin.Context) {
	websiteID, err := strconv.Atoi(c.Param("websiteId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid website ID"})
		return
	}
	
	var req struct {
		ArticleID   *uint    `json:"article_id"`
		Content     string   `json:"content" binding:"required"`
		Platforms   []string `json:"platforms" binding:"required"`
		MediaURLs   []string `json:"media_urls"`
		ScheduledAt *string  `json:"scheduled_at"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Get user from context
	user, _ := c.Get("user")
	userModel := user.(models.UserNew)
	
	post := models.SocialPost{
		WebsiteID: uint(websiteID),
		ArticleID: req.ArticleID,
		Content:   req.Content,
		Platforms: req.Platforms,
		MediaURLs: req.MediaURLs,
		Status:    "draft",
		CreatedBy: userModel.ID,
	}
	
	// Parse scheduled time
	if req.ScheduledAt != nil && *req.ScheduledAt != "" {
		if t, err := time.Parse(time.RFC3339, *req.ScheduledAt); err == nil {
			post.ScheduledAt = &t
			post.Status = "scheduled"
		}
	}
	
	if err := database.DB.Create(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create social post"})
		return
	}
	
	// Load relationships
	database.DB.Preload("Article").Preload("Creator").First(&post, post.ID)
	
	c.JSON(http.StatusCreated, post)
}

// UpdateSocialPost updates a social post
func UpdateSocialPost(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	
	var post models.SocialPost
	if err := database.DB.First(&post, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Social post not found"})
		return
	}
	
	var req struct {
		Content     string   `json:"content"`
		Platforms   []string `json:"platforms"`
		MediaURLs   []string `json:"media_urls"`
		ScheduledAt *string  `json:"scheduled_at"`
		Status      string   `json:"status"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Update fields
	if req.Content != "" {
		post.Content = req.Content
	}
	if len(req.Platforms) > 0 {
		post.Platforms = req.Platforms
	}
	post.MediaURLs = req.MediaURLs
	
	if req.Status != "" {
		post.Status = req.Status
		// If publishing, set published date
		if req.Status == "published" && post.PublishedAt == nil {
			now := time.Now()
			post.PublishedAt = &now
		}
	}
	
	// Update scheduled time
	if req.ScheduledAt != nil {
		if *req.ScheduledAt == "" {
			post.ScheduledAt = nil
		} else if t, err := time.Parse(time.RFC3339, *req.ScheduledAt); err == nil {
			post.ScheduledAt = &t
			if post.Status == "draft" {
				post.Status = "scheduled"
			}
		}
	}
	
	if err := database.DB.Save(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update social post"})
		return
	}
	
	// Load relationships
	database.DB.Preload("Article").Preload("Creator").First(&post, post.ID)
	
	c.JSON(http.StatusOK, post)
}

// DeleteSocialPost deletes a social post
func DeleteSocialPost(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	
	if err := database.DB.Delete(&models.SocialPost{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete social post"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Social post deleted successfully"})
}