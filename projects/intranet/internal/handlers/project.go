package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"intranet/internal/database"
	"intranet/internal/models"
)

// ProjectResponse represents a project response
type ProjectResponse struct {
	ID           uint                         `json:"id"`
	Name         string                       `json:"name"`
	Code         string                       `json:"code"`
	Description  string                       `json:"description"`
	ProjectType  string                       `json:"project_type"`
	Status       string                       `json:"status"`
	Priority     string                       `json:"priority"`
	DepartmentID *string                      `json:"department_id"`
	Department   *models.Entity               `json:"department,omitempty"`
	OwnerID      *uint                        `json:"owner_id"`
	Owner        *UserResponse                `json:"owner,omitempty"`
	StartDate    *string                      `json:"start_date"`
	EndDate      *string                      `json:"end_date"`
	Budget       float64                      `json:"budget"`
	Progress     int                          `json:"progress"`
	CreatedAt    string                       `json:"created_at"`
	UpdatedAt    string                       `json:"updated_at"`
	Metadata     models.ProjectMetadata       `json:"metadata"`
	Members      []ProjectMemberResponse      `json:"members,omitempty"`
	Departments  []ProjectDepartmentResponse  `json:"departments,omitempty"`
	Milestones   []models.ProjectMilestone    `json:"milestones,omitempty"`
	IssueCount   int                          `json:"issue_count"`
}

// ProjectMemberResponse represents a project member response
type ProjectMemberResponse struct {
	ID         uint          `json:"id"`
	UserID     uint          `json:"user_id"`
	User       *UserResponse `json:"user,omitempty"`
	Role       string        `json:"role"`
	AssignedAt string        `json:"assigned_at"`
}

// ProjectDepartmentResponse represents a project department response
type ProjectDepartmentResponse struct {
	ID           uint           `json:"id"`
	DepartmentID string         `json:"department_id"`
	Department   *models.Entity `json:"department,omitempty"`
	IsPrimary    bool           `json:"is_primary"`
	AssignedAt   string         `json:"assigned_at"`
}

// CreateProjectRequest represents the create project request
type CreateProjectRequest struct {
	Name         string                 `json:"name" binding:"required"`
	Code         string                 `json:"code" binding:"required"`
	Description  string                 `json:"description"`
	ProjectType  string                 `json:"project_type" binding:"required,oneof=software hardware infrastructure research mixed"`
	Status       string                 `json:"status"`
	Priority     string                 `json:"priority"`
	DepartmentID string                 `json:"department_id"`
	StartDate    string                 `json:"start_date"`
	EndDate      string                 `json:"end_date"`
	Budget       float64                `json:"budget"`
	Metadata     models.ProjectMetadata `json:"metadata"`
	Departments  []string               `json:"departments"` // Additional department IDs
}

// GetProjects handles getting all projects
func GetProjects(c *gin.Context) {
	var projects []models.Project
	
	// Get query parameters
	projectType := c.Query("type")
	status := c.Query("status")
	departmentID := c.Query("department")
	
	// Base query
	db := database.DB.Preload("Department").Preload("Owner").
		Preload("Members.User").Preload("Departments.Department")
	
	// Apply filters
	if projectType != "" {
		db = db.Where("project_type = ?", projectType)
	}
	if status != "" {
		db = db.Where("status = ?", status)
	}
	if departmentID != "" {
		db = db.Where("department_id = ? OR id IN (SELECT project_id FROM project_departments WHERE department_id = ?)", 
			departmentID, departmentID)
	}
	
	if err := db.Find(&projects).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get projects"})
		return
	}
	
	// Convert to response format
	var response []ProjectResponse
	for _, project := range projects {
		// Count issues
		var issueCount int
		database.DB.Model(&models.ProjectIssue{}).Where("project_id = ?", project.ID).Count(&issueCount)
		
		resp := convertProjectToResponse(project)
		resp.IssueCount = issueCount
		response = append(response, resp)
	}
	
	c.JSON(http.StatusOK, response)
}

