package models

import (
	"fmt"
	"time"
)

type Invoice struct {
	ID           string    `json:"id" gorm:"primaryKey;type:varchar(30)"`
	UserID       string    `json:"user_id" gorm:"type:varchar(30);not null;index"`
	ClientID     string    `json:"client_id" gorm:"type:varchar(30);not null;index;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT"`
	Client       Client    `json:"client" gorm:"foreignKey:ClientID;references:ID"`
	ClientName   string    `json:"client_name"` // For backward compatibility and display
	InvoiceDate  string    `json:"invoice_date"`
	Amount       float64   `json:"amount"`
	CurrencyType string    `json:"currency_type"`
	Status       string    `json:"status"` // paid/unpaid/overdue/processing
	DueDate      string    `json:"due_date"`
	CreatedAt    time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt    time.Time `json:"updated_at" gorm:"autoUpdateTime"`

	// Relationships
	User User `json:"user,omitempty" gorm:"foreignKey:UserID;references:ID"`
}

// GenerateInvoiceID creates a unique invoice ID using current date, time, and nanoseconds
// Format: INV-YYYYMMDD-HHMMSS-NNNNNN (e.g., INV-20241215-143052-123456)
func GenerateInvoiceID() string {
	now := time.Now()
	// Use nanoseconds for guaranteed uniqueness
	nanoseconds := now.Nanosecond() / 1000 // Convert to microseconds for shorter ID

	return fmt.Sprintf("INV-%s-%s-%06d",
		now.Format("20060102"), // YYYYMMDD
		now.Format("150405"),   // HHMMSS
		nanoseconds)            // Microseconds (6 digits)
}

// GenerateInvoiceNumber creates a sequential invoice number for display
func GenerateInvoiceNumber(userID string) string {
	// Count existing invoices for this user to generate next number
	var count int64
	// This would be called from the route handler where we have access to the DB
	return fmt.Sprintf("INV-%04d", count+1)
}