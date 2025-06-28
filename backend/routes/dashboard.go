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
	app.Get("/api/dashboard/collection-rate", getCollectionRate)
	app.Get("/api/dashboard/top-revenue-month", getTopRevenueMonth)
}

// KPI Data structure
type KPIData struct {
	TotalInvoiced float64 `json:"total_invoiced"`
	TotalPaid     float64 `json:"total_paid"`
	Outstanding   float64 `json:"outstanding"`
	ClientCount   int64   `json:"client_count"`
}

// Revenue Chart Data
type RevenueChartData struct {
	Month   string  `json:"month"`
	Revenue float64 `json:"revenue"`
}

// Top Client Data
type TopClientData struct {
	Name    string  `json:"name"`
	Revenue float64 `json:"revenue"`
}

// Reports Summary Data
type ReportsSummaryData struct {
	TotalRevenue     float64 `json:"total_revenue"`
	CollectionRate   float64 `json:"collection_rate"`
	TopClient        string  `json:"top_client"`
	TopClientRevenue float64 `json:"top_client_revenue"`
	TopRevenueMonth  string  `json:"top_revenue_month"`
	ClientCount      int64   `json:"client_count"`
	AveragePerClient float64 `json:"average_per_client"`
}

func getDashboardKPI(c *fiber.Ctx) error {
	var kpi KPIData

	// Get total invoiced amount
	config.DB.Model(&models.Invoice{}).Select("COALESCE(SUM(amount), 0)").Scan(&kpi.TotalInvoiced)

	// Get total paid amount
	config.DB.Model(&models.Invoice{}).Where("status = ?", "paid").Select("COALESCE(SUM(amount), 0)").Scan(&kpi.TotalPaid)

	// Calculate outstanding
	kpi.Outstanding = kpi.TotalInvoiced - kpi.TotalPaid

	// Get client count
	config.DB.Model(&models.Client{}).Count(&kpi.ClientCount)

	return c.JSON(kpi)
}

func getRevenueChart(c *fiber.Ctx) error {
	var revenueData []RevenueChartData

	// Get revenue data for the last 12 months from paid invoices
	// Using a simpler approach that works with string dates
	var invoices []models.Invoice
	if err := config.DB.Where("status = ?", "paid").
		Order("invoice_date DESC").
		Find(&invoices).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch revenue data"})
	}

	// Create a map to aggregate revenue by month
	monthlyRevenue := make(map[string]float64)
	
	// Get last 12 months
	now := time.Now()
	for i := 11; i >= 0; i-- {
		month := now.AddDate(0, -i, 0)
		monthKey := month.Format("2006-01")
		monthName := month.Format("Jan")
		
		// Initialize with 0
		monthlyRevenue[monthKey] = 0
		
		// Add to result with proper month name
		revenueData = append(revenueData, RevenueChartData{
			Month:   monthName,
			Revenue: 0,
		})
	}

	// Aggregate actual revenue data
	for _, invoice := range invoices {
		if invoice.InvoiceDate != "" {
			// Parse the invoice date (assuming YYYY-MM-DD format)
			if invoiceTime, err := time.Parse("2006-01-02", invoice.InvoiceDate); err == nil {
				monthKey := invoiceTime.Format("2006-01")
				if _, exists := monthlyRevenue[monthKey]; exists {
					monthlyRevenue[monthKey] += invoice.Amount
				}
			}
		}
	}

	// Update the revenue data with actual values
	now = time.Now()
	for i := range revenueData {
		month := now.AddDate(0, -(11-i), 0)
		monthKey := month.Format("2006-01")
		revenueData[i].Revenue = monthlyRevenue[monthKey]
	}

	return c.JSON(revenueData)
}

