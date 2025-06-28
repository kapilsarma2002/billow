package models

type Invoice struct {
	ID           int     `json:"id" gorm:"primaryKey"`
	Client       string  `json:"client"`
	InvoiceDate  string `json:"invoice_date"`
	Amount       float64  `json:"amount"`
	CurrencyType string `json:"currency_type"`
	Status       string  `json:"status"` // paid/unpaid/overdue/processing
	DueDate			 string  `json:"due_date"`
}
