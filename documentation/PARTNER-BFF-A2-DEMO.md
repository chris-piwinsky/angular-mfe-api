# Partner BFF — A2 Demonstration

## What This Demonstrates

**Principle [A2](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/suite-architecture-standards.md#a2): BFF Per Surface, Not Per Service**

Two surfaces (web UI and B2B partner integration) → Two BFFs → Same domain APIs.

---

## Implementation Summary

**Created:**
- `apps/partner-bff/` — B2B partner integration BFF (port 3002)

**Key Differences from web-bff:**

| Aspect | web-bff (port 3001) | partner-bff (port 3002) |
|--------|---------------------|-------------------------|
| **Auth** | Bearer token (`Authorization: Bearer demo-token`) | API key (`X-Partner-Key: demo-partner-key`) |
| **Bills payload** | Full bill object: invoiceNumber, billingPeriod, lineItems[], payments[] | Reduced: billId, accountId, balance, dueDate, status only |
| **Payment response** | 201 Created (synchronous) | 202 Accepted (webhook pattern) |
| **CORS** | Enabled (browser consumer) | Disabled (server-to-server) |
| **x-arch-note headers** | Yes (learning demo) | No (production-like) |

---

## Side-by-Side Comparison

### Same Bill, Different Contracts

**web-bff** — Rich UI payload:
```bash
curl -H "Authorization: Bearer demo-token" \
     http://localhost:3001/api/bills/91d9c0a7-054d-4ecb-8e42-f2ed5db02d08 | jq
```

Returns:
```json
{
  "id": "91d9c0a7-054d-4ecb-8e42-f2ed5db02d08",
  "accountId": "acct-001",
  "invoiceNumber": "INV-2026-0049",
  "billingPeriod": { "start": "2026-04-01", "end": "2026-04-30" },
  "issuedDate": "2026-05-01",
  "dueDate": "2026-06-01",
  "totalAmount": 275,
  "amountPaid": 0,
  "balance": 275,
  "status": "unpaid",
  "lineItems": [
    { "id": "...", "description": "Monthly service fee", ... },
    { "id": "...", "description": "Usage overage – 7.5 GB", ... }
  ],
  "payments": [],
  "requestId": "..."
}
```

**partner-bff** — Reduced B2B payload:
```bash
curl -H "X-Partner-Key: demo-partner-key" \
     http://localhost:3002/partner/bills/91d9c0a7-054d-4ecb-8e42-f2ed5db02d08 | jq
```

Returns:
```json
{
  "billId": "91d9c0a7-054d-4ecb-8e42-f2ed5db02d08",
  "accountId": "acct-001",
  "balance": 275,
  "dueDate": "2026-06-01",
  "status": "unpaid",
  "requestId": "..."
}
```

---

### Auth Boundary Isolation

**Bearer token fails on partner-bff:**
```bash
curl -H "Authorization: Bearer demo-token" \
     http://localhost:3002/partner/bills/91d9c0a7-054d-4ecb-8e42-f2ed5db02d08
```

Returns:
```json
{ "error": "Unauthorized", "requestId": "..." }
```

**API key fails on web-bff:**
```bash
curl -H "X-Partner-Key: demo-partner-key" \
     http://localhost:3001/api/bills/91d9c0a7-054d-4ecb-8e42-f2ed5db02d08
```

Returns:
```json
{ "error": "Unauthorized", "requestId": "..." }
```

---

### Payment Pattern Differences

**web-bff** — Synchronous (201 Created):
```bash
curl -X POST -H "Authorization: Bearer demo-token" \
     -H "Content-Type: application/json" \
     -d '{"billId":"91d9c0a7-054d-4ecb-8e42-f2ed5db02d08","amount":50,"method":"card","maskedAccount":"4242"}' \
     http://localhost:3001/api/payments
```

Returns 201 with full payment object.

**partner-bff** — Asynchronous (202 Accepted + webhook):
```bash
curl -X POST -H "X-Partner-Key: demo-partner-key" \
     -H "Content-Type: application/json" \
     -d '{"billId":"91d9c0a7-054d-4ecb-8e42-f2ed5db02d08","amount":50,"callbackUrl":"https://partner.example.com/webhook"}' \
     http://localhost:3002/partner/payments
```

Returns:
```json
{
  "requestId": "...",
  "message": "Payment accepted",
  "callbackUrl": "https://partner.example.com/webhook"
}
```

partner-bff terminal logs:
```
CALLBACK SIMULATION: would POST { billId: "...", paymentId: "...", status: "completed" } to https://partner.example.com/webhook
```

---

### Balance Validation — Same Rule, Both BFFs

**web-bff:**
```bash
curl -X POST -H "Authorization: Bearer demo-token" \
     -H "Content-Type: application/json" \
     -d '{"billId":"91d9c0a7-054d-4ecb-8e42-f2ed5db02d08","amount":999,"method":"card","maskedAccount":"4242"}' \
     http://localhost:3001/api/payments
```

Returns 422: `"error": "Amount 999 exceeds balance 275"`

**partner-bff:**
```bash
curl -X POST -H "X-Partner-Key: demo-partner-key" \
     -H "Content-Type: application/json" \
     -d '{"billId":"91d9c0a7-054d-4ecb-8e42-f2ed5db02d08","amount":999,"callbackUrl":"https://partner.example.com/webhook"}' \
     http://localhost:3002/partner/payments
```

Returns 422: `"error": "Amount 999 exceeds balance 275"`

**Why this matters:** Balance validation (`amount <= balance`) lives in the BFF layer, not the domain API. Each BFF implements the same rule independently. If the rule belonged in payments-api, adding a second consumer would require modifying shared code — violating P2 (BFF owns the contract, domain API owns the truth).

---

## Domain APIs Unchanged

Notice that:
- `apps/bills-api/` was not modified to support partner-bff
- `apps/payments-api/` was not modified to support partner-bff

The domain APIs are unchanged. A new consumer gets a new BFF — not new domain API endpoints.

---

## Acceptance Criteria — All Met

- ✅ `apps/partner-bff/` exists and runs independently on port 3002
- ✅ `GET /partner/bills` returns only `{ billId, accountId, balance, dueDate, status }` — no lineItems, no invoiceNumber
- ✅ `GET /partner/bills/:id` does NOT call payments-api (verified: no payments array in response)
- ✅ `POST /partner/payments` with `amount > balance` returns 422 (same balance guard as web-bff)
- ✅ `POST /partner/payments` with valid body returns 202 (not 201) and logs callback simulation
- ✅ `GET /health` returns `{ status: "ok", surface: "partner" }`
- ✅ Bearer token accepted by web-bff returns 401 on partner-bff
- ✅ API key accepted by partner-bff returns 401 on web-bff
- ✅ Both BFFs can run simultaneously without port conflict
- ✅ Side-by-side curl demonstrations show visibly different response shapes for the same bill

---

## Run All Three Layers Together

```bash
# Terminal 1 — Domain APIs
node /path/to/dist/apps/bills-api/main.js
node /path/to/dist/apps/payments-api/main.js

# Terminal 2 — web-bff
PORT=3001 node /path/to/dist/apps/web-bff/main.js

# Terminal 3 — partner-bff
PORT=3002 BILLS_API_URL=http://localhost:4001 PAYMENTS_API_URL=http://localhost:4002 node /path/to/dist/apps/partner-bff/server.js

# Terminal 4 — Angular shell + MFEs
npx nx serve shell-app --devRemotes=bills-mfe,payment-mfe
```

All services coexist. Two BFFs. One set of domain APIs. This is A2 in production.

---

## Further Reading

- [A2 — BFF Per Surface, Not Per Service](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/suite-architecture-standards.md#a2)
- [Sam Newman — BFF Pattern](https://samnewman.io/patterns/architectural/bff/)
- [P2 — BFF Owns the Contract, Domain API Owns the Truth](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/principles.md#p2)
