package config

import (
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"log"
	"os"
)

var DB *gorm.DB

func ConnectDatabase() {
	// Use environment variable for database URL, fallback to local development
	database_url := os.Getenv("DATABASE_URL")
	if database_url == "" {
		database_url = "host=localhost user=postgres password=postgres dbname=billow port=5432 sslmode=disable"
	}
	
	db, err := gorm.Open(postgres.Open(database_url), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to DB: ", err)
	}
	DB = db
}