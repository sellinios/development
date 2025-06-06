package models

import (
	"encoding/json"
	"time"
)

// UserPreference stores user-specific preferences
type UserPreference struct {
	ID              uint            `json:"id" gorm:"primaryKey"`
	UserID          uint            `json:"user_id" gorm:"index;not null"`
	PreferenceKey   string          `json:"preference_key" gorm:"not null"`
	PreferenceValue json.RawMessage `json:"preference_value" gorm:"type:jsonb"`
	CreatedAt       time.Time       `json:"created_at"`
	UpdatedAt       time.Time       `json:"updated_at"`
	
	// Add unique constraint on user_id and preference_key
	User UserNew `json:"-" gorm:"foreignKey:UserID"`
}

// TableName specifies the table name for UserPreference
func (UserPreference) TableName() string {
	return "user_preferences"
}