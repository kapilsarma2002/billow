package routes

import (
	"billow-backend/config"
	"billow-backend/models"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
)

func SetupDashboardRoutes(app *fiber.App) {
	app.Get("/api/dashboard/kpi", getDashboardKPI)
	app.Get("/api/dashboard/revenue-chart", getRevenueChart)
	app.Get("/api/dashboard/top-clients", getTopClients)
	app.Get("/api/dashboard/recent-invoices", getRecentInvoices)
	app.Get("/api/dashboard/reports-summary", getReportsSummary)
}

// Currency conversion rates to USD (updated regularly in production)
var currencyRates = map[string]float64{
	"USD": 1.0,
	"EUR": 1.09,
	"GBP": 1.27,
	"INR": 0.012,
	"CAD": 0.74,
	"AUD": 0.66,
	"JPY": 0.0067,
	"CHF": 1.11,
	"CNY": 0.14,
}

// Convert any currency to USD
func convertToUSD(amount float64, currency string) float64 {
	if currency == "" || currency == "USD" {
		return amount
	}
	rate, exists := currencyRates[currency]
	if !exists {
		rate = 1.0 // Default to USD rate if currency not found
	}
	return amount * rate
}

// KPI Data structure - all amounts in USD
type KPIData struct {
	TotalInvoiced   float64 `json:"total_invoiced"`
	TotalPaid       float64 `json:"total_paid"`
	Outstanding     float64 `json:"outstanding"`
	ClientCount     int64   `json:"client_count"`
	PrimaryCurrency string  `json:"primary_currency"` // Always "USD"
}

// Revenue Chart Data - all amounts in USD
type RevenueChartData struct {
	Month   string  `json:"month"`
	Revenue float64 `json:"revenue"`
}

// Top Client Data - all amounts in USD
type TopClientData struct {
	Name    string  `json:"name"`
	Revenue float64 `json:"revenue"`
}

// Reports Summary Data - all amounts in USD
type ReportsSummaryData struct {
	TotalRevenue     float64 `json:"total_revenue"`
	CollectionRate   float64 `json:"collection_rate"`
	TopClient        string  `json:"top_client"`
	TopClientRevenue float64 `json:"top_client_revenue"`
	TopRevenueMonth  string  `json:"top_revenue_month"`
	ClientCount      int64   `json:"client_count"`
	AveragePerClient float64 `json:"average_per_client"`
	PrimaryCurrency  string  `json:"primary_currency"` // Always "USD"
}

func getDashboardKPI(c *fiber.Ctx) error {
	var kpi KPIData

	// Get all invoices and convert to USD
	var invoices []models.Invoice
	config.DB.Find(&invoices)

	totalInvoicedUSD := 0.0
	totalPaidUSD := 0.0

	for _, invoice := range invoices {
		// Convert each invoice amount to USD
		amountUSD := convertToUSD(invoice.Amount, invoice.CurrencyType)
		totalInvoicedUSD += amountUSD
		
		if invoice.Status == "paid" {
			totalPaidUSD += amountUSD
		}
	}

	kpi.TotalInvoiced = totalInvoicedUSD
	kpi.TotalPaid = totalPaidUSD
	kpi.Outstanding = totalInvoicedUSD - totalPaidUSD
	kpi.PrimaryCurrency = "USD" // Always USD

	// Get client count
	config.DB.Model(&models.Client{}).Count(&kpi.ClientCount)

	return c.JSON(kpi)
}

func getRevenueChart(c *fiber.Ctx) error {
	var revenueData []RevenueChartData

	// Get all paid invoices
	var invoices []models.Invoice
	if err := config.DB.Where("status = ?", "paid").
		Order("invoice_date DESC").
		Find(&invoices).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch revenue data"})
	}

	// Create a map to aggregate revenue by month in USD
	monthlyRevenueUSD := make(map[string]float64)
	
	// Get last 12 months
	now := time.Now()
	for i := 11; i >= 0; i-- {
		month := now.AddDate(0, -i, 0)
		monthKey := month.Format("2006-01")
		monthName := month.Format("Jan")
		
		// Initialize with 0
		monthlyRevenueUSD[monthKey] = 0
		
		// Add to result with proper month name
		revenueData = append(revenueData, RevenueChartData{
			Month:   monthName,
			Revenue: 0,
		})
	}

	// Aggregate actual revenue data (convert all to USD)
	for _, invoice := range invoices {
		if invoice.InvoiceDate != "" {
			if invoiceTime, err := time.Parse("2006-01-02", invoice.InvoiceDate); err == nil {
				monthKey := invoiceTime.Format("2006-01")
				if _, exists := monthlyRevenueUSD[monthKey]; exists {
					amountUSD := convertToUSD(invoice.Amount, invoice.CurrencyType)
					monthlyRevenueUSD[monthKey] += amountUSD
				}
			}
		}
	}

	// Update the revenue data with USD amounts
	now = time.Now()
	for i := range revenueData {
		month := now.AddDate(0, -(11-i), 0)
		monthKey := month.Format("2006-01")
		revenueData[i].Revenue = monthlyRevenueUSD[monthKey]
	}

	return c.JSON(revenueData)
}

