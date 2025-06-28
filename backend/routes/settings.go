package routes

import (
	"billow-backend/config"
	"billow-backend/models"
	"time"

	"github.com/gofiber/fiber/v2"
)

func SetupSettingsRoutes(app *fiber.App) {
	// Profile settings
	app.Post("/api/settings/profile", updateProfile)
	app.Get("/api/settings/profile", getProfile)

	// Subscription management
	app.Get("/api/subscription/status", getSubscriptionStatus)
	app.Post("/api/subscription/change", changeSubscription)
	app.Get("/api/subscription/usage", getUsageMetrics)
	app.Get("/api/subscription/plans", getAvailablePlans)

	// Preferences
	app.Post("/api/settings/preferences", updatePreferences)
	app.Get("/api/settings/preferences", getPreferences)

	// Analytics
	app.Get("/api/analytics/usage", getUsageAnalytics)
	app.Get("/api/analytics/dashboard", getAnalyticsDashboard)
}

// Profile Management
func updateProfile(c *fiber.Ctx) error {
	// In a real app, you'd get user ID from JWT token
	userID := c.Get("X-User-ID")
	if userID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "User ID required"})
	}

	var updateData struct {
		DisplayName  string `json:"display_name"`
		Email        string `json:"email"`
		ProfileImage string `json:"profile_image"`
	}

	if err := c.BodyParser(&updateData); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request data"})
	}

	// Validate email format
	if updateData.Email != "" {
		// Basic email validation (in production, use proper validation)
		if len(updateData.Email) < 5 || !contains(updateData.Email, "@") {
			return c.Status(400).JSON(fiber.Map{"error": "Invalid email format"})
		}
	}

	// Update user profile
	var user models.User
	if err := config.DB.First(&user, "id = ?", userID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	// Update existing user
	if updateData.DisplayName != "" {
		user.DisplayName = updateData.DisplayName
	}
	if updateData.Email != "" {
		user.Email = updateData.Email
	}
	if updateData.ProfileImage != "" {
		user.ProfileImage = updateData.ProfileImage
	}

	if err := config.DB.Save(&user).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to update profile"})
	}

	return c.JSON(fiber.Map{
		"message": "Profile updated successfully",
		"user":    user,
	})
}

func getProfile(c *fiber.Ctx) error {
	userID := c.Get("X-User-ID")
	if userID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "User ID required"})
	}

	var user models.User
	if err := config.DB.First(&user, "id = ?", userID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "User not found"})
	}

	return c.JSON(user)
}

// Subscription Management
func getSubscriptionStatus(c *fiber.Ctx) error {
	userID := c.Get("X-User-ID")
	if userID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "User ID required"})
	}

	var subscription models.Subscription
	if err := config.DB.Preload("Plan").First(&subscription, "user_id = ?", userID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Subscription not found"})
	}

	return c.JSON(fiber.Map{"subscription": subscription})
}

func getUsageMetrics(c *fiber.Ctx) error {
	userID := c.Get("X-User-ID")
	if userID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "User ID required"})
	}

	// Get current month usage
	startOfMonth := time.Now().AddDate(0, 0, -time.Now().Day()+1)

	// Count invoices created this month
	var invoiceCount int64
	config.DB.Model(&models.Invoice{}).Where("created_at >= ?", startOfMonth).Count(&invoiceCount)

	// Count clients created this month
	var clientCount int64
	config.DB.Model(&models.Client{}).Where("created_at >= ?", startOfMonth).Count(&clientCount)

	// Get usage logs for other features
	var usageLogs []models.UsageLog
	config.DB.Where("user_id = ? AND timestamp >= ?", userID, startOfMonth).Find(&usageLogs)

	messagesCount := 0
	imagesGenerated := 0

	for _, log := range usageLogs {
		switch log.FeatureType {
		case "message_sent":
			messagesCount += log.Count
		case "image_generated":
			imagesGenerated += log.Count
		}
	}

	// Get user's subscription to get limits
	var subscription models.Subscription
	if err := config.DB.Preload("Plan").First(&subscription, "user_id = ?", userID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Subscription not found"})
	}

	return c.JSON(fiber.Map{
		"current_usage": map[string]interface{}{
			"invoices_created": invoiceCount,
			"clients_created":  clientCount,
		},
		"limits": map[string]interface{}{
			"invoice_limit": subscription.Plan.InvoiceLimit,
			"client_limit":  subscription.Plan.ClientLimit,
		},
		"period": map[string]interface{}{
			"start": startOfMonth,
			"end":   subscription.CurrentPeriodEnd,
		},
	})
}

func getAvailablePlans(c *fiber.Ctx) error {
	var plans []models.Plan
	if err := config.DB.Find(&plans).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch plans"})
	}

	if len(plans) == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "No plans available"})
	}

	return c.JSON(fiber.Map{"plans": plans})
}