// GetProject handles getting a single project
func GetProject(c *gin.Context) {
	id := c.Param("id")
	
	var project models.Project
	if err := database.DB.Preload("Department").Preload("Owner").
		Preload("Members.User").Preload("Departments.Department").
		Preload("Milestones").First(&project, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}
	
	// Count issues
	var issueCount int
	database.DB.Model(&models.ProjectIssue{}).Where("project_id = ?", project.ID).Count(&issueCount)
	
	resp := convertProjectToResponse(project)
	resp.IssueCount = issueCount
	
	c.JSON(http.StatusOK, resp)
}

// CreateProject handles creating a new project
func CreateProject(c *gin.Context) {
	var req CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Get current user
	currentUser, exists := c.Get("user")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	user := currentUser.(models.User)
	
	// Check if project code already exists
	var existingProject models.Project
	if err := database.DB.Where("code = ?", req.Code).First(&existingProject).Error; err == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Project code already exists"})
		return
	}
	
	// Create project
	project := models.Project{
		Name:        req.Name,
		Code:        req.Code,
		Description: req.Description,
		ProjectType: req.ProjectType,
		Status:      req.Status,
		Priority:    req.Priority,
		Budget:      req.Budget,
		CreatedBy:   &user.ID,
		OwnerID:     &user.ID,
		Metadata:    req.Metadata,
	}
	
	// Set default values
	if project.Status == "" {
		project.Status = "planning"
	}
	if project.Priority == "" {
		project.Priority = "medium"
	}
	if project.Metadata == nil {
		project.Metadata = make(models.ProjectMetadata)
	}
	
	// Parse dates
	if req.StartDate != "" {
		if startDate, err := time.Parse("2006-01-02", req.StartDate); err == nil {
			project.StartDate = &startDate
		}
	}
	if req.EndDate != "" {
		if endDate, err := time.Parse("2006-01-02", req.EndDate); err == nil {
			project.EndDate = &endDate
		}
	}
	
	// Parse primary department ID
	if req.DepartmentID != "" {
		if deptUUID, err := uuid.Parse(req.DepartmentID); err == nil {
			project.DepartmentID = &deptUUID
		}
	}
	
	// Begin transaction
	tx := database.DB.Begin()
	
	// Create project
	if err := tx.Create(&project).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create project"})
		return
	}
	
	// Add primary department to project_departments if specified
	if project.DepartmentID != nil {
		projectDept := models.ProjectDepartment{
			ProjectID:    project.ID,
			DepartmentID: *project.DepartmentID,
			IsPrimary:    true,
			AssignedAt:   time.Now(),
		}
		if err := tx.Create(&projectDept).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign primary department"})
			return
		}
	}
	
	// Add additional departments
	for _, deptIDStr := range req.Departments {
		if deptUUID, err := uuid.Parse(deptIDStr); err == nil {
			// Skip if it's the primary department
			if project.DepartmentID != nil && deptUUID == *project.DepartmentID {
				continue
			}
			
			projectDept := models.ProjectDepartment{
				ProjectID:    project.ID,
				DepartmentID: deptUUID,
				IsPrimary:    false,
				AssignedAt:   time.Now(),
			}
			if err := tx.Create(&projectDept).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to assign department"})
				return
			}
		}
	}
	
	// Add creator as project member
	member := models.ProjectMember{
		ProjectID:  project.ID,
		UserID:     user.ID,
		Role:       "lead",
		AssignedAt: time.Now(),
	}
	if err := tx.Create(&member).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add project member"})
		return
	}
	
	// Commit transaction
	tx.Commit()
	
	// Reload with relationships
	database.DB.Preload("Department").Preload("Owner").
		Preload("Members.User").Preload("Departments.Department").
		First(&project, project.ID)
	
	c.JSON(http.StatusCreated, convertProjectToResponse(project))
}

