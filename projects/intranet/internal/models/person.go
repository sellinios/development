package models

import (
	"time"
)

// Person represents personal information separate from user authentication
type Person struct {
	ID                     uint      `gorm:"primary_key" json:"id"`
	FirstName              string    `gorm:"type:varchar(100);not null" json:"first_name"`
	LastName               string    `gorm:"type:varchar(100);not null" json:"last_name"`
	DateOfBirth            *time.Time `gorm:"type:date" json:"date_of_birth"`
	PhoneNumber            string    `gorm:"type:varchar(50)" json:"phone_number"`
	MobileNumber           string    `gorm:"type:varchar(50)" json:"mobile_number"`
	Address                string    `gorm:"type:text" json:"address"`
	City                   string    `gorm:"type:varchar(100)" json:"city"`
	State                  string    `gorm:"type:varchar(100)" json:"state"`
	Country                string    `gorm:"type:varchar(100)" json:"country"`
	PostalCode             string    `gorm:"type:varchar(20)" json:"postal_code"`
	EmergencyContactName   string    `gorm:"type:varchar(200)" json:"emergency_contact_name"`
	EmergencyContactPhone  string    `gorm:"type:varchar(50)" json:"emergency_contact_phone"`
	ProfilePicture         string    `gorm:"type:varchar(255)" json:"profile_picture"`
	CreatedAt              time.Time `json:"created_at"`
	UpdatedAt              time.Time `json:"updated_at"`
	
	// Relationships
	User       *User        `gorm:"foreignkey:PersonID" json:"user,omitempty"`
	Employment *Employment  `gorm:"foreignkey:PersonID" json:"employment,omitempty"`
}

// TableName specifies the table name for the Person model
func (Person) TableName() string {
	return "persons"
}

// FullName returns the person's full name
func (p *Person) FullName() string {
	return p.FirstName + " " + p.LastName
}