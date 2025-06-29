#!/bin/bash

# Billow Deployment Script
set -e

echo "🚀 Starting Billow deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Check if .env file exists
if [ ! -f .env ]; then
    print_error ".env file not found!"
    print_status "Please create a .env file with the following variables:"
    echo ""
    echo "DATABASE_URL=postgres://username:password@host:port/database_name?sslmode=require"
    echo "POSTGRES_PASSWORD=your-secure-password"
    echo "JWT_SECRET=your-super-secret-jwt-key"
    echo "ALLOWED_ORIGINS=https://your-domain.com"
    echo "VITE_API_BASE_URL=https://your-backend-domain.com"
    echo "VITE_CLERK_PUBLISHABLE_KEY=your-clerk-key"
    echo ""
    exit 1
fi

# Load environment variables
source .env

print_status "Environment variables loaded"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

print_status "Docker is running"

# Build and deploy
print_status "Building and deploying services..."

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down --remove-orphans

# Build images
print_status "Building Docker images..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Start services
print_status "Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 30

# Check service health
print_status "Checking service health..."

# Check PostgreSQL
if docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U ${POSTGRES_USER:-postgres} > /dev/null 2>&1; then
    print_status "PostgreSQL is healthy"
else
    print_error "PostgreSQL is not healthy"
    exit 1
fi

# Check Backend
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    print_status "Backend is healthy"
else
    print_warning "Backend health check failed (this might be normal if no health endpoint exists)"
fi

# Check Frontend
if curl -f http://localhost > /dev/null 2>&1; then
    print_status "Frontend is healthy"
else
    print_error "Frontend is not responding"
    exit 1
fi

print_status "🎉 Deployment completed successfully!"
echo ""
print_status "Services are running on:"
echo "  Frontend: http://localhost"
echo "  Backend:  http://localhost:8080"
echo "  Database: localhost:5432"
echo ""
print_status "To view logs: docker-compose -f docker-compose.prod.yml logs -f"
print_status "To stop services: docker-compose -f docker-compose.prod.yml down" 