// UpdateProject handles updating a project
func UpdateProject(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}
	
	var req CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	
	// Check if project exists
	var project models.Project
	if err := database.DB.First(&project, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}
	
	// Update fields
	project.Name = req.Name
	project.Description = req.Description
	project.ProjectType = req.ProjectType
	project.Status = req.Status
	project.Priority = req.Priority
	project.Budget = req.Budget
	project.Metadata = req.Metadata
	
	// Parse dates
	if req.StartDate != "" {
		if startDate, err := time.Parse("2006-01-02", req.StartDate); err == nil {
			project.StartDate = &startDate
		}
	}
	if req.EndDate != "" {
		if endDate, err := time.Parse("2006-01-02", req.EndDate); err == nil {
			project.EndDate = &endDate
		}
	}
	
	// Parse department ID
	if req.DepartmentID != "" {
		if deptUUID, err := uuid.Parse(req.DepartmentID); err == nil {
			project.DepartmentID = &deptUUID
		}
	}
	
	// Save project
	if err := database.DB.Save(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update project"})
		return
	}
	
	// Update departments if provided
	if len(req.Departments) > 0 {
		// Remove existing non-primary departments
		database.DB.Where("project_id = ? AND is_primary = false", project.ID).Delete(&models.ProjectDepartment{})
		
		// Add new departments
		for _, deptIDStr := range req.Departments {
			if deptUUID, err := uuid.Parse(deptIDStr); err == nil {
				// Skip if it's the primary department
				if project.DepartmentID != nil && deptUUID == *project.DepartmentID {
					continue
				}
				
				projectDept := models.ProjectDepartment{
					ProjectID:    project.ID,
					DepartmentID: deptUUID,
					IsPrimary:    false,
					AssignedAt:   time.Now(),
				}
				database.DB.Create(&projectDept)
			}
		}
	}
	
	// Reload with relationships
	database.DB.Preload("Department").Preload("Owner").
		Preload("Members.User").Preload("Departments.Department").
		First(&project, project.ID)
	
	c.JSON(http.StatusOK, convertProjectToResponse(project))
}

// DeleteProject handles deleting a project
func DeleteProject(c *gin.Context) {
	id := c.Param("id")
	
	// Check if project exists
	var project models.Project
	if err := database.DB.First(&project, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Project not found"})
		return
	}
	
	// Delete project (cascade will handle related records)
	if err := database.DB.Delete(&project).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete project"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"message": "Project deleted successfully"})
}

// Helper function to convert Project to ProjectResponse
func convertProjectToResponse(project models.Project) ProjectResponse {
	resp := ProjectResponse{
		ID:          project.ID,
		Name:        project.Name,
		Code:        project.Code,
		Description: project.Description,
		ProjectType: project.ProjectType,
		Status:      project.Status,
		Priority:    project.Priority,
		Budget:      project.Budget,
		Progress:    project.Progress,
		CreatedAt:   project.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt:   project.UpdatedAt.Format("2006-01-02 15:04:05"),
		Metadata:    project.Metadata,
		Milestones:  project.Milestones,
	}
	
	// Format dates
	if project.StartDate != nil {
		startDate := project.StartDate.Format("2006-01-02")
		resp.StartDate = &startDate
	}
	if project.EndDate != nil {
		endDate := project.EndDate.Format("2006-01-02")
		resp.EndDate = &endDate
	}
	
	// Department
	if project.DepartmentID != nil {
		deptIDStr := project.DepartmentID.String()
		resp.DepartmentID = &deptIDStr
		resp.Department = project.Department
	}
	
	// Owner
	if project.Owner != nil {
		ownerResp := convertUserToResponse(*project.Owner)
		resp.Owner = &ownerResp
		resp.OwnerID = project.OwnerID
	}
	
	// Members
	for _, member := range project.Members {
		memberResp := ProjectMemberResponse{
			ID:         member.ID,
			UserID:     member.UserID,
			Role:       member.Role,
			AssignedAt: member.AssignedAt.Format("2006-01-02 15:04:05"),
		}
		if member.User.ID != 0 {
			userResp := convertUserToResponse(member.User)
			memberResp.User = &userResp
		}
		resp.Members = append(resp.Members, memberResp)
	}
	
	// Departments
	for _, dept := range project.Departments {
		deptResp := ProjectDepartmentResponse{
			ID:           dept.ID,
			DepartmentID: dept.DepartmentID.String(),
			Department:   &dept.Department,
			IsPrimary:    dept.IsPrimary,
			AssignedAt:   dept.AssignedAt.Format("2006-01-02 15:04:05"),
		}
		resp.Departments = append(resp.Departments, deptResp)
	}
	
	return resp
}