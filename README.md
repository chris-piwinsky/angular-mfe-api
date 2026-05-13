# Billing Portal — Architecture Reference Application

## What This Is

This is a reference application demonstrating the three-layer architecture (Angular micro front ends → Express BFF → Express domain APIs) documented in [suite-architecture-standards.md](documentation/suite-architecture-standards.md). It is intentionally minimal. Its purpose is to demonstrate the architecture correctly, not to build production payment infrastructure. Every architectural principle from A1 through E12 is implemented and visible in the running app. The **⚡ Arch** panel narrates architectural decisions in real-time as you use the application.

---

## Architecture at a Glance

```
Angular MFEs (shell-app, bills-mfe, payment-mfe)
       ↓  HTTP only — MFEs never call domain APIs directly
  web-bff  (Express + TypeScript, port 3001) ← Web UI surface
       ↓
Domain APIs (bills-api :4001, payments-api :4002)
       ↑
partner-bff (Express + TypeScript, port 3002) ← B2B Partner surface
```

**Two surfaces → Two BFFs → Same domain APIs.** See [PARTNER-BFF-A2-DEMO.md](documentation/PARTNER-BFF-A2-DEMO.md) for side-by-side comparisons showing different auth, response shapes, and payment patterns for the same underlying bill data.

### Port Reference

| App          | Port | Layer         | Surface                          |
|--------------|------|---------------|----------------------------------|
| shell-app    | 4200 | Presentation  | Web UI                           |
| bills-mfe    | 4201 | Presentation  | Web UI                           |
| payment-mfe  | 4202 | Presentation  | Web UI                           |
| web-bff      | 3001 | Orchestration | Web UI (Bearer token)            |
| partner-bff  | 3002 | Orchestration | B2B Partner Integration (API key)|
| bills-api    | 4001 | Domain        | Headless (internal only)         |
| payments-api | 4002 | Domain        | Headless (internal only)         |

### Vertical Domain Ownership

The file layout reflects intentional team boundaries, not just technical layers:

- The **Bills team** owns [apps/bills-api/](apps/bills-api/) through [apps/web-bff/src/routes/bills.ts](apps/web-bff/src/routes/bills.ts) through [apps/bills-mfe/](apps/bills-mfe/) — end to end
- The **Payments team** owns [apps/payments-api/](apps/payments-api/) through [apps/web-bff/src/routes/payments.ts](apps/web-bff/src/routes/payments.ts) through [apps/payment-mfe/](apps/payment-mfe/) — end to end

Teams are organized around business domains, not technical disciplines (not a "UI team", not an "API team"). Each domain team can design, test, and deploy their full vertical slice without waiting on another team's roadmap. This is the **Inverse Conway Maneuver** applied: the team structure was designed to produce clean vertical boundaries — not the other way around. See [principles.md](documentation/principles.md) P5 and [definitions.md](documentation/definitions.md) — Conway's Law.

---

## Getting Started

Use the dedicated startup walkthrough:

- [STARTUP-GUIDE.md](documentation/STARTUP-GUIDE.md) — prerequisites, terminal commands for all 7 services, health checks, and stop procedures

---

## Project Structure

### Test Results

36/36 passing (6 bills-api, 4 payments-api, 8 web-bff, 9 bills-mfe, 9 payment-mfe, 1 shell-app)

See [TEST-RESULTS.md](documentation/TEST-RESULTS.md) for full test documentation.

---

## Codebase Map

### Layer 1 — Micro Front ends

