package models

import (
	"time"
	"github.com/google/uuid"
)

// Employment represents a person's employment information
type Employment struct {
	ID             uint       `gorm:"primary_key" json:"id"`
	PersonID       uint       `gorm:"not null" json:"person_id"`
	EntityID       *uuid.UUID `gorm:"type:uuid" json:"entity_id"`
	PositionID     *uint      `json:"position_id"`
	EmploymentType string     `gorm:"type:varchar(50);not null;default:'full_time'" json:"employment_type"`
	DateHired      time.Time  `gorm:"type:date;not null" json:"date_hired"`
	DateTerminated *time.Time `gorm:"type:date" json:"date_terminated"`
	LeaveBalance   float64    `gorm:"type:decimal(5,2);default:0" json:"leave_balance"`
	IsCurrent      bool       `gorm:"default:true" json:"is_current"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
	
	// Relationships
	Person   Person   `gorm:"foreignkey:PersonID" json:"person"`
	Entity   *Entity  `gorm:"foreignkey:EntityID" json:"entity,omitempty"`
	Position *Position `gorm:"foreignkey:PositionID" json:"position,omitempty"`
}

// TableName specifies the table name for the Employment model
func (Employment) TableName() string {
	return "employments"
}

// EmploymentType constants
const (
	EmploymentTypeFullTime  = "full_time"
	EmploymentTypePartTime  = "part_time"
	EmploymentTypeContract  = "contract"
	EmploymentTypeIntern    = "intern"
	EmploymentTypeConsultant = "consultant"
)