package models

import (
	"time"

	"github.com/jinzhu/gorm"
)

// Customer represents a client or potential client in the CRM
type Customer struct {
	gorm.Model
	CompanyName    string `json:"company_name" gorm:"type:varchar(100)"`
	Industry       string `json:"industry" gorm:"type:varchar(50)"`
	Website        string `json:"website" gorm:"type:varchar(100)"`
	Phone          string `json:"phone" gorm:"type:varchar(20)"`
	Email          string `json:"email" gorm:"type:varchar(100)"`
	Address        string `json:"address" gorm:"type:text"`
	City           string `json:"city" gorm:"type:varchar(50)"`
	State          string `json:"state" gorm:"type:varchar(50)"`
	PostalCode     string `json:"postal_code" gorm:"type:varchar(20)"`
	Country        string `json:"country" gorm:"type:varchar(50)"`
	Size           string `json:"size" gorm:"type:varchar(20)"` // Small, Medium, Enterprise
	AnnualRevenue  float64 `json:"annual_revenue"`
	Source         string `json:"source" gorm:"type:varchar(50)"` // How they found us
	AssignedUserID *uint   `json:"assigned_user_id"` 
	AssignedUser   *User   `json:"assigned_user" gorm:"foreignKey:AssignedUserID"`
	Status         string `json:"status" gorm:"type:varchar(20);default:'lead'"` // lead, prospect, customer, inactive
	Notes          string `json:"notes" gorm:"type:text"`
}

// Contact represents a person at a customer organization
type Contact struct {
	gorm.Model
	CustomerID     uint     `json:"customer_id"`
	Customer       Customer `json:"customer" gorm:"foreignKey:CustomerID"`
	FirstName      string   `json:"first_name" gorm:"type:varchar(50)"`
	LastName       string   `json:"last_name" gorm:"type:varchar(50)"`
	JobTitle       string   `json:"job_title" gorm:"type:varchar(100)"`
	Email          string   `json:"email" gorm:"type:varchar(100)"`
	Phone          string   `json:"phone" gorm:"type:varchar(20)"`
	Mobile         string   `json:"mobile" gorm:"type:varchar(20)"`
	IsPrimary      bool     `json:"is_primary" gorm:"default:false"`
	LastContactedAt *time.Time `json:"last_contacted_at"`
	Notes          string   `json:"notes" gorm:"type:text"`
}

// Opportunity represents a sales opportunity
type Opportunity struct {
	gorm.Model
	Name           string    `json:"name" gorm:"type:varchar(100);not null"`
	CustomerID     uint      `json:"customer_id"`
	Customer       Customer  `json:"customer" gorm:"foreignKey:CustomerID"`
	PrimaryContactID *uint   `json:"primary_contact_id"`
	PrimaryContact *Contact  `json:"primary_contact" gorm:"foreignKey:PrimaryContactID"`
	AssignedUserID uint      `json:"assigned_user_id"`
	AssignedUser   User      `json:"assigned_user" gorm:"foreignKey:AssignedUserID"`
	Stage          string    `json:"stage" gorm:"type:varchar(50);not null"` // Prospecting, Qualification, Proposal, Negotiation, Closed Won, Closed Lost
	Value          float64   `json:"value"` // Potential revenue value
	Probability    int       `json:"probability"` // Probability of winning (0-100%)
	ExpectedCloseDate time.Time `json:"expected_close_date"`
	ActualCloseDate *time.Time `json:"actual_close_date"`
	Source         string    `json:"source" gorm:"type:varchar(50)"`
	Description    string    `json:"description" gorm:"type:text"`
	NextAction     string    `json:"next_action" gorm:"type:varchar(100)"`
	NextActionDate *time.Time `json:"next_action_date"`
	ReasonLost     string    `json:"reason_lost" gorm:"type:varchar(100)"`
}

