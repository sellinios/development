package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"intranet/internal/database"
	"intranet/internal/models"
)

// GetPositions handles getting all positions
func GetPositions(c *gin.Context) {
	var positions []models.Position

	if err := database.DB.Find(&positions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get positions"})
		return
	}

	c.JSON(http.StatusOK, positions)
}

// GetPosition handles getting a single position by ID
func GetPosition(c *gin.Context) {
	id := c.Param("id")
	
	var position models.Position
	if err := database.DB.First(&position, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Position not found"})
		return
	}

	c.JSON(http.StatusOK, position)
}

// CreatePositionRequest represents the request body for creating a position
type CreatePositionRequest struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	Level       int    `json:"level"`
}

// CreatePosition handles creating a new position
func CreatePosition(c *gin.Context) {
	var req CreatePositionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if position with the same title exists
	var existingPos models.Position
	result := database.DB.Where("title = ?", req.Title).First(&existingPos)
	if result.Error == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Position with this title already exists"})
		return
	}

	// Create new position
	position := models.Position{
		Title:       req.Title,
		Description: req.Description,
		Level:       req.Level,
	}

	// Save position
	if err := database.DB.Create(&position).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create position"})
		return
	}

	c.JSON(http.StatusCreated, position)
}

// UpdatePositionRequest represents the request body for updating a position
type UpdatePositionRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Level       *int   `json:"level"`
}

// UpdatePosition handles updating a position
func UpdatePosition(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid position ID"})
		return
	}

	var req UpdatePositionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if position exists
	var position models.Position
	if err := database.DB.First(&position, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Position not found"})
		return
	}

	// Check if title is already taken by another position
	if req.Title != "" && req.Title != position.Title {
		var existingPos models.Position
		result := database.DB.Where("title = ? AND id != ?", req.Title, id).First(&existingPos)
		if result.Error == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Position with this title already exists"})
			return
		}
	}

	// Update fields if provided
	if req.Title != "" {
		position.Title = req.Title
	}
	if req.Description != "" {
		position.Description = req.Description
	}
	if req.Level != nil {
		position.Level = *req.Level
	}

	// Save position
	if err := database.DB.Save(&position).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update position"})
		return
	}

	c.JSON(http.StatusOK, position)
}

// DeletePosition handles deleting a position
func DeletePosition(c *gin.Context) {
	id := c.Param("id")
	
	// Check if position exists
	var position models.Position
	if err := database.DB.First(&position, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Position not found"})
		return
	}

	// Check if position has associated users
	var count int64
	database.DB.Model(&models.User{}).Where("position_id = ?", id).Count(&count)
	if count > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete position with associated users"})
		return
	}

	// Delete the position
	if err := database.DB.Delete(&position).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete position"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Position deleted successfully"})
}