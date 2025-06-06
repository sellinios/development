package models

import (
	"time"
	"github.com/google/uuid"
	"database/sql/driver"
	"encoding/json"
)

// Project represents a project in the system
type Project struct {
	ID           uint            `json:"id" gorm:"primary_key"`
	Name         string          `json:"name" gorm:"type:varchar(255);not null"`
	Code         string          `json:"code" gorm:"type:varchar(50);unique;not null"`
	Description  string          `json:"description" gorm:"type:text"`
	ProjectType  string          `json:"project_type" gorm:"type:varchar(50);not null"`
	Status       string          `json:"status" gorm:"type:varchar(50);not null;default:'planning'"`
	Priority     string          `json:"priority" gorm:"type:varchar(20);default:'medium'"`
	DepartmentID *uuid.UUID      `json:"department_id" gorm:"type:uuid"`
	Department   *Entity         `json:"department,omitempty" gorm:"foreignkey:DepartmentID"`
	OwnerID      *uint           `json:"owner_id"`
	Owner        *User           `json:"owner,omitempty" gorm:"foreignkey:OwnerID"`
	StartDate    *time.Time      `json:"start_date" gorm:"type:date"`
	EndDate      *time.Time      `json:"end_date" gorm:"type:date"`
	Budget       float64         `json:"budget" gorm:"type:decimal(12,2)"`
	Progress     int             `json:"progress" gorm:"default:0"`
	CreatedAt    time.Time       `json:"created_at"`
	UpdatedAt    time.Time       `json:"updated_at"`
	CreatedBy    *uint           `json:"created_by"`
	Creator      *User           `json:"creator,omitempty" gorm:"foreignkey:CreatedBy"`
	Metadata     ProjectMetadata `json:"metadata" gorm:"type:jsonb"`
	
	// Relationships
	Members      []ProjectMember     `json:"members,omitempty" gorm:"foreignkey:ProjectID"`
	Departments  []ProjectDepartment `json:"departments,omitempty" gorm:"foreignkey:ProjectID"`
	Milestones   []ProjectMilestone  `json:"milestones,omitempty" gorm:"foreignkey:ProjectID"`
	Issues       []ProjectIssue      `json:"issues,omitempty" gorm:"foreignkey:ProjectID"`
	Components   []ProjectComponent  `json:"components,omitempty" gorm:"foreignkey:ProjectID"`
}

// ProjectMember represents a team member assigned to a project
type ProjectMember struct {
	ID         uint      `json:"id" gorm:"primary_key"`
	ProjectID  uint      `json:"project_id" gorm:"not null"`
	Project    Project   `json:"project,omitempty" gorm:"foreignkey:ProjectID"`
	UserID     uint      `json:"user_id" gorm:"not null"`
	User       User      `json:"user,omitempty" gorm:"foreignkey:UserID"`
	Role       string    `json:"role" gorm:"type:varchar(50);default:'member'"`
	AssignedAt time.Time `json:"assigned_at"`
	AssignedBy *uint     `json:"assigned_by"`
	Assigner   *User     `json:"assigner,omitempty" gorm:"foreignkey:AssignedBy"`
}

// ProjectDepartment represents departments involved in a project
type ProjectDepartment struct {
	ID           uint       `json:"id" gorm:"primary_key"`
	ProjectID    uint       `json:"project_id" gorm:"not null"`
	Project      Project    `json:"project,omitempty" gorm:"foreignkey:ProjectID"`
	DepartmentID uuid.UUID  `json:"department_id" gorm:"type:uuid;not null"`
	Department   Entity     `json:"department,omitempty" gorm:"foreignkey:DepartmentID"`
	IsPrimary    bool       `json:"is_primary" gorm:"default:false"`
	AssignedAt   time.Time  `json:"assigned_at"`
}

