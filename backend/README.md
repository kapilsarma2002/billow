# Billow Backend

A Go-based backend API for the Billow application built with Fiber framework and PostgreSQL.

## Local Development

### Prerequisites
- Go 1.21 or higher
- PostgreSQL database

### Setup
1. Clone the repository
2. Install dependencies: `go mod download`
3. Set up your PostgreSQL database
4. Set environment variables:
   ```bash
   export DATABASE_URL="host=localhost user=postgres password=postgres dbname=billow port=5432 sslmode=disable"
   ```
5. Run the application: `go run main.go`

## Heroku Deployment

### Prerequisites
- Heroku CLI installed
- Git repository set up

### Deployment Steps

1. **Login to Heroku**
   ```bash
   heroku login
   ```

2. **Create a new Heroku app**
   ```bash
   heroku create your-app-name
   ```

3. **Add PostgreSQL addon**
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```

4. **Set environment variables**
   ```bash
   heroku config:set ALLOWED_ORIGINS="https://your-frontend-domain.vercel.app"
   ```

5. **Deploy to Heroku**
   ```bash
   git add .
   git commit -m "Prepare for Heroku deployment"
   git push heroku main
   ```

6. **Open the app**
   ```bash
   heroku open
   ```

### Environment Variables

- `DATABASE_URL`: Automatically set by Heroku PostgreSQL addon
- `PORT`: Automatically set by Heroku
- `ALLOWED_ORIGINS`: Comma-separated list of allowed CORS origins

### Useful Commands

- View logs: `heroku logs --tail`
- Run migrations: `heroku run ./main`
- Check app status: `heroku ps`

## API Endpoints

The API provides endpoints for:
- Authentication
- User management
- Client management
- Invoice management
- Dashboard analytics
- Settings

## Database

The application uses PostgreSQL with GORM for database operations. Tables are automatically migrated on startup. 