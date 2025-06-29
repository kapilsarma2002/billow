package routes

import (
	"billow-backend/config"
	"billow-backend/models"
	"fmt"
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

	// Validate required fields
	if userData.ClerkID == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Clerk ID is required"})
	}

	if userData.Email == "" {
		return c.Status(400).JSON(fiber.Map{"error": "Email is required"})
	}

	// Check if user already exists
	var existingUser models.User
	if err := config.DB.Where("clerk_id = ?", userData.ClerkID).First(&existingUser).Error; err != nil {
		// User doesn't exist, create new user
		fmt.Printf("Creating new user with Clerk ID: %s\n", userData.ClerkID)
		
		user := models.User{
			ID:           models.GenerateUserID(),
			ClerkID:      userData.ClerkID,
			Email:        userData.Email,
			DisplayName:  userData.DisplayName,
			ProfileImage: userData.ProfileImage,
		}

		if err := config.DB.Create(&user).Error; err != nil {
			fmt.Printf("Error creating user: %v\n", err)
			return c.Status(500).JSON(fiber.Map{"error": "Failed to create user"})
		}

		fmt.Printf("User created successfully: %s\n", user.ID)

		// Create default subscription (Starter plan with trial)
		subscription := models.Subscription{
			ID:               models.GenerateSubscriptionID(),
			UserID:           user.ID,
			PlanID:           "PLN-STARTER",
			Status:           "trialing",
			CurrentPeriodEnd: time.Now().AddDate(0, 0, 14), // 14-day trial
			TrialEnd:         &[]time.Time{time.Now().AddDate(0, 0, 14)}[0],
		}

		if err := config.DB.Create(&subscription).Error; err != nil {
			fmt.Printf("Error creating subscription: %v\n", err)
			// Log error but don't fail user creation
		} else {
			fmt.Printf("Subscription created successfully: %s\n", subscription.ID)
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
			fmt.Printf("Error creating preferences: %v\n", err)
			// Log error but don't fail user creation
		} else {
			fmt.Printf("Preferences created successfully: %s\n", preferences.ID)
		}

		return c.JSON(fiber.Map{
			"message": "User created successfully",
			"user":    user,
			"is_new":  true,
		})
	} else {
		// User exists, update their information
		fmt.Printf("Updating existing user: %s\n", existingUser.ID)
		
		existingUser.Email = userData.Email
		existingUser.DisplayName = userData.DisplayName
		existingUser.ProfileImage = userData.ProfileImage

		if err := config.DB.Save(&existingUser).Error; err != nil {
			fmt.Printf("Error updating user: %v\n", err)
			return c.Status(500).JSON(fiber.Map{"error": "Failed to update user"})
		}

		fmt.Printf("User updated successfully: %s\n", existingUser.ID)

		return c.JSON(fiber.Map{
			"message": "User updated successfully",
			"user":    existingUser,
			"is_new":  false,
		})
	}
}

// Handle Clerk webhooks for user events
func handleClerkWebhook(c *fiber.Ctx) error {
	var webhookData struct {
		Type string `json:"type"`
		Data struct {
			ID            string `json:"id"`
			EmailAddress  string `json:"email_addresses"`
			FirstName     string `json:"first_name"`
			LastName      string `json:"last_name"`
			ImageURL      string `json:"image_url"`
			PrimaryEmail  string `json:"primary_email_address_id"`
			EmailObjects  []struct {
				ID           string `json:"id"`
				EmailAddress string `json:"email_address"`
			} `json:"email_addresses"`
		} `json:"data"`
	}

	if err := c.BodyParser(&webhookData); err != nil {
		return c.Status(400).JSON(fiber.Map{"error": "Invalid webhook data"})
	}

	fmt.Printf("Received webhook: %s for user: %s\n", webhookData.Type, webhookData.Data.ID)

	// Extract email from email objects
	var email string
	if len(webhookData.Data.EmailObjects) > 0 {
		email = webhookData.Data.EmailObjects[0].EmailAddress
	}

	switch webhookData.Type {
	case "user.created":
		// Handle user creation
		user := models.User{
			ID:           models.GenerateUserID(),
			ClerkID:      webhookData.Data.ID,
			Email:        email,
			DisplayName:  webhookData.Data.FirstName + " " + webhookData.Data.LastName,
			ProfileImage: webhookData.Data.ImageURL,
		}

		if err := config.DB.Create(&user).Error; err != nil {
			fmt.Printf("Webhook error creating user: %v\n", err)
			return c.Status(500).JSON(fiber.Map{"error": "Failed to create user"})
		}

		// Create default subscription and preferences
		subscription := models.Subscription{
			ID:               models.GenerateSubscriptionID(),
			UserID:           user.ID,
			PlanID:           "PLN-STARTER",
			Status:           "trialing",
			CurrentPeriodEnd: time.Now().AddDate(0, 0, 14),
			TrialEnd:         &[]time.Time{time.Now().AddDate(0, 0, 14)}[0],
		}
		config.DB.Create(&subscription)

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
		config.DB.Create(&preferences)

		fmt.Printf("Webhook user created: %s\n", user.ID)

	case "user.updated":
		// Handle user updates
		var user models.User
		if err := config.DB.Where("clerk_id = ?", webhookData.Data.ID).First(&user).Error; err != nil {
			fmt.Printf("Webhook user not found: %s\n", webhookData.Data.ID)
			return c.Status(404).JSON(fiber.Map{"error": "User not found"})
		}

		user.Email = email
		user.DisplayName = webhookData.Data.FirstName + " " + webhookData.Data.LastName
		user.ProfileImage = webhookData.Data.ImageURL

		if err := config.DB.Save(&user).Error; err != nil {
			fmt.Printf("Webhook error updating user: %v\n", err)
			return c.Status(500).JSON(fiber.Map{"error": "Failed to update user"})
		}

		fmt.Printf("Webhook user updated: %s\n", user.ID)

	case "user.deleted":
		// Handle user deletion
		if err := config.DB.Where("clerk_id = ?", webhookData.Data.ID).Delete(&models.User{}).Error; err != nil {
			fmt.Printf("Webhook error deleting user: %v\n", err)
			return c.Status(500).JSON(fiber.Map{"error": "Failed to delete user"})
		}

		fmt.Printf("Webhook user deleted: %s\n", webhookData.Data.ID)
	}

	return c.JSON(fiber.Map{"message": "Webhook processed successfully"})
}