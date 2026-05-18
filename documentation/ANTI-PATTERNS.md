# Anti-Patterns This Demo Prevents

This document explains common mistakes and where this repository enforces boundaries.

## 1) MFE Calls Domain APIs Directly

Anti-pattern:

- Browser code calls `localhost:4001` or `localhost:4002` directly.

Why it is harmful:

- Bypasses BFF auth, aggregation, and response shaping.
- Breaks surface-specific orchestration and observability expectations.

Guardrails in repo:

- https://github.com/chris-piwinsky/angular-mfe-api/blob/main/apps/bills-mfe/src/app/arch-guard.interceptor.ts
- https://github.com/chris-piwinsky/angular-mfe-api/blob/main/apps/payment-mfe/src/app/arch-guard.interceptor.ts

Architecture rule:

- [suite-architecture-standards.md#a3](./suite-architecture-standards.md#a3)

---

## 2) MFEs Import Each Other Directly

Anti-pattern:

- One MFE imports another MFE implementation.

Why it is harmful:

- Destroys independent deployability.
- Couples release cycles and build pipelines.

Preferred pattern in repo:

- Shell loads remotes at runtime.
- MFEs communicate intent via namespaced `suite:*` CustomEvents only.

Architecture rule:

- [suite-architecture-standards.md#a9](./suite-architecture-standards.md#a9)

---

## 3) Business Guardrails in the Wrong Layer

Anti-pattern:

- Duplicating or relocating payment guardrails to MFE.

Why it is harmful:

- Inconsistent enforcement and drift between clients.
- Harder to evolve rules safely across surfaces.

Guardrail in repo:

- BFF enforces `amount <= bill.balance` before proxying payment submission.
- https://github.com/chris-piwinsky/angular-mfe-api/blob/main/apps/web-bff/src/routes/payments.ts

Architecture rule:

- [suite-architecture-standards.md#a3](./suite-architecture-standards.md#a3)

---

## 4) Per-Service BFF Proliferation Instead of Per-Surface BFF

Anti-pattern:

- Creating one BFF per downstream domain service.

Why it is harmful:

- BFF shape stops matching consumer experience.
- Extra coupling to backend internals.

Preferred pattern in repo:

- `web-bff` for web surface.
- `partner-bff` for partner integration surface.
- Both can call shared domain APIs.

Architecture rule:

- [suite-architecture-standards.md#a2](./suite-architecture-standards.md#a2)

---

## 5) Missing Correlation-ID Propagation

Anti-pattern:

- Requests across services without a shared correlation identifier.

Why it is harmful:

- Difficult production debugging.
- No reliable cross-service traceability.

Guardrail in repo:

- Correlation ID generated/forwarded in BFF middleware.
- Structured logs include request correlation.

Code references:

- https://github.com/chris-piwinsky/angular-mfe-api/blob/main/apps/web-bff/src/middleware/correlationId.ts
- https://github.com/chris-piwinsky/angular-mfe-api/blob/main/apps/web-bff/src/middleware/requestLogger.ts

Architecture rules:

- [suite-architecture-standards.md#a8](./suite-architecture-standards.md#a8)
- [suite-architecture-standards.md#e10](./suite-architecture-standards.md#e10)

---

## Quick Review Checklist

- Does every browser request go to BFF endpoints only?
- Are MFEs communicating through `suite:*` events, not imports?
- Is business validation enforced at BFF boundaries where intended?
- Are correlation IDs visible across BFF and domain logs?
- Are we preserving per-surface BFF contracts?

If any answer is no, treat it as an architecture regression.