func getTopClients(c *fiber.Ctx) error {
	var topClients []TopClientData

	// Get all clients
	var clients []models.Client
	if err := config.DB.Find(&clients).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch clients"})
	}

	// Calculate revenue for each client in USD
	for _, client := range clients {
		var clientInvoices []models.Invoice
		config.DB.Where("client_id = ? AND status = ?", client.ID, "paid").Find(&clientInvoices)

		totalRevenueUSD := 0.0
		for _, invoice := range clientInvoices {
			amountUSD := convertToUSD(invoice.Amount, invoice.CurrencyType)
			totalRevenueUSD += amountUSD
		}

		// Include all clients, even those with 0 revenue
		topClients = append(topClients, TopClientData{
			Name:    client.Name,
			Revenue: totalRevenueUSD,
		})
	}

	// Sort by revenue (descending) and limit to top 5
	for i := 0; i < len(topClients)-1; i++ {
		for j := 0; j < len(topClients)-i-1; j++ {
			if topClients[j].Revenue < topClients[j+1].Revenue {
				topClients[j], topClients[j+1] = topClients[j+1], topClients[j]
			}
		}
	}

	// Limit to top 5
	if len(topClients) > 5 {
		topClients = topClients[:5]
	}

	return c.JSON(topClients)
}

func getRecentInvoices(c *fiber.Ctx) error {
	var invoices []models.Invoice

	// Get limit from query parameter, default to 5
	limitStr := c.Query("limit", "5")
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 5
	}

	if err := config.DB.Preload("Client").
		Order("created_at DESC").
		Limit(limit).
		Find(&invoices).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch recent invoices"})
	}

	// Set client names for backward compatibility
	for i := range invoices {
		if invoices[i].Client.Name != "" {
			invoices[i].ClientName = invoices[i].Client.Name
		}
	}

	return c.JSON(invoices)
}

func getReportsSummary(c *fiber.Ctx) error {
	var summary ReportsSummaryData

	// Get all invoices and convert to USD
	var invoices []models.Invoice
	config.DB.Find(&invoices)

	summary.PrimaryCurrency = "USD" // Always USD

	// Calculate totals in USD
	totalRevenueUSD := 0.0
	totalPaidUSD := 0.0

	for _, invoice := range invoices {
		amountUSD := convertToUSD(invoice.Amount, invoice.CurrencyType)
		totalRevenueUSD += amountUSD
		
		if invoice.Status == "paid" {
			totalPaidUSD += amountUSD
		}
	}

	summary.TotalRevenue = totalRevenueUSD

	// Calculate collection rate
	if totalRevenueUSD > 0 {
		summary.CollectionRate = (totalPaidUSD / totalRevenueUSD) * 100
	}

	// Get client count
	config.DB.Model(&models.Client{}).Count(&summary.ClientCount)

	// Calculate average per client
	if summary.ClientCount > 0 {
		summary.AveragePerClient = summary.TotalRevenue / float64(summary.ClientCount)
	}

	// Get top client (in USD)
	var clients []models.Client
	if err := config.DB.Find(&clients).Error; err == nil {
		var topClient TopClientData
		maxRevenueUSD := 0.0

		for _, client := range clients {
			var clientInvoices []models.Invoice
			config.DB.Where("client_id = ? AND status = ?", client.ID, "paid").Find(&clientInvoices)

			totalRevenueUSD := 0.0
			for _, invoice := range clientInvoices {
				amountUSD := convertToUSD(invoice.Amount, invoice.CurrencyType)
				totalRevenueUSD += amountUSD
			}

			if totalRevenueUSD > maxRevenueUSD {
				maxRevenueUSD = totalRevenueUSD
				topClient.Name = client.Name
				topClient.Revenue = totalRevenueUSD
			}
		}

		summary.TopClient = topClient.Name
		summary.TopClientRevenue = topClient.Revenue
	}

	// Get top revenue month (in USD)
	var paidInvoices []models.Invoice
	if err := config.DB.Where("status = ?", "paid").Find(&paidInvoices).Error; err == nil {
		monthlyRevenueUSD := make(map[string]float64)
		
		for _, invoice := range paidInvoices {
			if invoice.InvoiceDate != "" {
				if invoiceTime, err := time.Parse("2006-01-02", invoice.InvoiceDate); err == nil {
					monthKey := invoiceTime.Format("2006-01")
					amountUSD := convertToUSD(invoice.Amount, invoice.CurrencyType)
					monthlyRevenueUSD[monthKey] += amountUSD
				}
			}
		}

		// Find the month with highest revenue
		maxRevenueUSD := 0.0
		topMonth := ""
		for month, revenue := range monthlyRevenueUSD {
			if revenue > maxRevenueUSD {
				maxRevenueUSD = revenue
				topMonth = month
			}
		}

		if topMonth != "" {
			if monthTime, err := time.Parse("2006-01", topMonth); err == nil {
				summary.TopRevenueMonth = monthTime.Format("January 2006")
			}
		}
	}

	if summary.TopRevenueMonth == "" {
		summary.TopRevenueMonth = "Current Month"
	}

	return c.JSON(summary)
}