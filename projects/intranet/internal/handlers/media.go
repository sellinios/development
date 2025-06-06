package handlers

import (
	"fmt"
	"image"
	"image/jpeg"
	"image/png"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/chai2010/webp"
	"github.com/disintegration/imaging"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"intranet/internal/database"
	"intranet/internal/models"
)

// MediaUploadConfig holds configuration for media uploads
type MediaUploadConfig struct {
	MaxFileSize      int64   // Max file size in bytes (default: 10MB)
	AllowedMimeTypes []string // Allowed MIME types
	WebPQuality      float32 // WebP quality (0-100, default: 80)
	ThumbnailWidth   int     // Thumbnail width (default: 300px)
	MaxImageWidth    int     // Max image width (default: 1920px)
}

var defaultMediaConfig = MediaUploadConfig{
	MaxFileSize: 50 * 1024 * 1024, // 50MB
	AllowedMimeTypes: []string{
		"image/jpeg",
		"image/jpg", 
		"image/png",
		"image/gif",
		"image/webp",
	},
	WebPQuality:    80,
	ThumbnailWidth: 300,
	MaxImageWidth:  1920,
}

// GetMediaFiles returns all media files for a website
func GetMediaFiles(c *gin.Context) {
	websiteID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid website ID"})
		return
	}

	var media []models.MediaLibrary
	query := database.DB.Where("website_id = ?", websiteID).Order("created_at DESC")
	
	// Add search filter
	if search := c.Query("search"); search != "" {
		searchPattern := "%" + search + "%"
		query = query.Where("original_name ILIKE ? OR alt_text ILIKE ? OR caption ILIKE ?", 
			searchPattern, searchPattern, searchPattern)
	}

	// Add file type filter
	if fileType := c.Query("type"); fileType != "" {
		query = query.Where("file_type = ?", fileType)
	}

	// Pagination
	page := 1
	limit := 50
	if p := c.Query("page"); p != "" {
		if pageNum, err := strconv.Atoi(p); err == nil && pageNum > 0 {
			page = pageNum
		}
	}
	
	offset := (page - 1) * limit
	
	// Get total count
	var total int64
	query.Model(&models.MediaLibrary{}).Count(&total)
	
	// Get paginated results
	if err := query.Preload("Uploader").Limit(limit).Offset(offset).Find(&media).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch media files"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"media": media,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// UploadMedia handles media file upload with WebP conversion
func UploadMedia(c *gin.Context) {
	websiteID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid website ID"})
		return
	}

	// Get multipart form
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to parse form"})
		return
	}

	files := form.File["files"]
	if len(files) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No files uploaded"})
		return
	}

	// Get user from context
	user, _ := c.Get("user")
	userModel := user.(models.UserNew)

	uploadedFiles := make([]models.MediaLibrary, 0)
	errors := make([]string, 0)

	// Create upload directory
	uploadDir := filepath.Join("uploads", "media", strconv.Itoa(websiteID))
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
		return
	}

	for _, file := range files {
		if file.Size > defaultMediaConfig.MaxFileSize {
			errors = append(errors, fmt.Sprintf("%s: File size exceeds limit", file.Filename))
			continue
		}

		// Check MIME type
		if !isAllowedMimeType(file) {
			errors = append(errors, fmt.Sprintf("%s: File type not allowed", file.Filename))
			continue
		}

		// Process and save file
		mediaFile, err := processAndSaveFile(file, websiteID, userModel.ID, uploadDir)
		if err != nil {
			errors = append(errors, fmt.Sprintf("%s: %s", file.Filename, err.Error()))
			continue
		}

		uploadedFiles = append(uploadedFiles, *mediaFile)
	}

	c.JSON(http.StatusOK, gin.H{
		"uploaded": uploadedFiles,
		"errors":   errors,
	})
}

