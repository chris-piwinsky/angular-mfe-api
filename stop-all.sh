#!/usr/bin/env bash

# Billing Portal - Stop All Services
# Kills all processes on known ports and verifies they're freed

echo "🛑 Stopping all Billing Portal services..."
echo ""

# Known ports for this application
PORTS=(4001 4002 3001 3002 4200 4201 4202)
PORT_NAMES=(
  "bills-api"
  "payments-api"
  "web-bff"
  "partner-bff"
  "shell-app"
  "bills-mfe"
  "payment-mfe"
)

stopped=0
not_running=0

for i in "${!PORTS[@]}"; do
  port=${PORTS[$i]}
  name=${PORT_NAMES[$i]}
  
  # Find PID listening on this port
  pid=$(lsof -ti :$port 2>/dev/null)
  
  if [ -z "$pid" ]; then
    echo "⏭  $name (:$port) - not running"
    ((not_running++))
  else
    echo "🔪 Killing $name (:$port) - PID $pid"
    kill $pid 2>/dev/null
    
    # Wait up to 3 seconds for graceful shutdown
    for j in {1..6}; do
      sleep 0.5
      if ! kill -0 $pid 2>/dev/null; then
        break
      fi
    done
    
    # Force kill if still running
    if kill -0 $pid 2>/dev/null; then
      echo "   ⚠️  Forcing kill with SIGKILL..."
      kill -9 $pid 2>/dev/null
      sleep 0.5
    fi
    
    # Verify it's dead
    if kill -0 $pid 2>/dev/null; then
      echo "   ❌ Failed to kill process $pid"
    else
      echo "   ✅ Stopped"
      ((stopped++))
    fi
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Summary:"
echo "  • Stopped: $stopped service(s)"
echo "  • Not running: $not_running service(s)"
echo ""

if [ $stopped -gt 0 ]; then
  echo "✅ All running services have been stopped"
  echo "   Ports are now free for restart"
else
  echo "ℹ️  No services were running"
fi

# Kill any lingering Nx build/watch processes for this project (tsc watchers,
# esbuild, mid-startup processes, etc.) that don't hold a listening port and
# would otherwise grab task locks on the next start-all run.
echo ""
echo "🔧 Killing lingering Nx build processes..."
pkill -f "billing-portal.*nx" 2>/dev/null || true
pkill -f "nx.*serve.*(bills-api|payments-api|web-bff|partner-bff|bills-mfe|payment-mfe|shell-app)" 2>/dev/null || true
sleep 0.5
echo "   ✅ Done"

# Stop the Nx daemon so task locks don't bleed into the next start-all run
echo ""
echo "🔧 Stopping Nx daemon..."
npx nx daemon --stop 2>/dev/null || true
echo "   ✅ Nx daemon stopped"
