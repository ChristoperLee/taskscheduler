# Backend Dockerfile
FROM node:18-alpine

# Install dependencies for node-gyp
RUN apk add --no-cache python3 make g++

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5001/api/health', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Run the application
CMD ["node", "src/index.js"]