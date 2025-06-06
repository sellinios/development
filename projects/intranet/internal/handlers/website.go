package handlers

import (
	"net/http"
	"strconv"
	"time"
	
	"github.com/gin-gonic/gin"
	"github.com/gosimple/slug"
	"intranet/internal/database"
	"intranet/internal/models"
)

// GetWebsites returns all websites
func GetWebsites(c *gin.Context) {
	var websites []models.Website
	
	query := database.DB
	if activeOnly := c.Query("active"); activeOnly == "true" {
		query = query.Where("active = ?", true)
	}
	
	if err := query.Find(&websites).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch websites"})
		return
	}
	
	c.JSON(http.StatusOK, websites)
}

// GetWebsite returns a single website by ID
func GetWebsite(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	
	var website models.Website
	if err := database.DB.Preload("Articles", "status = ?", "published").
		Preload("SocialAccounts").First(&website, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Website not found"})
		return
	}
	
	c.JSON(http.StatusOK, website)
}

// CreateWebsite creates a new website
func CreateWebsite(c *gin.Context) {
	var req struct {
		Name        string `json:"name" binding:"required"`
		Domain      string `json:"domain" binding:"required"`
		Description string `json:"description"`
		LogoURL     string `json:"logo_url"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	website := models.Website{
		Name:        req.Name,
		Domain:      req.Domain,
		Description: req.Description,
		LogoURL:     req.LogoURL,
		Active:      true,
	}
	
	if err := database.DB.Create(&website).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create website"})
		return
	}
	
	c.JSON(http.StatusCreated, website)
}

// UpdateWebsite updates a website
func UpdateWebsite(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	
	var website models.Website
	if err := database.DB.First(&website, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Website not found"})
		return
	}
	
	var req struct {
		Name        string `json:"name"`
		Domain      string `json:"domain"`
		Description string `json:"description"`
		LogoURL     string `json:"logo_url"`
		Active      *bool  `json:"active"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Update fields
	if req.Name != "" {
		website.Name = req.Name
	}
	if req.Domain != "" {
		website.Domain = req.Domain
	}
	website.Description = req.Description
	website.LogoURL = req.LogoURL
	if req.Active != nil {
		website.Active = *req.Active
	}
	
	if err := database.DB.Save(&website).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update website"})
		return
	}
	
	c.JSON(http.StatusOK, website)
}

// DeleteWebsite deletes a website
func DeleteWebsite(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	
	if err := database.DB.Delete(&models.Website{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete website"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Website deleted successfully"})
}

// GetArticles returns articles for a website
func GetArticles(c *gin.Context) {
	websiteID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid website ID"})
		return
	}
	
	var articles []models.Article
	query := database.DB.Where("website_id = ?", websiteID)
	
	// Filter by status
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}
	
	// Filter by category
	if category := c.Query("category"); category != "" {
		query = query.Where("category = ?", category)
	}
	
	// Search
	if search := c.Query("search"); search != "" {
		searchPattern := "%" + search + "%"
		query = query.Where("title ILIKE ? OR summary ILIKE ? OR content ILIKE ?", 
			searchPattern, searchPattern, searchPattern)
	}
	
	// Pagination
	page := 1
	limit := 20
	if p := c.Query("page"); p != "" {
		if pageNum, err := strconv.Atoi(p); err == nil && pageNum > 0 {
			page = pageNum
		}
	}
	if l := c.Query("limit"); l != "" {
		if limitNum, err := strconv.Atoi(l); err == nil && limitNum > 0 && limitNum <= 100 {
			limit = limitNum
		}
	}
	
	offset := (page - 1) * limit
	
	// Get total count with a separate optimized query
	var total int64
	countQuery := database.DB.Model(&models.Article{}).Where("website_id = ?", websiteID)
	
	// Apply same filters to count query
	if status := c.Query("status"); status != "" {
		countQuery = countQuery.Where("status = ?", status)
	}
	if category := c.Query("category"); category != "" {
		countQuery = countQuery.Where("category = ?", category)
	}
	if search := c.Query("search"); search != "" {
		searchPattern := "%" + search + "%"
		countQuery = countQuery.Where("title ILIKE ? OR summary ILIKE ? OR content ILIKE ?", 
			searchPattern, searchPattern, searchPattern)
	}
	
	countQuery.Count(&total)
	
	// Use optimized query for fetching articles
	// Select only necessary fields for list view
	if err := query.Order("published_at DESC NULLS LAST, created_at DESC").
		Limit(limit).Offset(offset).Find(&articles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch articles"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"articles": articles,
		"total":    total,
		"page":     page,
		"limit":    limit,
	})
}

// GetArticle returns a single article
func GetArticle(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	
	var article models.Article
	if err := database.DB.Preload("Author").Preload("Website").
		First(&article, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Article not found"})
		return
	}
	
	c.JSON(http.StatusOK, article)
}

