package models

import (
	"time"
)

type Client struct {
	ID             string    `json:"id" gorm:"primaryKey;type:varchar(30)"`
	Name           string    `json:"name"`
	Email          string    `json:"email"`
	TotalInvoiced  float64   `json:"total_invoiced"`
	TotalPaid      float64   `json:"total_paid"`
	InvoiceCount   int       `json:"invoice_count"`
	AverageInvoice float64   `json:"average_invoice"`
	PaymentDelay   int       `json:"payment_delay"` // in days
	Avatar         string    `json:"avatar"`
	CreatedAt      time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt      time.Time `json:"updated_at" gorm:"autoUpdateTime"`
	
	// Relationship - will be populated when needed
	Invoices       []Invoice `json:"invoices,omitempty" gorm:"foreignKey:ClientID"`
}

// GenerateClientID creates a unique client ID using current timestamp
func GenerateClientID() string {
	now := time.Now()
	return "CLI-" + now.Format("20060102-150405") + "-" + string(rune(now.Nanosecond()/1000000))
}