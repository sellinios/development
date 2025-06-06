package handlers

import (
	"net/http"
	"github.com/gin-gonic/gin"
)

// EntityTreeNode represents an entity in the tree structure
type EntityTreeNode struct {
	ID          string             `json:"id"`
	ParentID    *string            `json:"parent_id"`
	Name        string             `json:"name"`
	Code        string             `json:"code"`
	Type        string             `json:"type"`
	Description string             `json:"description"`
	Active      bool               `json:"active"`
	CreatedAt   string             `json:"created_at"`
	UpdatedAt   string             `json:"updated_at"`
	Children    []EntityTreeNode   `json:"children,omitempty"`
}

// GetEntityTree retrieves the entity tree structure (override)
func (h *EntityHandler) GetEntityTree(c *gin.Context) {
	// Build tree starting from root entities using raw SQL
	rows, err := h.db.Raw(`
		SELECT id, parent_id, name, code, type, description, active, 
		       created_at, updated_at 
		FROM entities 
		WHERE parent_id IS NULL
		ORDER BY name
	`).Rows()
	
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch entity tree"})
		return
	}
	defer rows.Close()
	
	var rootEntities []EntityTreeNode
	
	for rows.Next() {
		var entity EntityTreeNode
		if err := rows.Scan(&entity.ID, &entity.ParentID, &entity.Name, &entity.Code, 
			&entity.Type, &entity.Description, &entity.Active, 
			&entity.CreatedAt, &entity.UpdatedAt); err != nil {
			continue
		}
		
		// Load children recursively
		h.loadChildrenNodes(&entity)
		rootEntities = append(rootEntities, entity)
	}
	
	c.JSON(http.StatusOK, rootEntities)
}

func (h *EntityHandler) loadChildrenNodes(parent *EntityTreeNode) {
	rows, err := h.db.Raw(`
		SELECT id, parent_id, name, code, type, description, active,
		       created_at, updated_at
		FROM entities 
		WHERE parent_id = ?
		ORDER BY name
	`, parent.ID).Rows()
	
	if err != nil {
		return
	}
	defer rows.Close()
	
	for rows.Next() {
		var child EntityTreeNode
		if err := rows.Scan(&child.ID, &child.ParentID, &child.Name, &child.Code,
			&child.Type, &child.Description, &child.Active,
			&child.CreatedAt, &child.UpdatedAt); err != nil {
			continue
		}
		
		// Recursively load this child's children
		h.loadChildrenNodes(&child)
		parent.Children = append(parent.Children, child)
	}
}