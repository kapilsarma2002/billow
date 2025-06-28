package routes

import (
	"billow-backend/config"
	"billow-backend/models"
	"encoding/json"
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
	userID := c.Get("X-User-ID", "USR-20241215-143052-123456") // Mock user ID
	
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
		// Create user if doesn't exist (for demo purposes)
		user = models.User{
			ID:           userID,
			Email:        updateData.Email,
			DisplayName:  updateData.DisplayName,
			ProfileImage: updateData.ProfileImage,
		}
		if err := config.DB.Create(&user).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to create user"})
		}
	} else {
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
	}
	
	return c.JSON(fiber.Map{
		"message": "Profile updated successfully",
		"user":    user,
	})
}

func getProfile(c *fiber.Ctx) error {
	userID := c.Get("X-User-ID", "USR-20241215-143052-123456")
	
	var user models.User
	if err := config.DB.First(&user, "id = ?", userID).Error; err != nil {
		// Return default user for demo
		user = models.User{
			ID:           userID,
			Email:        "john.doe@example.com",
			DisplayName:  "John Doe",
			ProfileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
		}
	}
	
	return c.JSON(user)
}

// Subscription Management
func getSubscriptionStatus(c *fiber.Ctx) error {
	userID := c.Get("X-User-ID", "USR-20241215-143052-123456")
	
	var subscription models.Subscription
	if err := config.DB.Preload("Plan").First(&subscription, "user_id = ?", userID).Error; err != nil {
		// Return default subscription for demo
		return c.JSON(fiber.Map{
			"subscription": map[string]interface{}{
				"id":                 "SUB-20241215-143052-123456",
				"plan_id":            "PLN-PRO",
				"status":             "active",
				"current_period_end": time.Now().AddDate(0, 1, 0),
				"trial_end":          nil,
				"plan": map[string]interface{}{
					"id":                  "PLN-PRO",
					"name":                "Pro",
					"price":               29.0,
					"currency":            "USD",
					"interval":            "month",
					"invoice_limit":       -1,
					"client_limit":        -1,
					"messages_per_day":    1000,
					"image_generation":    true,
					"custom_voice":        true,
					"priority_support":    true,
					"advanced_analytics":  true,
					"api_access":          true,
					"white_label":         false,
				},
			},
		})
	}
	
	return c.JSON(fiber.Map{"subscription": subscription})
}

func getUsageMetrics(c *fiber.Ctx) error {
	userID := c.Get("X-User-ID", "USR-20241215-143052-123456")
	
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
	
	return c.JSON(fiber.Map{
		"current_usage": map[string]interface{}{
			"invoices_created":  invoiceCount,
			"clients_created":   clientCount,
			"messages_sent":     messagesCount,
			"images_generated":  imagesGenerated,
		},
		"limits": map[string]interface{}{
			"invoice_limit":     -1, // Unlimited for Pro plan
			"client_limit":      -1, // Unlimited for Pro plan
			"messages_per_day":  1000,
			"image_generation":  true,
			"custom_voice":      true,
			"priority_support":  true,
		},
		"period": map[string]interface{}{
			"start": startOfMonth,
			"end":   time.Now().AddDate(0, 1, 0),
		},
	})
}

func getAvailablePlans(c *fiber.Ctx) error {
	// In production, these would be stored in database
	plans := []map[string]interface{}{
		{
			"id":                  "PLN-STARTER",
			"name":                "Starter",
			"price":               10.0,
			"currency":            "USD",
			"interval":            "month",
			"invoice_limit":       50,
			"client_limit":        10,
			"messages_per_day":    100,
			"image_generation":    false,
			"custom_voice":        false,
			"priority_support":    false,
			"advanced_analytics":  false,
			"api_access":          false,
			"white_label":         false,
			"features": []string{
				"Up to 50 invoices per month",
				"Up to 10 clients",
				"100 messages per day",
				"Basic analytics",
				"Email support",
			},
		},
		{
			"id":                  "PLN-PRO",
			"name":                "Pro",
			"price":               29.0,
			"currency":            "USD",
			"interval":            "month",
			"invoice_limit":       -1,
			"client_limit":        -1,
			"messages_per_day":    1000,
			"image_generation":    true,
			"custom_voice":        true,
			"priority_support":    true,
			"advanced_analytics":  true,
			"api_access":          true,
			"white_label":         false,
			"popular":             true,
			"features": []string{
				"Unlimited invoices",
				"Unlimited clients",
				"1,000 messages per day",
				"Image generation",
				"Custom voice",
				"Advanced analytics",
				"API access",
				"Priority support",
			},
		},
		{
			"id":                  "PLN-BUSINESS",
			"name":                "Business",
			"price":               99.0,
			"currency":            "USD",
			"interval":            "month",
			"invoice_limit":       -1,
			"client_limit":        -1,
			"messages_per_day":    -1,
			"image_generation":    true,
			"custom_voice":        true,
			"priority_support":    true,
			"advanced_analytics":  true,
			"api_access":          true,
			"white_label":         true,
			"features": []string{
				"Everything in Pro",
				"Unlimited messages",
				"White-label solution",
				"Custom integrations",
				"Dedicated support",
				"SLA guarantee",
			},
		},
	}
	
	return c.JSON(fiber.Map{"plans": plans})
}

