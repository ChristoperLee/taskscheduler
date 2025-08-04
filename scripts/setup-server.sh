#!/bin/bash

# TaskScheduler Server Setup Script
# Run this on a fresh Ubuntu/Debian server to set up the environment

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}==>${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
   echo "Please run as root (use sudo)"
   exit 1
fi

print_status "Starting server setup for TaskScheduler..."

# Update system
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install essential packages
print_status "Installing essential packages..."
apt install -y curl wget git build-essential

# Install Node.js
print_status "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
apt install -y nodejs

# Install PostgreSQL
print_status "Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib

# Install Nginx
print_status "Installing Nginx..."
apt install -y nginx

# Install PM2
print_status "Installing PM2..."
npm install -g pm2

# Install Certbot for SSL
print_status "Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# Create application user
print_status "Creating application user..."
if ! id -u taskscheduler > /dev/null 2>&1; then
    useradd -m -s /bin/bash taskscheduler
    usermod -aG sudo taskscheduler
fi

# Create directory structure
print_status "Creating directory structure..."
mkdir -p /var/www/taskscheduler
mkdir -p /var/log/taskscheduler
mkdir -p /var/backups/taskscheduler
chown -R taskscheduler:taskscheduler /var/www/taskscheduler
chown -R taskscheduler:taskscheduler /var/log/taskscheduler
chown -R taskscheduler:taskscheduler /var/backups/taskscheduler

# Setup PostgreSQL
print_status "Setting up PostgreSQL..."
sudo -u postgres psql << EOF
CREATE DATABASE taskscheduler_prod;
CREATE USER taskscheduler_user WITH ENCRYPTED PASSWORD 'changeme';
GRANT ALL PRIVILEGES ON DATABASE taskscheduler_prod TO taskscheduler_user;
EOF

print_warning "Please change the database password!"

# Configure firewall
print_status "Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Create Nginx configuration
print_status "Creating Nginx configuration..."
cat > /etc/nginx/sites-available/taskscheduler << 'EOF'
server {
    listen 80;
    server_name _;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
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
    
    # Static file caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Enable Nginx site
ln -sf /etc/nginx/sites-available/taskscheduler /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# Create systemd service for database backups
print_status "Setting up automated backups..."
cat > /etc/systemd/system/taskscheduler-backup.service << 'EOF'
[Unit]
Description=TaskScheduler Database Backup
After=postgresql.service

[Service]
Type=oneshot
User=taskscheduler
ExecStart=/var/www/taskscheduler/scripts/backup-database.sh
EOF

cat > /etc/systemd/system/taskscheduler-backup.timer << 'EOF'
[Unit]
Description=Run TaskScheduler backup daily
Requires=taskscheduler-backup.service

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
EOF

systemctl enable taskscheduler-backup.timer

# Create deployment script
print_status "Creating deployment helper..."
cat > /usr/local/bin/deploy-taskscheduler << 'EOF'
#!/bin/bash
cd /var/www/taskscheduler
sudo -u taskscheduler bash scripts/deploy.sh $1
EOF
chmod +x /usr/local/bin/deploy-taskscheduler

# Setup complete
print_status "Server setup complete!"
echo "=================================="
echo "Next steps:"
echo "1. Clone your repository to /var/www/taskscheduler"
echo "2. Configure environment variables"
echo "3. Update database password"
echo "4. Configure your domain in Nginx"
echo "5. Run: deploy-taskscheduler production"
echo "=================================="
echo ""
echo "Database credentials:"
echo "Database: taskscheduler_prod"
echo "User: taskscheduler_user"
echo "Password: changeme (PLEASE CHANGE THIS!)"
echo ""
echo "To switch to app user: su - taskscheduler"