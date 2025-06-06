package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"
)

// Role represents a system role
type Role struct {
	ID          uint        `json:"id" gorm:"primary_key"`
	Name        string      `json:"name" gorm:"type:varchar(50);unique;not null"`
	DisplayName string      `json:"display_name" gorm:"type:varchar(100);not null"`
	Description string      `json:"description" gorm:"type:text"`
	Permissions Permissions `json:"permissions" gorm:"type:jsonb"`
	CreatedAt   time.Time   `json:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at"`
}

// UserRole represents the many-to-many relationship between users and roles
type UserRole struct {
	ID               uint      `json:"id" gorm:"primary_key"`
	UserID          uint      `json:"user_id" gorm:"not null"`
	RoleID          uint      `json:"role_id" gorm:"not null"`
	AssignedAt      time.Time `json:"assigned_at"`
	AssignedBy      *uint     `json:"assigned_by"`
	User            User      `json:"user,omitempty" gorm:"foreignkey:UserID"`
	Role            Role      `json:"role,omitempty" gorm:"foreignkey:RoleID"`
	AssignedByUser  *User     `json:"assigned_by_user,omitempty" gorm:"foreignkey:AssignedBy"`
}

// Permissions represents the JSON permissions structure
type Permissions map[string][]string

// Scan implements the sql.Scanner interface for Permissions
func (p *Permissions) Scan(value interface{}) error {
	if value == nil {
		*p = make(Permissions)
		return nil
	}
	
	switch v := value.(type) {
	case []byte:
		return json.Unmarshal(v, p)
	case string:
		return json.Unmarshal([]byte(v), p)
	default:
		return json.Unmarshal([]byte("{}"), p)
	}
}

// Value implements the driver.Valuer interface for Permissions
func (p Permissions) Value() (driver.Value, error) {
	if p == nil {
		return "{}", nil
	}
	return json.Marshal(p)
}

// HasPermission checks if a role has a specific permission
func (r *Role) HasPermission(resource string, action string) bool {
	if r.Permissions == nil {
		return false
	}
	
	actions, exists := r.Permissions[resource]
	if !exists {
		return false
	}
	
	for _, a := range actions {
		if a == action || a == "*" {
			return true
		}
	}
	
	return false
}

// TableName specifies the table name for UserRole
func (UserRole) TableName() string {
	return "user_roles"
}