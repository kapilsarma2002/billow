#!/bin/bash

# Billow Database Setup Script
# This script will help you set up the PostgreSQL database for the Billow application

echo "🚀 Setting up Billow Database..."

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    echo "   On macOS with Homebrew: brew services start postgresql"
    echo "   On Ubuntu/Debian: sudo systemctl start postgresql"
    exit 1
fi

# Check if database exists
if psql -h localhost -U postgres -lqt | cut -d \| -f 1 | grep -qw billow; then
    echo "⚠️  Database 'billow' already exists."
    read -p "Do you want to drop and recreate it? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🗑️  Dropping existing database..."
        dropdb -h localhost -U postgres billow
    else
        echo "❌ Setup cancelled."
        exit 1
    fi
fi

# Create database
echo "📦 Creating database 'billow'..."
createdb -h localhost -U postgres billow

if [ $? -eq 0 ]; then
    echo "✅ Database created successfully!"
else
    echo "❌ Failed to create database. Please check your PostgreSQL setup."
    exit 1
fi

# Run the setup script
echo "🔧 Running database setup script..."
psql -h localhost -U postgres -d billow -f setup_database.sql

if [ $? -eq 0 ]; then
    echo "✅ Database setup completed successfully!"
    echo ""
    echo "📊 Database Summary:"
    echo "   - Database: billow"
    echo "   - Host: localhost"
    echo "   - Port: 5432"
    echo "   - User: postgres"
    echo ""
    echo "👤 Sample User:"
    echo "   - ID: USR-20241215-143052-123456"
    echo "   - Email: john.doe@example.com"
    echo "   - Plan: Pro"
    echo ""
    echo "🔑 To connect to the database:"
    echo "   psql -h localhost -U postgres -d billow"
    echo ""
    echo "🎉 You can now start the Billow backend application!"
else
    echo "❌ Database setup failed. Please check the error messages above."
    exit 1
fi 