| File | Description |
|------|-------------|
| [apps/shell-app/src/app/app.ts](apps/shell-app/src/app/app.ts) | Shell host: global layout, routing, event listeners |
| [apps/shell-app/src/app/app.routes.ts](apps/shell-app/src/app/app.routes.ts) | loadRemoteModule() routes for bills-mfe and payment-mfe |
| [apps/shell-app/src/app/arch-insights/architecture-insights.service.ts](apps/shell-app/src/app/arch-insights/architecture-insights.service.ts) | Architecture Insights signal store |
| [apps/shell-app/src/app/arch-insights/architecture-insights.component.ts](apps/shell-app/src/app/arch-insights/architecture-insights.component.ts) | Architecture Insights Panel component |
| [apps/bills-mfe/src/app/app.component.ts](apps/bills-mfe/src/app/app.component.ts) | Bills list and bill detail views; `bills` and `billDetail` are `httpResource` typed to the BFF envelope (`{ data, requestId }`); `billsData` and `billDetailData` are computed signals that unwrap the `data` array/object for template iteration |
| [apps/bills-mfe/src/app/arch-guard.interceptor.ts](apps/bills-mfe/src/app/arch-guard.interceptor.ts) | HTTP interceptor — warns on direct domain API calls (Prompt 9) |
| [apps/bills-mfe/src/app/arch-note.interceptor.ts](apps/bills-mfe/src/app/arch-note.interceptor.ts) | HTTP interceptor — reads x-arch-note header, emits suite:arch:event (Prompt 11) |
| [apps/bills-mfe/src/app/app.config.ts](apps/bills-mfe/src/app/app.config.ts) | Standalone bootstrap config — provides APP_CONFIG dev defaults; no shell required |
| [apps/payment-mfe/src/app/app.component.ts](apps/payment-mfe/src/app/app.component.ts) | Payment form and confirmation view |
| [apps/payment-mfe/src/app/arch-guard.interceptor.ts](apps/payment-mfe/src/app/arch-guard.interceptor.ts) | HTTP interceptor — warns on direct domain API calls |
| [apps/payment-mfe/src/app/arch-note.interceptor.ts](apps/payment-mfe/src/app/arch-note.interceptor.ts) | HTTP interceptor — reads x-arch-note header, emits suite:arch:event |
| [apps/payment-mfe/src/app/app.config.ts](apps/payment-mfe/src/app/app.config.ts) | Standalone bootstrap config — provides APP_CONFIG dev defaults |

### Layer 2 — Backend for Frontend

#### web-bff (Web UI surface)

| File | Description |
|------|-------------|
| [apps/web-bff/src/app.ts](apps/web-bff/src/app.ts) | BFF factory: middleware chain, route registration |
| [apps/web-bff/src/middleware/auth.ts](apps/web-bff/src/middleware/auth.ts) | Bearer token validation |
| [apps/web-bff/src/middleware/correlationId.ts](apps/web-bff/src/middleware/correlationId.ts) | x-correlation-id propagation |
| [apps/web-bff/src/middleware/requestLogger.ts](apps/web-bff/src/middleware/requestLogger.ts) | Structured JSON request logging |
| [apps/web-bff/src/routes/bills.ts](apps/web-bff/src/routes/bills.ts) | GET /api/bills, GET /api/bills/:id aggregation |
| [apps/web-bff/src/routes/payments.ts](apps/web-bff/src/routes/payments.ts) | POST /api/payments validation + proxy |
| [apps/web-bff/src/services/bills.service.ts](apps/web-bff/src/services/bills.service.ts) | Typed fetch wrappers for bills-api |
| [apps/web-bff/src/services/payments.service.ts](apps/web-bff/src/services/payments.service.ts) | Typed fetch wrappers for payments-api |

#### partner-bff (B2B Partner Integration surface)

| File | Description |
|------|-------------|
| [apps/partner-bff/src/app.ts](apps/partner-bff/src/app.ts) | BFF factory: correlation + API key middleware |
| [apps/partner-bff/src/middleware/apikey.middleware.ts](apps/partner-bff/src/middleware/apikey.middleware.ts) | X-Partner-Key validation (not Bearer token) |
| [apps/partner-bff/src/middleware/correlation.middleware.ts](apps/partner-bff/src/middleware/correlation.middleware.ts) | x-correlation-id propagation |
| [apps/partner-bff/src/routes/bills.routes.ts](apps/partner-bff/src/routes/bills.routes.ts) | GET /partner/bills — reduced payload (billId, accountId, balance, dueDate, status only) |
| [apps/partner-bff/src/routes/payments.routes.ts](apps/partner-bff/src/routes/payments.routes.ts) | POST /partner/payments — 202 Accepted + webhook callback pattern |
| [apps/partner-bff/src/server.ts](apps/partner-bff/src/server.ts) | ESM entry point |