// Activity represents interactions with customers and contacts
type Activity struct {
	gorm.Model
	Type           string    `json:"type" gorm:"type:varchar(20);not null"` // Call, Email, Meeting, Note, Task
	CustomerID     *uint     `json:"customer_id"`
	Customer       *Customer `json:"customer" gorm:"foreignKey:CustomerID"`
	ContactID      *uint     `json:"contact_id"`
	Contact        *Contact  `json:"contact" gorm:"foreignKey:ContactID"`
	OpportunityID  *uint     `json:"opportunity_id"`
	Opportunity    *Opportunity `json:"opportunity" gorm:"foreignKey:OpportunityID"`
	UserID         uint      `json:"user_id"` // User who performed the activity
	User           User      `json:"user" gorm:"foreignKey:UserID"`
	Subject        string    `json:"subject" gorm:"type:varchar(100);not null"`
	Description    string    `json:"description" gorm:"type:text"`
	ScheduledAt    *time.Time `json:"scheduled_at"`
	CompletedAt    *time.Time `json:"completed_at"`
	Duration       int       `json:"duration"` // Duration in minutes
	Outcome        string    `json:"outcome" gorm:"type:varchar(100)"`
	Direction      string    `json:"direction" gorm:"type:varchar(20)"` // Inbound, Outbound (for calls/emails)
	Status         string    `json:"status" gorm:"type:varchar(20);default:'pending'"` // pending, completed, cancelled
}

// Product represents items that can be sold to customers
type Product struct {
	gorm.Model
	Name        string  `json:"name" gorm:"type:varchar(100);not null"`
	Description string  `json:"description" gorm:"type:text"`
	SKU         string  `json:"sku" gorm:"type:varchar(50);unique"`
	UnitPrice   float64 `json:"unit_price"`
	Category    string  `json:"category" gorm:"type:varchar(50)"`
	Active      bool    `json:"active" gorm:"default:true"`
}

// Quote represents a formal sales quote to a customer
type Quote struct {
	gorm.Model
	QuoteNumber    string    `json:"quote_number" gorm:"type:varchar(50);unique"`
	CustomerID     uint      `json:"customer_id"`
	Customer       Customer  `json:"customer" gorm:"foreignKey:CustomerID"`
	OpportunityID  *uint     `json:"opportunity_id"`
	Opportunity    *Opportunity `json:"opportunity" gorm:"foreignKey:OpportunityID"`
	CreatedByID    uint      `json:"created_by_id"`
	CreatedBy      User      `json:"created_by" gorm:"foreignKey:CreatedByID"`
	IssueDate      time.Time `json:"issue_date"`
	ExpiryDate     time.Time `json:"expiry_date"`
	Status         string    `json:"status" gorm:"type:varchar(20);default:'draft'"` // draft, sent, accepted, rejected, expired
	SubTotal       float64   `json:"sub_total"`
	DiscountAmount float64   `json:"discount_amount"`
	TaxAmount      float64   `json:"tax_amount"`
	TotalAmount    float64   `json:"total_amount"`
	Notes          string    `json:"notes" gorm:"type:text"`
	Terms          string    `json:"terms" gorm:"type:text"`
	AcceptedAt     *time.Time `json:"accepted_at"`
}

// QuoteItem represents line items in a quote
type QuoteItem struct {
	gorm.Model
	QuoteID       uint    `json:"quote_id"`
	Quote         Quote   `json:"-" gorm:"foreignKey:QuoteID"`
	ProductID     uint    `json:"product_id"`
	Product       Product `json:"product" gorm:"foreignKey:ProductID"`
	Description   string  `json:"description" gorm:"type:text"`
	Quantity      int     `json:"quantity"`
	UnitPrice     float64 `json:"unit_price"`
	Discount      float64 `json:"discount"` // Percentage discount
	TaxRate       float64 `json:"tax_rate"` // Percentage tax
	TotalPrice    float64 `json:"total_price"`
}