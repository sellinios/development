package models

import (
	"time"

	"github.com/jinzhu/gorm"
)

type Ship struct {
	gorm.Model
	PrincipalID                 uint       `json:"principal_id"`
	PrincipalName              string     `json:"principal_name" gorm:"type:varchar(255)"`
	ShipName                   string     `json:"ship_name" gorm:"type:varchar(255);not null"`
	ShipIMO                    *int       `json:"ship_imo"`
	PIClub                     string     `json:"pi_club" gorm:"type:varchar(255)"`
	ShipType                   string     `json:"ship_type" gorm:"type:varchar(50)"` // DRY, WET, PASSENGER, OTHER
	ShipSpecificCharacterization string    `json:"ship_specific_characterization" gorm:"type:varchar(255)"`
	Flags                      string     `json:"flags" gorm:"type:text"` // JSON array of flags
	Classification             string     `json:"classification" gorm:"type:varchar(255)"`
	DwtTeu                     string     `json:"dwt_teu" gorm:"type:varchar(100)"`
	ShipConstructionDate       *time.Time `json:"ship_construction_date"`
	CBACoverage                string     `json:"cba_coverage" gorm:"type:varchar(10)"` // YES, NO
	TypeOfCBA                  string     `json:"type_of_cba" gorm:"type:varchar(255)"`
	ForthcomingDryDockDate     *time.Time `json:"forthcoming_dry_dock_date"`
	VettingProcedure           bool       `json:"vetting_procedure" gorm:"default:false"`
	ForthcomingVetting         string     `json:"forthcoming_vetting" gorm:"type:varchar(50)"` // quarter
	Engines                    string     `json:"engines" gorm:"type:varchar(255)"`
	ConventionalOrElectronic   string     `json:"conventional_or_electronic" gorm:"type:varchar(50)"`
	EngineTierCategory         string     `json:"engine_tier_category" gorm:"type:varchar(10)"` // 1, 2, 3
	DualFuel                   bool       `json:"dual_fuel" gorm:"default:false"`
	FuelType                   string     `json:"fuel_type" gorm:"type:varchar(50)"` // DIESEL, METHANOL, LPG, LNG, HYDROGEN, OTHER
	CranesAboard               bool       `json:"cranes_aboard" gorm:"default:false"`
	BallastWaterMgmtSystem     string     `json:"ballast_water_mgmt_system" gorm:"type:varchar(255)"`
	ECDIS                      string     `json:"ecdis" gorm:"type:varchar(255)"`
	Scrubber                   bool       `json:"scrubber" gorm:"default:false"`
	ScrubberType               string     `json:"scrubber_type" gorm:"type:varchar(50)"` // Hybrid, Open, Closed
}