func changeSubscription(c *fiber.Ctx) error {
	userID := c.Get("X-User-ID")
	if userID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "User ID required"})
	}

	var changeData struct {
		PlanID string `json:"plan_id"`
	}

	if err := c.BodyParser(&changeData); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request data"})
	}

	// Verify plan exists
	var plan models.Plan
	if err := config.DB.First(&plan, "id = ?", changeData.PlanID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Plan not found"})
	}

	// In production, this would integrate with payment processor (Stripe, etc.)
	var subscription models.Subscription
	if err := config.DB.First(&subscription, "user_id = ?", userID).Error; err != nil {
		// Create new subscription
		subscription = models.Subscription{
			ID:               models.GenerateSubscriptionID(),
			UserID:           userID,
			PlanID:           changeData.PlanID,
			Status:           "active",
			CurrentPeriodEnd: time.Now().AddDate(0, 1, 0),
		}
		if err := config.DB.Create(&subscription).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to create subscription"})
		}
	} else {
		// Update existing subscription
		subscription.PlanID = changeData.PlanID
		subscription.UpdatedAt = time.Now()
		if err := config.DB.Save(&subscription).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to update subscription"})
		}
	}

	// Log the subscription change
	usageLog := models.UsageLog{
		ID:          models.GenerateUsageLogID(),
		UserID:      userID,
		FeatureType: "subscription_changed",
		Count:       1,
		Metadata:    `{"new_plan_id":"` + changeData.PlanID + `"}`,
	}
	config.DB.Create(&usageLog)

	return c.JSON(fiber.Map{
		"message":      "Subscription updated successfully",
		"subscription": subscription,
	})
}

// Preferences Management
func updatePreferences(c *fiber.Ctx) error {
	userID := c.Get("X-User-ID")
	if userID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "User ID required"})
	}

	var updateData models.UserPreferences
	if err := c.BodyParser(&updateData); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request data"})
	}

	var preferences models.UserPreferences
	if err := config.DB.First(&preferences, "user_id = ?", userID).Error; err != nil {
		// Create new preferences
		preferences = models.UserPreferences{
			ID:                 models.GeneratePreferencesID(),
			UserID:             userID,
			Theme:              updateData.Theme,
			Language:           updateData.Language,
			EmailNotifications: updateData.EmailNotifications,
			PushNotifications:  updateData.PushNotifications,
			MarketingEmails:    updateData.MarketingEmails,
			WeeklyReports:      updateData.WeeklyReports,
			SecurityAlerts:     updateData.SecurityAlerts,
			Currency:           updateData.Currency,
			Timezone:           updateData.Timezone,
		}
		if err := config.DB.Create(&preferences).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to create preferences"})
		}
	} else {
		// Update existing preferences
		if updateData.Theme != "" {
			preferences.Theme = updateData.Theme
		}
		if updateData.Language != "" {
			preferences.Language = updateData.Language
		}
		preferences.EmailNotifications = updateData.EmailNotifications
		preferences.PushNotifications = updateData.PushNotifications
		preferences.MarketingEmails = updateData.MarketingEmails
		preferences.WeeklyReports = updateData.WeeklyReports
		preferences.SecurityAlerts = updateData.SecurityAlerts
		if updateData.Currency != "" {
			preferences.Currency = updateData.Currency
		}
		if updateData.Timezone != "" {
			preferences.Timezone = updateData.Timezone
		}
		if err := config.DB.Save(&preferences).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to update preferences"})
		}
	}

	return c.JSON(fiber.Map{
		"message":     "Preferences updated successfully",
		"preferences": preferences,
	})
}

func getPreferences(c *fiber.Ctx) error {
	userID := c.Get("X-User-ID")
	if userID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "User ID required"})
	}

	var preferences models.UserPreferences
	if err := config.DB.First(&preferences, "user_id = ?", userID).Error; err != nil {
		return c.Status(404).JSON(fiber.Map{"error": "Preferences not found"})
	}

	return c.JSON(preferences)
}

// Analytics
func getUsageAnalytics(c *fiber.Ctx) error {
	userID := c.Get("X-User-ID")
	if userID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "User ID required"})
	}

	// Get last 30 days of analytics data
	thirtyDaysAgo := time.Now().AddDate(0, 0, -30)

	var analyticsData []models.AnalyticsData
	if err := config.DB.Where("user_id = ? AND date >= ?", userID, thirtyDaysAgo).
		Order("date ASC").
		Find(&analyticsData).Error; err != nil {
		return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch analytics data"})
	}

	if len(analyticsData) == 0 {
		return c.Status(404).JSON(fiber.Map{"error": "No analytics data found"})
	}

	return c.JSON(fiber.Map{"analytics": analyticsData})
}

func getAnalyticsDashboard(c *fiber.Ctx) error {
	userID := c.Get("X-User-ID")
	if userID == "" {
		return c.Status(401).JSON(fiber.Map{"error": "User ID required"})
	}

	// Get current month stats
	startOfMonth := time.Now().AddDate(0, 0, -time.Now().Day()+1)

	var invoiceCount int64
	config.DB.Model(&models.Invoice{}).Where("created_at >= ?", startOfMonth).Count(&invoiceCount)

	var clientCount int64
	config.DB.Model(&models.Client{}).Where("created_at >= ?", startOfMonth).Count(&clientCount)

	// Get usage logs
	var usageLogs []models.UsageLog
	config.DB.Where("user_id = ? AND timestamp >= ?", userID, startOfMonth).Find(&usageLogs)

	messagesCount := 0
	for _, log := range usageLogs {
		if log.FeatureType == "message_sent" {
			messagesCount += log.Count
		}
	}

	// Calculate revenue from actual invoices
	var totalRevenue float64
	config.DB.Model(&models.Invoice{}).
		Where("created_at >= ?", startOfMonth).
		Select("COALESCE(SUM(total_amount), 0)").
		Scan(&totalRevenue)

	return c.JSON(fiber.Map{
		"dashboard": map[string]interface{}{
			"current_month": map[string]interface{}{
				"invoices_created":  invoiceCount,
				"clients_added":     clientCount,
				"messages_sent":     messagesCount,
				"revenue_generated": totalRevenue,
			},
		},
	})
}

// Helper functions
func contains(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
