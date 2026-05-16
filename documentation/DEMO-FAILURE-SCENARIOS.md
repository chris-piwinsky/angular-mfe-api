# Demo Failure Scenarios

Use these controlled scenarios to prove architecture behavior under stress.

## Setup

Start all services first:

```bash
./start-all.sh
./health-check.sh --wait
```

Keep one terminal available for stop/restart commands.

---

## Scenario 1: Auth Boundary (E4)

Trigger:

1. In browser DevTools, modify/remove `Authorization` header behavior (or call web-bff directly without auth).
2. Re-run a bills or payment request.

Expected:

- HTTP 401 from web-bff.
- ⚡ Arch indicates auth boundary behavior.

Recovery:

- Return to normal shell-driven flow where `Bearer demo-token` is injected.

Reference:

- https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/suite-architecture-standards.md#e4

---

## Scenario 2: payments-api Down, Graceful Degradation (E5)

Trigger:

```bash
lsof -ti :4002 | xargs kill
```

Then open a bill detail in UI.

Expected:

- Bill detail still loads.
- Payments section is empty (`payments: []`) rather than hard failure.
- ⚡ Arch shows graceful degradation signal.

Recovery:

```bash
PORT=4002 npx nx serve payments-api --output-style=stream
./health-check.sh --wait
```

Reference:

- https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/suite-architecture-standards.md#e5

---

## Scenario 3: Overpayment Rejection at BFF (A3)

Trigger:

1. Navigate to payment form.
2. Enter amount larger than current balance.
3. Submit.

Expected:

- HTTP 422 from BFF.
- Clear rejection in UI.
- Domain API call is not made for invalid amount.

Recovery:

- Submit a valid amount less than or equal to balance.

Reference:

- https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/suite-architecture-standards.md#a3

---

## Scenario 4: bills-api Down

Trigger:

```bash
lsof -ti :4001 | xargs kill
```

Then refresh bills list/detail.

Expected:

- BFF-dependent flows fail for bills data.
- Errors are explicit and traceable through logs.

Recovery:

```bash
PORT=4001 npx nx serve bills-api --output-style=stream
./health-check.sh --wait
```

---

## Scenario 5: Partner Surface Isolation (A2)

Trigger:

- Call partner-bff with Bearer token instead of partner API key.

Expected:

- Request is rejected by partner auth policy.
- Demonstrates per-surface auth and contract differences.

Recovery:

- Use the correct partner API key header for partner-bff requests.

Reference:

- https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/suite-architecture-standards.md#a2

---

## Presenter Notes

- Announce expected outcome before triggering each failure.
- Show both UI evidence and terminal/log evidence.
- Always finish with successful recovery to reinforce operational confidence.
