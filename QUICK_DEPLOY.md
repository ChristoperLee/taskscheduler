# Quick Deployment Guide

## Option 1: Deploy to VPS (Recommended)

### Prerequisites
- Ubuntu 20.04+ or Debian 10+ VPS
- Domain name pointing to your server
- SSH access to server

### Step 1: Initial Server Setup
```bash
# SSH into your server
ssh root@your-server-ip

# Run the setup script
wget https://raw.githubusercontent.com/yourusername/taskscheduler/main/scripts/setup-server.sh
chmod +x setup-server.sh
sudo ./setup-server.sh
```

### Step 2: Clone and Configure
```bash
# Switch to app user
su - taskscheduler

# Clone repository
cd /var/www
git clone https://github.com/yourusername/taskscheduler.git taskscheduler
cd taskscheduler

# Configure environment
cp server/.env.example server/.env.production
nano server/.env.production  # Edit with your values

# Important: Update these values
# - DATABASE_URL with new password
# - JWT_SECRET (generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
# - CORS_ORIGIN with your domain
```

### Step 3: Deploy Application
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run deployment
./scripts/deploy.sh production

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup  # Follow the instructions
```

### Step 4: Configure Domain & SSL
```bash
# Update Nginx configuration
sudo nano /etc/nginx/sites-available/taskscheduler
# Replace server_name _ with your domain

# Restart Nginx
sudo nginx -t
sudo systemctl restart nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Option 2: Deploy with Docker

### Prerequisites
- Docker and Docker Compose installed
- Domain name (for production)

### Steps
```bash
# Clone repository
git clone https://github.com/yourusername/taskscheduler.git
cd taskscheduler

# Create environment file
cp .env.example .env
nano .env  # Edit values

# Build and run
docker-compose up -d --build

# Run migrations
docker-compose exec backend npm run setup-db
docker-compose exec backend npm run seed  # Optional
```

## Option 3: Deploy to Heroku

### Prerequisites
- Heroku CLI installed
- Heroku account

### Steps
```bash
# Create Heroku app
heroku create your-app-name

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
heroku config:set NPM_CONFIG_PRODUCTION=false

# Deploy
git push heroku main

# Run migrations
heroku run npm run setup-db
```

## Option 4: Deploy to Railway

### Steps
1. Fork the repository
2. Go to [Railway](https://railway.app)
3. Create new project from GitHub
4. Add PostgreSQL service
5. Configure environment variables:
   - `JWT_SECRET`
   - `NODE_ENV=production`
6. Deploy automatically

## Option 5: Deploy to Vercel + Supabase

### Frontend (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd client
vercel --prod
```

### Backend (Supabase)
1. Create project at [Supabase](https://supabase.com)
2. Use Supabase PostgreSQL connection string
3. Deploy backend to Railway/Render with Supabase DB

## Post-Deployment Checklist

- [ ] Test all endpoints
- [ ] Verify database migrations
- [ ] Check SSL certificate
- [ ] Test user registration/login
- [ ] Create admin user
- [ ] Set up monitoring
- [ ] Configure backups
- [ ] Test backup restore

## Common Issues

### Port Already in Use
```bash
# Find process using port
sudo lsof -i :5001
# Kill process
sudo kill -9 <PID>
```

### Database Connection Failed
- Check DATABASE_URL format
- Verify PostgreSQL is running
- Check firewall rules

### CORS Errors
- Update CORS_ORIGIN in backend
- Check REACT_APP_API_URL in frontend

## Support

For deployment help:
1. Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed guide
2. Open an issue on GitHub
3. Check logs: `pm2 logs`