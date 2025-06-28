package routes

import (
	"billow-backend/config"
	"billow-backend/models"

	"github.com/gofiber/fiber/v2"
)

func Setup(app *fiber.App) {
	app.Post("/api/invoices", createInvoice)
	app.Get("/api/invoices", getInvoices)
}

func createInvoice(c *fiber.Ctx) error {
	invoice := new(models.Invoice)
	if err := c.BodyParser(invoice); err != nil {
		return c.Status(400).JSON(err.Error())
	}

	// Generate unique invoice ID using current date and time
	invoice.ID = models.GenerateInvoiceID()

	config.DB.Create(&invoice)
	return c.JSON(invoice)
}

func getInvoices(c *fiber.Ctx) error {
	var invoices []models.Invoice
	config.DB.Order("created_at DESC").Find(&invoices)
	return c.JSON(invoices)
}
