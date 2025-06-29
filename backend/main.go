package main

import (
	"billow-backend/config"
	"billow-backend/models"
	"billow-backend/routes"

	"fmt"
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

func main() {
	fmt.Println("Starting Billow backend...")
	config.ConnectDatabase()

	// Auto migrate the database with proper relationships
	// GORM will handle foreign key constraints automatically
	fmt.Println("Running database migrations...")
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

	// Get port from environment variable (Heroku sets this)
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Get allowed origins from environment variable
	allowedOrigins := os.Getenv("ALLOWED_ORIGINS")
	if allowedOrigins == "" {
		allowedOrigins = "http://localhost:5173,https://billow-three.vercel.app"
	}

	app := fiber.New(fiber.Config{
		ErrorHandler: func(c *fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}

			fmt.Printf("Error: %v\n", err)

			return c.Status(code).JSON(fiber.Map{
				"error": err.Error(),
			})
		},
	})

	// Add CORS middleware with proper configuration
	app.Use(cors.New(cors.Config{
		AllowOrigins:     allowedOrigins,
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

	fmt.Printf("Starting server on :%s...\n", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}

func seedDefaultPlans() {
	// Check if plans already exist
	var count int64
	config.DB.Model(&models.Plan{}).Count(&count)

	if count == 0 {
		fmt.Println("Seeding default plans...")
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
			if err := config.DB.Create(&plan).Error; err != nil {
				fmt.Printf("Error creating plan %s: %v\n", plan.Name, err)
			} else {
				fmt.Printf("Created plan: %s\n", plan.Name)
			}
		}
	} else {
		fmt.Printf("Plans already exist (%d plans found)\n", count)
	}
}
