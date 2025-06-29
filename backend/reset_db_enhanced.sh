#!/bin/bash

# Enhanced Database Reset Script for Billow
# This script will drop all tables and recreate them with fresh, comprehensive mock data

echo "🔄 Enhanced Billow Database Reset"
echo "=================================="

# Check if PostgreSQL is running
if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    echo "   On macOS with Homebrew: brew services start postgresql"
    echo "   On Ubuntu/Debian: sudo systemctl start postgresql"
    exit 1
fi

# Database connection details
DB_NAME="billow"
DB_USER="postgres"
DB_HOST="localhost"
DB_PORT="5432"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 Dropping and recreating tables...${NC}"

# Run the enhanced reset SQL script
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f reset_database_enhanced.sql

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Enhanced database reset completed successfully!${NC}"
    echo ""
    echo -e "${YELLOW}📈 Enhanced Mock Data Summary:${NC}"
    echo "   ┌─────────────────────────────────────────────────────────┐"
    echo "   │ Users: 3 (John Doe, Jane Smith, Mike Wilson)           │"
    echo "   │ Plans: 3 (Starter $9.99, Pro $29.99, Business $99.99)  │"
    echo "   │ Clients: 7 across different users                      │"
    echo "   │ Invoices: 10 with various statuses                     │"
    echo "   │ Usage Logs: 13 entries                                 │"
    echo "   │ Analytics: 21 days of data                             │"
    echo "   └─────────────────────────────────────────────────────────┘"
    echo ""
    echo -e "${YELLOW}🔑 Test Clerk IDs:${NC}"
    echo "   • user_2abc123def456 (John Doe - Pro plan)"
    echo "   • user_2def456ghi789 (Jane Smith - Starter trial)"
    echo "   • user_2ghi789jkl012 (Mike Wilson - Business plan)"
    echo ""
    echo -e "${YELLOW}💰 Revenue Overview:${NC}"
    echo "   • Total Invoices: $28,700"
    echo "   • Paid Invoices: $20,800"
    echo "   • Pending Invoices: $6,700"
    echo "   • Draft Invoices: $1,200"
    echo ""
    echo -e "${YELLOW}📅 Recent Activity:${NC}"
    echo "   • Last 7 days of analytics data for each user"
    echo "   • Various invoice statuses (draft, sent, paid, pending)"
    echo "   • Usage logs for different features (invoices, clients, messages, images)"
    echo "   • Realistic business scenarios and amounts"
    echo ""
    echo -e "${GREEN}🎉 Enhanced database is ready for development!${NC}"
else
    echo -e "${RED}❌ Enhanced database reset failed!${NC}"
    exit 1
fi 