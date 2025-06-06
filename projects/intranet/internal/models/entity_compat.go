package models

import (
	"time"
)

// EntityCompat represents the current database schema for entities
type EntityCompat struct {
	ID          int            `json:"id" gorm:"primary_key"`
	ParentID    *int           `json:"parent_id"`
	Parent      *EntityCompat  `json:"parent,omitempty" gorm:"foreignKey:ParentID"`
	Children    []EntityCompat `json:"children,omitempty" gorm:"foreignKey:ParentID"`
	Name        string         `json:"name" gorm:"not null"`
	Code        string         `json:"code" gorm:"unique;not null"`
	Type        string         `json:"type" gorm:"not null"`
	Description string         `json:"description"`
	IsActive    bool           `json:"active" gorm:"column:is_active;default:true"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	CreatedBy   string         `json:"created_by"`
	UpdatedBy   string         `json:"updated_by"`
	DeletedAt   *time.Time     `json:"deleted_at"`
	Version     int            `json:"version" gorm:"default:1"`
}

// TableName specifies the table name for EntityCompat
func (EntityCompat) TableName() string {
	return "entities"
}