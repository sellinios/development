package models

import (
	"time"
)

// Notification represents a system notification
type Notification struct {
	ID          uint      `gorm:"primary_key" json:"id"`
	UserID      uint      `gorm:"not null" json:"user_id"`
	Type        string    `gorm:"type:varchar(50);not null" json:"type"` // employee_needs_user, system_message, etc.
	Title       string    `gorm:"type:varchar(255);not null" json:"title"`
	Message     string    `gorm:"type:text;not null" json:"message"`
	RelatedType string    `gorm:"type:varchar(50)" json:"related_type"` // employee, user, etc.
	RelatedID   uint      `json:"related_id"`
	Read        bool      `gorm:"default:false" json:"read"`
	ReadAt      *time.Time `json:"read_at"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	
	// Relationships
	User UserNew `gorm:"foreignkey:UserID" json:"user,omitempty"`
}

// TableName specifies the table name
func (Notification) TableName() string {
	return "notifications"
}