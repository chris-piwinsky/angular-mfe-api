#!/bin/bash

# health-check.sh - Verify all services are responding

set -e

echo "🔍 Checking service health..."
echo ""

ALL_HEALTHY=true

check_service() {
  local name=$1
  local url=$2
  local auth_header=$3

  if [ -n "$auth_header" ]; then
    response=$(curl -s -o /dev/null -w "%{http_code}" -H "$auth_header" "$url" 2>/dev/null || echo "000")
  else
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
  fi

  if [ "$response" = "200" ]; then
    echo "✅ $name ($url)"
  else
    echo "❌ $name ($url) - HTTP $response"
    ALL_HEALTHY=false
  fi
}

# Domain APIs
check_service "bills-api" "http://localhost:4001/health"
check_service "payments-api" "http://localhost:4002/health"

# BFFs (health endpoints are public, no auth required)
check_service "web-bff" "http://localhost:3001/health"
check_service "partner-bff" "http://localhost:3002/health"

# Angular MFEs (check root path)
check_service "bills-mfe" "http://localhost:4201/"
check_service "payment-mfe" "http://localhost:4202/"
check_service "shell-app" "http://localhost:4200/"

echo ""

if [ "$ALL_HEALTHY" = true ]; then
  echo "✅ All services healthy"
  exit 0
else
  echo "❌ Some services are down"
  exit 1
fi
