package models

import (
	"time"

	"github.com/jinzhu/gorm"
)

// LeaveType represents different types of leave (vacation, sick, etc.)
type LeaveType struct {
	gorm.Model
	Name        string  `json:"name" gorm:"type:varchar(50);unique;not null"`
	Description string  `json:"description" gorm:"type:text"`
	DefaultDays float64 `json:"default_days"` // Default annual allocation
	Paid        bool    `json:"paid"`
	Color       string  `json:"color" gorm:"type:varchar(20)"` // For UI display
}

// LeaveRequest represents a request for time off
type LeaveRequest struct {
	gorm.Model
	UserID      uint      `json:"user_id"`
	User        User      `json:"user" gorm:"foreignKey:UserID"`
	LeaveTypeID uint      `json:"leave_type_id"`
	LeaveType   LeaveType `json:"leave_type" gorm:"foreignKey:LeaveTypeID"`
	StartDate   time.Time `json:"start_date" gorm:"not null"`
	EndDate     time.Time `json:"end_date" gorm:"not null"`
	Duration    float64   `json:"duration"` // In days (can be fractional for half days)
	Reason      string    `json:"reason" gorm:"type:text"`
	Status      string    `json:"status" gorm:"type:varchar(20);default:'pending'"` // pending, approved, rejected
	ApproverID  *uint     `json:"approver_id"`
	Approver    *User     `json:"approver" gorm:"foreignKey:ApproverID"`
	ApprovedAt  *time.Time `json:"approved_at"`
	Comments    string    `json:"comments" gorm:"type:text"` // Comments from approver
}

// LeaveBalance tracks an employee's leave balance for a specific year
type LeaveBalance struct {
	gorm.Model
	UserID       uint      `json:"user_id"`
	User         User      `json:"user" gorm:"foreignKey:UserID"`
	LeaveTypeID  uint      `json:"leave_type_id"`
	LeaveType    LeaveType `json:"leave_type" gorm:"foreignKey:LeaveTypeID"`
	Year         int       `json:"year" gorm:"not null"`
	InitialDays  float64   `json:"initial_days"` // Starting balance
	UsedDays     float64   `json:"used_days"`    // Days used so far
	AccruedDays  float64   `json:"accrued_days"` // Additional days accrued during the year
	CarriedDays  float64   `json:"carried_days"` // Days carried over from previous year
	ExpiryDate   *time.Time `json:"expiry_date"` // When carried days expire
}

// LeavePolicy defines company-wide leave policies
type LeavePolicy struct {
	gorm.Model
	Name                string  `json:"name" gorm:"type:varchar(100);not null"`
	Description         string  `json:"description" gorm:"type:text"`
	MaxCarryoverDays    float64 `json:"max_carryover_days"` // Maximum days that can be carried over
	CarryoverExpiryDays int     `json:"carryover_expiry_days"` // Days until carried days expire
	MinAdvanceNotice    int     `json:"min_advance_notice"` // Minimum days of notice required
	MaxConsecutiveDays  int     `json:"max_consecutive_days"` // Maximum consecutive days allowed
	Active              bool    `json:"active" gorm:"default:true"`
}

// Holiday represents company holidays
type Holiday struct {
	gorm.Model
	Name        string    `json:"name" gorm:"type:varchar(100);not null"`
	Date        time.Time `json:"date" gorm:"not null"`
	Description string    `json:"description" gorm:"type:text"`
	Recurring   bool      `json:"recurring"` // If true, holiday repeats annually
}