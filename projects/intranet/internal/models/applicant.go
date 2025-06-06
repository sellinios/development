package models

import (
	"time"
)

// JobApplicant represents a job application
type JobApplicant struct {
	ID                uint      `json:"id" gorm:"primaryKey"`
	FirstName         string    `json:"first_name" gorm:"not null"`
	LastName          string    `json:"last_name" gorm:"not null"`
	Email             string    `json:"email" gorm:"not null"`
	Nationality       string    `json:"nationality" gorm:"not null"`
	CurrentRank       string    `json:"current_rank" gorm:"not null"`
	PositionApplying  string    `json:"position_applying" gorm:"not null"`
	PreferredShipType string    `json:"preferred_ship_type" gorm:"not null"`
	Address           string    `json:"address" gorm:"not null"`
	Telephone         string    `json:"telephone" gorm:"not null"`
	DateOfBirth       time.Time `json:"date_of_birth" gorm:"not null"`
	Status            string    `json:"status" gorm:"default:'new'"`
	Notes             string    `json:"notes"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

// TableName specifies the table name for GORM
func (JobApplicant) TableName() string {
	return "job_applicants"
}