#!/bin/bash

# GitHub Pages Deployment Script
# This script deploys the frontend to GitHub Pages

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}==>${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if in correct directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

# Check if gh-pages is installed
if ! npm list gh-pages >/dev/null 2>&1; then
    print_status "Installing gh-pages..."
    cd client && npm install --save-dev gh-pages --legacy-peer-deps && cd ..
fi

# Get GitHub username from git remote
GITHUB_USERNAME=$(git config --get remote.origin.url | sed -n 's/.*github.com[:/]\([^/]*\).*/\1/p')
REPO_NAME=$(basename `git rev-parse --show-toplevel`)

if [ -z "$GITHUB_USERNAME" ]; then
    print_error "Could not determine GitHub username from remote"
    print_warning "Please enter your GitHub username:"
    read GITHUB_USERNAME
fi

print_status "Detected GitHub username: $GITHUB_USERNAME"
print_status "Repository name: $REPO_NAME"

# Update homepage in package.json
print_status "Updating homepage in package.json..."
cd client
HOMEPAGE="https://$GITHUB_USERNAME.github.io/$REPO_NAME"
npm pkg set homepage="$HOMEPAGE"

# Ask for backend URL
print_warning "Enter your backend API URL (e.g., https://taskscheduler-api.railway.app):"
read BACKEND_URL

# Create .env.production
print_status "Creating .env.production..."
cat > .env.production << EOF
REACT_APP_API_URL=$BACKEND_URL/api
EOF

# Build and deploy
print_status "Building application..."
npm run build

# Create 404.html for client-side routing
cp build/index.html build/404.html

print_status "Deploying to GitHub Pages..."
npm run deploy

# Success message
print_status "Deployment complete!"
echo "=================================="
echo "Frontend URL: $HOMEPAGE"
echo "Backend URL: $BACKEND_URL"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Enable GitHub Pages in repository settings (if not already enabled)"
echo "2. Set to use GitHub Actions as source"
echo "3. Your site will be live in a few minutes"
echo ""
echo "To update in the future, just run:"
echo "  cd client && npm run deploy"