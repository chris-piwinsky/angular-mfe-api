#!/usr/bin/env bash

# Billing Portal - Start All Services
# Starts all known services in the background and waits for health readiness.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$ROOT_DIR/tmp/demo-logs"
mkdir -p "$LOG_DIR"

start_service() {
  local name="$1"
  local command="$2"
  local log_file="$LOG_DIR/${name}.log"

  echo "▶ Starting $name"
  nohup bash -lc "cd '$ROOT_DIR' && $command" >"$log_file" 2>&1 &
  local pid=$!
  echo "   PID: $pid | Log: $log_file"
}

echo "🚀 Starting Billing Portal services..."

action_ports=(4001 4002 3001 3002 4201 4202 4200)
for port in "${action_ports[@]}"; do
  if lsof -ti :"$port" >/dev/null 2>&1; then
    echo "⚠ Port $port is already in use. Run ./stop-all.sh first if needed."
  fi
done

start_service "bills-api" "PORT=4001 npx nx serve bills-api --output-style=stream"
start_service "payments-api" "PORT=4002 npx nx serve payments-api --output-style=stream"
start_service "web-bff" "PORT=3001 npx nx serve web-bff --output-style=stream"
start_service "partner-bff" "PORT=3002 BILLS_API_URL=http://localhost:4001 PAYMENTS_API_URL=http://localhost:4002 npx nx serve partner-bff --output-style=stream"
start_service "bills-mfe" "PORT=4201 npx nx serve bills-mfe --output-style=stream"
start_service "payment-mfe" "PORT=4202 npx nx serve payment-mfe --output-style=stream"
start_service "shell-app" "npx nx serve shell-app --output-style=stream"

echo ""
echo "⏳ Waiting for services to report healthy..."
if "$ROOT_DIR/health-check.sh" --wait --verbose; then
  echo ""
  echo "✅ All services started and healthy"
  echo "🌐 Open http://localhost:4200"
  echo "📘 Next: documentation/DEMO-WALKTHROUGH.md"
else
  echo ""
  echo "❌ Startup incomplete. Check logs in $LOG_DIR"
  exit 1
fi
