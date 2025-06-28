package models

type Invoice struct {
	ID         int     `json:"id" gorm:"primaryKey"`
	Client     string  `json:"client"`
	InvoiceDate string `json:"invoice_date"`
	Amount     float64  `json:"amount"`
	Status     string  `json:"status"` // paid/unpaid
}
