#!/bin/bash

# Heroku Deployment Script for Billow
set -e

echo "🚀 Starting Heroku deployment for Billow..."

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

# Get app name from user or use default
read -p "Enter Heroku app name (or press Enter for auto-generated): " APP_NAME

if [ -z "$APP_NAME" ]; then
    print_status "Creating new Heroku app..."
    APP_NAME=$(heroku create --json | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
    print_status "Created app: $APP_NAME"
else
    # Check if app exists
    if heroku apps:info --app "$APP_NAME" &> /dev/null; then
        print_status "Using existing app: $APP_NAME"
    else
        print_error "App '$APP_NAME' does not exist!"
        exit 1
    fi
fi

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
    heroku git:remote -a "$APP_NAME"
fi

# Add PostgreSQL addon
print_status "Adding PostgreSQL addon..."
heroku addons:create heroku-postgresql:mini --app "$APP_NAME"

# Set environment variables
print_status "Setting environment variables..."

# Generate a secure JWT secret
JWT_SECRET=$(openssl rand -base64 32)

heroku config:set JWT_SECRET="$JWT_SECRET" --app "$APP_NAME"
heroku config:set PORT="8080" --app "$APP_NAME"
heroku config:set HOST="0.0.0.0" --app "$APP_NAME"
heroku config:set RATE_LIMIT_REQUESTS="100" --app "$APP_NAME"
heroku config:set RATE_LIMIT_WINDOW="15m" --app "$APP_NAME"

# Get the app URL for CORS
APP_URL="https://$APP_NAME.herokuapp.com"
heroku config:set ALLOWED_ORIGINS="$APP_URL" --app "$APP_NAME"

print_status "Backend URL: $APP_URL"

# Deploy to Heroku
print_status "Deploying to Heroku..."
git add .
git commit -m "Deploy to Heroku" || true
git push heroku main

# Run database setup
print_status "Setting up database..."
heroku run "psql \$DATABASE_URL -f setup_database.sql" --app "$APP_NAME"

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

print_step "Setting up frontend deployment..."

# Ask user about frontend deployment
echo ""
print_status "Frontend deployment options:"
echo "1. Vercel (Recommended)"
echo "2. Netlify"
echo "3. Skip for now"
read -p "Choose frontend deployment option (1-3): " FRONTEND_CHOICE

case $FRONTEND_CHOICE in
    1)
        print_status "Setting up Vercel deployment..."
        
        # Check if Vercel CLI is installed
        if ! command -v vercel &> /dev/null; then
            print_status "Installing Vercel CLI..."
            npm install -g vercel
        fi
        
        cd frontend
        
        # Create production environment file
        cat > .env.production << EOF
VITE_API_BASE_URL=$APP_URL
VITE_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
VITE_NODE_ENV=production
EOF
        
        print_status "Deploying to Vercel..."
        vercel --prod --yes
        
        cd ..
        ;;
    2)
        print_status "Setting up Netlify deployment..."
        cd frontend
        
        # Build the project
        npm run build
        
        print_status "Build completed. Please deploy the 'dist' folder to Netlify manually."
        print_status "Or install Netlify CLI and run: netlify deploy --prod --dir=dist"
        
        cd ..
        ;;
    3)
        print_status "Skipping frontend deployment"
        ;;
    *)
        print_error "Invalid choice"
        exit 1
        ;;
esac

echo ""
print_status "🎉 Deployment completed!"
echo ""
print_status "Backend URL: $APP_URL"
print_status "Database: PostgreSQL (managed by Heroku)"
echo ""
print_status "Next steps:"
echo "1. Update your frontend environment variables with the backend URL"
echo "2. Configure your Clerk authentication keys"
echo "3. Test the API endpoints"
echo ""
print_status "Useful commands:"
echo "  View logs: heroku logs --tail --app $APP_NAME"
echo "  Open app: heroku open --app $APP_NAME"
echo "  Run console: heroku run bash --app $APP_NAME" 