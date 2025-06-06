package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"intranet/internal/database"
	"intranet/internal/models"
)

type EmployeeResponse struct {
	ID                    uint                `json:"id"`
	FirstName             string              `json:"first_name"`
	LastName              string              `json:"last_name"`
	DateOfBirth           *string             `json:"date_of_birth"`
	PhoneNumber           string              `json:"phone_number"`
	MobileNumber          string              `json:"mobile_number"`
	Address               string              `json:"address"`
	City                  string              `json:"city"`
	State                 string              `json:"state"`
	Country               string              `json:"country"`
	PostalCode            string              `json:"postal_code"`
	EmergencyContactName  string              `json:"emergency_contact_name"`
	EmergencyContactPhone string              `json:"emergency_contact_phone"`
	ProfilePicture        string              `json:"profile_picture"`
	Employment            *EmploymentResponse `json:"employment,omitempty"`
	HasUserAccount        bool                `json:"has_user_account"`
	UserID                *uint               `json:"user_id,omitempty"`
}

type EmploymentResponse struct {
	EntityID       *string          `json:"entity_id"`
	Entity         *models.Entity   `json:"entity,omitempty"`
	PositionID     *uint            `json:"position_id"`
	Position       *models.Position `json:"position,omitempty"`
	EmploymentType string           `json:"employment_type"`
	DateHired      string           `json:"date_hired"`
	DateTerminated *string          `json:"date_terminated"`
	LeaveBalance   float64          `json:"leave_balance"`
	IsCurrent      bool             `json:"is_current"`
}

type CreateEmployeeRequest struct {
	FirstName             string  `json:"first_name" binding:"required"`
	LastName              string  `json:"last_name" binding:"required"`
	DateOfBirth           *string `json:"date_of_birth"`
	PhoneNumber           string  `json:"phone_number"`
	MobileNumber          string  `json:"mobile_number"`
	Address               string  `json:"address"`
	City                  string  `json:"city"`
	State                 string  `json:"state"`
	Country               string  `json:"country"`
	PostalCode            string  `json:"postal_code"`
	EmergencyContactName  string  `json:"emergency_contact_name"`
	EmergencyContactPhone string  `json:"emergency_contact_phone"`
	ProfilePicture        string  `json:"profile_picture"`
	Employment            *struct {
		EntityID       *string `json:"entity_id"`
		PositionID     *uint   `json:"position_id"`
		EmploymentType string  `json:"employment_type"`
		DateHired      string  `json:"date_hired" binding:"required"`
		LeaveBalance   float64 `json:"leave_balance"`
	} `json:"employment,omitempty"`
}

type UpdateEmployeeRequest struct {
	FirstName             string  `json:"first_name"`
	LastName              string  `json:"last_name"`
	DateOfBirth           *string `json:"date_of_birth"`
	PhoneNumber           string  `json:"phone_number"`
	MobileNumber          string  `json:"mobile_number"`
	Address               string  `json:"address"`
	City                  string  `json:"city"`
	State                 string  `json:"state"`
	Country               string  `json:"country"`
	PostalCode            string  `json:"postal_code"`
	EmergencyContactName  string  `json:"emergency_contact_name"`
	EmergencyContactPhone string  `json:"emergency_contact_phone"`
	ProfilePicture        string  `json:"profile_picture"`
	Employment            *struct {
		EntityID       *string `json:"entity_id"`
		PositionID     *uint   `json:"position_id"`
		EmploymentType string  `json:"employment_type"`
		DateHired      string  `json:"date_hired"`
		DateTerminated *string `json:"date_terminated"`
		LeaveBalance   float64 `json:"leave_balance"`
	} `json:"employment,omitempty"`
}

func GetEmployees(c *gin.Context) {
	var persons []models.Person
	
	query := database.DB.Preload("Employment").Preload("Employment.Entity").Preload("Employment.Position")
	
	if err := query.Find(&persons).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch employees"})
		return
	}

	var response []EmployeeResponse
	for _, person := range persons {
		emp := convertPersonToEmployeeResponse(person)
		response = append(response, emp)
	}

	c.JSON(http.StatusOK, response)
}

func GetEmployee(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var person models.Person
	if err := database.DB.Preload("Employment").Preload("Employment.Entity").Preload("Employment.Position").First(&person, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Employee not found"})
		return
	}

	response := convertPersonToEmployeeResponse(person)
	c.JSON(http.StatusOK, response)
}