// processAndSaveFile processes an uploaded file and converts it to WebP
func processAndSaveFile(file *multipart.FileHeader, websiteID int, uploaderID uint, uploadDir string) (*models.MediaLibrary, error) {
	// Open the uploaded file
	src, err := file.Open()
	if err != nil {
		return nil, fmt.Errorf("failed to open file: %v", err)
	}
	defer src.Close()

	// Decode image
	img, _, err := image.Decode(src)
	if err != nil {
		return nil, fmt.Errorf("failed to decode image: %v", err)
	}

	// Generate unique filename
	uniqueID := uuid.New().String()
	webpFilename := fmt.Sprintf("%s.webp", uniqueID)
	webpPath := filepath.Join(uploadDir, webpFilename)
	
	// Resize image if it exceeds max width
	if img.Bounds().Dx() > defaultMediaConfig.MaxImageWidth {
		img = imaging.Resize(img, defaultMediaConfig.MaxImageWidth, 0, imaging.Lanczos)
	}

	// Convert to WebP
	webpFile, err := os.Create(webpPath)
	if err != nil {
		return nil, fmt.Errorf("failed to create WebP file: %v", err)
	}
	defer webpFile.Close()

	options := &webp.Options{
		Lossless: false,
		Quality:  defaultMediaConfig.WebPQuality,
		Exact:    false,
	}

	if err := webp.Encode(webpFile, img, options); err != nil {
		return nil, fmt.Errorf("failed to encode WebP: %v", err)
	}

	// Create thumbnail
	thumbnailFilename := fmt.Sprintf("%s_thumb.webp", uniqueID)
	thumbnailPath := filepath.Join(uploadDir, thumbnailFilename)
	
	thumbnail := imaging.Resize(img, defaultMediaConfig.ThumbnailWidth, 0, imaging.Lanczos)
	
	thumbFile, err := os.Create(thumbnailPath)
	if err != nil {
		return nil, fmt.Errorf("failed to create thumbnail: %v", err)
	}
	defer thumbFile.Close()

	if err := webp.Encode(thumbFile, thumbnail, options); err != nil {
		return nil, fmt.Errorf("failed to encode thumbnail: %v", err)
	}

	// Get file size
	webpInfo, err := os.Stat(webpPath)
	if err != nil {
		return nil, fmt.Errorf("failed to get file info: %v", err)
	}

	// Create database record
	mediaFile := &models.MediaLibrary{
		WebsiteID:    uint(websiteID),
		Filename:     webpFilename,
		OriginalName: strings.TrimSuffix(file.Filename, filepath.Ext(file.Filename)) + ".webp",
		FileType:     "image",
		FileSize:     int(webpInfo.Size()),
		MimeType:     "image/webp",
		URL:          fmt.Sprintf("/intranet/uploads/media/%d/%s", websiteID, webpFilename),
		ThumbnailURL: fmt.Sprintf("/intranet/uploads/media/%d/%s", websiteID, thumbnailFilename),
		UploadedBy:   uploaderID,
	}

	if err := database.DB.Create(mediaFile).Error; err != nil {
		// Clean up files on database error
		os.Remove(webpPath)
		os.Remove(thumbnailPath)
		return nil, fmt.Errorf("failed to save to database: %v", err)
	}

	return mediaFile, nil
}

// UpdateMedia updates media metadata
func UpdateMedia(c *gin.Context) {
	mediaID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid media ID"})
		return
	}

	var media models.MediaLibrary
	if err := database.DB.First(&media, mediaID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Media not found"})
		return
	}

	var req struct {
		AltText string `json:"alt_text"`
		Caption string `json:"caption"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	media.AltText = req.AltText
	media.Caption = req.Caption

	if err := database.DB.Save(&media).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update media"})
		return
	}

	c.JSON(http.StatusOK, media)
}

// DeleteMedia deletes a media file
func DeleteMedia(c *gin.Context) {
	mediaID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid media ID"})
		return
	}

	var media models.MediaLibrary
	if err := database.DB.First(&media, mediaID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Media not found"})
		return
	}

	// Delete physical files
	uploadDir := filepath.Join("uploads", "media", strconv.Itoa(int(media.WebsiteID)))
	webpPath := filepath.Join(uploadDir, media.Filename)
	thumbnailPath := filepath.Join(uploadDir, strings.Replace(media.Filename, ".webp", "_thumb.webp", 1))
	
	os.Remove(webpPath)
	os.Remove(thumbnailPath)

	// Delete database record
	if err := database.DB.Delete(&media).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete media"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Media deleted successfully"})
}

// BulkDeleteMedia deletes multiple media files
func BulkDeleteMedia(c *gin.Context) {
	var req struct {
		IDs []int `json:"ids" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var mediaFiles []models.MediaLibrary
	if err := database.DB.Where("id IN ?", req.IDs).Find(&mediaFiles).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch media files"})
		return
	}

	// Delete physical files
	for _, media := range mediaFiles {
		uploadDir := filepath.Join("uploads", "media", strconv.Itoa(int(media.WebsiteID)))
		webpPath := filepath.Join(uploadDir, media.Filename)
		thumbnailPath := filepath.Join(uploadDir, strings.Replace(media.Filename, ".webp", "_thumb.webp", 1))
		
		os.Remove(webpPath)
		os.Remove(thumbnailPath)
	}

	// Delete database records
	if err := database.DB.Delete(&models.MediaLibrary{}, "id IN ?", req.IDs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete media"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": fmt.Sprintf("Deleted %d media files", len(mediaFiles)),
		"deleted": len(mediaFiles),
	})
}

