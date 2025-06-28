package main

import (
	"billow-backend/config"
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

	app := fiber.New()

	// Add CORS middleware
	app.Use(cors.New(cors.Config{
		AllowOrigins: "http://localhost:5173",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
		AllowMethods: "GET, POST, PUT, DELETE, OPTIONS",
	}))

	routes.Setup(app)
	routes.SetupClientRoutes(app)

	app.Listen(":8080")
}