package models

import (
	"time"
	"github.com/lib/pq"
)

// Website represents a website managed by the system
type Website struct {
	ID          uint      `gorm:"primary_key" json:"id"`
	Name        string    `gorm:"type:varchar(255);not null" json:"name"`
	Domain      string    `gorm:"type:varchar(255);unique;not null" json:"domain"`
	Description string    `gorm:"type:text" json:"description"`
	LogoURL     string    `gorm:"type:varchar(500)" json:"logo_url"`
	Active      bool      `gorm:"default:true" json:"active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	
	// Relationships
	Articles       []Article       `gorm:"foreignkey:WebsiteID" json:"articles,omitempty"`
	SocialAccounts []SocialAccount `gorm:"foreignkey:WebsiteID" json:"social_accounts,omitempty"`
	MediaFiles     []MediaLibrary  `gorm:"foreignkey:WebsiteID" json:"media_files,omitempty"`
}

// Article represents a news article or event
type Article struct {
	ID              uint           `gorm:"primary_key" json:"id"`
	WebsiteID       uint           `gorm:"not null" json:"website_id"`
	Title           string         `gorm:"type:varchar(500);not null" json:"title"`
	Slug            string         `gorm:"type:varchar(500);not null" json:"slug"`
	Summary         string         `gorm:"type:text" json:"summary"`
	Content         string         `gorm:"type:text;not null" json:"content"`
	FeaturedImage   string         `gorm:"type:varchar(500)" json:"featured_image"`
	AuthorID        *uint          `json:"author_id"`
	Category        string         `gorm:"type:varchar(100);default:'news'" json:"category"`
	Status          string         `gorm:"type:varchar(50);default:'draft'" json:"status"`
	PublishedAt     *time.Time     `json:"published_at"`
	EventDate       *time.Time     `json:"event_date"`
	EventLocation   string         `gorm:"type:varchar(500)" json:"event_location"`
	Tags            pq.StringArray `gorm:"type:text[]" json:"tags"`
	MetaTitle       string         `gorm:"type:varchar(255)" json:"meta_title"`
	MetaDescription string         `gorm:"type:text" json:"meta_description"`
	Views           int            `gorm:"default:0" json:"views"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	
	// Relationships
	Website Website  `gorm:"foreignkey:WebsiteID" json:"website,omitempty"`
	Author  *UserNew `gorm:"foreignkey:AuthorID" json:"author,omitempty"`
}

// SocialAccount represents a social media account
type SocialAccount struct {
	ID           uint       `gorm:"primary_key" json:"id"`
	WebsiteID    uint       `gorm:"not null" json:"website_id"`
	Platform     string     `gorm:"type:varchar(50);not null" json:"platform"`
	AccountName  string     `gorm:"type:varchar(255);not null" json:"account_name"`
	AccountURL   string     `gorm:"type:varchar(500)" json:"account_url"`
	AccessToken  string     `gorm:"type:text" json:"-"`
	RefreshToken string     `gorm:"type:text" json:"-"`
	ExpiresAt    *time.Time `json:"expires_at"`
	Active       bool       `gorm:"default:true" json:"active"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
	
	// Relationships
	Website Website `gorm:"foreignkey:WebsiteID" json:"website,omitempty"`
}

// SocialPost represents a social media post
type SocialPost struct {
	ID           uint           `gorm:"primary_key" json:"id"`
	WebsiteID    uint           `gorm:"not null" json:"website_id"`
	ArticleID    *uint          `json:"article_id"`
	Content      string         `gorm:"type:text;not null" json:"content"`
	Platforms    pq.StringArray `gorm:"type:text[];not null" json:"platforms"`
	MediaURLs    pq.StringArray `gorm:"type:text[]" json:"media_urls"`
	ScheduledAt  *time.Time     `json:"scheduled_at"`
	PublishedAt  *time.Time     `json:"published_at"`
	Status       string         `gorm:"type:varchar(50);default:'draft'" json:"status"`
	ErrorMessage string         `gorm:"type:text" json:"error_message"`
	Engagement   JSONB          `gorm:"type:jsonb" json:"engagement"`
	CreatedBy    uint           `json:"created_by"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	
	// Relationships
	Website Website   `gorm:"foreignkey:WebsiteID" json:"website,omitempty"`
	Article *Article  `gorm:"foreignkey:ArticleID" json:"article,omitempty"`
	Creator *UserNew  `gorm:"foreignkey:CreatedBy" json:"creator,omitempty"`
}

// MediaLibrary represents uploaded media files
type MediaLibrary struct {
	ID           uint      `gorm:"primary_key" json:"id"`
	WebsiteID    uint      `gorm:"not null" json:"website_id"`
	Filename     string    `gorm:"type:varchar(500);not null" json:"filename"`
	OriginalName string    `gorm:"type:varchar(500);not null" json:"original_name"`
	FileType     string    `gorm:"type:varchar(50);not null" json:"file_type"`
	FileSize     int       `gorm:"not null" json:"file_size"`
	MimeType     string    `gorm:"type:varchar(100);not null" json:"mime_type"`
	URL          string    `gorm:"type:varchar(1000);not null" json:"url"`
	ThumbnailURL string    `gorm:"type:varchar(1000)" json:"thumbnail_url"`
	AltText      string    `gorm:"type:varchar(500)" json:"alt_text"`
	Caption      string    `gorm:"type:text" json:"caption"`
	UploadedBy   uint      `json:"uploaded_by"`
	CreatedAt    time.Time `json:"created_at"`
	
	// Relationships
	Website  Website  `gorm:"foreignkey:WebsiteID" json:"website,omitempty"`
	Uploader *UserNew `gorm:"foreignkey:UploadedBy" json:"uploader,omitempty"`
}

// JSONB type for PostgreSQL JSONB fields
type JSONB map[string]interface{}