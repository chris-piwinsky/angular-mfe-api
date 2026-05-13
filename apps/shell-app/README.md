# shell-app

Angular 21 Native Federation HOST for the Billing Portal.

Serves at `http://localhost:4200`. Loads `bills-mfe` (`:4201`) and `payment-mfe` (`:4202`) as federation remotes at runtime.

## Development

```bash
# Start all services
nx run-many -t serve --all

# Start shell + MFEs only
nx serve shell-app --devRemotes=bills-mfe,payment-mfe
```

## Architecture Guardrails

The following rules are enforced by convention. Violations are caught by the `arch-guard.interceptor.ts` in each MFE and will log `[ARCH VIOLATION]` warnings to the browser console during development.

- **MFEs communicate via window CustomEvents only — never by importing each other as npm packages.**
  Events: `suite:navigate:pay`, `suite:navigate:bills`, `suite:payment:submitted`.

- **All BFF calls must use HttpClient + APP_CONFIG.authHeader — never hardcode a token.**
  The `APP_CONFIG` injection token is provided by the shell and read by MFEs via `inject(APP_CONFIG)`.

- **Add new remotes in `public/federation.manifest.json` and load via `loadRemoteModule()` — never `npm install` an MFE.**
  Remote discovery happens at runtime; MFEs are independently deployed.

- **`bills-mfe` does NOT submit payments. `payment-mfe` does NOT render the bills list.**
  Each MFE owns exactly one bounded context. Cross-domain actions are handled via CustomEvents to the shell, which routes to the correct MFE.

## Port Reference

| App | Port |
|---|---|
| `shell-app` | 4200 |
| `bills-mfe` | 4201 |
| `payment-mfe` | 4202 |
| `web-bff` | 3001 |
| `bills-api` | 4001 |
| `payments-api` | 4002 |
