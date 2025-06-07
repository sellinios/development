package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"intranet/internal/handlers"
	"intranet/internal/middleware"
	"intranet/internal/database"
)

func main() {
	// Set up Gin mode
	appEnv := getEnv("APP_ENV", "development")
	if appEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	// Initialize database connection
	_, err := database.InitDB()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer database.CloseDB()

	// Run migrations
	if err := database.MigrateDB(); err != nil {
		log.Printf("Failed to run migrations: %v", err)
	}

	log.Printf("Database connected successfully")

	// Create a new Gin router
	router := gin.Default()

	// Set up middleware
	router.Use(middleware.CORSMiddleware())
	
	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status": "ok",
			"message": "Intranet API is running",
		})
	})
	
	// Serve uploaded files
	router.Static("/uploads", "./uploads")
	
	// API routes
	api := router.Group("/api")
	{
		// Authentication routes
		auth := api.Group("/auth")
		{
			auth.POST("/login", handlers.LoginNew)
			auth.POST("/register", handlers.Register)
			auth.POST("/forgot-password", handlers.ForgotPasswordNew)
			auth.POST("/reset-password", handlers.ResetPasswordNew)
			auth.GET("/validate-token/:token", handlers.ValidateResetToken)
		}

		// Public routes - no authentication required
		api.POST("/career-applications", handlers.CreateApplicant)
		
		// Public API for website content
		public := api.Group("/public")
		{
			public.GET("/articles", handlers.GetPublicArticles)
			public.GET("/articles/:slug", handlers.GetPublicArticle)
			public.GET("/categories", handlers.GetPublicCategories)
			public.GET("/tags", handlers.GetPublicTags)
		}

		// Protected routes
		protected := api.Group("/")
		protected.Use(middleware.JWTAuth())
		{
			// Entity management routes
			entityHandler := handlers.NewEntityHandler(database.DB)
			userEntityHandler := handlers.NewUserEntityHandler(database.DB)
			moduleHandler := handlers.NewModuleHandler(database.DB)
			
			entities := protected.Group("/entities")
			{
				entities.GET("/", entityHandler.GetEntities)
				entities.GET("/tree", entityHandler.GetEntityTree)
				entities.GET("/:id", entityHandler.GetEntity)
				entities.GET("/:id/hierarchy", entityHandler.GetEntityHierarchy)
				entities.POST("/", middleware.AdminOnly(), entityHandler.CreateEntity)
				entities.PUT("/:id", middleware.AdminOnly(), entityHandler.UpdateEntity)
				entities.DELETE("/:id", middleware.AdminOnly(), entityHandler.DeleteEntity)
				
				// User-entity relationships
				entities.GET("/:id/users", userEntityHandler.GetEntityUsers)
				entities.POST("/:id/users", middleware.AdminOnly(), userEntityHandler.AssignUserToEntity)
				entities.PUT("/:id/users/:user_id", middleware.AdminOnly(), userEntityHandler.UpdateUserEntityRole)
				entities.DELETE("/:id/users/:user_id", middleware.AdminOnly(), userEntityHandler.RemoveUserFromEntity)
			}
			// User routes - using new clean user structure
			users := protected.Group("/users")
			{
				users.GET("/", middleware.PermissionRequired("users", "read"), handlers.GetUsersNew)
				users.GET("/:id", middleware.PermissionRequired("users", "read"), handlers.GetUserNew)
				users.POST("/", middleware.AdminOnly(), handlers.CreateUserNew)
				users.PUT("/:id", middleware.PermissionRequired("users", "update"), handlers.UpdateUserNew)
				users.DELETE("/:id", middleware.AdminOnly(), handlers.DeleteUserNew)
				users.POST("/:id/unlock", middleware.AdminOnly(), handlers.UnlockUser)
				users.POST("/:id/reset-attempts", middleware.AdminOnly(), handlers.ResetLoginAttempts)
				users.GET("/profile", handlers.GetProfileNew)
				users.PUT("/profile", handlers.UpdateProfileNew)
				users.GET("/profile/permissions", handlers.GetUserPermissionsNew)
				
				// User entity management
				users.GET("/:id/entities", userEntityHandler.GetUserEntities)
			}
			
			// Entity switching
			protected.POST("/switch-entity/:id", userEntityHandler.SwitchUserEntity)

			// Department routes removed - use entities with type='department' instead

			// Employee routes (for HR management)
			employees := protected.Group("/employees")
			{
				employees.GET("/", handlers.GetEmployees)
				employees.GET("/:id", handlers.GetEmployee)
				employees.POST("/", middleware.HROnly(), handlers.CreateEmployee)
				employees.PUT("/:id", middleware.HROnly(), handlers.UpdateEmployee)
				employees.DELETE("/:id", middleware.AdminOnly(), handlers.DeleteEmployee)
			}

			// Position routes
			positions := protected.Group("/positions")
			{
				positions.GET("/", handlers.GetPositions)
				positions.GET("/:id", handlers.GetPosition)
				positions.POST("/", middleware.AdminOnly(), handlers.CreatePosition)
				positions.PUT("/:id", middleware.AdminOnly(), handlers.UpdatePosition)
				positions.DELETE("/:id", middleware.AdminOnly(), handlers.DeletePosition)
			}

			// Leave routes
			leaves := protected.Group("/leaves")
			{
				leaves.GET("/", handlers.GetLeaveRequests)
				leaves.GET("/:id", handlers.GetLeaveRequest)
				leaves.POST("/", handlers.CreateLeaveRequest)
				leaves.PUT("/:id", handlers.UpdateLeaveRequest)
				leaves.DELETE("/:id", handlers.DeleteLeaveRequest)
				leaves.PUT("/:id/approve", middleware.ManagerOnly(), handlers.ApproveLeaveRequest)
				leaves.PUT("/:id/reject", middleware.ManagerOnly(), handlers.RejectLeaveRequest)
				leaves.GET("/balance", handlers.GetLeaveBalance)
				leaves.GET("/calendar", handlers.GetLeaveCalendar)
			}

			// CRM routes
			customers := protected.Group("/customers")
			{
				customers.GET("/", handlers.GetCustomers)
				customers.GET("/:id", handlers.GetCustomer)
				customers.POST("/", handlers.CreateCustomer)
				customers.PUT("/:id", handlers.UpdateCustomer)
				customers.DELETE("/:id", handlers.DeleteCustomer)
			}

			contacts := protected.Group("/contacts")
			{
				contacts.GET("/", handlers.GetContacts)
				contacts.GET("/:id", handlers.GetContact)
				contacts.POST("/", handlers.CreateContact)
				contacts.PUT("/:id", handlers.UpdateContact)
				contacts.DELETE("/:id", handlers.DeleteContact)
			}

			opportunities := protected.Group("/opportunities")
			{
				opportunities.GET("/", handlers.GetOpportunities)
				opportunities.GET("/:id", handlers.GetOpportunity)
				opportunities.POST("/", handlers.CreateOpportunity)
				opportunities.PUT("/:id", handlers.UpdateOpportunity)
				opportunities.DELETE("/:id", handlers.DeleteOpportunity)
				opportunities.GET("/dashboard", handlers.GetOpportunityDashboard)
			}

			// Principal routes
			principalHandler := handlers.NewPrincipalHandler(database.DB)
			principals := protected.Group("/principals")
			{
				principals.GET("/", principalHandler.GetPrincipals)
				principals.GET("/groups", principalHandler.GetPrincipalGroups)
				principals.GET("/types", principalHandler.GetPrincipalTypes)
				principals.GET("/ethnicities", principalHandler.GetEthnicities)
				principals.GET("/:id", principalHandler.GetPrincipal)
				principals.POST("/", middleware.AdminOnly(), principalHandler.CreatePrincipal)
				principals.PUT("/:id", middleware.AdminOnly(), principalHandler.UpdatePrincipal)
				principals.DELETE("/:id", middleware.AdminOnly(), principalHandler.DeletePrincipal)
			}

			// Ship routes
			ships := protected.Group("/ships")
			{
				ships.GET("/", handlers.GetShips)
				ships.GET("/:id", handlers.GetShip)
				ships.POST("/", handlers.CreateShip)
				ships.PUT("/:id", handlers.UpdateShip)
				ships.DELETE("/:id", middleware.AdminOnly(), handlers.DeleteShip)
			}

			// Upload routes
			uploadDir := getEnv("UPLOAD_DIR", "./uploads")
			baseURL := getEnv("BASE_URL", "https://site.epsilonhellas.com/intranet")
			uploadHandler := handlers.NewUploadHandler(uploadDir, baseURL)
			upload := protected.Group("/upload")
			{
				upload.POST("/logo", uploadHandler.UploadLogo)
			}

			// User preferences routes
			preferences := protected.Group("/preferences")
			{
				preferences.GET("/:key", handlers.GetUserPreference)
				preferences.PUT("/:key", handlers.SaveUserPreference)
			}

			// Role management routes
			roles := protected.Group("/roles")
			{
				roles.GET("/", handlers.GetRoles)
				roles.GET("/:id", handlers.GetRole)
				roles.POST("/", middleware.AdminOnly(), handlers.CreateRole)
				roles.PUT("/:id", middleware.AdminOnly(), handlers.UpdateRole)
				roles.DELETE("/:id", middleware.AdminOnly(), handlers.DeleteRole)
			}

			// User role assignments
			userRoles := protected.Group("/user-roles")
			{
				userRoles.GET("/:userId", handlers.GetUserRoles)
				userRoles.POST("/", middleware.AdminOnly(), handlers.AssignRole)
				userRoles.DELETE("/:userId/:roleId", middleware.AdminOnly(), handlers.RemoveRole)
			}

			// Project routes
			projects := protected.Group("/projects")
			{
				projects.GET("/", handlers.GetProjects)
				projects.GET("/:id", handlers.GetProject)
				projects.POST("/", handlers.CreateProject)
				projects.PUT("/:id", handlers.UpdateProject)
				projects.DELETE("/:id", middleware.AdminOnly(), handlers.DeleteProject)
			}

			// Job Applicants routes
			applicants := protected.Group("/applicants")
			{
				applicants.GET("/", middleware.PermissionRequired("hr", "view"), handlers.GetApplicants)
				applicants.GET("/:id", middleware.PermissionRequired("hr", "view"), handlers.GetApplicant)
				applicants.PUT("/:id", middleware.PermissionRequired("hr", "edit"), handlers.UpdateApplicant)
				applicants.DELETE("/:id", middleware.PermissionRequired("hr", "delete"), handlers.DeleteApplicant)
			}

			// Website Management routes
			websites := protected.Group("/websites")
			{
				websites.GET("/", handlers.GetWebsites)
				websites.GET("/:id", handlers.GetWebsite)
				websites.POST("/", middleware.AdminOnly(), handlers.CreateWebsite)
				websites.PUT("/:id", middleware.AdminOnly(), handlers.UpdateWebsite)
				websites.DELETE("/:id", middleware.AdminOnly(), handlers.DeleteWebsite)
				
				// Articles for a website
				websites.GET("/:id/articles", handlers.GetArticles)
				websites.POST("/:id/articles", middleware.PermissionRequired("content", "create"), handlers.CreateArticle)
				
				// Social media for a website
				websites.GET("/:id/social-accounts", handlers.GetSocialAccounts)
				websites.POST("/:id/social-accounts", middleware.PermissionRequired("content", "create"), handlers.CreateSocialAccount)
				websites.GET("/:id/social-posts", handlers.GetSocialPosts)
				websites.POST("/:id/social-posts", middleware.PermissionRequired("content", "create"), handlers.CreateSocialPost)
				
				// Media management for a website
				websites.GET("/:id/media", handlers.GetMediaFiles)
				websites.POST("/:id/media", handlers.UploadMedia)
				websites.POST("/:id/media/convert", handlers.ConvertExistingToWebP)
			}
			
			// Article routes
			articles := protected.Group("/articles")
			{
				articles.GET("/:id", handlers.GetArticle)
				articles.PUT("/:id", middleware.PermissionRequired("content", "edit"), handlers.UpdateArticle)
				articles.DELETE("/:id", middleware.PermissionRequired("content", "delete"), handlers.DeleteArticle)
			}

			// Social media account/post management routes
			socialAccounts := protected.Group("/social-accounts")
			{
				socialAccounts.PUT("/:id", middleware.PermissionRequired("content", "edit"), handlers.UpdateSocialAccount)
				socialAccounts.DELETE("/:id", middleware.PermissionRequired("content", "delete"), handlers.DeleteSocialAccount)
			}
			
			// Media management routes
			media := protected.Group("/media")
			{
				media.PUT("/:id", handlers.UpdateMedia)
				media.DELETE("/:id", handlers.DeleteMedia)
				media.POST("/bulk-delete", handlers.BulkDeleteMedia)
			}
			
			socialPosts := protected.Group("/social-posts")
			{
				socialPosts.PUT("/:id", middleware.PermissionRequired("content", "edit"), handlers.UpdateSocialPost)
				socialPosts.DELETE("/:id", middleware.PermissionRequired("content", "delete"), handlers.DeleteSocialPost)
			}
			
			// Notification routes
			notifications := protected.Group("/notifications")
			{
				notifications.GET("/", handlers.GetNotifications)
				notifications.PUT("/:id/read", handlers.MarkNotificationRead)
				notifications.PUT("/mark-all-read", handlers.MarkAllNotificationsRead)
			}

			// Module management routes
			modules := protected.Group("/modules")
			{
				modules.GET("/", moduleHandler.GetModules)
				modules.POST("/", middleware.AdminOnly(), moduleHandler.UpdateModules)
				modules.GET("/enabled", moduleHandler.GetEnabledModules)
			}

			// Add more routes for other modules...
		}
	}

	// Start the server
	port := getEnv("PORT", "8080")
	log.Printf("Server starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}

// getEnv gets an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}