// ProjectMilestone represents a milestone in a project
type ProjectMilestone struct {
	ID            uint       `json:"id" gorm:"primary_key"`
	ProjectID     uint       `json:"project_id" gorm:"not null"`
	Project       Project    `json:"project,omitempty" gorm:"foreignkey:ProjectID"`
	Name          string     `json:"name" gorm:"type:varchar(255);not null"`
	Description   string     `json:"description" gorm:"type:text"`
	DueDate       *time.Time `json:"due_date" gorm:"type:date"`
	CompletedDate *time.Time `json:"completed_date" gorm:"type:date"`
	Status        string     `json:"status" gorm:"type:varchar(50);default:'pending'"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

// ProjectIssue represents an issue or task in a project
type ProjectIssue struct {
	ID           uint       `json:"id" gorm:"primary_key"`
	ProjectID    uint       `json:"project_id" gorm:"not null"`
	Project      Project    `json:"project,omitempty" gorm:"foreignkey:ProjectID"`
	Title        string     `json:"title" gorm:"type:varchar(255);not null"`
	Description  string     `json:"description" gorm:"type:text"`
	IssueType    string     `json:"issue_type" gorm:"type:varchar(50);default:'task'"`
	Status       string     `json:"status" gorm:"type:varchar(50);default:'open'"`
	Priority     string     `json:"priority" gorm:"type:varchar(20);default:'medium'"`
	AssignedTo   *uint      `json:"assigned_to"`
	Assignee     *User      `json:"assignee,omitempty" gorm:"foreignkey:AssignedTo"`
	ReportedBy   *uint      `json:"reported_by"`
	Reporter     *User      `json:"reporter,omitempty" gorm:"foreignkey:ReportedBy"`
	DueDate      *time.Time `json:"due_date" gorm:"type:date"`
	ResolvedDate *time.Time `json:"resolved_date"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

// ProjectMetadata represents additional project metadata
type ProjectMetadata map[string]interface{}

// Scan implements the sql.Scanner interface
func (m *ProjectMetadata) Scan(value interface{}) error {
	if value == nil {
		*m = make(ProjectMetadata)
		return nil
	}
	
	switch v := value.(type) {
	case []byte:
		return json.Unmarshal(v, m)
	case string:
		return json.Unmarshal([]byte(v), m)
	default:
		return json.Unmarshal([]byte("{}"), m)
	}
}

// Value implements the driver.Valuer interface
func (m ProjectMetadata) Value() (driver.Value, error) {
	if m == nil {
		return "{}", nil
	}
	return json.Marshal(m)
}

// TableName for ProjectMember
func (ProjectMember) TableName() string {
	return "project_members"
}

// TableName for ProjectDepartment
func (ProjectDepartment) TableName() string {
	return "project_departments"
}

// TableName for ProjectMilestone
func (ProjectMilestone) TableName() string {
	return "project_milestones"
}

// TableName for ProjectIssue
func (ProjectIssue) TableName() string {
	return "project_issues"
}

// ProjectComponent represents a component/module within a project
type ProjectComponent struct {
	ID          uint            `json:"id" gorm:"primary_key"`
	ProjectID   uint            `json:"project_id" gorm:"not null"`
	Project     Project         `json:"project,omitempty" gorm:"foreignkey:ProjectID"`
	Name        string          `json:"name" gorm:"type:varchar(255);not null"`
	Code        string          `json:"code" gorm:"type:varchar(50);not null"`
	Description string          `json:"description" gorm:"type:text"`
	Status      string          `json:"status" gorm:"type:varchar(50);default:'planning'"`
	OwnerID     *uint           `json:"owner_id"`
	Owner       *User           `json:"owner,omitempty" gorm:"foreignkey:OwnerID"`
	StartDate   *time.Time      `json:"start_date" gorm:"type:date"`
	EndDate     *time.Time      `json:"end_date" gorm:"type:date"`
	Progress    int             `json:"progress" gorm:"default:0"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
	Tasks       []ComponentTask `json:"tasks,omitempty" gorm:"foreignkey:ComponentID"`
}

// ComponentTask represents a task within a component
type ComponentTask struct {
	ID             uint           `json:"id" gorm:"primary_key"`
	ComponentID    uint           `json:"component_id" gorm:"not null"`
	Component      ProjectComponent `json:"component,omitempty" gorm:"foreignkey:ComponentID"`
	Title          string         `json:"title" gorm:"type:varchar(255);not null"`
	Description    string         `json:"description" gorm:"type:text"`
	TaskType       string         `json:"task_type" gorm:"type:varchar(50);default:'task'"`
	Status         string         `json:"status" gorm:"type:varchar(50);default:'todo'"`
	Priority       string         `json:"priority" gorm:"type:varchar(20);default:'medium'"`
	AssignedTo     *uint          `json:"assigned_to"`
	Assignee       *User          `json:"assignee,omitempty" gorm:"foreignkey:AssignedTo"`
	EstimatedHours float64        `json:"estimated_hours" gorm:"type:decimal(6,2)"`
	ActualHours    float64        `json:"actual_hours" gorm:"type:decimal(6,2)"`
	DueDate        *time.Time     `json:"due_date" gorm:"type:date"`
	CompletedDate  *time.Time     `json:"completed_date" gorm:"type:date"`
	CreatedBy      *uint          `json:"created_by"`
	Creator        *User          `json:"creator,omitempty" gorm:"foreignkey:CreatedBy"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	Comments       []TaskComment  `json:"comments,omitempty" gorm:"foreignkey:TaskID"`
}

// TaskComment represents a comment on a task
type TaskComment struct {
	ID        uint      `json:"id" gorm:"primary_key"`
	TaskID    uint      `json:"task_id" gorm:"not null"`
	Task      ComponentTask `json:"task,omitempty" gorm:"foreignkey:TaskID"`
	UserID    uint      `json:"user_id" gorm:"not null"`
	User      User      `json:"user,omitempty" gorm:"foreignkey:UserID"`
	Comment   string    `json:"comment" gorm:"type:text;not null"`
	CreatedAt time.Time `json:"created_at"`
}

// TableName for ProjectComponent
func (ProjectComponent) TableName() string {
	return "project_components"
}

// TableName for ComponentTask
func (ComponentTask) TableName() string {
	return "component_tasks"
}

// TableName for TaskComment
func (TaskComment) TableName() string {
	return "task_comments"
}