# TaskScheduler Deployment Guide

This guide covers the deployment process for the TaskScheduler application, including various deployment options and configurations.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Build Process](#build-process)
4. [Deployment Options](#deployment-options)
5. [Database Setup](#database-setup)
6. [Post-Deployment](#post-deployment)
7. [Monitoring & Maintenance](#monitoring--maintenance)

## Prerequisites

- Node.js v16 or higher
- PostgreSQL v12 or higher
- Git
- Domain name (for production)
- SSL certificate (for HTTPS)

## Environment Setup

### 1. Environment Variables

Create production environment files:

```bash
# Backend environment (.env.production)
NODE_ENV=production
PORT=5001
DATABASE_URL=postgresql://username:password@host:5432/taskscheduler_prod
JWT_SECRET=your-secure-jwt-secret-here
CORS_ORIGIN=https://yourdomain.com

# Frontend environment (.env.production)
REACT_APP_API_URL=https://api.yourdomain.com
```

### 2. Generate Secure Secrets

```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Build Process

### 1. Install Dependencies

```bash
# Install all dependencies
npm run install-all

# Or separately
cd client && npm ci --production
cd ../server && npm ci --production
```

### 2. Build Frontend

```bash
cd client
npm run build

# This creates an optimized production build in client/build/
```

### 3. Prepare Backend

```bash
cd server
# No build step needed for Node.js, but ensure all dependencies are installed
npm ci --production
```

## Deployment Options

### Option 1: Traditional VPS (Ubuntu/Debian)

#### A. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (via NodeSource)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2 (Process Manager)
sudo npm install -g pm2
```

#### B. Configure PostgreSQL

```bash
# Access PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE taskscheduler_prod;
CREATE USER taskscheduler_user WITH ENCRYPTED PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE taskscheduler_prod TO taskscheduler_user;
\q
```

#### C. Deploy Application

```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/yourusername/taskscheduler.git
cd taskscheduler

# Set up environment files
sudo cp server/.env.example server/.env.production
sudo nano server/.env.production  # Edit with production values

# Install dependencies and build
npm run install-all
cd client && npm run build
cd ..

# Set up database
NODE_ENV=production npm run setup-db
NODE_ENV=production npm run seed  # Optional: seed with sample data
```

#### D. Configure PM2

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'taskscheduler-api',
    script: './server/src/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5001
    },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_file: './logs/pm2-combined.log',
    time: true
  }]
};
```

Start with PM2:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions to enable startup on boot
```

#### E. Configure Nginx

Create Nginx configuration:

```nginx
# /etc/nginx/sites-available/taskscheduler
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/key.pem;

    # Frontend
    location / {
        root /var/www/taskscheduler/client/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/taskscheduler /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option 2: Docker Deployment

#### A. Create Dockerfile for Backend

```dockerfile
# server/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --production

# Copy application files
COPY . .

EXPOSE 5001

CMD ["node", "src/index.js"]
```

#### B. Create Dockerfile for Frontend

```dockerfile
# client/Dockerfile
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### C. Create docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: taskscheduler
      POSTGRES_USER: taskscheduler
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network

  backend:
    build: ./server
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://taskscheduler:${DB_PASSWORD}@postgres:5432/taskscheduler
      JWT_SECRET: ${JWT_SECRET}
      CORS_ORIGIN: ${FRONTEND_URL}
    depends_on:
      - postgres
    networks:
      - app-network
    ports:
      - "5001:5001"

  frontend:
    build: ./client
    environment:
      REACT_APP_API_URL: ${API_URL}
    depends_on:
      - backend
    networks:
      - app-network
    ports:
      - "80:80"
      - "443:443"

volumes:
  postgres_data:

networks:
  app-network:
    driver: bridge
```

#### D. Deploy with Docker

```bash
# Create .env file for Docker
cat > .env << EOF
DB_PASSWORD=your-secure-password
JWT_SECRET=your-jwt-secret
FRONTEND_URL=https://yourdomain.com
API_URL=https://api.yourdomain.com
EOF

# Build and run
docker-compose up -d --build

# Run database migrations
docker-compose exec backend npm run setup-db
```

### Option 3: Platform-as-a-Service (Heroku)

#### A. Prepare for Heroku

Create `Procfile` in root:

```
web: cd server && node src/index.js
release: cd server && npm run migrate
```

Update `package.json` in root:

```json
{
  "scripts": {
    "heroku-postbuild": "npm run install-all && cd client && npm run build",
    "start": "cd server && node src/index.js"
  }
}
```

#### B. Deploy to Heroku

```bash
# Install Heroku CLI
# Create Heroku app
heroku create your-app-name

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-jwt-secret
heroku config:set NPM_CONFIG_PRODUCTION=false

# Deploy
git push heroku main

# Run database setup
heroku run npm run setup-db
```

### Option 4: Cloud Platforms (AWS/GCP/Azure)

#### AWS Deployment with EC2 + RDS

1. **Set up RDS PostgreSQL instance**
2. **Launch EC2 instance**
3. **Configure Security Groups**
4. **Deploy using Option 1 steps**
5. **Set up Application Load Balancer**
6. **Configure Auto Scaling**

#### Google Cloud Platform

1. **Set up Cloud SQL PostgreSQL**
2. **Deploy to App Engine or Compute Engine**
3. **Configure Cloud Load Balancing**
4. **Set up Cloud CDN for static assets**

### Option 5: Serverless Deployment (Vercel + Railway)

#### Frontend on Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy frontend
cd client
vercel --prod
```

#### Backend on Railway

1. Connect GitHub repository
2. Add PostgreSQL service
3. Configure environment variables
4. Deploy automatically on push

## Database Setup

### Production Database Migrations

```bash
# Run migrations
NODE_ENV=production npm run migrate

# Create admin user
NODE_ENV=production node scripts/create-admin.js
```

### Database Backup Strategy

Create `scripts/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/taskscheduler"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="taskscheduler_prod"

# Create backup
pg_dump $DB_NAME > "$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Compress
gzip "$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Delete backups older than 30 days
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
```

Set up cron job:

```bash
# Daily backups at 2 AM
0 2 * * * /path/to/backup-db.sh
```

## Post-Deployment

### 1. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### 2. Security Hardening

```bash
# Configure firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Secure headers in Nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
```

### 3. Performance Optimization

- Enable Gzip compression
- Set up CDN for static assets
- Configure caching headers
- Optimize images

## Monitoring & Maintenance

### 1. Application Monitoring

```bash
# PM2 monitoring
pm2 monit

# Install PM2 web dashboard
pm2 install pm2-web
```

### 2. Log Management

```bash
# Application logs
pm2 logs

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 3. Health Checks

Create health check endpoint:

```javascript
// server/src/routes/health.js
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

### 4. Automated Monitoring

Set up monitoring with:
- **Uptime Robot** - Free uptime monitoring
- **New Relic** - Application performance monitoring
- **Sentry** - Error tracking
- **Grafana + Prometheus** - Metrics visualization

## Continuous Deployment

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm run install-all
      
    - name: Run tests
      run: npm test
      
    - name: Build frontend
      run: cd client && npm run build
      
    - name: Deploy to server
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /var/www/taskscheduler
          git pull origin main
          npm run install-all
          cd client && npm run build
          pm2 restart taskscheduler-api
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL format
   - Verify PostgreSQL is running
   - Check firewall rules

2. **CORS Errors**
   - Verify CORS_ORIGIN in backend
   - Check API_URL in frontend

3. **404 on Routes**
   - Ensure Nginx try_files directive
   - Check React Router configuration

4. **Performance Issues**
   - Enable PM2 cluster mode
   - Add database indexes
   - Implement caching

## Security Checklist

- [ ] Use HTTPS everywhere
- [ ] Secure environment variables
- [ ] Enable CORS properly
- [ ] Implement rate limiting
- [ ] Regular security updates
- [ ] Database backups configured
- [ ] Monitoring alerts set up
- [ ] Error logging configured
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention

## Cost Optimization

### Estimated Monthly Costs

1. **VPS Hosting**: $5-20/month (DigitalOcean, Linode)
2. **Managed Database**: $15-25/month (or self-host)
3. **Domain**: $10-15/year
4. **SSL**: Free (Let's Encrypt)
5. **CDN**: $0-20/month (Cloudflare free tier)

**Total**: ~$20-65/month

## Conclusion

This deployment guide covers multiple options from simple VPS deployment to containerized and serverless solutions. Choose based on your:
- Technical expertise
- Budget constraints
- Scaling requirements
- Maintenance preferences

For most use cases, start with Option 1 (VPS) or Option 5 (Serverless) for simplicity and cost-effectiveness.