package routes

import (
	"billow-backend/config"
	"billow-backend/models"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

func SetupClientRoutes(app *fiber.App) {
	app.Post("/api/clients", createClient)
	app.Get("/api/clients", getClients)
	app.Get("/api/clients/:id", getClient)
	app.Put("/api/clients/:id", updateClient)
	app.Delete("/api/clients/:id", deleteClient)
	app.Get("/api/clients/:id/revenue-data", getClientRevenueData)
}

func createClient(c *fiber.Ctx) error {
	client := new(models.Client)
	if err := c.BodyParser(client); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	// Generate unique client ID
	client.ID = models.GenerateClientID()

	// Calculate average invoice if invoice count > 0
	if client.InvoiceCount > 0 {
		client.AverageInvoice = client.TotalInvoiced / float64(client.InvoiceCount)
	}

	if err := config.DB.Create(&client).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create client"})
	}

	return c.JSON(client)
}

func getClients(c *fiber.Ctx) error {
	var clients []models.Client
	
	// Get query parameters for search and filtering
	search := c.Query("search", "")
	
	query := config.DB.Order("created_at DESC")
	
	if search != "" {
		query = query.Where("name ILIKE ? OR email ILIKE ?", "%"+search+"%", "%"+search+"%")
	}
	
	if err := query.Find(&clients).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch clients"})
	}

	return c.JSON(clients)
}

func getClient(c *fiber.Ctx) error {
	id := c.Params("id")
	var client models.Client

	if err := config.DB.First(&client, "id = ?", id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Client not found"})
	}

	return c.JSON(client)
}

func updateClient(c *fiber.Ctx) error {
	id := c.Params("id")
	var client models.Client

	if err := config.DB.First(&client, "id = ?", id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Client not found"})
	}

	if err := c.BodyParser(&client); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	// Recalculate average invoice
	if client.InvoiceCount > 0 {
		client.AverageInvoice = client.TotalInvoiced / float64(client.InvoiceCount)
	}

	if err := config.DB.Save(&client).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update client"})
	}

	return c.JSON(client)
}

func deleteClient(c *fiber.Ctx) error {
	id := c.Params("id")
	
	if err := config.DB.Delete(&models.Client{}, "id = ?", id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to delete client"})
	}

	return c.JSON(fiber.Map{"message": "Client deleted successfully"})
}

func getClientRevenueData(c *fiber.Ctx) error {
	id := c.Params("id")
	months := c.Query("months", "7") // Default to 7 months
	
	monthsInt, err := strconv.Atoi(months)
	if err != nil {
		monthsInt = 7
	}

	// For now, return mock revenue data
	// In a real implementation, this would calculate from invoice data
	revenueData := make([]float64, monthsInt)
	for i := 0; i < monthsInt; i++ {
		// Generate some sample data - in real implementation, query invoices
		revenueData[i] = float64(10000 + (i * 2000) + (i * i * 500))
	}

	return c.JSON(fiber.Map{
		"client_id": id,
		"months": monthsInt,
		"revenue_data": revenueData,
	})
}