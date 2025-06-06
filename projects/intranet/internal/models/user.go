package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/jinzhu/gorm"
	"golang.org/x/crypto/bcrypt"
)

// User represents a user in the system (employee, admin, etc.)
type User struct {
	gorm.Model
	FirstName         string         `json:"first_name"`
	LastName          string         `json:"last_name"`
	Email             string         `json:"email" gorm:"type:varchar(100);unique;not null"`
	Password          string         `json:"-" gorm:"not null"` // Never expose in JSON responses
	Role              string         `json:"role"`              // superadmin, admin, manager, employee, etc.
	EntityID          *uuid.UUID     `json:"entity_id" gorm:"type:uuid"` // Primary entity assignment
	Entity            *Entity        `json:"entity,omitempty" gorm:"foreignKey:EntityID"`
	PositionID        uint           `json:"position_id"`
	Position          Position       `json:"position" gorm:"foreignKey:PositionID"`
	DateHired         time.Time      `json:"date_hired"`
	LeaveBalance      float64        `json:"leave_balance"`
	ProfilePicture    string         `json:"profile_picture"`
	PhoneNumber       string         `json:"phone_number"`
	Address           string         `json:"address"`
	Active            bool           `json:"active" gorm:"default:true"`
	CurrentEntityID   *uuid.UUID     `json:"current_entity_id" gorm:"type:uuid"`
	CurrentEntity     *Entity        `json:"current_entity,omitempty" gorm:"foreignKey:CurrentEntityID"`
	LastEntitySwitch  *time.Time     `json:"last_entity_switch"`
	Entities          []UserEntity   `json:"entities,omitempty" gorm:"foreignKey:UserID"`
}

// TableName specifies the table name for the User model to use the view
func (User) TableName() string {
	return "users_view"
}

// Note: Department functionality has been migrated to Entity model with type='department'

// Position represents a job position in the organization
type Position struct {
	ID          uint      `gorm:"primary_key" json:"id"`
	Title       string    `json:"title" gorm:"type:varchar(100);not null"`
	Description string    `json:"description" gorm:"type:text"`
	Level       int       `json:"level"` // For hierarchy, e.g. 1 = entry, 5 = senior
	Active      bool      `json:"active" gorm:"default:true"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Skill represents a skill or knowledge area that employees can possess
type Skill struct {
	gorm.Model
	Name        string `json:"name" gorm:"type:varchar(100);unique;not null"`
	Description string `json:"description" gorm:"type:text"`
	Category    string `json:"category" gorm:"type:varchar(50)"` // Technical, Soft Skill, etc.
}

// UserSkill is a many-to-many relationship between users and skills
type UserSkill struct {
	gorm.Model
	UserID     uint      `json:"user_id"`
	User       User      `json:"-" gorm:"foreignKey:UserID"`
	SkillID    uint      `json:"skill_id"`
	Skill      Skill     `json:"skill" gorm:"foreignKey:SkillID"`
	Level      int       `json:"level"` // 1-5 proficiency level
	Certified  bool      `json:"certified"`
	AcquiredAt time.Time `json:"acquired_at,omitempty"`
}

// HashPassword hashes a user's password
func (u *User) HashPassword() error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(hashedPassword)
	return nil
}

// CheckPassword compares a hashed password with a plaintext password
func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
	return err == nil
}