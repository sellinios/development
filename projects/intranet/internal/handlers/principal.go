package handlers

import (
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/jinzhu/gorm"
)

type PrincipalHandler struct {
	db *gorm.DB
}

type Principal struct {
	ID                              uint   `json:"system_id" gorm:"column:system_id"`
	PrincipalID                     string `json:"principal_id"`
	SoftwareID                      string `json:"software_id"`
	PrincipalGroup                 string `json:"principal_group"`
	PrincipalLogo                  string `json:"principal_logo"`
	PrincipalName                  string `json:"principal_name"`
	PrincipalOwnerCEO              string `json:"principal_owner_ceo"`
	DateEstablished                int    `json:"date_established"`
	TypeOfPrincipal                string `json:"type_of_principal"`
	PrincipalOwnedCompanies        string `json:"principal_owned_companies"`
	Ethnicity                      string `json:"ethnicity"`
	NumberOfShips                  int    `json:"number_of_ships"`
	NumberOfEpsilonShips           int    `json:"number_of_epsilon_ships"`
	ShipTypes                      string `json:"ship_types"`
	TotalDWT                       int    `json:"total_dwt"`
	TotalTEU                       int    `json:"total_teu"`
	CrewEthnicities               string `json:"crew_ethnicities"`
	Address                        string `json:"address"`
	Webpage                        string `json:"webpage"`
	Telephone                      string `json:"telephone"`
	Email                          string `json:"email"`
	GreekShippingDirectory         string `json:"greek_shipping_directory"`
	NewbuildsOrdersCount           int    `json:"newbuilds_orders_count"`
	Notes                          string `json:"notes"`
}

func NewPrincipalHandler(db *gorm.DB) *PrincipalHandler {
	return &PrincipalHandler{db: db}
}

// GetPrincipals returns all principals with their complete information
func (h *PrincipalHandler) GetPrincipals(c *gin.Context) {
	query := `
		SELECT 
			p.id as system_id,
			COALESCE(p.principal_id, '') as principal_id,
			CASE WHEN p.software_id IS NULL THEN '' ELSE CAST(p.software_id AS VARCHAR) END as software_id,
			COALESCE(g.title, '') as principal_group,
			COALESCE(p.principal_logo, '') as principal_logo,
			p.principal_name,
			COALESCE(p.principal_owner_ceo, '') as principal_owner_ceo,
			COALESCE(p.date_established, 0) as date_established,
			COALESCE(pt.title, '') as type_of_principal,
			COALESCE(p.principal_owned_companies, '') as principal_owned_companies,
			COALESCE(c.title, '') as ethnicity,
			COALESCE(p.no_of_ships_total, 0) as number_of_ships,
			COALESCE(p.no_of_epsilon_ships, 0) as number_of_epsilon_ships,
			'' as ship_types,
			COALESCE(p.total_dwt, 0) as total_dwt,
			COALESCE(p.total_teu, 0) as total_teu,
			'' as crew_ethnicities,
			COALESCE(p.address, '') as address,
			COALESCE(p.webpage, '') as webpage,
			COALESCE(p.telephone, '') as telephone,
			COALESCE(p.email, '') as email,
			COALESCE(p.greek_shipping_directory, '') as greek_shipping_directory,
			COALESCE(p.newbuilds_orders_count, 0) as newbuilds_orders_count,
			COALESCE(p.notes, '') as notes
		FROM principals p
		LEFT JOIN groups_of_principals g ON p.group_id = g.id
		LEFT JOIN principal_types pt ON p.type_of_principal_id = pt.id
		LEFT JOIN countries c ON p.ethnicity_id = c.id
		WHERE (p.is_active = true OR p.is_active IS NULL) AND (p.deleted_at IS NULL)
		ORDER BY (p.software_id IS NOT NULL) DESC, g.title, p.principal_name
	`

	var principals []Principal
	if err := h.db.Raw(query).Scan(&principals).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch principals: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, principals)
}

// GetPrincipal returns a single principal by ID
func (h *PrincipalHandler) GetPrincipal(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid principal ID"})
		return
	}

	query := `
		SELECT 
			pa.system_id,
			pa.principal_id,
			pa.is_already_customer,
			pa.principal_group,
			pa.principal_name,
			pa.principal_owner_ceo,
			pa.date_established,
			pa.type_of_principal,
			pa.ethnicity,
			pa.number_of_ships,
			pa.total_dwt,
			pa.address,
			pa.webpage,
			pa.telephone,
			pa.email,
			pst.ship_types,
			pce.crew_ethnicities,
			pa.notes
		FROM v_principal_accounts pa
		LEFT JOIN v_principal_ship_types pst ON pa.system_id = pst.principal_id
		LEFT JOIN v_principal_crew_ethnicities pce ON pa.system_id = pce.principal_id
		WHERE pa.system_id = ? AND pa.is_active = true
	`

	var principal Principal
	if err := h.db.Raw(query, id).Scan(&principal).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Principal not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch principal"})
		return
	}

	c.JSON(http.StatusOK, principal)
}

