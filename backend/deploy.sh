#!/bin/bash

# Billow Backend Heroku Deployment Script

echo "🚀 Starting Billow Backend deployment to Heroku..."

# Check if Heroku CLI is installed
if ! command -v heroku &> /dev/null; then
    echo "❌ Heroku CLI is not installed. Please install it first:"
    echo "   https://devcenter.heroku.com/articles/heroku-cli"
    exit 1
fi

# Check if we're in the backend directory
if [ ! -f "main.go" ]; then
    echo "❌ Please run this script from the backend directory"
    exit 1
fi

# Get app name from user
echo "📝 Enter your Heroku app name (or press Enter to create a new one):"
read app_name

if [ -z "$app_name" ]; then
    echo "🔧 Creating new Heroku app..."
    heroku create
    app_name=$(heroku apps:info --json | grep -o '"name":"[^"]*"' | cut -d'"' -f4)
    echo "✅ Created app: $app_name"
else
    echo "🔧 Using existing app: $app_name"
    heroku git:remote -a $app_name
fi

# Add PostgreSQL addon
echo "🗄️  Adding PostgreSQL addon..."
heroku addons:create heroku-postgresql:mini

# Set environment variables
echo "⚙️  Setting environment variables..."
heroku config:set ALLOWED_ORIGINS="https://your-frontend-domain.vercel.app"

# Deploy to Heroku
echo "📦 Deploying to Heroku..."
git add .
git commit -m "Deploy to Heroku"
git push heroku main

# Run migrations
echo "🔄 Running database migrations..."
heroku run ./main

# Open the app
echo "🌐 Opening the app..."
heroku open

echo "✅ Deployment complete!"
echo "📊 View logs: heroku logs --tail"
echo "🔧 Check app status: heroku ps"
echo "🌐 App URL: https://$app_name.herokuapp.com" 