#!/bin/bash

# TaskScheduler Deployment Script
# This script automates the deployment process

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_ENV=${1:-production}
APP_DIR="/var/www/taskscheduler"
BACKUP_DIR="/var/backups/taskscheduler"
PM2_APP_NAME="taskscheduler-api"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as appropriate user
if [ "$EUID" -eq 0 ]; then 
   print_error "Please don't run this script as root"
   exit 1
fi

print_status "Starting deployment for environment: $DEPLOY_ENV"

# Create backup
print_status "Creating backup..."
if [ ! -d "$BACKUP_DIR" ]; then
    sudo mkdir -p "$BACKUP_DIR"
    sudo chown $USER:$USER "$BACKUP_DIR"
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/pre-deploy-backup-$TIMESTAMP.tar.gz"

# Backup current deployment
if [ -d "$APP_DIR" ]; then
    cd $APP_DIR
    tar -czf "$BACKUP_FILE" --exclude=node_modules --exclude=.git .
    print_status "Backup created: $BACKUP_FILE"
fi

# Pull latest code
print_status "Pulling latest code from repository..."
cd $APP_DIR
git fetch origin
git checkout main
git pull origin main

# Check for environment file
if [ ! -f "server/.env.$DEPLOY_ENV" ]; then
    print_error "Environment file server/.env.$DEPLOY_ENV not found!"
    print_warning "Please create it based on server/.env.example"
    exit 1
fi

# Install dependencies
print_status "Installing dependencies..."
npm run install-all

# Build frontend
print_status "Building frontend..."
cd client
npm run build
cd ..

# Run database migrations
print_status "Running database migrations..."
cd server
NODE_ENV=$DEPLOY_ENV npm run migrate
cd ..

# Restart application
print_status "Restarting application..."
pm2 restart $PM2_APP_NAME --update-env

# Wait for application to start
sleep 5

# Health check
print_status "Performing health check..."
HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5001/api/health || echo "000")

if [ "$HEALTH_CHECK" = "200" ]; then
    print_status "Health check passed!"
else
    print_error "Health check failed! HTTP status: $HEALTH_CHECK"
    print_warning "Rolling back deployment..."
    
    # Rollback
    tar -xzf "$BACKUP_FILE" -C $APP_DIR
    pm2 restart $PM2_APP_NAME
    exit 1
fi

# Clear old backups (keep last 10)
print_status "Cleaning old backups..."
cd $BACKUP_DIR
ls -t pre-deploy-backup-*.tar.gz | tail -n +11 | xargs -r rm

# Clear caches
print_status "Clearing caches..."
# Clear Nginx cache if configured
# Clear CDN cache if using CDN

# Deployment info
print_status "Deployment completed successfully!"
echo "=================================="
echo "Environment: $DEPLOY_ENV"
echo "Deployed at: $(date)"
echo "Backup file: $BACKUP_FILE"
echo "=================================="

# Send notification (optional)
# You can add Slack, Discord, or email notifications here

exit 0