// CreatePrincipal creates a new principal
func (h *PrincipalHandler) CreatePrincipal(c *gin.Context) {
	var input struct {
		PrincipalName     string `json:"principal_name" binding:"required"`
		PrincipalGroup    string `json:"principal_group"`
		SoftwareID        string `json:"software_id"`
		GroupID           *uint  `json:"group_id"`
		PrincipalOwnerCEO string `json:"principal_owner_ceo"`
		DateEstablished   *int   `json:"date_established"`
		TypeOfPrincipal   string `json:"type_of_principal"`
		Ethnicity         string `json:"ethnicity"`
		Email             string `json:"email"`
		Telephone         string `json:"telephone"`
		Address           string `json:"address"`
		Webpage           string `json:"webpage"`
		Notes             string `json:"notes"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Insert the new principal
	query := `
		INSERT INTO principals (
			principal_name, principal_group, software_id, group_id, 
			principal_owner_ceo, date_established, type_of_principal,
			ethnicity, email, telephone, address, webpage, notes
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		RETURNING id
	`

	var principalID uint
	err := h.db.Raw(query, 
		input.PrincipalName, input.PrincipalGroup, input.SoftwareID,
		input.GroupID, input.PrincipalOwnerCEO, input.DateEstablished,
		input.TypeOfPrincipal, input.Ethnicity, input.Email, 
		input.Telephone, input.Address, input.Webpage, input.Notes,
	).Scan(&principalID).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create principal"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"id": principalID})
}

// UpdatePrincipal updates an existing principal
func (h *PrincipalHandler) UpdatePrincipal(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid principal ID"})
		return
	}

	var input map[string]interface{}
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Build update query dynamically based on provided fields
	updates := make(map[string]interface{})
	allowedFields := []string{
		"principal_id", "principal_name", "software_id", 
		"group_id", "type_of_principal_id", "ethnicity_id",
		"principal_logo", "principal_owner_ceo", "date_established",
		"principal_owned_companies", "no_of_ships_total", 
		"no_of_epsilon_ships", "total_dwt", "total_teu",
		"email", "telephone", "address", "webpage", 
		"greek_shipping_directory", "newbuilds_orders_count", "notes",
	}

	for _, field := range allowedFields {
		if val, ok := input[field]; ok {
			// Handle null/nil values for numeric fields
			if field == "software_id" && (val == nil || val == "") {
				updates[field] = nil
			} else {
				updates[field] = val
			}
		}
	}
	
	// Log the updates for debugging
	c.Header("X-Debug-Updates", fmt.Sprintf("%v", updates))

	if len(updates) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No fields to update"})
		return
	}

	if err := h.db.Table("principals").Where("id = ?", id).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update principal: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Principal updated successfully"})
}

// GetPrincipalGroups returns all principal groups
func (h *PrincipalHandler) GetPrincipalGroups(c *gin.Context) {
	type Group struct {
		ID    uint   `json:"id"`
		Title string `json:"title"`
	}

	var groups []Group
	query := `SELECT id, title FROM groups_of_principals WHERE is_active = true ORDER BY title`
	
	if err := h.db.Raw(query).Scan(&groups).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch principal groups"})
		return
	}

	c.JSON(http.StatusOK, groups)
}

// GetPrincipalTypes returns all principal types
func (h *PrincipalHandler) GetPrincipalTypes(c *gin.Context) {
	type PrincipalType struct {
		ID    uint   `json:"id"`
		Title string `json:"title"`
	}

	var types []PrincipalType
	query := `SELECT id, title FROM principal_types WHERE is_active = true ORDER BY title`
	
	if err := h.db.Raw(query).Scan(&types).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch principal types"})
		return
	}

	c.JSON(http.StatusOK, types)
}

// GetEthnicities returns all ethnicities (countries)
func (h *PrincipalHandler) GetEthnicities(c *gin.Context) {
	type Ethnicity struct {
		ID    uint   `json:"id"`
		Title string `json:"title"`
	}

	var ethnicities []Ethnicity
	query := `
		SELECT id, title 
		FROM countries 
		WHERE is_active = true 
		ORDER BY 
			CASE WHEN LOWER(title) IN ('greek', 'greece') THEN 0 ELSE 1 END,
			title
	`
	
	if err := h.db.Raw(query).Scan(&ethnicities).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch ethnicities"})
		return
	}

	c.JSON(http.StatusOK, ethnicities)
}

// DeletePrincipal soft deletes a principal
func (h *PrincipalHandler) DeletePrincipal(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid principal ID"})
		return
	}

	// Soft delete by setting deleted_at and is_active = false
	query := `
		UPDATE principals 
		SET deleted_at = NOW(), is_active = false 
		WHERE id = ?
	`

	if err := h.db.Exec(query, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete principal"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Principal deleted successfully"})
}