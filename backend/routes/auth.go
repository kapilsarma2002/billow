package routes

import (
	"billow-backend/config"
	"billow-backend/models"
	"time"

	"github.com/gofiber/fiber/v2"
)

func SetupAuthRoutes(app *fiber.App) {
	app.Post("/api/auth/sync-user", syncUser)
	app.Post("/api/auth/webhook", handleClerkWebhook)
}

// Sync user data from Clerk to our database
func syncUser(c *fiber.Ctx) error {
	var userData struct {
		ClerkID      string `json:"clerk_id"`
		Email        string `json:"email"`
		DisplayName  string `json:"display_name"`
		ProfileImage string `json:"profile_image"`
	}

	if err := c.BodyParser(&userData); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid request data"})
	}

	// Check if user already exists
	var existingUser models.User
	if err := config.DB.Where("clerk_id = ?", userData.ClerkID).First(&existingUser).Error; err != nil {
		// User doesn't exist, create new user
		user := models.User{
			ID:           models.GenerateUserID(),
			ClerkID:      userData.ClerkID,
			Email:        userData.Email,
			DisplayName:  userData.DisplayName,
			ProfileImage: userData.ProfileImage,
		}

		if err := config.DB.Create(&user).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to create user"})
		}

		// Create default subscription (Starter plan)
		subscription := models.Subscription{
			ID:               models.GenerateSubscriptionID(),
			UserID:           user.ID,
			PlanID:           "PLN-STARTER",
			Status:           "trialing",
			CurrentPeriodEnd: time.Now().AddDate(0, 0, 14), // 14-day trial
		}

		if err := config.DB.Create(&subscription).Error; err != nil {
			// Log error but don't fail user creation
			// In production, you might want to handle this differently
		}

		// Create default preferences
		preferences := models.UserPreferences{
			ID:                 models.GeneratePreferencesID(),
			UserID:             user.ID,
			Theme:              "light",
			Language:           "en",
			EmailNotifications: true,
			PushNotifications:  true,
			WeeklyReports:      true,
			SecurityAlerts:     true,
			Currency:           "USD",
			Timezone:           "UTC",
		}

		if err := config.DB.Create(&preferences).Error; err != nil {
			// Log error but don't fail user creation
		}

		return c.JSON(fiber.Map{
			"message": "User created successfully",
			"user":    user,
		})
	} else {
		// User exists, update their information
		existingUser.Email = userData.Email
		existingUser.DisplayName = userData.DisplayName
		existingUser.ProfileImage = userData.ProfileImage

		if err := config.DB.Save(&existingUser).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to update user"})
		}

		return c.JSON(fiber.Map{
			"message": "User updated successfully",
			"user":    existingUser,
		})
	}
}

// Handle Clerk webhooks for user events
func handleClerkWebhook(c *fiber.Ctx) error {
	var webhookData struct {
		Type string `json:"type"`
		Data struct {
			ID           string `json:"id"`
			EmailAddress string `json:"email_addresses"`
			FirstName    string `json:"first_name"`
			LastName     string `json:"last_name"`
			ImageURL     string `json:"image_url"`
		} `json:"data"`
	}

	if err := c.BodyParser(&webhookData); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid webhook data"})
	}

	switch webhookData.Type {
	case "user.created":
		// Handle user creation
		user := models.User{
			ID:           models.GenerateUserID(),
			ClerkID:      webhookData.Data.ID,
			Email:        webhookData.Data.EmailAddress,
			DisplayName:  webhookData.Data.FirstName + " " + webhookData.Data.LastName,
			ProfileImage: webhookData.Data.ImageURL,
		}

		if err := config.DB.Create(&user).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to create user"})
		}

		// Create default subscription and preferences (same as above)
		// ... (implementation similar to syncUser)

	case "user.updated":
		// Handle user updates
		var user models.User
		if err := config.DB.Where("clerk_id = ?", webhookData.Data.ID).First(&user).Error; err != nil {
			return c.Status(404).JSON(fiber.Map{"error": "User not found"})
		}

		user.Email = webhookData.Data.EmailAddress
		user.DisplayName = webhookData.Data.FirstName + " " + webhookData.Data.LastName
		user.ProfileImage = webhookData.Data.ImageURL

		if err := config.DB.Save(&user).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to update user"})
		}

	case "user.deleted":
		// Handle user deletion
		if err := config.DB.Where("clerk_id = ?", webhookData.Data.ID).Delete(&models.User{}).Error; err != nil {
			return c.Status(500).JSON(fiber.Map{"error": "Failed to delete user"})
		}
	}

	return c.JSON(fiber.Map{"message": "Webhook processed successfully"})
}