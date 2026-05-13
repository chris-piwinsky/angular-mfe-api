# Startup Guide

This guide explains how to run the full Billing Portal stack locally.

## Prerequisites

- Node.js 22+ (nvm recommended)
- npm 10+
- Dependencies installed from repo root:

```bash
npm install
```

## Start the Full Application

Run each service in a separate terminal tab/window.

```bash
# Terminal 1 - bills-api
cd billing-portal
PORT=4001 npx nx serve bills-api --output-style=stream

# Terminal 2 - payments-api
cd billing-portal
PORT=4002 npx nx serve payments-api --output-style=stream

# Terminal 3 - web-bff
cd billing-portal
PORT=3001 npx nx serve web-bff --output-style=stream

# Terminal 4 - partner-bff
cd billing-portal
PORT=3002 BILLS_API_URL=http://localhost:4001 PAYMENTS_API_URL=http://localhost:4002 npx nx serve partner-bff --output-style=stream

# Terminal 5 - bills-mfe
cd billing-portal
PORT=4201 npx nx serve bills-mfe --output-style=stream

# Terminal 6 - payment-mfe
cd billing-portal
PORT=4202 npx nx serve payment-mfe --output-style=stream

# Terminal 7 - shell-app
cd billing-portal
npx nx serve shell-app --output-style=stream
```

Why separate terminals: each service runs as its own process and must remain active during development.

Tip: --output-style=stream gives plain logs (easier to debug than the Nx TUI).

After startup, wait about 60 seconds and open:

- http://localhost:4200

## Verify Health (Optional)

Run the included health check script:

```bash
./health-check.sh
```

## Stop Services

Normal stop:

- Press Ctrl+C in each running terminal

Force stop all known app ports:

```bash
./stop-all.sh
```

This script clears ports 4001, 4002, 3001, 3002, 4200, 4201, and 4202.

Use it if:

- Ctrl+C did not stop everything
- You see port already in use errors
- You suspect orphaned processes from a previous run
