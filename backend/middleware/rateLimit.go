package middleware

import (
	"billow-backend/config"
	"billow-backend/models"
	"time"

	"github.com/gofiber/fiber/v2"
)

// Rate limiting based on subscription tier
func RateLimitMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID := c.Get("X-User-ID", "USR-20241215-143052-123456") // Mock user ID

		// Get user's subscription
		var subscription models.Subscription
		if err := config.DB.Preload("Plan").First(&subscription, "user_id = ?", userID).Error; err != nil {
			// Default to starter limits if no subscription found
			return applyRateLimit(c, "starter")
		}

		// Apply rate limits based on plan
		planName := subscription.Plan.Name
		return applyRateLimit(c, planName)
	}
}

func applyRateLimit(c *fiber.Ctx, planName string) error {
	userID := c.Get("X-User-ID", "USR-20241215-143052-123456")
	endpoint := c.Path()

	// Define rate limits per plan
	limits := map[string]map[string]int{
		"starter": {
			"/api/invoices":  50,  // 50 requests per hour
			"/api/clients":   20,  // 20 requests per hour
			"/api/dashboard": 100, // 100 requests per hour
			"default":        30,  // 30 requests per hour for other endpoints
		},
		"pro": {
			"/api/invoices":  200, // 200 requests per hour
			"/api/clients":   100, // 100 requests per hour
			"/api/dashboard": 500, // 500 requests per hour
			"default":        150, // 150 requests per hour for other endpoints
		},
		"business": {
			"/api/invoices":  1000, // 1000 requests per hour
			"/api/clients":   500,  // 500 requests per hour
			"/api/dashboard": 2000, // 2000 requests per hour
			"default":        500,  // 500 requests per hour for other endpoints
		},
	}

	// Get limit for current plan and endpoint
	planLimits, exists := limits[planName]
	if !exists {
		planLimits = limits["starter"] // Default to starter limits
	}

	limit, exists := planLimits[endpoint]
	if !exists {
		limit = planLimits["default"]
	}

	// Check current usage in the last hour
	oneHourAgo := time.Now().Add(-time.Hour)
	var requestCount int64

	// In production, you'd use Redis or similar for rate limiting
	// For demo, we'll use a simple database check
	config.DB.Model(&models.UsageLog{}).
		Where("user_id = ? AND feature_type = ? AND timestamp >= ?",
			userID, "api_request_"+endpoint, oneHourAgo).
		Count(&requestCount)

	if int(requestCount) >= limit {
		return c.Status(429).JSON(fiber.Map{
			"error":      "Rate limit exceeded",
			"limit":      limit,
			"reset_time": time.Now().Add(time.Hour).Unix(),
		})
	}

	// Add rate limit headers
	c.Set("X-RateLimit-Limit", string(rune(limit)))
	c.Set("X-RateLimit-Remaining", string(rune(limit-int(requestCount)-1)))
	c.Set("X-RateLimit-Reset", string(rune(time.Now().Add(time.Hour).Unix())))

	return c.Next()
}

// Subscription feature check middleware
func RequireFeature(feature string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userID := c.Get("X-User-ID", "USR-20241215-143052-123456")

		// Get user's subscription
		var subscription models.Subscription
		if err := config.DB.Preload("Plan").First(&subscription, "user_id = ?", userID).Error; err != nil {
			return c.Status(403).JSON(fiber.Map{
				"error":   "Subscription required",
				"feature": feature,
			})
		}

		// Check if plan includes the required feature
		plan := subscription.Plan
		hasFeature := false

		switch feature {
		case "advanced_analytics":
			hasFeature = plan.AdvancedAnalytics
		case "api_access":
			hasFeature = plan.APIAccess
		case "white_label":
			hasFeature = plan.WhiteLabel
		default:
			hasFeature = true // Allow by default
		}

		if !hasFeature {
			return c.Status(403).JSON(fiber.Map{
				"error":            "Feature not available in your plan",
				"feature":          feature,
				"current_plan":     plan.Name,
				"upgrade_required": true,
			})
		}

		return c.Next()
	}
}

// Usage tracking middleware
func TrackUsage(featureType string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		// Temporarily disabled to prevent errors
		// TODO: Re-enable once ID generation is stable
		return c.Next()

		/*
			userID := c.Get("X-User-ID", "USR-20241215-143052-123456")

			// Check if user exists before creating usage log
			var user models.User
			if err := config.DB.First(&user, "id = ?", userID).Error; err != nil {
				// User doesn't exist, skip logging but continue with request
				return c.Next()
			}

			// Check if we already logged this feature recently (within 1 second)
			oneSecondAgo := time.Now().Add(-time.Second)
			var existingLog models.UsageLog
			if err := config.DB.Where("user_id = ? AND feature_type = ? AND timestamp >= ?",
				userID, featureType, oneSecondAgo).First(&existingLog).Error; err != nil {
				// No recent log exists, create new one
				usageLog := models.UsageLog{
					ID:          models.GenerateUsageLogID(),
					UserID:      userID,
					FeatureType: featureType,
					Count:       1,
				}
				if createErr := config.DB.Create(&usageLog).Error; createErr != nil {
					// Log error but don't fail the request
					// In production, you might want to log this to a monitoring system
				}
			}
			// If recent log exists, skip creating new one to avoid duplicates

			return c.Next()
		*/
	}
}