### Layer 3 — Domain APIs

| File | Description |
|------|-------------|
| [apps/bills-api/src/app.ts](apps/bills-api/src/app.ts) | Express app factory |
| [apps/bills-api/src/data/bills.ts](apps/bills-api/src/data/bills.ts) | In-memory bill store; makeBill() always computes balance |
| [apps/bills-api/src/routes/bills.ts](apps/bills-api/src/routes/bills.ts) | GET /v1/bills, GET /v1/bills/:id |
| [apps/payments-api/src/app.ts](apps/payments-api/src/app.ts) | Express app factory |
| [apps/payments-api/src/routes/payments.ts](apps/payments-api/src/routes/payments.ts) | GET /v1/payments, POST /v1/payments |

### Tests

| File | Description |
|------|-------------|
| [apps/bills-api/src/__tests__/bills.spec.ts](apps/bills-api/src/__tests__/bills.spec.ts) | Domain API unit tests (Jest + supertest) |
| [apps/payments-api/src/__tests__/payments.spec.ts](apps/payments-api/src/__tests__/payments.spec.ts) | Domain API unit tests |
| [apps/web-bff/src/__tests__/bff.spec.ts](apps/web-bff/src/__tests__/bff.spec.ts) | BFF integration tests (Jest + service mocks) |
| [apps/bills-mfe/src/app/app.component.spec.ts](apps/bills-mfe/src/app/app.component.spec.ts) | MFE unit tests (Vitest + Angular TestBed) |
| [apps/bills-mfe/src/app/bff.contract.spec.ts](apps/bills-mfe/src/app/bff.contract.spec.ts) | Consumer-driven contract tests |
| [apps/payment-mfe/src/app/app.component.spec.ts](apps/payment-mfe/src/app/app.component.spec.ts) | MFE unit tests |
| [apps/payment-mfe/src/app/bff.contract.spec.ts](apps/payment-mfe/src/app/bff.contract.spec.ts) | Consumer-driven contract tests |

### Utilities

| File | Description |
|------|-------------|
| [stop-all.sh](stop-all.sh) | Force-kill all services by port (use if Ctrl+C fails or ports are stuck) |
| [health-check.sh](health-check.sh) | Curl all 7 service health endpoints; exits 0 if all healthy, 1 if any down |

---

## Guided Walkthrough

This section is the tutorial core. Follow these steps in order to see every architectural principle in action.

### Step 1 — Load the app

