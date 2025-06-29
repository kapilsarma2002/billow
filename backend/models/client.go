package models

import (
	"time"
)

type Client struct {
	ID             string    `json:"id" gorm:"primaryKey;type:varchar(30)"`
	UserID         string    `json:"user_id" gorm:"type:varchar(30);not null;index"`
	Name           string    `json:"name"`
	Email          string    `json:"email"`
	Phone          string    `json:"phone"`
	Company        string    `json:"company"`
	Address        string    `json:"address"`
	TotalInvoiced  float64   `json:"total_invoiced"`
	TotalPaid      float64   `json:"total_paid"`
	InvoiceCount   int       `json:"invoice_count"`
	AverageInvoice float64   `json:"average_invoice"`
	PaymentDelay   int       `json:"payment_delay"` // in days
	Avatar         string    `json:"avatar"`
	CreatedAt      time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt      time.Time `json:"updated_at" gorm:"autoUpdateTime"`
	
	// Relationships
	User     User      `json:"user,omitempty" gorm:"foreignKey:UserID;references:ID"`
	Invoices []Invoice `json:"invoices,omitempty" gorm:"foreignKey:ClientID"`
}

// GenerateClientID creates a unique client ID using current timestamp
func GenerateClientID() string {
	now := time.Now()
	return "CLI-" + now.Format("20060102-150405") + "-" + string(rune(now.Nanosecond()/1000000))
}