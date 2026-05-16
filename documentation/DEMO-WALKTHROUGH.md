# Demo Walkthrough (5-10 Minutes)

Use this script when presenting the architecture to teams.

## 0) Setup (30-60 seconds)

Run:

```bash
./start-all.sh
./health-check.sh --wait
```

Open:

- http://localhost:4200

In the shell UI, click **⚡ Arch** first so the audience can see architecture notes and request IDs as you go.

You can open the full local standards index at:

- http://localhost:4200/architecture/standards

---

## 1) Show the Three-Layer Contract (1 minute)

Action:

1. Load the app at `/`.
2. Point out shell nav, bills list, and overdue badge.

Narration:

- The shell hosts remotes; remotes do not call domain APIs directly.
- All browser calls go to `web-bff` only.

Evidence:

- UI: bills list is rendered.
- ⚡ Arch: `A3:BFF-PROXY`.

References:

- https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/suite-architecture-standards.md#a3

---

## 2) Show BFF Aggregation (1 minute)

Action:

1. Click a bill row.

Narration:

- The MFE sends one request to BFF.
- BFF fans out to two domain APIs and returns one merged payload.

Evidence:

- UI: bill detail + payment history in one panel.
- ⚡ Arch: `E3:BFF-AGGREGATE`.

References:

- https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/suite-architecture-standards.md#e3

---

## 3) Show Cross-MFE Communication via Events (1 minute)

Action:

1. Click **Pay Now** on a bill.

Narration:

- bills-mfe dispatches a `suite:navigate:pay` CustomEvent.
- shell-app receives the event and routes to payment-mfe.
- MFEs do not import each other.

Evidence:

- UI: route switches to payment form.
- ⚡ Arch: `A9:MFE-EVENT`.

References:

- https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/suite-architecture-standards.md#a9

---

## 4) Show BFF Validation Boundary (1-2 minutes)

Action:

1. Enter an amount greater than balance.
2. Submit payment.

Narration:

- Validation is enforced at BFF (`amount <= bill.balance`).
- MFE does not own this business guardrail.

Evidence:

- UI: 422 validation error.
- ⚡ Arch: `A3:BALANCE-GUARD`.

References:

- https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/suite-architecture-standards.md#a3

---

## 5) Show Successful Payment + Shell Refresh (1 minute)

Action:

1. Submit a valid payment.
2. Click back to bills.

Narration:

- payment-mfe dispatches `suite:payment:submitted`.
- shell-app refreshes overdue badge without full reload.

Evidence:

- UI: confirmation then updated overdue count.
- ⚡ Arch: `A9:MFE-EVENT`.

---

## 6) Show Correlation ID Traceability (1 minute)

Action:

1. Pick one request ID from ⚡ Arch panel.
2. Find same ID in web-bff logs.
3. Find same ID in domain API logs.

Narration:

- One ID ties browser action to every backend hop.

Evidence:

- `requestId` in UI matches `correlationId` in service logs.

References:

- https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/suite-architecture-standards.md#a8
- https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/suite-architecture-standards.md#e10

---

## Optional Failure Demos

Use:

- https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/DEMO-FAILURE-SCENARIOS.md

These scenarios show resilience and boundary behavior without changing code.
