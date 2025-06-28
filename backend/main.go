package main

import (
	"billow-backend/config"
	"billow-backend/middleware"
	"billow-backend/models"
	"billow-backend/routes"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
	config.ConnectDatabase()

	// Auto migrate the database with proper relationships
	// GORM will handle foreign key constraints automatically
	config.DB.AutoMigrate(&models.Client{})
	config.DB.AutoMigrate(&models.Invoice{})
	
	// Migrate new models for settings and subscription management
	config.DB.AutoMigrate(&models.User{})
	config.DB.AutoMigrate(&models.Plan{})
	config.DB.AutoMigrate(&models.Subscription{})
	config.DB.AutoMigrate(&models.UserPreferences{})
	config.DB.AutoMigrate(&models.UsageLog{})
	config.DB.AutoMigrate(&models.AnalyticsData{})

	// Seed default plans if they don't exist
	seedDefaultPlans()

	app := fiber.New()

	// Add CORS middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://localhost:5173",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization, X-User-ID",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	// Apply rate limiting middleware to API routes
	app.Use("/api", middleware.RateLimitMiddleware())

	// Setup all routes
	routes.Setup(app)
	routes.SetupClientRoutes(app)
	routes.SetupDashboardRoutes(app)
	routes.SetupSettingsRoutes(app)

	// Protected routes that require specific features
	app.Use("/api/advanced-analytics", middleware.RequireFeature("advanced_analytics"))
	app.Use("/api/image-generation", middleware.RequireFeature("image_generation"))
	app.Use("/api/custom-voice", middleware.RequireFeature("custom_voice"))

	// Usage tracking for key features
	app.Use("/api/invoices", middleware.TrackUsage("invoice_created"))
	app.Use("/api/clients", middleware.TrackUsage("client_created"))

	app.Listen(":8080")
}

func seedDefaultPlans() {
	// Check if plans already exist
	var count int64
	config.DB.Model(&models.Plan{}).Count(&count)
	
	if count == 0 {
		plans := []models.Plan{
			{
				ID:                "PLN-STARTER",
				Name:              "Starter",
				Price:             10.0,
				Currency:          "USD",
				Interval:          "month",
				InvoiceLimit:      50,
				ClientLimit:       10,
				MessagesPerDay:    100,
				ImageGeneration:   false,
				CustomVoice:       false,
				PrioritySupport:   false,
				AdvancedAnalytics: false,
				APIAccess:         false,
				WhiteLabel:        false,
			},
			{
				ID:                "PLN-PRO",
				Name:              "Pro",
				Price:             29.0,
				Currency:          "USD",
				Interval:          "month",
				InvoiceLimit:      -1, // Unlimited
				ClientLimit:       -1, // Unlimited
				MessagesPerDay:    1000,
				ImageGeneration:   true,
				CustomVoice:       true,
				PrioritySupport:   true,
				AdvancedAnalytics: true,
				APIAccess:         true,
				WhiteLabel:        false,
			},
			{
				ID:                "PLN-BUSINESS",
				Name:              "Business",
				Price:             99.0,
				Currency:          "USD",
				Interval:          "month",
				InvoiceLimit:      -1, // Unlimited
				ClientLimit:       -1, // Unlimited
				MessagesPerDay:    -1, // Unlimited
				ImageGeneration:   true,
				CustomVoice:       true,
				PrioritySupport:   true,
				AdvancedAnalytics: true,
				APIAccess:         true,
				WhiteLabel:        true,
			},
		}

		for _, plan := range plans {
			config.DB.Create(&plan)
		}
	}
}