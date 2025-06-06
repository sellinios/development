package handlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// UploadHandler handles file uploads
type UploadHandler struct {
	uploadDir string
	baseURL   string
}

// NewUploadHandler creates a new upload handler
func NewUploadHandler(uploadDir, baseURL string) *UploadHandler {
	// Create upload directory if it doesn't exist
	os.MkdirAll(uploadDir, 0755)
	
	return &UploadHandler{
		uploadDir: uploadDir,
		baseURL:   baseURL,
	}
}

// UploadLogo handles logo file uploads
func (h *UploadHandler) UploadLogo(c *gin.Context) {
	file, header, err := c.Request.FormFile("logo")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file provided"})
		return
	}
	defer file.Close()

	// Validate file type
	contentType := header.Header.Get("Content-Type")
	if !strings.HasPrefix(contentType, "image/") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File must be an image"})
		return
	}

	// Validate file size (max 5MB)
	if header.Size > 5*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File size must be less than 5MB"})
		return
	}

	// Generate unique filename
	ext := filepath.Ext(header.Filename)
	filename := fmt.Sprintf("logo_%d%s", time.Now().UnixNano(), ext)
	
	// Create the full path
	fullPath := filepath.Join(h.uploadDir, "logos", filename)
	os.MkdirAll(filepath.Dir(fullPath), 0755)

	// Create the file
	dst, err := os.Create(fullPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}
	defer dst.Close()

	// Copy the uploaded file to the destination
	if _, err := io.Copy(dst, file); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// Return the URL
	url := fmt.Sprintf("%s/uploads/logos/%s", h.baseURL, filename)
	c.JSON(http.StatusOK, gin.H{"url": url})
}