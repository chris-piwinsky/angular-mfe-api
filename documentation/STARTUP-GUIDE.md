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

Quickest path for demos:

```bash
./start-all.sh
./health-check.sh --wait
```

If you prefer manual startup, run each service in a separate terminal tab/window.

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

## Turn On Architecture Insights First

After the shell loads, click the **⚡ Arch** button in the top-right navigation.

This panel is the teaching overlay for the demo. As you click through flows, it explains which principle is active (A2/A3/A9/E3/E4/E5/E10) and shows request IDs that map to backend logs.

When you click a standards link from the panel, it now opens the local standards page route at `/architecture/standards#<section>`.

Recommended next step after startup:

- [documentation/DEMO-WALKTHROUGH.md](./DEMO-WALKTHROUGH.md)

## Verify Health (Optional)

Run the included health check script:

```bash
./health-check.sh
```

Wait until all services are healthy (default 60 seconds):

```bash
./health-check.sh --wait
```

Verbose wait output:

```bash
./health-check.sh --wait=120 --verbose
```

## Dependency Matrix

Use this to decide whether you need the full stack for a specific demo.

| Service      | Can run solo? | Requires                        | Best use                                  |
| ------------ | ------------- | ------------------------------- | ----------------------------------------- |
| bills-api    | Yes           | None                            | Domain API behavior and contract checks   |
| payments-api | Yes           | None                            | Payment domain API behavior               |
| web-bff      | No            | bills-api, payments-api         | Aggregation, auth boundary, balance guard |
| partner-bff  | No            | bills-api, payments-api         | A2 comparison with web-bff                |
| bills-mfe    | Partial       | web-bff recommended             | Bills UI behavior and BFF contract        |
| payment-mfe  | Partial       | web-bff recommended             | Payment UI flow and BFF validation        |
| shell-app    | No            | web-bff, bills-mfe, payment-mfe | End-to-end host + MFE event flow          |

## Project Overview UI (Nx)

Yes. Nx provides a project details page for any app/lib, including all MFEs and APIs.

Open one project detail page:

```bash
npx nx show project payment-mfe-e2e --web
```

Open project detail pages for core apps in this repo:

```bash
npx nx show project shell-app --web
npx nx show project bills-mfe --web
npx nx show project payment-mfe --web
npx nx show project bills-api --web
npx nx show project payments-api --web
npx nx show project web-bff --web
npx nx show project partner-bff --web
```

What you will see:

- A local Nx page at an address like `http://127.0.0.1:4212/project-details/<project-name>`
- Targets, dependencies, and configuration for that project

Note: the port can change (for example, 4211, 4212) if another Nx page is already running.

To see the full dependency graph for the workspace:

```bash
npx nx graph
```

This opens an interactive graph for all projects and their relationships.

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

## Troubleshooting

### Port Already in Use

Symptom: `EADDRINUSE` on one of the known ports.

Fix:

```bash
./stop-all.sh
./start-all.sh
```

### Service Appears Up but Flow Fails

Symptom: Shell loads, but API calls fail or MFEs do not render data.

Fix:

```bash
./health-check.sh --wait --verbose
```

Confirm all 7 services return healthy before re-testing in browser.

### Remote Module Load Failure in Browser

Symptom: shell renders but one remote fails to load.

Fix:

1. Ensure `bills-mfe` and `payment-mfe` are both running.
2. Re-run `./health-check.sh --wait`.
3. Refresh browser after both remotes are confirmed healthy.

### Script Permission Denied

Symptom: `Permission denied` running scripts.

Fix:

```bash
chmod +x health-check.sh stop-all.sh start-all.sh
```

### Standards Links Show 404 or Open Wrong Page

Symptom: Clicking a standards link from ⚡ Arch does not land on the local standards section.

Fix:

1. Open `http://localhost:4200/architecture/standards` directly to verify shell route availability.
2. Refresh shell and click ⚡ Arch again.
3. Ensure shell-app is running on port 4200 and not an old dev server instance.

### Auth Boundary Triggered (401)

Symptom: Requests to web-bff return 401.

Fix:

1. Confirm shell-app is injecting `Authorization: Bearer demo-token`.
2. Do not call web-bff browser routes directly without auth headers.
3. Use the shell flow for normal demos so auth header injection is automatic.

### TypeScript 6 Upgrade Fails (ERESOLVE)

Symptom: `npm install` fails with peer dependency errors when upgrading to TypeScript 6.

Cause:

- Current Angular build tooling in this workspace (`@angular-devkit/build-angular` 21.2.x) requires TypeScript `< 6.0`.

Fix:

1. Keep TypeScript on 5.9.x for now.
2. Keep `ignoreDeprecations` at `5.0` in `tsconfig.base.json`.
3. Revisit TypeScript 6 only after Angular build tooling in your registry supports it.