**Try it:** Open [http://localhost:4200](http://localhost:4200). The bills list loads.

**Principle:** [A3](documentation/suite-architecture-standards.md#a3) — Frontends Call the BFF. Only the BFF.

**Code:** [apps/bills-mfe/src/app/app.component.ts](apps/bills-mfe/src/app/app.component.ts) — Fetches from `bffBaseUrl/api/bills`, never `localhost:4001`. The MFE does not know that bills-api exists. The BFF wraps responses in `{ data, requestId }` — `billsData` is a computed signal that unwraps `bills.value()?.data` so the template can iterate directly over the array.

**What ⚡ Arch shows:** `A3:BFF-PROXY` — "bills-api proxied; MFE never calls domain APIs directly"

---

### Step 2 — Filter by status

**Try it:** Click the "Overdue" tab in the bills list. The list re-fetches with `?status=overdue`.

**Principle:** [E3](documentation/suite-architecture-standards.md#e3) — Data at the Right Granularity

**Code:** [apps/web-bff/src/routes/bills.ts](apps/web-bff/src/routes/bills.ts) — Forwards status query param to bills-api; returns summary fields only (no `lineItems` in list view). Full detail is fetched on-demand in Step 3.

**What ⚡ Arch shows:** `A3:BFF-PROXY` fires again for the filtered request

---

### Step 3 — Open a bill detail

**Try it:** Click any bill row. The detail panel opens with line items and payment history.

**Principle:** [E3](documentation/suite-architecture-standards.md#e3) — BFF aggregation (one call returns bill + payments merged from two domain APIs)

**Code:** [apps/web-bff/src/routes/bills.ts](apps/web-bff/src/routes/bills.ts) (GET /api/bills/:id) — Parallel fetch to bills-api and payments-api, merged into one response. The MFE makes one HTTP call and receives both datasets.

**What ⚡ Arch shows:** `E3:BFF-AGGREGATE` — "1 BFF call → bills-api + payments-api merged into single response"

---

### Step 4 — Observe the correlation ID

**Try it:** Open the BFF terminal. Each log line shows a `correlationId`. Open the bill detail response in browser DevTools > Network. The `x-request-id` response header matches the `correlationId` in the log.

**Principle:** [A8](documentation/suite-architecture-standards.md#a8) — Observability Is Not Optional

**Code:** [apps/web-bff/src/middleware/correlationId.ts](apps/web-bff/src/middleware/correlationId.ts) — Generates or propagates `x-correlation-id` on every request. The same ID flows through BFF → bills-api → payments-api logs, enabling distributed tracing.

**What ⚡ Arch shows:** The `requestId` shown in the event card matches the terminal log `correlationId`

---

### Step 5 — Click Pay Now (navigation event)

**Try it:** Click the "Pay Now" button on any unpaid or overdue bill.

**Principle:** [A9](documentation/suite-architecture-standards.md#a9) — Cross-MFE communication via CustomEvent (not direct import)

**Code:** [apps/bills-mfe/src/app/app.component.ts](apps/bills-mfe/src/app/app.component.ts) — Dispatches `new CustomEvent("suite:navigate:pay", { detail: { billId } })` on window. [apps/shell-app/src/app/app.ts](apps/shell-app/src/app/app.ts) — Listens to `suite:navigate:pay` and calls `router.navigate()`. The bills-mfe never imports payment-mfe.

**What ⚡ Arch shows:** `A9:MFE-EVENT` — "bills-mfe dispatched suite:navigate:pay via CustomEvent — MFEs never import each other directly"

---

### Step 6 — The shell injected your auth token

**Try it:** Open DevTools > Network. Click the payment form's initial bill fetch. Observe the `Authorization: Bearer demo-token` request header.

**Principle:** [E4](documentation/suite-architecture-standards.md#e4) — Authentication Is Centralized

**Code:** [apps/shell-app/src/app/app.config.ts](apps/shell-app/src/app/app.config.ts) — Passes `authHeader` via `APP_CONFIG` token. [apps/payment-mfe/src/app/app.component.ts](apps/payment-mfe/src/app/app.component.ts) — Receives it and adds to every BFF request. [apps/web-bff/src/middleware/auth.ts](apps/web-bff/src/middleware/auth.ts) — Validates it before any downstream call.

**What ⚡ Arch shows:** `E4:AUTH-BOUNDARY` fires if you modify the token and try again (401 response) — "token validated at BFF; downstream services never received an unauthenticated call"

---

### Step 7 — Submit a payment that exceeds the balance

**Try it:** On the payment form, change the amount to a value larger than the balance (e.g., if balance is $300, try $500). Submit.

**Principle:** [A3](documentation/suite-architecture-standards.md#a3) — Balance validation lives at the BFF, not the MFE and not payments-api

**Code:** [apps/web-bff/src/routes/payments.ts](apps/web-bff/src/routes/payments.ts) — Fetches bill, checks `amount <= bill.balance`, returns 422 if not. [apps/payment-mfe/src/app/app.component.ts](apps/payment-mfe/src/app/app.component.ts) never enforces this rule itself; it relies on the BFF to validate.

**What ⚡ Arch shows:** `A3:BALANCE-GUARD` — "amount <= balance validated at BFF; payments-api never received an invalid amount"

---

### Step 8 — Submit a valid payment

**Try it:** Submit a valid payment amount (less than or equal to the balance).

**Principle:** [A3](documentation/suite-architecture-standards.md#a3) (BFF proxied), [E5](documentation/suite-architecture-standards.md#e5) (structured response), cross-MFE event on success

**Code:** [apps/payment-mfe/src/app/app.component.ts](apps/payment-mfe/src/app/app.component.ts) — On 201, dispatches `suite:payment:submitted`. [apps/shell-app/src/app/app.ts](apps/shell-app/src/app/app.ts) — Listens and re-fetches overdue count.

**What ⚡ Arch shows:** `A3:BFF-PROXY` for the payment submission, then `A9:MFE-EVENT` for `suite:payment:submitted` event

---

### Step 9 — Watch the nav badge update

**Try it:** After the payment confirmation, look at the nav bar. The "Overdue (n)" count updates without a full page reload.

**Principle:** [A9](documentation/suite-architecture-standards.md#a9) — Shell refreshes its own state in response to a CustomEvent from the MFE; no full reload, no shared state object

**Code:** [apps/shell-app/src/app/app.ts](apps/shell-app/src/app/app.ts) — `suite:payment:submitted` listener calls `fetchOverdueCount()`, updating the signal that drives the badge display.

**What ⚡ Arch shows:** `A9:MFE-EVENT` — "payment-mfe dispatched suite:payment:submitted — shell refreshing overdue count without a full reload"

---

### Step 10 — Simulate graceful degradation

**Try it:** Stop payments-api (Ctrl+C in its terminal). Open any bill detail.

**Principle:** [E5](documentation/suite-architecture-standards.md#e5) — Fail Gracefully, Not Silently

**Code:** [apps/web-bff/src/routes/bills.ts](apps/web-bff/src/routes/bills.ts) — payments-api fetch is wrapped in try/catch; on failure, returns bill with `payments: []` instead of a 500. The bill detail still loads successfully.

**What ⚡ Arch shows:** `E5:GRACEFUL-DEGRADE` — "payments-api unavailable; returned payments:[] without failing the bill response"

---

### Step 11 — Run bills-mfe in standalone mode

**Try it:** Stop the shell. Run: `cd billing-portal && npx nx serve bills-mfe`. Open [http://localhost:4201](http://localhost:4201).

**Principle:** [A5](documentation/suite-architecture-standards.md#a5) and [P4](documentation/principles.md#p4) — Independent Deployability

The Bills team can build, test, and serve bills-mfe without running shell-app, payment-mfe, or any other app. This mirrors the CI/CD reality: each MFE has its own pipeline. Deploying bills-mfe requires no coordination with the payment-mfe pipeline.

**Code:** [apps/bills-mfe/src/app/app.config.ts](apps/bills-mfe/src/app/app.config.ts) — Provides `APP_CONFIG` with local dev values; bootstraps `AppComponent` without the shell.

**What ⚡ Arch shows:** No event — independent deployability is a build and pipeline concern, not a runtime observation

---

### Step 12 — The balance field is always computed

**Try it:** Open [apps/bills-api/src/data/bills.ts](apps/bills-api/src/data/bills.ts) and find the `makeBill()` function. Every bill's `balance` field is computed as `totalAmount - amountPaid`. It is never stored or hardcoded.

**Principle:** [E8](documentation/suite-architecture-standards.md#e8) — Vocabulary Discipline

**Code:** [apps/bills-api/src/data/bills.ts](apps/bills-api/src/data/bills.ts) — `makeBill()` always computes `balance: totalAmount - amountPaid`. This ensures the balance is always consistent with the source of truth (total and paid amounts).

**What ⚡ Arch shows:** No event — vocabulary discipline is a data modeling concern verified by tests ([apps/bills-api/src/__tests__/bills.spec.ts](apps/bills-api/src/__tests__/bills.spec.ts) line 25-32)

---

### Step 13 — View encapsulation prevents style bleed

**Try it:** Open [apps/bills-mfe/src/app/app.component.ts](apps/bills-mfe/src/app/app.component.ts) and find the comment "Emulated encapsulation (default)". Open [apps/bills-mfe/src/app/app.component.css](apps/bills-mfe/src/app/app.component.css) — all styles are scoped to this component.

**Principle:** [A9](documentation/suite-architecture-standards.md#a9) — Angular auto-scopes all styles to each component; unscoped styles would bleed into the shell and sibling MFEs

**Code:** [apps/bills-mfe/src/app/app.component.ts](apps/bills-mfe/src/app/app.component.ts) — ViewEncapsulation.Emulated (default) is used. [apps/bills-mfe/src/app/arch-guard.interceptor.ts](apps/bills-mfe/src/app/arch-guard.interceptor.ts) — Warns if this is ever changed to `ViewEncapsulation.None`.

**What ⚡ Arch shows:** No event — style encapsulation is a component-level concern enforced at build time

---

### Step 14 — Every request carries a correlation ID

**Try it:** Open the BFF terminal. Every log line includes a `correlationId` field. Open bills-api or payments-api terminal — same `correlationId` appears. Open DevTools > Network > any response header — see `x-request-id` matching the terminal logs.

**Principle:** [A8](documentation/suite-architecture-standards.md#a8) — Observability Is Not Optional; [E10](documentation/suite-architecture-standards.md#e10) — Logs Are Event Streams

**Code:** [apps/web-bff/src/middleware/correlationId.ts](apps/web-bff/src/middleware/correlationId.ts) — Generates UUID if absent, propagates if present. [apps/web-bff/src/middleware/requestLogger.ts](apps/web-bff/src/middleware/requestLogger.ts) — Structured JSON logs to stdout, one line per request.

**What ⚡ Arch shows:** Every event card shows the `requestId` field, linking UI interactions to backend logs

---

## Architectural Rules — Quick Reference

| Rule | Enforced in |
|------|-------------|
| MFEs call only the BFF — never domain APIs directly | [apps/bills-mfe/src/app/arch-guard.interceptor.ts](apps/bills-mfe/src/app/arch-guard.interceptor.ts), [apps/payment-mfe/src/app/arch-guard.interceptor.ts](apps/payment-mfe/src/app/arch-guard.interceptor.ts) |
| Balance validation lives at the BFF | [apps/web-bff/src/routes/payments.ts](apps/web-bff/src/routes/payments.ts) |
| MFEs communicate only via namespaced CustomEvents | [apps/bills-mfe/src/app/app.component.ts](apps/bills-mfe/src/app/app.component.ts) (dispatch), [apps/shell-app/src/app/app.ts](apps/shell-app/src/app/app.ts) (listen) |
| Module Federation remotes loaded at runtime | [apps/shell-app/src/app/app.routes.ts](apps/shell-app/src/app/app.routes.ts) (loadRemoteModule calls) |
| maskedAccount holds only last 4 digits | [apps/payment-mfe/src/app/app.component.ts](apps/payment-mfe/src/app/app.component.ts) (maskedAccount construction), [apps/web-bff/src/routes/payments.ts](apps/web-bff/src/routes/payments.ts) (passes through without touching) |

---

## Troubleshooting

### Port Already in Use

If you see "port already in use" errors:

```bash
# Stop all services
./stop-all.sh

# Check specific port manually
lsof -i :4001

# Kill specific port manually
lsof -ti :4001 | xargs kill
```

### Service Won't Start

1. Make sure you're in the `billing-portal` directory
2. Check that Node.js 22+ is active: `node --version`
3. Try stopping all services first: `./stop-all.sh`
4. Check the terminal output for specific error messages

### Running All Tests

```bash
npx nx run-many -t test -p bills-api payments-api web-bff bills-mfe payment-mfe shell-app
```

---

## Intentional Limitations

This sample intentionally omits several production concerns to keep the focus on architectural principles:

| Omitted | Why | Where to Learn More |
|---------|-----|---------------------|
| Real authentication | Demo uses hardcoded `Bearer demo-token` | [E4](documentation/suite-architecture-standards.md#e4) — centralized auth; replace with OAuth2/OIDC in production |
| Persistence layer | Domain APIs use in-memory data stores | [E2](documentation/suite-architecture-standards.md#e2) — domain APIs would use PostgreSQL, MongoDB, etc. |
| Payment gateway integration | No Stripe/Braintree/Adyen | [A7](documentation/suite-architecture-standards.md#a7) — vendor SDKs belong in domain APIs, not the BFF |
| Error boundaries | No UI fallback for MFE load failures | [A9](documentation/suite-architecture-standards.md#a9) — production shells need error boundaries per remote |
| CI/CD pipelines | No GitHub Actions / CircleCI config | [P4](documentation/principles.md#p4) — each app needs independent pipeline |
| API rate limiting | No throttling or quota enforcement | [E12](documentation/suite-architecture-standards.md#e12) — production BFFs need rate limiting middleware |
| Real-time updates | No WebSocket / Server-Sent Events | [E11](documentation/suite-architecture-standards.md#e11) — real-time events require event-driven architecture |
| Multi-tenancy | Single account only | [E8](documentation/suite-architecture-standards.md#e8) — production requires tenant isolation |
| Internationalization | English only | [A9](documentation/suite-architecture-standards.md#a9) — i18n belongs in MFEs, not BFF responses |
| OpenAPI specs | Not yet generated | [E1](documentation/suite-architecture-standards.md#e1) — contract-first means OpenAPI before implementation |

**The omissions are intentional, not oversights.** This sample demonstrates architecture, not feature completeness.

---

## Further Reading

### Deep Dives

- **[NAVIGATION-FLOWS.md](documentation/NAVIGATION-FLOWS.md)** — Mermaid sequence diagrams for every user interaction: bootstrap, bills list, bill detail aggregation, Pay Now CustomEvent, payment submission with balance guard, confirmation badge refresh, and a complete navigation map
- **[PARTNER-BFF-A2-DEMO.md](documentation/PARTNER-BFF-A2-DEMO.md)** — Side-by-side curl comparisons showing A2 (BFF Per Surface, Not Per Service) in action: web-bff vs partner-bff calling the same domain APIs with different auth, response shapes, and payment patterns

### Workspace Documentation

- [suite-architecture-standards.md](documentation/suite-architecture-standards.md) — Full architectural principles (A1–A9, E1–E12)
- sample-app-prompts.md — The 14 build prompts used to construct this app (kept in the parent workspace, outside this repository)
- [api-vs-headless-commerce.md](documentation/api-vs-headless-commerce.md) — Platform vocabulary and API-first evaluation guide
- [principles.md](documentation/principles.md) — Engineering and architectural principles (P1–P5)
- [definitions.md](documentation/definitions.md) — Plain-English definitions for every term used in the standards

### BFF Pattern References

- [Sam Newman — Original BFF Pattern](https://samnewman.io/patterns/architectural/bff/) — "One experience, one BFF"; BFF owned by the same team as the UI
- [Microsoft Azure Architecture Center](https://learn.microsoft.com/en-us/azure/architecture/patterns/backends-for-frontends) — Cross-cutting concerns (auth, rate limiting) at gateway layer
- [AWS — Backends for Frontends Pattern](https://aws.amazon.com/blogs/mobile/backends-for-frontends-pattern/) — Event-driven BFF variant with real-time updates
- [ITNEXT — BFF: What It Is and When to Use It](https://itnext.io/backend-for-frontend-bff-what-it-is-and-when-to-use-it-6e8edb72e32c) — Practical examples and anti-patterns

### 12-Factor App Methodology

- [12factor.net](https://12factor.net/) — Config in env vars (III), stateless processes (VI), logs as stdout streams (XI)

---

## License

This reference application is provided as-is for educational purposes. See workspace root for license details
