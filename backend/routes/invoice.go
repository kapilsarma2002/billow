package routes

import (
	"billow-backend/config"
	"billow-backend/middleware"
	"billow-backend/models"
	"strconv"

	"github.com/gofiber/fiber/v2"
)

func Setup(app *fiber.App) {
	// Apply auth middleware to all invoice routes
	invoices := app.Group("/api/invoices", middleware.AuthMiddleware())
	
	invoices.Post("/", createInvoice)
	invoices.Get("/", getInvoices)
	invoices.Get("/:id", getInvoice)
	invoices.Put("/:id", updateInvoice)
	invoices.Delete("/:id", deleteInvoice)
}

func createInvoice(c *fiber.Ctx) error {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		return err
	}

	invoice := new(models.Invoice)
	if err := c.BodyParser(invoice); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	// Generate unique invoice ID and set user ID
	invoice.ID = models.GenerateInvoiceID()
	invoice.UserID = userID

	// Validate that the client belongs to the user
	if invoice.ClientID != "" {
		var client models.Client
		if err := config.DB.Where("id = ? AND user_id = ?", invoice.ClientID, userID).First(&client).Error; err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid client selected"})
		}
		// Set client name for backward compatibility
		invoice.ClientName = client.Name
	}

	// Handle legacy client_name field (for backward compatibility)
	if invoice.ClientName != "" && invoice.ClientID == "" {
		var client models.Client
		// Try to find existing client by name
		if err := config.DB.Where("name = ? AND user_id = ?", invoice.ClientName, userID).First(&client).Error; err != nil {
			// Client doesn't exist, create a new one
			client = models.Client{
				ID:     models.GenerateClientID(),
				UserID: userID,
				Name:   invoice.ClientName,
				Email:  "", // Will need to be updated later
			}
			if err := config.DB.Create(&client).Error; err != nil {
				return c.Status(500).JSON(fiber.Map{"error": "Failed to create client"})
			}
		}
		invoice.ClientID = client.ID
	}

	if err := config.DB.Create(&invoice).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to create invoice"})
	}

	// Load the client relationship for response
	config.DB.Preload("Client").First(&invoice, "id = ?", invoice.ID)
	
	// Set client name for backward compatibility
	if invoice.Client.Name != "" {
		invoice.ClientName = invoice.Client.Name
	}

	return c.JSON(invoice)
}

func getInvoices(c *fiber.Ctx) error {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		return err
	}

	var invoices []models.Invoice
	
	// Get limit from query parameter for pagination
	limitStr := c.Query("limit", "")
	query := config.DB.Where("user_id = ?", userID).Preload("Client").Order("created_at DESC")
	
	if limitStr != "" {
		if limit, err := strconv.Atoi(limitStr); err == nil && limit > 0 {
			query = query.Limit(limit)
		}
	}
	
	if err := query.Find(&invoices).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch invoices"})
	}

	// Set client names for backward compatibility
	for i := range invoices {
		if invoices[i].Client.Name != "" {
			invoices[i].ClientName = invoices[i].Client.Name
		}
	}

	return c.JSON(invoices)
}

func getInvoice(c *fiber.Ctx) error {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		return err
	}

	id := c.Params("id")
	var invoice models.Invoice

	if err := config.DB.Where("id = ? AND user_id = ?", id, userID).Preload("Client").First(&invoice).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Invoice not found"})
	}

	// Set client name for backward compatibility
	if invoice.Client.Name != "" {
		invoice.ClientName = invoice.Client.Name
	}

	return c.JSON(invoice)
}

func updateInvoice(c *fiber.Ctx) error {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		return err
	}

	id := c.Params("id")
	var invoice models.Invoice

	if err := config.DB.Where("id = ? AND user_id = ?", id, userID).First(&invoice).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Invoice not found"})
	}

	if err := c.BodyParser(&invoice); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	// Ensure user ID doesn't change
	invoice.UserID = userID

	// Validate that the client belongs to the user
	if invoice.ClientID != "" {
		var client models.Client
		if err := config.DB.Where("id = ? AND user_id = ?", invoice.ClientID, userID).First(&client).Error; err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid client selected"})
		}
	}

	// Handle client updates (legacy support)
	if invoice.ClientName != "" && invoice.ClientID == "" {
		var client models.Client
		if err := config.DB.Where("name = ? AND user_id = ?", invoice.ClientName, userID).First(&client).Error; err != nil {
			client = models.Client{
				ID:     models.GenerateClientID(),
				UserID: userID,
				Name:   invoice.ClientName,
			}
			config.DB.Create(&client)
		}
		invoice.ClientID = client.ID
	}

	if err := config.DB.Save(&invoice).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update invoice"})
	}

	// Load the client relationship
	config.DB.Preload("Client").First(&invoice, "id = ?", invoice.ID)
	
	// Set client name for backward compatibility
	if invoice.Client.Name != "" {
		invoice.ClientName = invoice.Client.Name
	}

	return c.JSON(invoice)
}

func deleteInvoice(c *fiber.Ctx) error {
	userID, err := middleware.GetUserIDFromContext(c)
	if err != nil {
		return err
	}

	id := c.Params("id")
	
	if err := config.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&models.Invoice{}).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to delete invoice"})
	}

	return c.JSON(fiber.Map{"message": "Invoice deleted successfully"})
}