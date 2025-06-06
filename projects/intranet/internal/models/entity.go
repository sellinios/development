package models

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/jinzhu/gorm"
)

// Entity represents an organizational unit (company, division, department, etc.)
type Entity struct {
	ID          uuid.UUID      `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	ParentID    *uuid.UUID     `json:"parent_id" gorm:"type:uuid"`
	Parent      *Entity        `json:"parent,omitempty" gorm:"foreignKey:ParentID"`
	Children    []Entity       `json:"children,omitempty" gorm:"foreignKey:ParentID"`
	Name        string         `json:"name" gorm:"not null"`
	Code        string         `json:"code" gorm:"unique;not null"`
	Type        string         `json:"type" gorm:"not null"` // company, division, department, team
	Description string         `json:"description"`
	Active      bool           `json:"active" gorm:"default:true"`
	Settings    EntitySettings `json:"settings" gorm:"type:jsonb;default:'{}'"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	CreatedBy   *uint          `json:"created_by"`
	Creator     *User          `json:"creator,omitempty" gorm:"foreignKey:CreatedBy"`
}

// EntitySettings stores entity-specific configuration
type EntitySettings map[string]interface{}

// Value implements driver.Valuer interface
func (es EntitySettings) Value() (driver.Value, error) {
	return json.Marshal(es)
}

// Scan implements sql.Scanner interface
func (es *EntitySettings) Scan(value interface{}) error {
	if value == nil {
		*es = make(EntitySettings)
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return nil
	}
	return json.Unmarshal(bytes, es)
}

// UserEntity represents the relationship between users and entities
type UserEntity struct {
	ID         uuid.UUID  `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	UserID     uint       `json:"user_id" gorm:"not null"`
	User       User       `json:"user,omitempty" gorm:"foreignKey:UserID"`
	EntityID   uuid.UUID  `json:"entity_id" gorm:"type:uuid;not null"`
	Entity     Entity     `json:"entity,omitempty" gorm:"foreignKey:EntityID"`
	Role       string     `json:"role" gorm:"not null"` // admin, manager, member, viewer
	IsPrimary  bool       `json:"is_primary" gorm:"default:false"`
	AssignedAt time.Time  `json:"assigned_at"`
	AssignedBy *uint      `json:"assigned_by"`
	Assigner   *User      `json:"assigner,omitempty" gorm:"foreignKey:AssignedBy"`
}

// EntitySystemAccess defines which systems an entity has access to
type EntitySystemAccess struct {
	ID                uuid.UUID         `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	EntityID          uuid.UUID         `json:"entity_id" gorm:"type:uuid;not null"`
	Entity            Entity            `json:"entity,omitempty" gorm:"foreignKey:EntityID"`
	SystemName        string            `json:"system_name" gorm:"not null"` // hr, leave, crm
	AccessLevel       string            `json:"access_level" gorm:"not null"` // full, read, none
	CustomPermissions map[string]interface{} `json:"custom_permissions" gorm:"type:jsonb;default:'{}'"`
	Enabled           bool              `json:"enabled" gorm:"default:true"`
}

// EntityRole defines custom roles within an entity
type EntityRole struct {
	ID           uuid.UUID              `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	EntityID     uuid.UUID              `json:"entity_id" gorm:"type:uuid;not null"`
	Entity       Entity                 `json:"entity,omitempty" gorm:"foreignKey:EntityID"`
	RoleName     string                 `json:"role_name" gorm:"not null"`
	Permissions  map[string]interface{} `json:"permissions" gorm:"type:jsonb;default:'{}'"`
	Description  string                 `json:"description"`
	IsSystemRole bool                   `json:"is_system_role" gorm:"default:false"`
	CreatedAt    time.Time              `json:"created_at"`
}

// EntityAuditLog tracks changes to entities
type EntityAuditLog struct {
	ID        uuid.UUID              `json:"id" gorm:"type:uuid;primary_key;default:gen_random_uuid()"`
	EntityID  *uuid.UUID             `json:"entity_id" gorm:"type:uuid"`
	Entity    *Entity                `json:"entity,omitempty" gorm:"foreignKey:EntityID"`
	UserID    *uint                  `json:"user_id"`
	User      *User                  `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Action    string                 `json:"action" gorm:"not null"` // create, update, delete, assign_user
	Changes   map[string]interface{} `json:"changes" gorm:"type:jsonb;default:'{}'"`
	IPAddress string                 `json:"ip_address"`
	UserAgent string                 `json:"user_agent"`
	CreatedAt time.Time              `json:"created_at"`
}

// BeforeCreate hook for Entity
func (e *Entity) BeforeCreate(scope *gorm.Scope) error {
	if e.ID == uuid.Nil {
		e.ID = uuid.New()
	}
	return nil
}

// BeforeCreate hooks for other models
func (ue *UserEntity) BeforeCreate(scope *gorm.Scope) error {
	if ue.ID == uuid.Nil {
		ue.ID = uuid.New()
	}
	ue.AssignedAt = time.Now()
	return nil
}

func (esa *EntitySystemAccess) BeforeCreate(scope *gorm.Scope) error {
	if esa.ID == uuid.Nil {
		esa.ID = uuid.New()
	}
	return nil
}

func (er *EntityRole) BeforeCreate(scope *gorm.Scope) error {
	if er.ID == uuid.Nil {
		er.ID = uuid.New()
	}
	return nil
}

func (eal *EntityAuditLog) BeforeCreate(scope *gorm.Scope) error {
	if eal.ID == uuid.Nil {
		eal.ID = uuid.New()
	}
	return nil
}

// GetPath returns the full hierarchy path of the entity
func (e *Entity) GetPath(db *gorm.DB) ([]Entity, error) {
	var path []Entity
	current := e
	
	for current != nil {
		path = append([]Entity{*current}, path...)
		if current.ParentID == nil {
			break
		}
		
		var parent Entity
		if err := db.Where("id = ?", current.ParentID).First(&parent).Error; err != nil {
			if err == gorm.ErrRecordNotFound {
				break
			}
			return nil, err
		}
		current = &parent
	}
	
	return path, nil
}

// GetAllChildren returns all descendant entities
func (e *Entity) GetAllChildren(db *gorm.DB) ([]Entity, error) {
	var children []Entity
	var getChildren func(parentID uuid.UUID) error
	
	getChildren = func(parentID uuid.UUID) error {
		var directChildren []Entity
		if err := db.Where("parent_id = ?", parentID).Find(&directChildren).Error; err != nil {
			return err
		}
		
		for _, child := range directChildren {
			children = append(children, child)
			if err := getChildren(child.ID); err != nil {
				return err
			}
		}
		
		return nil
	}
	
	return children, getChildren(e.ID)
}

// HasAccess checks if the entity has access to a specific system
func (e *Entity) HasAccess(db *gorm.DB, systemName string) (bool, string) {
	var access EntitySystemAccess
	err := db.Where("entity_id = ? AND system_name = ?", e.ID, systemName).First(&access).Error
	
	if err != nil {
		return false, "none"
	}
	
	if !access.Enabled {
		return false, "none"
	}
	
	return access.AccessLevel != "none", access.AccessLevel
}