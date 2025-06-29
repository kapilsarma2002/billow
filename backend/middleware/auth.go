package middleware

import (
	"billow-backend/config"
	"billow-backend/models"
	"fmt"
	"strings"

	"github.com/gofiber/fiber/v2"
)

// AuthMiddleware validates the user and sets user context
func AuthMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Get user ID from header (in production, this would come from JWT token validation)
		userID := c.Get("X-User-ID")
		clerkID := c.Get("X-Clerk-ID")

		// For development, allow mock user ID
		if userID == "" && clerkID == "" {
			return c.Status(401).JSON(fiber.Map{
				"error": "Authentication required",
				"message": "Please provide X-User-ID or X-Clerk-ID header",
			})
		}

		var user models.User
		var err error

		// Try to find user by Clerk ID first, then by our internal ID
		if clerkID != "" {
			fmt.Printf("Looking for user with Clerk ID: %s\n", clerkID)
			err = config.DB.Where("clerk_id = ?", clerkID).First(&user).Error
			if err != nil {
				fmt.Printf("User not found with Clerk ID: %s, error: %v\n", clerkID, err)
			}
		} else if userID != "" {
			fmt.Printf("Looking for user with User ID: %s\n", userID)
			err = config.DB.Where("id = ?", userID).First(&user).Error
			if err != nil {
				fmt.Printf("User not found with User ID: %s, error: %v\n", userID, err)
			}
		}

		if err != nil {
			return c.Status(401).JSON(fiber.Map{
				"error": "User not found",
				"message": "Please sign in to continue. If you just signed up, please try refreshing the page.",
				"clerk_id": clerkID,
				"user_id": userID,
			})
		}

		fmt.Printf("User found: %s (Clerk ID: %s)\n", user.ID, user.ClerkID)

		// Set user context for use in handlers
		c.Locals("user", user)
		c.Locals("user_id", user.ID)

		return c.Next()
	}
}

// GetUserFromContext retrieves the authenticated user from context
func GetUserFromContext(c *fiber.Ctx) (*models.User, error) {
	user, ok := c.Locals("user").(models.User)
	if !ok {
		return nil, fiber.NewError(401, "User not found in context")
	}
	return &user, nil
}

// GetUserIDFromContext retrieves the authenticated user ID from context
func GetUserIDFromContext(c *fiber.Ctx) (string, error) {
	userID, ok := c.Locals("user_id").(string)
	if !ok {
		return "", fiber.NewError(401, "User ID not found in context")
	}
	return userID, nil
}

// OptionalAuthMiddleware allows both authenticated and unauthenticated requests
func OptionalAuthMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID := c.Get("X-User-ID")
		clerkID := c.Get("X-Clerk-ID")

		if userID != "" || clerkID != "" {
			var user models.User
			var err error

			if clerkID != "" {
				err = config.DB.Where("clerk_id = ?", clerkID).First(&user).Error
			} else if userID != "" {
				err = config.DB.Where("id = ?", userID).First(&user).Error
			}

			if err == nil {
				c.Locals("user", user)
				c.Locals("user_id", user.ID)
			}
		}

		return c.Next()
	}
}

// RequireSubscription middleware checks if user has an active subscription
func RequireSubscription() fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID, err := GetUserIDFromContext(c)
		if err != nil {
			return err
		}

		var subscription models.Subscription
		if err := config.DB.Preload("Plan").Where("user_id = ? AND status IN ?", userID, []string{"active", "trialing"}).First(&subscription).Error; err != nil {
			return c.Status(403).JSON(fiber.Map{
				"error": "Active subscription required",
				"message": "Please upgrade your plan to access this feature",
			})
		}

		c.Locals("subscription", subscription)
		return c.Next()
	}
}

// RequirePlan middleware checks if user has a specific plan or higher
func RequirePlan(requiredPlans ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		subscription, ok := c.Locals("subscription").(models.Subscription)
		if !ok {
			return c.Status(403).JSON(fiber.Map{
				"error": "Subscription information not found",
			})
		}

		// Check if user's plan is in the required plans list
		for _, plan := range requiredPlans {
			if strings.EqualFold(subscription.Plan.Name, plan) {
				return c.Next()
			}
		}

		return c.Status(403).JSON(fiber.Map{
			"error": "Plan upgrade required",
			"message": "This feature requires a higher plan",
			"current_plan": subscription.Plan.Name,
			"required_plans": requiredPlans,
		})
	}
}