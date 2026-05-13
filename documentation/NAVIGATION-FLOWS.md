# Navigation Flows — Architecture Reference

Each diagram traces a user interaction from browser to backend, showing every service hop and the pattern that governs it. Ports match the [local dev port assignments](../README.md#port-reference).

**Layer color key used in diagrams:**
- Browser / user action
- `shell-app :4200` — host shell (routing, events, badge)
- `bills-mfe :4201` — Bills micro frontend
- `payment-mfe :4202` — Payment micro frontend
- `web-bff :3001` — Backend for Frontend (auth, aggregation, balance guard)
- `bills-api :4001` — Bills domain API
- `payments-api :4002` — Payments domain API

---

## 1. Application Bootstrap

Shell resolves both remotes at runtime via Native Federation (`loadRemoteModule()`). No npm install, no shared bundle — remotes are loaded from their running dev servers.

```mermaid
sequenceDiagram
    actor User
    participant B as Browser
    participant S as shell-app :4200
    participant BM as bills-mfe :4201
    participant PM as payment-mfe :4202
    participant BFF as web-bff :3001
    participant BA as bills-api :4001

    User->>B: Open localhost:4200
    B->>S: GET /
    S->>BM: loadRemoteModule() — fetch remoteEntry.json
    S->>PM: loadRemoteModule() — fetch remoteEntry.json
    BM-->>S: AppComponent exposed
    PM-->>S: AppComponent exposed
    Note over S: Router lazy-loads remotes on navigate
    S->>BFF: GET /api/bills?status=overdue (overdue badge)
    BFF->>BA: GET /v1/bills?status=overdue
    BA-->>BFF: Bill[]
    BFF-->>S: { data: Bill[], requestId }
    S-->>B: Shell rendered, nav badge set
```

**Pattern:** [A2](./suite-architecture-standards.md#a2) — Module Federation host. [A9](./suite-architecture-standards.md#a9) — Remotes never imported as npm packages.

---

## 2. Bills List

User lands on `/`. The shell router-outlet renders bills-mfe, which fetches all bills from the BFF.

```mermaid
sequenceDiagram
    actor User
    participant B as Browser
    participant S as shell-app :4200
    participant BM as bills-mfe :4201
    participant BFF as web-bff :3001
    participant BA as bills-api :4001

    User->>B: Navigate to /
    B->>S: route: /
    S->>BM: router-outlet renders AppComponent
    BM->>BFF: GET /api/bills<br/>(Authorization: Bearer demo-token)
    Note over BFF: Validates Bearer token (auth middleware)
    BFF->>BA: GET /v1/bills
    BA-->>BFF: Bill[]
    BFF-->>BM: { data: Bill[], requestId }
    Note over BM: billsData() = httpResource.value()?.data
    BM-->>B: Bills table rendered
```

**Pattern:** [A3](./suite-architecture-standards.md#a3) — MFE calls BFF only. bills-mfe never calls bills-api directly. [E4](./suite-architecture-standards.md#e4) — Auth validated at BFF; domain APIs receive no tokens.

---

## 3. Filter by Status

User clicks a filter tab (e.g. "Overdue"). bills-mfe recomputes the URL signal and httpResource re-fetches automatically.

```mermaid
sequenceDiagram
    actor User
    participant B as Browser
    participant BM as bills-mfe :4201
    participant BFF as web-bff :3001
    participant BA as bills-api :4001

    User->>BM: Click "Overdue" tab
    Note over BM: statusFilter.set("overdue")<br/>billsUrl computed() reacts<br/>httpResource() re-fetches
    BM->>BFF: GET /api/bills?status=overdue<br/>(Authorization: Bearer demo-token)
    BFF->>BA: GET /v1/bills?status=overdue
    BA-->>BFF: Bill[] (filtered)
    BFF-->>BM: { data: Bill[], requestId }
    BM-->>B: Table re-renders with filtered rows
```

**Pattern:** [E3](./suite-architecture-standards.md#e3) — Data at the right granularity; list view requests only summary fields. Signal reactivity — `computed()` drives re-fetch automatically.

---

## 4. Bill Detail — BFF Aggregation

User clicks a bill row. The BFF fans out to two domain APIs in parallel and merges the result into one response.

```mermaid
sequenceDiagram
    actor User
    participant B as Browser
    participant BM as bills-mfe :4201
    participant BFF as web-bff :3001
    participant BA as bills-api :4001
    participant PA as payments-api :4002

    User->>BM: Click bill row
    Note over BM: selectedBillId.set(id)<br/>detailUrl computed() reacts<br/>httpResource() fetches detail
    BM->>BFF: GET /api/bills/:id<br/>(Authorization: Bearer demo-token)
    Note over BFF: Parallel fetch — Promise.allSettled
    par Parallel
        BFF->>BA: GET /v1/bills/:id
        BA-->>BFF: Bill
    and
        BFF->>PA: GET /v1/payments?billId=:id
        PA-->>BFF: Payment[]
    end
    Note over BFF: Merges bill + payments[]<br/>Graceful: payments-api failure → payments: []
    BFF-->>BM: { data: { ...bill, payments }, requestId }
    Note over BM: billDetailData() = httpResource.value()?.data
    BM-->>B: Bill detail panel rendered
```

**Pattern:** [E3](./suite-architecture-standards.md#e3) — 1 BFF call → 2 domain APIs → 1 merged response. [E5](./suite-architecture-standards.md#e5) — Graceful degradation: payments-api down returns `payments: []`, not 500.

---

## 5. Pay Now — Cross-MFE Navigation Event

User clicks "Pay Now". bills-mfe dispatches a `CustomEvent` on `window`. The shell catches it and navigates. The two MFEs never import each other.

```mermaid
sequenceDiagram
    actor User
    participant B as Browser
    participant BM as bills-mfe :4201
    participant W as window (CustomEvent bus)
    participant S as shell-app :4200
    participant PM as payment-mfe :4202

    User->>BM: Click "Pay Now" (billId: abc)
    BM->>W: dispatchEvent("suite:navigate:pay", { billId: "abc" })
    Note over BM: bills-mfe has NO import of payment-mfe
    W->>S: listener: "suite:navigate:pay"
    S->>S: router.navigate(["/pay", "abc"])
    S->>PM: router-outlet renders payment-mfe AppComponent
    PM-->>B: Payment form rendered
```

**Pattern:** [A9](./suite-architecture-standards.md#a9) — Cross-MFE communication via namespaced `suite:*` CustomEvents. MFEs are fully decoupled; either can be deployed independently.

---

## 6. Payment Form — Submission with BFF Balance Guard

User fills in the payment form and submits. The BFF is the single enforcement point for balance validation — the MFE and payments-api never duplicate this rule.

```mermaid
sequenceDiagram
    actor User
    participant B as Browser
    participant PM as payment-mfe :4202
    participant BFF as web-bff :3001
    participant BA as bills-api :4001
    participant PA as payments-api :4002

    User->>PM: Submit form (amount, method, last4)
    PM->>BFF: POST /api/payments<br/>{ billId, amount, method, maskedAccount }<br/>(Authorization: Bearer demo-token)
    Note over BFF: 1. Validates Bearer token
    BFF->>BA: GET /v1/bills/:id (fetch bill for balance check)
    BA-->>BFF: Bill { balance: 300 }
    alt amount > balance
        BFF-->>PM: 422 Unprocessable Entity<br/>{ error: "amount exceeds balance" }
        PM-->>B: Inline error shown
    else amount <= balance
        BFF->>PA: POST /v1/payments<br/>{ billId, amount, method, maskedAccount }
        PA-->>BFF: Payment { id, status: "completed" }
        BFF-->>PM: 201 Created<br/>{ data: Payment, requestId }
        PM-->>B: Confirmation panel shown
    end
```

**Pattern:** [A3](./suite-architecture-standards.md#a3) — Balance guard lives at the BFF. [E4](./suite-architecture-standards.md#e4) — Auth at the BFF boundary. PCI scope: `maskedAccount` carries last 4 digits only — full card data never transits BFF or MFEs.

---

## 7. Payment Confirmation — Badge Refresh via CustomEvent

After confirmation, payment-mfe fires `suite:payment:submitted`. The shell catches it independently and re-fetches the overdue count. No full page reload. No shared state object.

```mermaid
sequenceDiagram
    actor User
    participant B as Browser
    participant PM as payment-mfe :4202
    participant W as window (CustomEvent bus)
    participant S as shell-app :4200
    participant BFF as web-bff :3001
    participant BA as bills-api :4001

    Note over PM: Payment 201 received
    PM->>W: dispatchEvent("suite:payment:submitted",<br/>{ billId, amount })
    W->>S: listener: "suite:payment:submitted"
    S->>BFF: GET /api/bills?status=overdue
    BFF->>BA: GET /v1/bills?status=overdue
    BA-->>BFF: Bill[] (updated count)
    BFF-->>S: { data: Bill[], requestId }
    S->>S: overdueCount.set(data.length)
    S-->>B: Nav badge updates — no reload
    User->>PM: Click "← Back to Bills"
    PM->>W: dispatchEvent("suite:navigate:bills")
    W->>S: listener: "suite:navigate:bills"
    S->>S: router.navigate(["/"])
    S-->>B: Bills list view restored
```

**Pattern:** [A9](./suite-architecture-standards.md#a9) — Shell owns its own state refresh. MFEs communicate intent only — the shell decides how to respond. [E10](./suite-architecture-standards.md#e10) — Every BFF request logged with `correlationId` flowing from shell → BFF → bills-api.

---

## 8. Complete Navigation Map

All paths, all services, all CustomEvents in one view.

```mermaid
flowchart TD
    User([User])
    S["shell-app :4200\nhost · router · badge"]
    BM["bills-mfe :4201\nbills list · bill detail"]
    PM["payment-mfe :4202\npayment form · confirmation"]
    BFF["web-bff :3001\nauth · aggregation · balance guard"]
    BA["bills-api :4001\nbills domain"]
    PA["payments-api :4002\npayments domain"]

    User -->|"GET /"| S
    S -->|"loadRemoteModule()"| BM
    S -->|"loadRemoteModule()"| PM

    BM -->|"GET /api/bills"| BFF
    BM -->|"GET /api/bills/:id"| BFF
    PM -->|"GET /api/bills/:id"| BFF
    PM -->|"POST /api/payments"| BFF

    BFF -->|"GET /v1/bills"| BA
    BFF -->|"GET /v1/bills/:id"| BA
    BFF -->|"GET /v1/payments?billId="| PA
    BFF -->|"POST /v1/payments"| PA

    BM -->|"⚡ suite:navigate:pay"| S
    PM -->|"⚡ suite:payment:submitted"| S
    PM -->|"⚡ suite:navigate:bills"| S
    S -->|"overdueCount refresh"| BFF

    style S fill:#e8f0fe,stroke:#1a73e8
    style BM fill:#e6f4ea,stroke:#188038
    style PM fill:#e6f4ea,stroke:#188038
    style BFF fill:#fff8e1,stroke:#c47f00
    style BA fill:#fce8e6,stroke:#c5221f
    style PA fill:#fce8e6,stroke:#c5221f
```

---

## Pattern Summary

| Flow | Pattern | Standard |
|------|---------|----------|
| Shell loads MFEs at runtime | Module Federation via `loadRemoteModule()` | A2, A9 |
| MFEs call BFF only | `bffBaseUrl/api/*` — never `localhost:4001` | A3 |
| Auth validated at BFF | Bearer token checked before any domain call | E4 |
| Bill detail merges two APIs | `Promise.allSettled` in BFF route | E3 |
| Payments-api down → `payments: []` | try/catch in BFF, not 500 | E5 |
| Balance guard at BFF | `amount <= bill.balance` in BFF route only | A3 |
| Cross-MFE navigation | `suite:navigate:pay` CustomEvent on `window` | A9 |
| Badge refresh on payment | `suite:payment:submitted` CustomEvent on `window` | A9 |
| Correlation ID on every request | `x-correlation-id` generated/propagated by middleware | A8, E10 |
| BFF response envelope | `{ data, requestId }` — MFEs unwrap with computed signal | E5 |
