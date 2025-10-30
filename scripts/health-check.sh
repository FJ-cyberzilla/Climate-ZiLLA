#!/bin/bash

# Climate-ZiLLA Health Check Script
set -e

echo "🌍 Climate-ZiLLA Comprehensive Health Check"
echo "==========================================="

# Configuration
DOMAIN="${HEALTH_CHECK_DOMAIN:-localhost:3000}"
PROTOCOL="${HEALTH_CHECK_PROTOCOL:-http}"
ENDPOINTS=("/health" "/api/health" "/status")

TIMEOUT=10
MAX_ATTEMPTS=2
SUCCESS_COUNT=0
TOTAL_CHECKS=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Target: $PROTOCOL://$DOMAIN${NC}"
echo ""

for endpoint in "${ENDPOINTS[@]}"; do
    URL="$PROTOCOL://$DOMAIN$endpoint"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    attempt=1
    success=false
    
    while [ $attempt -le $MAX_ATTEMPTS ]; do
        echo -n "🔍 Checking $endpoint (attempt $attempt/$MAX_ATTEMPTS)... "
        
        start_time=$(date +%s%3N)
        response_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time $TIMEOUT "$URL" || echo "000")
        end_time=$(date +%s%3N)
        response_time=$((end_time - start_time))
        
        if [ "$response_code" -eq 200 ]; then
            echo -e "${GREEN}✅ HTTP $response_code (${response_time}ms)${NC}"
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
            success=true
            break
        elif [ "$response_code" -eq 000 ]; then
            echo -e "${RED}❌ Connection Failed (${response_time}ms)${NC}"
        else
            echo -e "${YELLOW}⚠️  HTTP $response_code (${response_time}ms)${NC}"
        fi
        
        attempt=$((attempt + 1))
        [ $attempt -le $MAX_ATTEMPTS ] && sleep 2
    done
    
    if [ "$success" = false ]; then
        echo -e "${RED}🚫 All attempts failed for $endpoint${NC}"
    fi
done

echo ""
echo -e "${BLUE}📊 Health Check Summary${NC}"
echo "========================="
echo -e "Successful: ${GREEN}$SUCCESS_COUNT/$TOTAL_CHECKS${NC}"
echo "Timestamp: $(date)"
echo "Domain: $DOMAIN"

if [ $SUCCESS_COUNT -eq $TOTAL_CHECKS ]; then
    echo -e "${GREEN}🎉 SUCCESS: Climate-ZiLLA system is fully operational${NC}"
    exit 0
elif [ $SUCCESS_COUNT -ge 1 ]; then
    echo -e "${YELLOW}⚠️  DEGRADED: Climate-ZiLLA system is partially available${NC}"
    exit 0
else
    echo -e "${RED}💥 CRITICAL: Climate-ZiLLA system is completely unavailable${NC}"
    exit 1
fi
