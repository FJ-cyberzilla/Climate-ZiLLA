#!/bin/bash

# Climate-ZiLLA Enterprise Deployment Script
set -e

echo "🚀 Starting Climate-ZiLLA Enterprise Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
DOMAIN="${DOMAIN:-climate-zilla.com}"
NODE_ENV="${NODE_ENV:-production}"
PORT="${PORT:-3000}"

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed"
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed"
    fi
    
    # Check PM2
    if ! command -v pm2 &> /dev/null; then
        warn "PM2 not installed, installing..."
        npm install -g pm2
    fi
    
    log "✓ All prerequisites satisfied"
}

# Security audit
run_security_audit() {
    log "Running security audit..."
    npm audit --audit-level=high
    
    if [ $? -ne 0 ]; then
        warn "Security vulnerabilities found. Run 'npm audit fix' to fix them."
        read -p "Continue deployment? (y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "Deployment cancelled due to security issues"
        fi
    fi
}

# Build application
build_app() {
    log "Building application..."
    
    # Install dependencies
    npm ci --production
    
    # Build frontend
    npm run build
    
    # Build server
    cd server && npm ci --production && cd ..
    
    log "✓ Application built successfully"
}

# Deploy application
deploy_app() {
    log "Deploying application..."
    
    # Start with PM2
    pm2 start ecosystem.config.js --env production
    
    # Save PM2 configuration
    pm2 save
    pm2 startup
    
    log "✓ Application deployed successfully"
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Wait for app to start
    sleep 10
    
    # Check health endpoint
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/health || echo "000")
    
    if [ "$response" -eq 200 ]; then
        log "✓ Health check passed (HTTP 200)"
    else
        error "Health check failed (HTTP $response)"
    fi
}

# Main deployment process
main() {
    log "Starting Climate-ZiLLA Enterprise Deployment v2.0.0"
    
    check_prerequisites
    run_security_audit
    build_app
    deploy_app
    health_check
    
    log "🎉 Climate-ZiLLA Enterprise successfully deployed!"
    log "🌐 Frontend: http://localhost:$PORT"
    log "🔧 Backend: http://localhost:3001"
    log "📊 PM2 Dashboard: pm2 monit"
    log "🩺 Health Check: http://localhost:$PORT/health"
}

# Run main function
main "$@"
