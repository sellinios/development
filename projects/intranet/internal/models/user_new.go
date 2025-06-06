package models

import (
	"time"
	"golang.org/x/crypto/bcrypt"
	"github.com/google/uuid"
)

// UserNew represents a user account for authentication (new clean structure)
type UserNew struct {
	ID                  uint           `gorm:"primary_key" json:"id"`
	Username            string         `gorm:"type:varchar(100);unique;not null" json:"username"`
	Email               string         `gorm:"type:varchar(255);unique;not null" json:"email"`
	Password            string         `gorm:"type:varchar(255);not null" json:"-"`
	PersonID            *uint          `gorm:"unique" json:"person_id"`
	Role                string         `gorm:"type:varchar(50);default:'employee'" json:"role"`
	Active              bool           `gorm:"default:true" json:"active"`
	LastLogin           *time.Time     `json:"last_login"`
	FailedLoginAttempts int            `gorm:"default:0" json:"failed_login_attempts"`
	LockedUntil         *time.Time     `json:"locked_until"`
	CreatedAt           time.Time      `json:"created_at"`
	UpdatedAt           time.Time      `json:"updated_at"`
	DeletedAt           *time.Time     `sql:"index" json:"deleted_at,omitempty"`
	
	// Relationships
	Person        *Person         `gorm:"foreignkey:PersonID" json:"person,omitempty"`
	Entities      []UserEntity    `gorm:"foreignkey:UserID" json:"entities,omitempty"`
	Sessions      []Session       `gorm:"foreignkey:UserID" json:"sessions,omitempty"`
	AuditLogs     []AuditLog      `gorm:"foreignkey:UserID" json:"audit_logs,omitempty"`
}

// TableName overrides the table name
func (UserNew) TableName() string {
	return "users"
}

// Session represents an active user session
type Session struct {
	ID        uuid.UUID  `gorm:"primary_key;type:uuid;default:uuid_generate_v4()" json:"id"`
	UserID    uint       `gorm:"not null" json:"user_id"`
	Token     string     `gorm:"type:varchar(500);unique;not null" json:"token"`
	IPAddress string     `gorm:"type:inet" json:"ip_address"`
	UserAgent string     `gorm:"type:text" json:"user_agent"`
	ExpiresAt time.Time  `gorm:"not null" json:"expires_at"`
	CreatedAt time.Time  `json:"created_at"`
	
	// Relationships
	User UserNew `gorm:"foreignkey:UserID" json:"user,omitempty"`
}

// AuditLog represents an audit trail entry
type AuditLog struct {
	ID        uint       `gorm:"primary_key" json:"id"`
	UserID    *uint      `json:"user_id"`
	Action    string     `gorm:"type:varchar(100);not null" json:"action"`
	TableName string     `gorm:"type:varchar(100)" json:"table_name"`
	RecordID  *uint      `json:"record_id"`
	OldValues *string    `gorm:"type:jsonb" json:"old_values,omitempty"`
	NewValues *string    `gorm:"type:jsonb" json:"new_values,omitempty"`
	IPAddress string     `gorm:"type:inet" json:"ip_address"`
	UserAgent string     `gorm:"type:text" json:"user_agent"`
	CreatedAt time.Time  `json:"created_at"`
	
	// Relationships
	User *UserNew `gorm:"foreignkey:UserID" json:"user,omitempty"`
}

// HashPassword hashes a user's password
func (u *UserNew) HashPassword() error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(hashedPassword)
	return nil
}

// CheckPassword compares a hashed password with a plaintext password
func (u *UserNew) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
	return err == nil
}

// GetFullName returns the person's full name (if person is loaded)
func (u *UserNew) GetFullName() string {
	if u.Person != nil {
		return u.Person.FullName()
	}
	return u.Email // Fallback to email if person not loaded
}

// IsLocked checks if the account is locked
func (u *UserNew) IsLocked() bool {
	if u.LockedUntil == nil {
		return false
	}
	return u.LockedUntil.After(time.Now())
}

// Lock locks the account for a specified duration
func (u *UserNew) Lock(duration time.Duration) {
	lockUntil := time.Now().Add(duration)
	u.LockedUntil = &lockUntil
}

// Unlock unlocks the account
func (u *UserNew) Unlock() {
	u.LockedUntil = nil
	u.FailedLoginAttempts = 0
}

// RecordLogin records a successful login
func (u *UserNew) RecordLogin() {
	now := time.Now()
	u.LastLogin = &now
	u.FailedLoginAttempts = 0
}

// RecordFailedLogin records a failed login attempt
func (u *UserNew) RecordFailedLogin() {
	u.FailedLoginAttempts++
	// Lock account after 5 failed attempts
	if u.FailedLoginAttempts >= 5 {
		u.Lock(30 * time.Minute) // Lock for 30 minutes
	}
}