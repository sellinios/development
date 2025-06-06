package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"intranet/internal/database"
	"intranet/internal/models"
)

type ShipWithPrincipal struct {
	models.Ship
	PrincipalName string `json:"principal_name"`
}

func GetShips(c *gin.Context) {
	type ShipResponse struct {
		ID                           uint       `json:"id"`
		PrincipalID                  uint       `json:"principal_id"`
		PrincipalName                string     `json:"principal_name"`
		ShipName                     string     `json:"ship_name"`
		ShipIMO                      *int       `json:"ship_imo"`
		PIClub                       string     `json:"pi_club"`
		ShipType                     string     `json:"ship_type"`
		ShipSpecificCharacterization string     `json:"ship_specific_characterization"`
		Flags                        string     `json:"flags"`
		Classification               string     `json:"classification"`
		DwtTeu                       string     `json:"dwt_teu"`
		ShipConstructionDate         *time.Time `json:"ship_construction_date"`
		CBACoverage                  string     `json:"cba_coverage"`
		TypeOfCBA                    string     `json:"type_of_cba"`
		ForthcomingDryDockDate       *time.Time `json:"forthcoming_dry_dock_date"`
		VettingProcedure             bool       `json:"vetting_procedure"`
		ForthcomingVetting           string     `json:"forthcoming_vetting"`
		Engines                      string     `json:"engines"`
		ConventionalOrElectronic     string     `json:"conventional_or_electronic"`
		EngineTierCategory           string     `json:"engine_tier_category"`
		DualFuel                     bool       `json:"dual_fuel"`
		FuelType                     string     `json:"fuel_type"`
		CranesAboard                 bool       `json:"cranes_aboard"`
		BallastWaterMgmtSystem       string     `json:"ballast_water_mgmt_system"`
		ECDIS                        string     `json:"ecdis"`
		Scrubber                     bool       `json:"scrubber"`
		ScrubberType                 string     `json:"scrubber_type"`
	}
	
	var results []ShipResponse
	
	// Simplified query with actual database columns
	query := database.DB.Table("ships").
		Select(`ships.id, 
			ships.principal_id, 
			COALESCE(principals.principal_name, '') as principal_name,
			ships.ship_name, 
			ships.ship_imo, 
			'' as pi_club,
			COALESCE(st.title, 'BULK') as ship_type,
			'' as ship_specific_characterization,
			'' as flags,
			'' as classification,
			COALESCE(ships.dwt_teu, '') as dwt_teu,
			ships.ship_constr_date as ship_construction_date,
			CASE WHEN ships.cba_coverage = true THEN 'YES' ELSE 'NO' END as cba_coverage,
			COALESCE(ships.type_of_cba, '') as type_of_cba,
			NULL::timestamp as forthcoming_dry_dock_date,
			false as vetting_procedure,
			'' as forthcoming_vetting,
			COALESCE(ships.engine, '') as engines,
			'' as conventional_or_electronic,
			'' as engine_tier_category,
			false as dual_fuel,
			'DIESEL' as fuel_type,
			false as cranes_aboard,
			'' as ballast_water_mgmt_system,
			'' as ecdis,
			false as scrubber,
			'' as scrubber_type`).
		Joins("LEFT JOIN principals ON ships.principal_id = principals.id").
		Joins("LEFT JOIN ship_types st ON ships.ship_type_id = st.id").
		Where("ships.deleted_at IS NULL")
	
	if principalID := c.Query("principal_id"); principalID != "" {
		query = query.Where("ships.principal_id = ?", principalID)
	}
	
	if err := query.Scan(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch ships"})
		return
	}
	
	c.JSON(http.StatusOK, results)
}

func GetShip(c *gin.Context) {
	id := c.Param("id")
	
	var result struct {
		models.Ship
		PrincipalName string `json:"principal_name"`
	}
	
	if err := database.DB.Table("ships").
		Select("ships.*, COALESCE(principals.principal_name, '') as principal_name").
		Joins("LEFT JOIN principals ON ships.principal_id = principals.id").
		Where("ships.id = ?", id).
		First(&result).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ship not found"})
		return
	}
	
	c.JSON(http.StatusOK, result)
}

func CreateShip(c *gin.Context) {
	var ship models.Ship
	
	if err := c.ShouldBindJSON(&ship); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	if err := database.DB.Create(&ship).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create ship"})
		return
	}
	
	c.JSON(http.StatusCreated, ship)
}

func UpdateShip(c *gin.Context) {
	id := c.Param("id")
	
	var ship models.Ship
	if err := database.DB.First(&ship, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Ship not found"})
		return
	}
	
	var updateData models.Ship
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	if err := database.DB.Model(&ship).Updates(updateData).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update ship"})
		return
	}
	
	c.JSON(http.StatusOK, ship)
}

func DeleteShip(c *gin.Context) {
	id := c.Param("id")
	
	if err := database.DB.Delete(&models.Ship{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete ship"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Ship deleted successfully"})
}