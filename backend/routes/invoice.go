package routes

import (
	"billow-backend/config"
	"billow-backend/models"

	"github.com/gofiber/fiber/v2"
)

func Setup(app *fiber.App) {
	app.Post("/api/invoices", createInvoice)
	app.Get("/api/invoices", getInvoices)
	app.Get("/api/invoices/:id", getInvoice)
	app.Put("/api/invoices/:id", updateInvoice)
	app.Delete("/api/invoices/:id", deleteInvoice)
}

func createInvoice(c *fiber.Ctx) error {
	invoice := new(models.Invoice)
	if err := c.BodyParser(invoice); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	// Generate unique invoice ID using current date and time
	invoice.ID = models.GenerateInvoiceID()

	// Handle backward compatibility - if client_name is provided, find or create client
	if invoice.ClientName != "" && invoice.ClientID == "" {
		var client models.Client
		// Try to find existing client by name
		if err := config.DB.Where("name = ?", invoice.ClientName).First(&client).Error; err != nil {
			// Client doesn't exist, create a new one
			client = models.Client{
				ID:    models.GenerateClientID(),
				Name:  invoice.ClientName,
				Email: "", // Will need to be updated later
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

	// Load the client relationship
	config.DB.Preload("Client").First(&invoice, "id = ?", invoice.ID)

	return c.JSON(invoice)
}

func getInvoices(c *fiber.Ctx) error {
	var invoices []models.Invoice
	
	query := config.DB.Preload("Client").Order("created_at DESC")
	
	if err := query.Find(&invoices).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch invoices"})
	}

	// For backward compatibility, set client_name field
	for i := range invoices {
		if invoices[i].Client.Name != "" {
			invoices[i].ClientName = invoices[i].Client.Name
		}
	}

	return c.JSON(invoices)
}

func getInvoice(c *fiber.Ctx) error {
	id := c.Params("id")
	var invoice models.Invoice

	if err := config.DB.Preload("Client").First(&invoice, "id = ?", id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Invoice not found"})
	}

	// For backward compatibility
	if invoice.Client.Name != "" {
		invoice.ClientName = invoice.Client.Name
	}

	return c.JSON(invoice)
}

func updateInvoice(c *fiber.Ctx) error {
	id := c.Params("id")
	var invoice models.Invoice

	if err := config.DB.First(&invoice, "id = ?", id).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Invoice not found"})
	}

	if err := c.BodyParser(&invoice); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": err.Error()})
	}

	// Handle client_name updates
	if invoice.ClientName != "" && invoice.ClientID == "" {
		var client models.Client
		if err := config.DB.Where("name = ?", invoice.ClientName).First(&client).Error; err != nil {
			client = models.Client{
				ID:   models.GenerateClientID(),
				Name: invoice.ClientName,
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

	return c.JSON(invoice)
}

func deleteInvoice(c *fiber.Ctx) error {
	id := c.Params("id")
	
	if err := config.DB.Delete(&models.Invoice{}, "id = ?", id).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to delete invoice"})
	}

	return c.JSON(fiber.Map{"message": "Invoice deleted successfully"})
}