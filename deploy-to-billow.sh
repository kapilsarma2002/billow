#!/bin/bash

# Deploy to existing Heroku app 'billow'
set -e

echo "🚀 Deploying to existing Heroku app 'billow'..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    print_error "Heroku CLI is not installed!"
    print_status "Please install it from: https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Check if logged in to Heroku
if ! heroku auth:whoami &> /dev/null; then
    print_error "Not logged in to Heroku!"
    print_status "Please run: heroku login"
    exit 1
fi

print_status "Heroku CLI is ready"

# Check if app exists
if ! heroku apps:info --app billow &> /dev/null; then
    print_error "App 'billow' does not exist!"
    print_status "Please create the app first or check the app name"
    exit 1
fi

print_status "Found existing app: billow"

print_step "Setting up backend deployment..."

# Navigate to backend directory
cd backend

# Initialize git if not already done
if [ ! -d ".git" ]; then
    print_status "Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit for Heroku deployment"
fi

# Add Heroku remote if not exists
if ! git remote get-url heroku &> /dev/null; then
    print_status "Adding Heroku remote..."
    heroku git:remote -a billow
fi

# Set environment variables
print_status "Setting environment variables..."

# Generate a secure JWT secret if not already set
JWT_SECRET=$(heroku config:get JWT_SECRET --app billow 2>/dev/null || echo "")
if [ -z "$JWT_SECRET" ]; then
    JWT_SECRET=$(openssl rand -base64 32)
    heroku config:set JWT_SECRET="$JWT_SECRET" --app billow
    print_status "Generated new JWT secret"
else
    print_status "JWT secret already exists"
fi

# Set other environment variables
heroku config:set PORT="8080" --app billow
heroku config:set HOST="0.0.0.0" --app billow
heroku config:set RATE_LIMIT_REQUESTS="100" --app billow
heroku config:set RATE_LIMIT_WINDOW="15m" --app billow

# Get the app URL for CORS
APP_URL="https://billow.herokuapp.com"
heroku config:set ALLOWED_ORIGINS="$APP_URL,https://billow-three.vercel.app" --app billow

print_status "Backend URL: $APP_URL"

# Deploy to Heroku
print_status "Deploying to Heroku..."
git add .
git commit -m "Deploy to Heroku" || true
git push heroku main

# Run database setup
print_status "Setting up database..."
heroku run "psql \$DATABASE_URL -f setup_database.sql" --app billow

# Check if deployment was successful
print_status "Checking deployment..."
sleep 10

if curl -f "$APP_URL" > /dev/null 2>&1; then
    print_status "✅ Backend deployment successful!"
else
    print_warning "Backend might still be starting up..."
fi

# Go back to root directory
cd ..

echo ""
print_status "🎉 Deployment completed!"
echo ""
print_status "Backend URL: $APP_URL"
print_status "Database: PostgreSQL (managed by Heroku)"
echo ""
print_status "Next steps:"
echo "1. Update your Vercel environment variables:"
echo "   VITE_API_BASE_URL=$APP_URL"
echo "2. Test the API endpoints"
echo ""
print_status "Useful commands:"
echo "  View logs: heroku logs --tail --app billow"
echo "  Open app: heroku open --app billow"
echo "  Run console: heroku run bash --app billow"

heroku config --app billow 