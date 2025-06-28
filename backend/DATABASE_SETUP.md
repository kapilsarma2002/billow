# Billow Database Setup Guide

This guide will help you set up the PostgreSQL database for the Billow application without any hardcoded or mock data.

## Prerequisites

1. **PostgreSQL** installed and running
   - macOS: `brew install postgresql && brew services start postgresql`
   - Ubuntu/Debian: `sudo apt-get install postgresql postgresql-contrib`
   - Windows: Download from https://www.postgresql.org/download/windows/

2. **psql** command line tool available

## Quick Setup (Recommended)

### Option 1: Automated Setup Script

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Run the automated setup script:
   ```bash
   ./setup_db.sh
   ```

   This script will:
   - Check if PostgreSQL is running
   - Create the `billow` database
   - Run the complete setup script
   - Create all tables and sample data

### Option 2: Manual Setup

If you prefer to run the commands manually:

1. **Create the database:**
   ```bash
   createdb -h localhost -U postgres billow
   ```

2. **Run the setup script:**
   ```bash
   psql -h localhost -U postgres -d billow -f setup_database.sql
   ```

## Database Structure

The setup creates the following tables:

- **users** - User accounts and profiles
- **plans** - Subscription plans (Starter, Pro, Business)
- **subscriptions** - User subscriptions to plans
- **user_preferences** - User preferences and settings
- **usage_logs** - Feature usage tracking
- **analytics_data** - Daily analytics data
- **clients** - Client information
- **invoices** - Invoice records

## Sample Data Created

### Plans
- **Starter** ($10/month): 50 invoices, 10 clients, 100 messages/day
- **Pro** ($29/month): Unlimited invoices/clients, 1000 messages/day
- **Business** ($99/month): Unlimited everything, white-label

### Sample User
- **ID**: `USR-20241215-143052-123456`
- **Email**: `john.doe@example.com`
- **Name**: John Doe
- **Plan**: Pro (active subscription)

### Sample Data
- 3 sample clients
- 3 sample invoices
- 7 days of analytics data
- Usage logs for messages and image generation

## API Authentication

The APIs now require a valid `X-User-ID` header. For testing, use:
```
X-User-ID: USR-20241215-143052-123456
```

## Testing the Setup

1. **Start the backend:**
   ```bash
   cd backend
   go run main.go
   ```

2. **Test an API endpoint:**
   ```bash
   curl -H "X-User-ID: USR-20241215-143052-123456" \
        http://localhost:8080/api/settings/profile
   ```

3. **Expected response:**
   ```json
   {
     "id": "USR-20241215-143052-123456",
     "email": "john.doe@example.com",
     "display_name": "John Doe",
     "profile_image": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
     "created_at": "2024-12-15T14:30:52Z",
     "updated_at": "2024-12-15T14:30:52Z"
   }
   ```

## Database Connection Details

- **Host**: localhost
- **Port**: 5432
- **Database**: billow
- **User**: postgres
- **Password**: (your PostgreSQL password)

## Troubleshooting

### PostgreSQL Connection Issues
```bash
# Check if PostgreSQL is running
pg_isready -h localhost -p 5432

# Start PostgreSQL (macOS)
brew services start postgresql

# Start PostgreSQL (Ubuntu/Debian)
sudo systemctl start postgresql
```

### Permission Issues
```bash
# Create postgres user if it doesn't exist
createuser -s postgres

# Set password for postgres user
psql -U postgres -c "ALTER USER postgres PASSWORD 'your_password';"
```

### Database Already Exists
```bash
# Drop and recreate
dropdb -h localhost -U postgres billow
createdb -h localhost -U postgres billow
```

## Environment Variables

The backend uses these environment variables:

```bash
# Database connection
DATABASE_URL="host=localhost user=postgres password=postgres dbname=billow port=5432 sslmode=disable"

# Or set individual variables
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=billow
DB_PORT=5432
```

## Next Steps

1. Start the backend server
2. Test the APIs with the sample user ID
3. Create additional users as needed
4. Customize the sample data for your use case

## API Endpoints

All settings endpoints now require authentication and return proper error responses:

- `GET /api/settings/profile` - Get user profile
- `POST /api/settings/profile` - Update user profile
- `GET /api/subscription/status` - Get subscription status
- `GET /api/subscription/plans` - Get available plans
- `POST /api/subscription/change` - Change subscription
- `GET /api/subscription/usage` - Get usage metrics
- `GET /api/settings/preferences` - Get user preferences
- `POST /api/settings/preferences` - Update preferences
- `GET /api/analytics/usage` - Get usage analytics
- `GET /api/analytics/dashboard` - Get dashboard analytics 