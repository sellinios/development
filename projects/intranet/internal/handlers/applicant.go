package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"intranet/internal/database"
	"intranet/internal/models"
)

// CreateApplicant handles creating a new job applicant
func CreateApplicant(c *gin.Context) {
	var req struct {
		FirstName         string `json:"firstName" binding:"required"`
		LastName          string `json:"lastName" binding:"required"`
		Email             string `json:"email" binding:"required,email"`
		Nationality       string `json:"nationality" binding:"required"`
		CurrentRank       string `json:"currentRank" binding:"required"`
		PositionApplying  string `json:"positionApplying" binding:"required"`
		PreferredShipType string `json:"preferredShipType" binding:"required"`
		Address           string `json:"address" binding:"required"`
		Telephone         string `json:"telephone" binding:"required"`
		DateOfBirth       string `json:"dateOfBirth" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Parse date of birth
	dob, err := time.Parse("2006-01-02", req.DateOfBirth)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format"})
		return
	}

	applicant := models.JobApplicant{
		FirstName:         req.FirstName,
		LastName:          req.LastName,
		Email:             req.Email,
		Nationality:       req.Nationality,
		CurrentRank:       req.CurrentRank,
		PositionApplying:  req.PositionApplying,
		PreferredShipType: req.PreferredShipType,
		Address:           req.Address,
		Telephone:         req.Telephone,
		DateOfBirth:       dob,
		Status:            "new",
	}

	if err := database.DB.Create(&applicant).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create applicant"})
		return
	}

	c.JSON(http.StatusCreated, applicant)
}

// GetApplicants handles listing all job applicants
func GetApplicants(c *gin.Context) {
	var applicants []models.JobApplicant
	query := database.DB

	// Filter by status if provided
	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	// Search by name or email
	if search := c.Query("search"); search != "" {
		searchPattern := "%" + search + "%"
		query = query.Where("first_name ILIKE ? OR last_name ILIKE ? OR email ILIKE ?", 
			searchPattern, searchPattern, searchPattern)
	}

	// Sort by created_at desc by default
	query = query.Order("created_at DESC")

	if err := query.Find(&applicants).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch applicants"})
		return
	}

	c.JSON(http.StatusOK, applicants)
}

// GetApplicant handles getting a single applicant by ID
func GetApplicant(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var applicant models.JobApplicant
	if err := database.DB.First(&applicant, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Applicant not found"})
		return
	}

	c.JSON(http.StatusOK, applicant)
}

// UpdateApplicant handles updating an applicant's status and notes
func UpdateApplicant(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var req struct {
		Status string `json:"status"`
		Notes  string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update only status and notes
	updates := map[string]interface{}{
		"status": req.Status,
		"notes":  req.Notes,
	}

	if err := database.DB.Model(&models.JobApplicant{}).Where("id = ?", id).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update applicant"})
		return
	}

	// Fetch updated applicant
	var applicant models.JobApplicant
	if err := database.DB.First(&applicant, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Applicant not found"})
		return
	}

	c.JSON(http.StatusOK, applicant)
}

// DeleteApplicant handles deleting an applicant
func DeleteApplicant(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	if err := database.DB.Delete(&models.JobApplicant{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete applicant"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Applicant deleted successfully"})
}