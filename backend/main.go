package main

import (
	"billow-backend/config"
	"billow-backend/models"
	"billow-backend/routes"

	"fmt"
	"log"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
	fmt.Println("Starting Billow backend...")
	config.ConnectDatabase()

	// Clear existing data to avoid foreign key constraint issues
	// This ensures a clean slate for auto-migration
	//clearExistingData()

	// Auto migrate the database with proper relationships
	// GORM will handle foreign key constraints automatically
	config.DB.AutoMigrate(&models.User{})
	config.DB.AutoMigrate(&models.Plan{})
	config.DB.AutoMigrate(&models.Subscription{})
	config.DB.AutoMigrate(&models.UserPreferences{})
	config.DB.AutoMigrate(&models.UsageLog{})
	config.DB.AutoMigrate(&models.AnalyticsData{})
	config.DB.AutoMigrate(&models.Client{})
	config.DB.AutoMigrate(&models.Invoice{})

	// Seed default plans if they don't exist
	seedDefaultPlans()

	app := fiber.New()

	// Add CORS middleware with proper configuration
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:5173",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization, X-User-ID, X-Clerk-ID",
		AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS",
		AllowCredentials: true,
	}))

	// Setup all routes
	fmt.Println("Setting up routes...")
	routes.SetupAuthRoutes(app)
	routes.Setup(app)
	routes.SetupClientRoutes(app)
	routes.SetupDashboardRoutes(app)
	routes.SetupSettingsRoutes(app)

	fmt.Println("Starting server on :8080...")
	if err := app.Listen(":8080"); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func clearExistingData() {
	fmt.Println("Clearing existing data to ensure clean migration...")

	// Delete data in the correct order to respect foreign key constraints
	config.DB.Exec("DELETE FROM analytics_data")
	config.DB.Exec("DELETE FROM usage_logs")
	config.DB.Exec("DELETE FROM user_preferences")
	config.DB.Exec("DELETE FROM subscriptions")
	config.DB.Exec("DELETE FROM invoices")
	config.DB.Exec("DELETE FROM clients")
	config.DB.Exec("DELETE FROM users")

	// Keep plans as they are seeded data
	fmt.Println("Existing data cleared successfully")
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
