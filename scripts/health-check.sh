#!/bin/bash

# Climate-ZiLLA Health Check Script
set -e

echo "🌍 Climate-ZiLLA Health Check"
echo "==============================="

# Configuration - UPDATE THESE URLs
HEALTH_ENDPOINTS=(
  "https://your-actual-domain.com/health"
  "https://your-actual-domain.com/api/health"
  "https://your-actual-domain.com/status"
)

TIMEOUT=10
MAX_ATTEMPTS=2

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

health_check_passed=false

for endpoint in "${HEALTH_ENDPOINTS[@]}"; do
  attempt=1
  success=false
  
  while [ $attempt -le $MAX_ATTEMPTS ]; do
    echo -n "🔍 Checking $endpoint (attempt $attempt/$MAX_ATTEMPTS)... "
    
    response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$endpoint" || echo "000")
    
    if [ "$response_code" -eq 200 ]; then
      echo -e "${GREEN}✅ HTTP $response_code${NC}"
      success=true
      health_check_passed=true
      break
    elif [ "$response_code" -eq 206 ]; then
      echo -e "${YELLOW}⚠️  HTTP $response_code (Degraded)${NC}"
      success=true
      health_check_passed=true
      break
    else
      echo -e "${RED}❌ HTTP $response_code${NC}"
    fi
    
    attempt=$((attempt + 1))
    sleep 2
  done
done

if [ "$health_check_passed" = true ]; then
  echo -e "${GREEN}🎉 SUCCESS: Climate-ZiLLA system is operational${NC}"
  exit 0
else
  echo -e "${RED}💥 CRITICAL: Climate-ZiLLA system is unavailable${NC}"
  exit 1
fi
