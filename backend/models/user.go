package models

import (
	"time"
)

type User struct {
	ID          string    `json:"id" gorm:"primaryKey;type:varchar(30)"`
	Email       string    `json:"email" gorm:"unique;not null"`
	DisplayName string    `json:"display_name"`
	ProfileImage string   `json:"profile_image"`
	CreatedAt   time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt   time.Time `json:"updated_at" gorm:"autoUpdateTime"`
	
	// Relationships
	Subscription   *Subscription   `json:"subscription,omitempty" gorm:"foreignKey:UserID"`
	Preferences    *UserPreferences `json:"preferences,omitempty" gorm:"foreignKey:UserID"`
	UsageLogs      []UsageLog      `json:"usage_logs,omitempty" gorm:"foreignKey:UserID"`
}

type Subscription struct {
	ID                string    `json:"id" gorm:"primaryKey;type:varchar(30)"`
	UserID            string    `json:"user_id" gorm:"type:varchar(30);not null;index"`
	PlanID            string    `json:"plan_id" gorm:"type:varchar(30);not null"`
	Status            string    `json:"status"` // active, canceled, past_due, trialing
	CurrentPeriodEnd  time.Time `json:"current_period_end"`
	TrialEnd          *time.Time `json:"trial_end,omitempty"`
	CanceledAt        *time.Time `json:"canceled_at,omitempty"`
	CreatedAt         time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt         time.Time `json:"updated_at" gorm:"autoUpdateTime"`
	
	// Relationships
	User User `json:"user" gorm:"foreignKey:UserID;references:ID"`
	Plan Plan `json:"plan" gorm:"foreignKey:PlanID;references:ID"`
}

type Plan struct {
	ID                    string  `json:"id" gorm:"primaryKey;type:varchar(30)"`
	Name                  string  `json:"name"`
	Price                 float64 `json:"price"`
	Currency              string  `json:"currency" gorm:"default:'USD'"`
	Interval              string  `json:"interval"` // month, year
	InvoiceLimit          int     `json:"invoice_limit"` // -1 for unlimited
	ClientLimit           int     `json:"client_limit"` // -1 for unlimited
	MessagesPerDay        int     `json:"messages_per_day"` // -1 for unlimited
	ImageGeneration       bool    `json:"image_generation"`
	CustomVoice           bool    `json:"custom_voice"`
	PrioritySupport       bool    `json:"priority_support"`
	AdvancedAnalytics     bool    `json:"advanced_analytics"`
	APIAccess             bool    `json:"api_access"`
	WhiteLabel            bool    `json:"white_label"`
	CreatedAt             time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt             time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

type UserPreferences struct {
	ID                    string    `json:"id" gorm:"primaryKey;type:varchar(30)"`
	UserID                string    `json:"user_id" gorm:"type:varchar(30);not null;unique;index"`
	Theme                 string    `json:"theme" gorm:"default:'light'"` // light, dark, auto
	Language              string    `json:"language" gorm:"default:'en'"`
	EmailNotifications    bool      `json:"email_notifications" gorm:"default:true"`
	PushNotifications     bool      `json:"push_notifications" gorm:"default:true"`
	MarketingEmails       bool      `json:"marketing_emails" gorm:"default:false"`
	WeeklyReports         bool      `json:"weekly_reports" gorm:"default:true"`
	SecurityAlerts        bool      `json:"security_alerts" gorm:"default:true"`
	Currency              string    `json:"currency" gorm:"default:'USD'"`
	Timezone              string    `json:"timezone" gorm:"default:'UTC'"`
	CreatedAt             time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt             time.Time `json:"updated_at" gorm:"autoUpdateTime"`
	
	// Relationships
	User User `json:"user" gorm:"foreignKey:UserID;references:ID"`
}

type UsageLog struct {
	ID          string    `json:"id" gorm:"primaryKey;type:varchar(30)"`
	UserID      string    `json:"user_id" gorm:"type:varchar(30);not null;index"`
	FeatureType string    `json:"feature_type"` // invoice_created, client_created, message_sent, image_generated
	Count       int       `json:"count" gorm:"default:1"`
	Metadata    string    `json:"metadata,omitempty"` // JSON string for additional data
	Timestamp   time.Time `json:"timestamp" gorm:"autoCreateTime"`
	
	// Relationships
	User User `json:"user" gorm:"foreignKey:UserID;references:ID"`
}

type AnalyticsData struct {
	ID          string    `json:"id" gorm:"primaryKey;type:varchar(30)"`
	UserID      string    `json:"user_id" gorm:"type:varchar(30);not null;index"`
	Date        time.Time `json:"date"`
	InvoicesCreated int   `json:"invoices_created"`
	ClientsAdded    int   `json:"clients_added"`
	RevenueGenerated float64 `json:"revenue_generated"`
	MessagesCount   int   `json:"messages_count"`
	CreatedAt       time.Time `json:"created_at" gorm:"autoCreateTime"`
	
	// Relationships
	User User `json:"user" gorm:"foreignKey:UserID;references:ID"`
}

// Generate unique IDs
func GenerateUserID() string {
	now := time.Now()
	return "USR-" + now.Format("20060102-150405") + "-" + string(rune(now.Nanosecond()/1000000))
}

func GenerateSubscriptionID() string {
	now := time.Now()
	return "SUB-" + now.Format("20060102-150405") + "-" + string(rune(now.Nanosecond()/1000000))
}

func GeneratePlanID() string {
	now := time.Now()
	return "PLN-" + now.Format("20060102-150405") + "-" + string(rune(now.Nanosecond()/1000000))
}

func GeneratePreferencesID() string {
	now := time.Now()
	return "PRF-" + now.Format("20060102-150405") + "-" + string(rune(now.Nanosecond()/1000000))
}

func GenerateUsageLogID() string {
	now := time.Now()
	return "ULG-" + now.Format("20060102-150405") + "-" + string(rune(now.Nanosecond()/1000000))
}

func GenerateAnalyticsID() string {
	now := time.Now()
	return "ANL-" + now.Format("20060102-150405") + "-" + string(rune(now.Nanosecond()/1000000))
}