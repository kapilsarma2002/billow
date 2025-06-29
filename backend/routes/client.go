package routes

import (
	"billow-backend/config"
	"billow-backend/middleware"
	"billow-backend/models"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

func SetupClientRoutes(app *fiber.App) {
	// Apply auth middleware to all client routes
	clients := app.Group("/api/clients", middleware.AuthMiddleware())
	
	clients.Post("/", createClient)
	clients.Get("/", getClients)
	clients.Get("/:id", getClient)
	clients.Put("/:id", updateClient)
	clients.Delete("/:id", deleteClient)
	clients.Get("/:id/revenue-data", getClientRevenueData)
}

func createClient(c *fiber.Ctx) error {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		return err
	}

	client := new(models.Client)
	if err := c.BodyParser(client); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	// Generate unique client ID and set user ID
	client.ID = models.GenerateClientID()
	client.UserID = userID

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
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		return err
	}

	var clients []models.Client
	
	// Get query parameters for search and filtering
	search := c.Query("search", "")
	
	query := config.DB.Where("user_id = ?", userID).Order("created_at DESC")
	
	if search != "" {
		query = query.Where("name ILIKE ? OR email ILIKE ?", "%"+search+"%", "%"+search+"%")
	}
	
	if err := query.Find(&clients).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch clients"})
	}

	// Update client statistics based on their invoices
	for i := range clients {
		updateClientStatistics(&clients[i])
	}

	return c.JSON(clients)
}

func getClient(c *fiber.Ctx) error {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		return err
	}

	id := c.Params("id")
	var client models.Client

	if err := config.DB.Where("id = ? AND user_id = ?", id, userID).First(&client).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Client not found"})
	}

	// Update statistics
	updateClientStatistics(&client)

	return c.JSON(client)
}

func updateClient(c *fiber.Ctx) error {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		return err
	}

	id := c.Params("id")
	var client models.Client

	if err := config.DB.Where("id = ? AND user_id = ?", id, userID).First(&client).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Client not found"})
	}

	if err := c.BodyParser(&client); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	// Ensure user ID doesn't change
	client.UserID = userID

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
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		return err
	}

	id := c.Params("id")
	
	// Check if client has invoices
	var invoiceCount int64
	config.DB.Model(&models.Invoice{}).Where("client_id = ? AND user_id = ?", id, userID).Count(&invoiceCount)
	
	if invoiceCount > 0 {
		return c.Status(400).JSON(fiber.Map{"error": "Cannot delete client with existing invoices"})
	}
	
	if err := config.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Client{}).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to delete client"})
	}

	return c.JSON(fiber.Map{"message": "Client deleted successfully"})
}

func getClientRevenueData(c *fiber.Ctx) error {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		return err
	}

	id := c.Params("id")
	months := c.Query("months", "7") // Default to 7 months
	
	monthsInt, err := strconv.Atoi(months)
	if err != nil {
		monthsInt = 7
	}

	// Get actual revenue data from paid invoices
	var invoices []models.Invoice
	if err := config.DB.Where("client_id = ? AND user_id = ? AND status = 'paid'", id, userID).
		Order("invoice_date DESC").
		Limit(monthsInt).
		Find(&invoices).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch revenue data"})
	}

	// Create revenue data array
	revenueData := make([]float64, monthsInt)
	for i, invoice := range invoices {
		if i < monthsInt {
			revenueData[i] = invoice.Amount
		}
	}

	// Fill remaining slots with 0 if we have fewer invoices than months requested
	for i := len(invoices); i < monthsInt; i++ {
		revenueData[i] = 0
	}

	return c.JSON(fiber.Map{
		"client_id":    id,
		"months":       monthsInt,
		"revenue_data": revenueData,
	})
}

// Helper function to update client statistics based on their invoices
func updateClientStatistics(client *models.Client) {
	var invoices []models.Invoice
	config.DB.Where("client_id = ? AND user_id = ?", client.ID, client.UserID).Find(&invoices)

	totalInvoiced := 0.0
	totalPaid := 0.0
	invoiceCount := len(invoices)

	for _, invoice := range invoices {
		totalInvoiced += invoice.Amount
		if invoice.Status == "paid" {
			totalPaid += invoice.Amount
		}
	}

	client.TotalInvoiced = totalInvoiced
	client.TotalPaid = totalPaid
	client.InvoiceCount = invoiceCount

	if invoiceCount > 0 {
		client.AverageInvoice = totalInvoiced / float64(invoiceCount)
	}

	// Update in database
	config.DB.Model(client).Updates(map[string]interface{}{
		"total_invoiced":  totalInvoiced,
		"total_paid":      totalPaid,
		"invoice_count":   invoiceCount,
		"average_invoice": client.AverageInvoice,
	})
}