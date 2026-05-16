#!/usr/bin/env bash

# health-check.sh - Verify all services are responding
#
# Usage:
#   ./health-check.sh
#   ./health-check.sh --wait
#   ./health-check.sh --wait=120 --verbose

set -euo pipefail

WAIT_MODE=false
TIMEOUT_SECONDS=60
VERBOSE=false

for arg in "$@"; do
  case "$arg" in
    --wait)
      WAIT_MODE=true
      ;;
    --wait=*)
      WAIT_MODE=true
      TIMEOUT_SECONDS="${arg#*=}"
      ;;
    --verbose)
      VERBOSE=true
      ;;
    *)
      echo "Unknown option: $arg"
      echo "Usage: ./health-check.sh [--wait|--wait=<seconds>] [--verbose]"
      exit 2
      ;;
  esac
done

SERVICES=(
  "bills-api|http://localhost:4001/health"
  "payments-api|http://localhost:4002/health"
  "web-bff|http://localhost:3001/health"
  "partner-bff|http://localhost:3002/health"
  "bills-mfe|http://localhost:4201/"
  "payment-mfe|http://localhost:4202/"
  "shell-app|http://localhost:4200/"
)

check_once() {
  local all_healthy=true

  if [ "$VERBOSE" = true ]; then
    echo ""
    echo "🔍 Checking service health..."
  fi

  for entry in "${SERVICES[@]}"; do
    local name="${entry%%|*}"
    local url="${entry#*|}"
    local response

    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")

    if [ "$response" = "200" ]; then
      if [ "$VERBOSE" = true ]; then
        echo "✅ $name ($url)"
      fi
    else
      all_healthy=false
      if [ "$VERBOSE" = true ]; then
        echo "❌ $name ($url) - HTTP $response"
      fi
    fi
  done

  if [ "$all_healthy" = true ]; then
    return 0
  fi

  return 1
}

if [ "$WAIT_MODE" = false ]; then
  echo "🔍 Checking service health..."
  echo ""

  if check_once; then
    for entry in "${SERVICES[@]}"; do
      name="${entry%%|*}"
      url="${entry#*|}"
      echo "✅ $name ($url)"
    done
    echo ""
    echo "✅ All services healthy"
    exit 0
  else
    for entry in "${SERVICES[@]}"; do
      name="${entry%%|*}"
      url="${entry#*|}"
      response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
      if [ "$response" = "200" ]; then
        echo "✅ $name ($url)"
      else
        echo "❌ $name ($url) - HTTP $response"
      fi
    done
    echo ""
    echo "❌ Some services are down"
    exit 1
  fi
fi

echo "⏳ Waiting for services to become healthy (timeout: ${TIMEOUT_SECONDS}s)..."
start_time=$(date +%s)

while true; do
  if check_once; then
    echo ""
    echo "✅ All services healthy"
    exit 0
  fi

  now=$(date +%s)
  elapsed=$((now - start_time))

  if [ "$elapsed" -ge "$TIMEOUT_SECONDS" ]; then
    echo ""
    echo "❌ Timed out waiting for healthy services after ${TIMEOUT_SECONDS}s"
    echo "Tip: rerun with --verbose to see failing endpoints"
    exit 1
  fi

  if [ "$VERBOSE" = true ]; then
    echo "⏱️  ${elapsed}s elapsed... retrying in 2s"
  fi

  sleep 2
done