func CreateEmployee(c *gin.Context) {
	var req CreateEmployeeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx := database.DB.Begin()

	person := models.Person{
		FirstName:             req.FirstName,
		LastName:              req.LastName,
		PhoneNumber:           req.PhoneNumber,
		MobileNumber:          req.MobileNumber,
		Address:               req.Address,
		City:                  req.City,
		State:                 req.State,
		Country:               req.Country,
		PostalCode:            req.PostalCode,
		EmergencyContactName:  req.EmergencyContactName,
		EmergencyContactPhone: req.EmergencyContactPhone,
		ProfilePicture:        req.ProfilePicture,
	}

	if req.DateOfBirth != nil {
		dob, _ := time.Parse("2006-01-02", *req.DateOfBirth)
		person.DateOfBirth = &dob
	}

	if err := tx.Create(&person).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create employee"})
		return
	}

	if req.Employment != nil {
		employment := models.Employment{
			PersonID:       person.ID,
			EmploymentType: req.Employment.EmploymentType,
			LeaveBalance:   req.Employment.LeaveBalance,
			IsCurrent:      true,
		}

		if req.Employment.EntityID != nil {
			entityID, _ := uuid.Parse(*req.Employment.EntityID)
			employment.EntityID = &entityID
		}

		employment.PositionID = req.Employment.PositionID

		dateHired, _ := time.Parse("2006-01-02", req.Employment.DateHired)
		employment.DateHired = dateHired

		if err := tx.Create(&employment).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create employment record"})
			return
		}
	}

	tx.Commit()

	var createdPerson models.Person
	database.DB.Preload("Employment").Preload("Employment.Entity").Preload("Employment.Position").First(&createdPerson, person.ID)
	
	// Create notification for superadmins
	go func() {
		title := fmt.Sprintf("New Employee: %s %s", person.FirstName, person.LastName)
		message := fmt.Sprintf("A new employee has been created: %s %s. Please create a user account for this employee.", person.FirstName, person.LastName)
		if err := CreateNotificationForSuperAdmins("employee_needs_user", title, message, "employee", person.ID); err != nil {
			fmt.Printf("Failed to create notification: %v\n", err)
		}
	}()
	
	response := convertPersonToEmployeeResponse(createdPerson)
	c.JSON(http.StatusCreated, response)
}

func UpdateEmployee(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var req UpdateEmployeeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tx := database.DB.Begin()

	var person models.Person
	if err := tx.First(&person, id).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Employee not found"})
		return
	}

	person.FirstName = req.FirstName
	person.LastName = req.LastName
	person.PhoneNumber = req.PhoneNumber
	person.MobileNumber = req.MobileNumber
	person.Address = req.Address
	person.City = req.City
	person.State = req.State
	person.Country = req.Country
	person.PostalCode = req.PostalCode
	person.EmergencyContactName = req.EmergencyContactName
	person.EmergencyContactPhone = req.EmergencyContactPhone
	person.ProfilePicture = req.ProfilePicture

	if req.DateOfBirth != nil {
		dob, _ := time.Parse("2006-01-02", *req.DateOfBirth)
		person.DateOfBirth = &dob
	}

	if err := tx.Save(&person).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update employee"})
		return
	}

	if req.Employment != nil {
		var employment models.Employment
		err := tx.Where("person_id = ? AND is_current = ?", person.ID, true).First(&employment).Error
		
		if err == nil {
			if req.Employment.EntityID != nil {
				entityID, _ := uuid.Parse(*req.Employment.EntityID)
				employment.EntityID = &entityID
			}
			employment.PositionID = req.Employment.PositionID
			employment.EmploymentType = req.Employment.EmploymentType
			employment.LeaveBalance = req.Employment.LeaveBalance
			
			if req.Employment.DateHired != "" {
				dateHired, _ := time.Parse("2006-01-02", req.Employment.DateHired)
				employment.DateHired = dateHired
			}
			
			if req.Employment.DateTerminated != nil {
				dateTerminated, _ := time.Parse("2006-01-02", *req.Employment.DateTerminated)
				employment.DateTerminated = &dateTerminated
				employment.IsCurrent = false
			}

			if err := tx.Save(&employment).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update employment"})
				return
			}
		}
	}

	tx.Commit()

	var updatedPerson models.Person
	database.DB.Preload("Employment").Preload("Employment.Entity").Preload("Employment.Position").Preload("User").First(&updatedPerson, person.ID)
	
	response := convertPersonToEmployeeResponse(updatedPerson)
	c.JSON(http.StatusOK, response)
}

func DeleteEmployee(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ID"})
		return
	}

	var person models.Person
	if err := database.DB.First(&person, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Employee not found"})
		return
	}

	var user models.UserNew
	if err := database.DB.Where("person_id = ?", person.ID).First(&user).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete employee with active user account"})
		return
	}

	if err := database.DB.Delete(&person).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete employee"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Employee deleted successfully"})
}

func convertPersonToEmployeeResponse(person models.Person) EmployeeResponse {
	response := EmployeeResponse{
		ID:                    person.ID,
		FirstName:             person.FirstName,
		LastName:              person.LastName,
		PhoneNumber:           person.PhoneNumber,
		MobileNumber:          person.MobileNumber,
		Address:               person.Address,
		City:                  person.City,
		State:                 person.State,
		Country:               person.Country,
		PostalCode:            person.PostalCode,
		EmergencyContactName:  person.EmergencyContactName,
		EmergencyContactPhone: person.EmergencyContactPhone,
		ProfilePicture:        person.ProfilePicture,
		HasUserAccount:        false, // We're not loading user data anymore
	}

	if person.DateOfBirth != nil {
		dob := person.DateOfBirth.Format("2006-01-02")
		response.DateOfBirth = &dob
	}

	if person.Employment != nil {
		emp := &EmploymentResponse{
			EmploymentType: person.Employment.EmploymentType,
			DateHired:      person.Employment.DateHired.Format("2006-01-02"),
			LeaveBalance:   person.Employment.LeaveBalance,
			IsCurrent:      person.Employment.IsCurrent,
			Entity:         person.Employment.Entity,
			Position:       person.Employment.Position,
			PositionID:     person.Employment.PositionID,
		}

		if person.Employment.EntityID != nil {
			entityIDStr := person.Employment.EntityID.String()
			emp.EntityID = &entityIDStr
		}

		if person.Employment.DateTerminated != nil {
			dt := person.Employment.DateTerminated.Format("2006-01-02")
			emp.DateTerminated = &dt
		}

		response.Employment = emp
	}

	return response
}