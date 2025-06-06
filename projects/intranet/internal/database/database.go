package database

import (
	"fmt"
	"log"
	"os"

	"github.com/google/uuid"
	"github.com/jinzhu/gorm"
	_ "github.com/jinzhu/gorm/dialects/postgres"
	"intranet/internal/models"
)

// DB is the database connection instance
var DB *gorm.DB

// InitDB initializes the database connection
func InitDB() (*gorm.DB, error) {
	// Get database connection details from environment variables
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "postgres")
	dbPassword := getEnv("DB_PASSWORD", "postgres")
	dbName := getEnv("DB_NAME", "intranet")
	sslMode := getEnv("DB_SSLMODE", "disable")

	// Create connection string
	dsn := fmt.Sprintf("host=%s port=%s user=%s dbname=%s password=%s sslmode=%s",
		dbHost, dbPort, dbUser, dbName, dbPassword, sslMode)

	// Connect to the database
	db, err := gorm.Open("postgres", dsn)
	if err != nil {
		return nil, err
	}
	
	// Log which database we're connected to
	log.Printf("Connected to database: %s on %s:%s", dbName, dbHost, dbPort)

	// Set connection pool settings
	db.DB().SetMaxIdleConns(10)
	db.DB().SetMaxOpenConns(100)

	// Enable logging in development
	if getEnv("APP_ENV", "development") == "development" {
		db.LogMode(true)
	}

	// Store the database connection
	DB = db

	return db, nil
}

// MigrateDB runs auto migrations for all models
func MigrateDB() error {
	if DB == nil {
		return fmt.Errorf("database connection not initialized")
	}

	// Run AutoMigrate for all models
	err := DB.AutoMigrate(
		&models.UserNew{},
		&models.Person{},
		&models.Entity{},
		&models.UserEntity{},
		&models.Position{},
		&models.User{},
		&models.LeaveRequest{},
		&models.LeaveType{},
		&models.Customer{},
		&models.Contact{},
		&models.Opportunity{},
		&models.Ship{},
		&models.Role{},
		&models.UserRole{},
		&models.Project{},
		&models.JobApplicant{},
		&models.Website{},
		&models.Article{},
		&models.SocialAccount{},
		&models.SocialPost{},
		&models.MediaLibrary{},
		&models.UserPreference{},
	).Error

	if err != nil {
		return err
	}

	// Add unique constraint for user preferences
	DB.Model(&models.UserPreference{}).AddIndex("idx_user_preference", "user_id", "preference_key")
	DB.Model(&models.UserPreference{}).AddUniqueIndex("idx_unique_user_preference", "user_id", "preference_key")

	// Skip foreign key creation for now - we're using a new database structure
	// TODO: Update to match new schema
	// DB.Model(&models.User{}).AddForeignKey("entity_id", "entities(id)", "SET NULL", "CASCADE")
	// DB.Model(&models.User{}).AddForeignKey("position_id", "positions(id)", "SET NULL", "CASCADE")
	
	// Add additional foreign keys for all relationships...

	// Seed initial data if needed
	err = seedInitialData()
	if err != nil {
		log.Printf("Error seeding initial data: %v", err)
	}

	return nil
}

// CloseDB closes the database connection
func CloseDB() error {
	if DB != nil {
		return DB.Close()
	}
	return nil
}

// getEnv gets an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}

// seedInitialData seeds initial data for the application
func seedInitialData() error {
	// Check if we have any users
	var count int
	DB.Model(&models.UserNew{}).Count(&count)
	
	// If we already have users, don't seed
	if count > 0 {
		return nil
	}

	// Create admin entity (department)
	adminEntityID := uuid.New()
	adminEntity := models.Entity{
		ID:          adminEntityID,
		Name:        "Administration",
		Code:        "ADMIN",
		Type:        "department",
		Description: "Administrative department",
		Active:      true,
	}
	if err := DB.Create(&adminEntity).Error; err != nil {
		return err
	}

	// Skip creating admin position for now
	// adminPosition := models.Position{
	// 	Title:       "System Administrator",
	// 	Description: "System Administrator with full access",
	// 	Level:       5,
	// }
	// if err := DB.Create(&adminPosition).Error; err != nil {
	// 	return err
	// }

	// Create admin user with new structure
	adminUser := models.UserNew{
		Username: "admin",
		Email:    "admin@example.com",
		Password: "admin123", // This will be hashed
		Role:     "admin",
		Active:   true,
	}
	
	// Hash the password
	if err := adminUser.HashPassword(); err != nil {
		return err
	}
	
	// Save the user
	if err := DB.Create(&adminUser).Error; err != nil {
		return err
	}

	// Create user-entity relationship
	userEntityID := uuid.New()
	userEntity := models.UserEntity{
		ID:        userEntityID,
		UserID:    adminUser.ID,
		EntityID:  adminEntityID,
		Role:      "admin",
		IsPrimary: true,
	}
	if err := DB.Create(&userEntity).Error; err != nil {
		return err
	}

	// Create leave types
	leaveTypes := []models.LeaveType{
		{
			Name:        "Vacation",
			Description: "Annual vacation leave",
			DefaultDays: 20,
			Paid:        true,
			Color:       "#4CAF50",
		},
		{
			Name:        "Sick Leave",
			Description: "Leave for illness or medical appointments",
			DefaultDays: 10,
			Paid:        true,
			Color:       "#F44336",
		},
		{
			Name:        "Personal Leave",
			Description: "Leave for personal matters",
			DefaultDays: 5,
			Paid:        true,
			Color:       "#2196F3",
		},
	}
	
	for _, leaveType := range leaveTypes {
		if err := DB.Create(&leaveType).Error; err != nil {
			return err
		}
	}

	return nil
}