func getTopClients(c *fiber.Ctx) error {
	var topClients []TopClientData

	// Get all clients and calculate their revenue from paid invoices
	var clients []models.Client
	if err := config.DB.Find(&clients).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch clients"})
	}

	// Calculate revenue for each client
	for _, client := range clients {
		var totalRevenue float64
		config.DB.Model(&models.Invoice{}).
			Where("client_id = ? AND status = ?", client.ID, "paid").
			Select("COALESCE(SUM(amount), 0)").
			Scan(&totalRevenue)

		// Include all clients, even those with 0 revenue
		topClients = append(topClients, TopClientData{
			Name:    client.Name,
			Revenue: totalRevenue,
		})
	}

	// Sort by revenue (descending) and limit to top 5
	// Simple bubble sort for small dataset
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

	// Get total revenue
	config.DB.Model(&models.Invoice{}).Select("COALESCE(SUM(amount), 0)").Scan(&summary.TotalRevenue)

	// Get total paid amount for collection rate
	var totalPaid float64
	config.DB.Model(&models.Invoice{}).Where("status = ?", "paid").Select("COALESCE(SUM(amount), 0)").Scan(&totalPaid)

	// Calculate collection rate
	if summary.TotalRevenue > 0 {
		summary.CollectionRate = (totalPaid / summary.TotalRevenue) * 100
	}

	// Get client count
	config.DB.Model(&models.Client{}).Count(&summary.ClientCount)

	// Calculate average per client
	if summary.ClientCount > 0 {
		summary.AveragePerClient = summary.TotalRevenue / float64(summary.ClientCount)
	}

	// Get top client
	var clients []models.Client
	if err := config.DB.Find(&clients).Error; err == nil {
		var topClient TopClientData
		maxRevenue := 0.0

		for _, client := range clients {
			var totalRevenue float64
			config.DB.Model(&models.Invoice{}).
				Where("client_id = ? AND status = ?", client.ID, "paid").
				Select("COALESCE(SUM(amount), 0)").
				Scan(&totalRevenue)

			if totalRevenue > maxRevenue {
				maxRevenue = totalRevenue
				topClient.Name = client.Name
				topClient.Revenue = totalRevenue
			}
		}

		summary.TopClient = topClient.Name
		summary.TopClientRevenue = topClient.Revenue
	}

	// Get top revenue month
	var invoices []models.Invoice
	if err := config.DB.Where("status = ?", "paid").Find(&invoices).Error; err == nil {
		monthlyRevenue := make(map[string]float64)
		
		for _, invoice := range invoices {
			if invoice.InvoiceDate != "" {
				if invoiceTime, err := time.Parse("2006-01-02", invoice.InvoiceDate); err == nil {
					monthKey := invoiceTime.Format("2006-01")
					monthlyRevenue[monthKey] += invoice.Amount
				}
			}
		}

		// Find the month with highest revenue
		maxRevenue := 0.0
		topMonth := ""
		for month, revenue := range monthlyRevenue {
			if revenue > maxRevenue {
				maxRevenue = revenue
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

func getCollectionRate(c *fiber.Ctx) error {
	var totalInvoiced, totalPaid float64

	config.DB.Model(&models.Invoice{}).Select("COALESCE(SUM(amount), 0)").Scan(&totalInvoiced)
	config.DB.Model(&models.Invoice{}).Where("status = ?", "paid").Select("COALESCE(SUM(amount), 0)").Scan(&totalPaid)

	collectionRate := 0.0
	if totalInvoiced > 0 {
		collectionRate = (totalPaid / totalInvoiced) * 100
	}

	return c.JSON(fiber.Map{
		"collection_rate": collectionRate,
		"total_invoiced":  totalInvoiced,
		"total_paid":      totalPaid,
	})
}

func getTopRevenueMonth(c *fiber.Ctx) error {
	var invoices []models.Invoice
	if err := config.DB.Where("status = ?", "paid").Find(&invoices).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch invoices"})
	}

	monthlyRevenue := make(map[string]float64)
	
	for _, invoice := range invoices {
		if invoice.InvoiceDate != "" {
			if invoiceTime, err := time.Parse("2006-01-02", invoice.InvoiceDate); err == nil {
				monthKey := invoiceTime.Format("2006-01")
				monthlyRevenue[monthKey] += invoice.Amount
			}
		}
	}

	// Find the month with highest revenue
	maxRevenue := 0.0
	topMonth := ""
	for month, revenue := range monthlyRevenue {
		if revenue > maxRevenue {
			maxRevenue = revenue
			topMonth = month
		}
	}

	topMonthFormatted := "Current Month"
	if topMonth != "" {
		if monthTime, err := time.Parse("2006-01", topMonth); err == nil {
			topMonthFormatted = monthTime.Format("January 2006")
		}
	}

	return c.JSON(fiber.Map{
		"top_month":       topMonthFormatted,
		"top_month_revenue": maxRevenue,
	})
}