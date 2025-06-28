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

	// Add CORS middleware with proper configuration
	app.Use(cors.New(cors.Config{
		AllowOrigins:     "http://localhost:5173",
		AllowHeaders:     "Origin, Content-Type, Accept, Authorization, X-User-ID",
		AllowMethods:     "GET, POST, PUT, DELETE, OPTIONS",
		AllowCredentials: true,
	}))

	// Setup all routes
	fmt.Println("Setting up routes...")
	routes.Setup(app)
	routes.SetupClientRoutes(app)
	routes.SetupDashboardRoutes(app)
	routes.SetupSettingsRoutes(app)

	fmt.Println("Starting server on :8080...")
	if err := app.Listen(":8080"); err != nil {
		log.Fatal("Failed to start server:", err)
	}
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
