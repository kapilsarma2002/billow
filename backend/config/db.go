package config

import (
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"log"
)

var DB *gorm.DB

func ConnectDatabase() {
	database_url := "host=localhost user=postgres password=postgres dbname=billow port=5432 sslmode=disable"
	db, err := gorm.Open(postgres.Open(database_url), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to DB: ", err)
	}
	DB = db
}
