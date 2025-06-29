# 🚀 Billow Deployment Guide

## Heroku Deployment

### Prerequisites
- Heroku CLI installed
- Git repository set up
- Heroku account

### 1. Backend Deployment (Heroku)

#### Setup Heroku App
```bash
# Login to Heroku
heroku login

# Create Heroku app for backend
heroku create billow-backend-api

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set JWT_SECRET="your-super-secret-jwt-key-here"
heroku config:set ALLOWED_ORIGINS="https://your-frontend-domain.com"
heroku config:set RATE_LIMIT_REQUESTS="100"
heroku config:set RATE_LIMIT_WINDOW="15m"
```

#### Deploy Backend
```bash
# Navigate to backend directory
cd backend

# Deploy to Heroku
git push heroku main

# Run database migrations
heroku run ./main
```

### 2. Frontend Deployment (Vercel/Netlify)

#### Option A: Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to frontend directory
cd frontend

# Deploy to Vercel
vercel --prod
```

#### Option B: Netlify
```bash
# Build the frontend
npm run build

# Deploy to Netlify (drag and drop dist folder)
# Or use Netlify CLI
netlify deploy --prod --dir=dist
```

### 3. Environment Configuration

#### Backend Environment Variables (Heroku)
```bash
heroku config:set DATABASE_URL="$(heroku config:get DATABASE_URL)"
heroku config:set PORT="8080"
heroku config:set HOST="0.0.0.0"
heroku config:set JWT_SECRET="your-super-secret-jwt-key"
heroku config:set ALLOWED_ORIGINS="https://your-frontend-domain.vercel.app"
```

#### Frontend Environment Variables (Vercel)
Create `.env.production` in frontend directory:
```env
VITE_API_BASE_URL=https://your-backend-app.herokuapp.com
VITE_CLERK_PUBLISHABLE_KEY=your-clerk-publishable-key
VITE_NODE_ENV=production
```

### 4. Database Setup

#### Initialize Database
```bash
# Connect to Heroku PostgreSQL
heroku pg:psql

# Run the setup script
\i setup_database.sql
```

### 5. Domain Configuration

#### Custom Domain (Optional)
```bash
# Add custom domain to Heroku
heroku domains:add api.yourdomain.com

# Configure DNS records as instructed by Heroku
```

## Alternative Deployment Options

### Docker Deployment
```bash
# Use the provided docker-compose.prod.yml
./deploy.sh
```

### AWS Deployment
- Use AWS ECS for containerized deployment
- Use AWS RDS for PostgreSQL
- Use AWS S3 + CloudFront for frontend

### Google Cloud Platform
- Use Google Cloud Run for backend
- Use Cloud SQL for PostgreSQL
- Use Firebase Hosting for frontend

## Monitoring & Maintenance

### Health Checks
- Backend: `https://your-backend-app.herokuapp.com/health`
- Frontend: Check Vercel/Netlify dashboard

### Logs
```bash
# View Heroku logs
heroku logs --tail

# View Vercel logs
vercel logs
```

### Scaling
```bash
# Scale Heroku dynos
heroku ps:scale web=1
```

## Troubleshooting

### Common Issues
1. **CORS Errors**: Ensure `ALLOWED_ORIGINS` includes your frontend domain
2. **Database Connection**: Check `DATABASE_URL` format
3. **Build Failures**: Verify all dependencies are in `package.json`

### Support
- Heroku Status: https://status.heroku.com
- Vercel Status: https://vercel-status.com
- Netlify Status: https://netlifystatus.com 