// CreateArticle creates a new article
func CreateArticle(c *gin.Context) {
	websiteID, err := strconv.Atoi(c.Param("websiteId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid website ID"})
		return
	}
	
	var req struct {
		Title           string   `json:"title" binding:"required"`
		Summary         string   `json:"summary"`
		Content         string   `json:"content" binding:"required"`
		FeaturedImage   string   `json:"featured_image"`
		Category        string   `json:"category"`
		Status          string   `json:"status"`
		PublishedAt     *string  `json:"published_at"`
		EventDate       *string  `json:"event_date"`
		EventLocation   string   `json:"event_location"`
		Tags            []string `json:"tags"`
		MetaTitle       string   `json:"meta_title"`
		MetaDescription string   `json:"meta_description"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Get user from context
	user, _ := c.Get("user")
	userModel := user.(models.UserNew)
	
	article := models.Article{
		WebsiteID:       uint(websiteID),
		Title:           req.Title,
		Slug:            slug.Make(req.Title),
		Summary:         req.Summary,
		Content:         req.Content,
		FeaturedImage:   req.FeaturedImage,
		AuthorID:        &userModel.ID,
		Category:        req.Category,
		Status:          req.Status,
		EventLocation:   req.EventLocation,
		Tags:            req.Tags,
		MetaTitle:       req.MetaTitle,
		MetaDescription: req.MetaDescription,
	}
	
	// Set defaults
	if article.Category == "" {
		article.Category = "news"
	}
	if article.Status == "" {
		article.Status = "draft"
	}
	
	// Parse dates
	if req.PublishedAt != nil && *req.PublishedAt != "" {
		if t, err := time.Parse(time.RFC3339, *req.PublishedAt); err == nil {
			article.PublishedAt = &t
		}
	}
	if req.EventDate != nil && *req.EventDate != "" {
		if t, err := time.Parse(time.RFC3339, *req.EventDate); err == nil {
			article.EventDate = &t
		}
	}
	
	// Auto-publish if status is published and no publish date set
	if article.Status == "published" && article.PublishedAt == nil {
		now := time.Now()
		article.PublishedAt = &now
	}
	
	// Generate unique slug
	var count int64
	baseSlug := article.Slug
	for i := 1; ; i++ {
		database.DB.Model(&models.Article{}).Where("website_id = ? AND slug = ?", 
			websiteID, article.Slug).Count(&count)
		if count == 0 {
			break
		}
		article.Slug = baseSlug + "-" + strconv.Itoa(i)
	}
	
	if err := database.DB.Create(&article).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create article"})
		return
	}
	
	// Load relationships
	database.DB.Preload("Author").First(&article, article.ID)
	
	c.JSON(http.StatusCreated, article)
}

// UpdateArticle updates an article
func UpdateArticle(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	
	var article models.Article
	if err := database.DB.First(&article, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Article not found"})
		return
	}
	
	var req struct {
		Title           string   `json:"title"`
		Summary         string   `json:"summary"`
		Content         string   `json:"content"`
		FeaturedImage   string   `json:"featured_image"`
		Category        string   `json:"category"`
		Status          string   `json:"status"`
		PublishedAt     *string  `json:"published_at"`
		EventDate       *string  `json:"event_date"`
		EventLocation   string   `json:"event_location"`
		Tags            []string `json:"tags"`
		MetaTitle       string   `json:"meta_title"`
		MetaDescription string   `json:"meta_description"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Update fields
	if req.Title != "" && req.Title != article.Title {
		article.Title = req.Title
		article.Slug = slug.Make(req.Title)
		
		// Ensure unique slug
		var count int64
		baseSlug := article.Slug
		for i := 1; ; i++ {
			database.DB.Model(&models.Article{}).Where("website_id = ? AND slug = ? AND id != ?", 
				article.WebsiteID, article.Slug, article.ID).Count(&count)
			if count == 0 {
				break
			}
			article.Slug = baseSlug + "-" + strconv.Itoa(i)
		}
	}
	
	article.Summary = req.Summary
	if req.Content != "" {
		article.Content = req.Content
	}
	article.FeaturedImage = req.FeaturedImage
	if req.Category != "" {
		article.Category = req.Category
	}
	if req.Status != "" {
		article.Status = req.Status
		// Auto-publish if changing to published
		if req.Status == "published" && article.PublishedAt == nil {
			now := time.Now()
			article.PublishedAt = &now
		}
	}
	
	// Update dates
	if req.PublishedAt != nil {
		if *req.PublishedAt == "" {
			article.PublishedAt = nil
		} else if t, err := time.Parse(time.RFC3339, *req.PublishedAt); err == nil {
			article.PublishedAt = &t
		}
	}
	if req.EventDate != nil {
		if *req.EventDate == "" {
			article.EventDate = nil
		} else if t, err := time.Parse(time.RFC3339, *req.EventDate); err == nil {
			article.EventDate = &t
		}
	}
	
	article.EventLocation = req.EventLocation
	article.Tags = req.Tags
	article.MetaTitle = req.MetaTitle
	article.MetaDescription = req.MetaDescription
	
	if err := database.DB.Save(&article).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update article"})
		return
	}
	
	// Load relationships
	database.DB.Preload("Author").First(&article, article.ID)
	
	c.JSON(http.StatusOK, article)
}

// DeleteArticle deletes an article
func DeleteArticle(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}
	
	if err := database.DB.Delete(&models.Article{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete article"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Article deleted successfully"})
}