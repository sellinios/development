package handlers

import (
	"encoding/json"
	"net/http"
	"github.com/gin-gonic/gin"
	"intranet/internal/database"
	"intranet/internal/models"
)

func GetUserPreference(c *gin.Context) {
	userID := c.GetUint("userID")
	key := c.Param("key")

	var preference models.UserPreference
	result := database.DB.Where("user_id = ? AND preference_key = ?", userID, key).First(&preference)
	
	if result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Preference not found"})
		return
	}

	c.JSON(http.StatusOK, preference)
}

func SaveUserPreference(c *gin.Context) {
	userID := c.GetUint("userID")
	key := c.Param("key")

	var input struct {
		Value json.RawMessage `json:"value" binding:"required"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var preference models.UserPreference
	result := database.DB.Where("user_id = ? AND preference_key = ?", userID, key).First(&preference)

	if result.Error != nil {
		preference = models.UserPreference{
			UserID:          userID,
			PreferenceKey:   key,
			PreferenceValue: input.Value,
		}
		if err := database.DB.Create(&preference).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create preference"})
			return
		}
	} else {
		preference.PreferenceValue = input.Value
		if err := database.DB.Save(&preference).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update preference"})
			return
		}
	}

	c.JSON(http.StatusOK, preference)
}