func changeSubscription(c *fiber.Ctx) error {
	userID := c.Get("X-User-ID", "USR-20241215-143052-123456")
	
	var changeData struct {
		PlanID string `json:"plan_id"`
	}
	
	if err := c.BodyParser(&changeData); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request data"})
	}
	
	// In production, this would integrate with payment processor (Stripe, etc.)
	// For demo, we'll just update the subscription
	
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
		config.DB.Create(&subscription)
	} else {
		// Update existing subscription
		subscription.PlanID = changeData.PlanID
		subscription.UpdatedAt = time.Now()
		config.DB.Save(&subscription)
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
	userID := c.Get("X-User-ID", "USR-20241215-143052-123456")
	
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
		config.DB.Create(&preferences)
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
		config.DB.Save(&preferences)
	}
	
	return c.JSON(fiber.Map{
		"message":     "Preferences updated successfully",
		"preferences": preferences,
	})
}

func getPreferences(c *fiber.Ctx) error {
	userID := c.Get("X-User-ID", "USR-20241215-143052-123456")
	
	var preferences models.UserPreferences
	if err := config.DB.First(&preferences, "user_id = ?", userID).Error; err != nil {
		// Return default preferences
		preferences = models.UserPreferences{
			ID:                 models.GeneratePreferencesID(),
			UserID:             userID,
			Theme:              "light",
			Language:           "en",
			EmailNotifications: true,
			PushNotifications:  true,
			MarketingEmails:    false,
			WeeklyReports:      true,
			SecurityAlerts:     true,
			Currency:           "USD",
			Timezone:           "UTC",
		}
	}
	
	return c.JSON(preferences)
}

// Analytics
func getUsageAnalytics(c *fiber.Ctx) error {
	userID := c.Get("X-User-ID", "USR-20241215-143052-123456")
	
	// Get last 30 days of analytics data
	thirtyDaysAgo := time.Now().AddDate(0, 0, -30)
	
	var analyticsData []models.AnalyticsData
	config.DB.Where("user_id = ? AND date >= ?", userID, thirtyDaysAgo).
		Order("date ASC").
		Find(&analyticsData)
	
	// If no data exists, generate sample data for demo
	if len(analyticsData) == 0 {
		for i := 0; i < 30; i++ {
			date := time.Now().AddDate(0, 0, -29+i)
			analyticsData = append(analyticsData, models.AnalyticsData{
				Date:             date,
				InvoicesCreated:  randomInt(0, 5),
				ClientsAdded:     randomInt(0, 2),
				RevenueGenerated: float64(randomInt(0, 5000)),
				MessagesCount:    randomInt(10, 100),
			})
		}
	}
	
	return c.JSON(fiber.Map{"analytics": analyticsData})
}

func getAnalyticsDashboard(c *fiber.Ctx) error {
	userID := c.Get("X-User-ID", "USR-20241215-143052-123456")
	
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
	
	// Calculate revenue (mock data for demo)
	totalRevenue := float64(randomInt(10000, 50000))
	
	return c.JSON(fiber.Map{
		"dashboard": map[string]interface{}{
			"current_month": map[string]interface{}{
				"invoices_created":  invoiceCount,
				"clients_added":     clientCount,
				"messages_sent":     messagesCount,
				"revenue_generated": totalRevenue,
			},
			"growth": map[string]interface{}{
				"invoices_growth":  "+12.5%",
				"clients_growth":   "+8.3%",
				"messages_growth":  "+15.7%",
				"revenue_growth":   "+22.1%",
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

func randomInt(min, max int) int {
	return min + int(time.Now().UnixNano())%(max-min+1)
}