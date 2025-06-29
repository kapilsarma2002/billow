#!/bin/bash

# Database reset script for Billow
# This script will drop all tables and recreate them with fresh mock data

echo "🔄 Resetting Billow database..."

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    exit 1
fi

# Database connection details (update these if needed)
DB_NAME="billow"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

echo "📊 Dropping and recreating tables..."

# Run the reset SQL script
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f reset_database.sql

if [ $? -eq 0 ]; then
    echo "✅ Database reset completed successfully!"
    echo ""
    echo "📈 Mock data summary:"
    echo "   - 3 users (John Doe, Jane Smith, Mike Wilson)"
    echo "   - 3 subscription plans (Starter, Pro, Business)"
    echo "   - 5 clients across different users"
    echo "   - 7 invoices with various statuses"
    echo "   - Usage logs and analytics data"
    echo ""
    echo "🔑 Test Clerk IDs:"
    echo "   - user_2abc123def456 (John Doe - Pro plan)"
    echo "   - user_2def456ghi789 (Jane Smith - Starter trial)"
    echo "   - user_2ghi789jkl012 (Mike Wilson - Business plan)"
else
    echo "❌ Database reset failed!"
    exit 1
fi 