// Helper function to check allowed MIME types
func isAllowedMimeType(file *multipart.FileHeader) bool {
	// Open file to detect actual MIME type
	src, err := file.Open()
	if err != nil {
		return false
	}
	defer src.Close()

	// Read first 512 bytes to detect content type
	buffer := make([]byte, 512)
	_, err = src.Read(buffer)
	if err != nil && err != io.EOF {
		return false
	}

	contentType := http.DetectContentType(buffer)
	
	for _, allowed := range defaultMediaConfig.AllowedMimeTypes {
		if strings.HasPrefix(contentType, allowed) {
			return true
		}
	}
	
	return false
}

// ConvertExistingToWebP converts existing images to WebP format
func ConvertExistingToWebP(c *gin.Context) {
	websiteID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid website ID"})
		return
	}

	var media []models.MediaLibrary
	if err := database.DB.Where("website_id = ? AND mime_type != ?", websiteID, "image/webp").Find(&media).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch media"})
		return
	}

	converted := 0
	errors := []string{}

	for _, m := range media {
		if err := convertSingleImageToWebP(&m); err != nil {
			errors = append(errors, fmt.Sprintf("%s: %v", m.OriginalName, err))
		} else {
			converted++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"converted": converted,
		"errors":    errors,
		"total":     len(media),
	})
}

// Helper function to convert a single image to WebP
func convertSingleImageToWebP(media *models.MediaLibrary) error {
	uploadDir := filepath.Join("uploads", "media", strconv.Itoa(int(media.WebsiteID)))
	oldPath := filepath.Join(uploadDir, media.Filename)
	
	// Open existing file
	file, err := os.Open(oldPath)
	if err != nil {
		return fmt.Errorf("failed to open file: %v", err)
	}
	defer file.Close()

	// Decode image
	var img image.Image
	switch media.MimeType {
	case "image/jpeg", "image/jpg":
		img, err = jpeg.Decode(file)
	case "image/png":
		img, err = png.Decode(file)
	default:
		img, _, err = image.Decode(file)
	}
	
	if err != nil {
		return fmt.Errorf("failed to decode image: %v", err)
	}

	// Generate new filename
	webpFilename := strings.TrimSuffix(media.Filename, filepath.Ext(media.Filename)) + ".webp"
	webpPath := filepath.Join(uploadDir, webpFilename)
	
	// Resize if needed
	if img.Bounds().Dx() > defaultMediaConfig.MaxImageWidth {
		img = imaging.Resize(img, defaultMediaConfig.MaxImageWidth, 0, imaging.Lanczos)
	}

	// Convert to WebP
	webpFile, err := os.Create(webpPath)
	if err != nil {
		return fmt.Errorf("failed to create WebP file: %v", err)
	}
	defer webpFile.Close()

	options := &webp.Options{
		Lossless: false,
		Quality:  defaultMediaConfig.WebPQuality,
		Exact:    false,
	}

	if err := webp.Encode(webpFile, img, options); err != nil {
		return fmt.Errorf("failed to encode WebP: %v", err)
	}

	// Create thumbnail
	thumbnailFilename := strings.TrimSuffix(webpFilename, ".webp") + "_thumb.webp"
	thumbnailPath := filepath.Join(uploadDir, thumbnailFilename)
	
	thumbnail := imaging.Resize(img, defaultMediaConfig.ThumbnailWidth, 0, imaging.Lanczos)
	
	thumbFile, err := os.Create(thumbnailPath)
	if err != nil {
		return fmt.Errorf("failed to create thumbnail: %v", err)
	}
	defer thumbFile.Close()

	if err := webp.Encode(thumbFile, thumbnail, options); err != nil {
		return fmt.Errorf("failed to encode thumbnail: %v", err)
	}

	// Get new file size
	webpInfo, err := os.Stat(webpPath)
	if err != nil {
		return fmt.Errorf("failed to get file info: %v", err)
	}

	// Update database record
	media.Filename = webpFilename
	media.OriginalName = strings.TrimSuffix(media.OriginalName, filepath.Ext(media.OriginalName)) + ".webp"
	media.FileSize = int(webpInfo.Size())
	media.MimeType = "image/webp"
	media.URL = fmt.Sprintf("/intranet/uploads/media/%d/%s", media.WebsiteID, webpFilename)
	media.ThumbnailURL = fmt.Sprintf("/intranet/uploads/media/%d/%s", media.WebsiteID, thumbnailFilename)

	if err := database.DB.Save(media).Error; err != nil {
		// Clean up new files on error
		os.Remove(webpPath)
		os.Remove(thumbnailPath)
		return fmt.Errorf("failed to update database: %v", err)
	}

	// Remove old file
	os.Remove(oldPath)
	
	return nil
}