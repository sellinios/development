package handlers

import (
	"net/http"
	"strconv"
	
	"github.com/gin-gonic/gin"
	"intranet/internal/database"
	"intranet/internal/models"
)

// GetPublicArticles returns published articles for a specific website (public API)
func GetPublicArticles(c *gin.Context) {
	// Get website domain from query parameter
	domain := c.Query("domain")
	if domain == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Domain parameter is required"})
		return
	}
	
	// Find website by domain
	var website models.Website
	if err := database.DB.Where("domain = ? AND active = ?", domain, true).First(&website).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Website not found"})
		return
	}
	
	// Get articles
	var articles []models.Article
	query := database.DB.Where("website_id = ? AND status = ?", website.ID, "published")
	
	// Filter by category if provided
	if category := c.Query("category"); category != "" {
		query = query.Where("category = ?", category)
	}
	
	// Filter by tag if provided
	if tag := c.Query("tag"); tag != "" {
		query = query.Where("? = ANY(tags)", tag)
	}
	
	// Pagination
	page := 1
	limit := 10
	if p := c.Query("page"); p != "" {
		if pageNum, err := strconv.Atoi(p); err == nil && pageNum > 0 {
			page = pageNum
		}
	}
	if l := c.Query("limit"); l != "" {
		if limitNum, err := strconv.Atoi(l); err == nil && limitNum > 0 && limitNum <= 50 {
			limit = limitNum
		}
	}
	
	offset := (page - 1) * limit
	
	// Get total count
	var total int64
	query.Model(&models.Article{}).Count(&total)
	
	// Get articles
	if err := query.Preload("Author").
		Order("published_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&articles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch articles"})
		return
	}
	
	// Transform response to hide sensitive data
	publicArticles := make([]gin.H, len(articles))
	for i, article := range articles {
		authorName := "Epsilon Hellas"
		if article.Author != nil {
			authorName = article.Author.GetFullName()
		}
		
		publicArticles[i] = gin.H{
			"id":               article.ID,
			"title":            article.Title,
			"slug":             article.Slug,
			"summary":          article.Summary,
			"content":          article.Content,
			"featured_image":   article.FeaturedImage,
			"author":           authorName,
			"category":         article.Category,
			"published_at":     article.PublishedAt,
			"event_date":       article.EventDate,
			"event_location":   article.EventLocation,
			"tags":             article.Tags,
			"meta_title":       article.MetaTitle,
			"meta_description": article.MetaDescription,
			"views":            article.Views,
		}
	}
	
	c.JSON(http.StatusOK, gin.H{
		"articles": publicArticles,
		"total":    total,
		"page":     page,
		"limit":    limit,
	})
}

// GetPublicArticle returns a single published article by slug (public API)
func GetPublicArticle(c *gin.Context) {
	slug := c.Param("slug")
	domain := c.Query("domain")
	
	if domain == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Domain parameter is required"})
		return
	}
	
	// Find website by domain
	var website models.Website
	if err := database.DB.Where("domain = ? AND active = ?", domain, true).First(&website).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Website not found"})
		return
	}
	
	// Find article
	var article models.Article
	if err := database.DB.Preload("Author").
		Where("website_id = ? AND slug = ? AND status = ?", website.ID, slug, "published").
		First(&article).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Article not found"})
		return
	}
	
	// Increment views
	database.DB.Model(&article).UpdateColumn("views", article.Views + 1)
	
	// Transform response
	authorName := "Epsilon Hellas"
	if article.Author != nil {
		authorName = article.Author.GetFullName()
	}
	
	c.JSON(http.StatusOK, gin.H{
		"id":               article.ID,
		"title":            article.Title,
		"slug":             article.Slug,
		"summary":          article.Summary,
		"content":          article.Content,
		"featured_image":   article.FeaturedImage,
		"author":           authorName,
		"category":         article.Category,
		"published_at":     article.PublishedAt,
		"event_date":       article.EventDate,
		"event_location":   article.EventLocation,
		"tags":             article.Tags,
		"meta_title":       article.MetaTitle,
		"meta_description": article.MetaDescription,
		"views":            article.Views,
	})
}

// GetPublicCategories returns available categories for a website (public API)
func GetPublicCategories(c *gin.Context) {
	domain := c.Query("domain")
	if domain == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Domain parameter is required"})
		return
	}
	
	// Find website by domain
	var website models.Website
	if err := database.DB.Where("domain = ? AND active = ?", domain, true).First(&website).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Website not found"})
		return
	}
	
	// Get distinct categories
	var categories []string
	if err := database.DB.Model(&models.Article{}).
		Select("DISTINCT category").
		Where("website_id = ? AND status = ?", website.ID, "published").
		Pluck("category", &categories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch categories"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"categories": categories})
}

// GetPublicTags returns popular tags for a website (public API)
func GetPublicTags(c *gin.Context) {
	domain := c.Query("domain")
	if domain == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Domain parameter is required"})
		return
	}
	
	// Find website by domain
	var website models.Website
	if err := database.DB.Where("domain = ? AND active = ?", domain, true).First(&website).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Website not found"})
		return
	}
	
	// Get all tags from published articles
	var articles []models.Article
	if err := database.DB.Select("tags").
		Where("website_id = ? AND status = ?", website.ID, "published").
		Find(&articles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch tags"})
		return
	}
	
	// Count tag occurrences
	tagCount := make(map[string]int)
	for _, article := range articles {
		for _, tag := range article.Tags {
			tagCount[tag]++
		}
	}
	
	// Convert to array and sort by count
	type tagInfo struct {
		Tag   string `json:"tag"`
		Count int    `json:"count"`
	}
	
	var tags []tagInfo
	for tag, count := range tagCount {
		tags = append(tags, tagInfo{Tag: tag, Count: count})
	}
	
	c.JSON(http.StatusOK, gin.H{"tags": tags})
}