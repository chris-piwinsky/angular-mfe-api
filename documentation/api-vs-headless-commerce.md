# API-First vs Retrofitted Platforms

## Key Distinctions

### API-Wrapped Platform (Retrofitted)

- A legacy system — billing engine, CRM, ERP, payment processor — that has had APIs added as a layer on top of an existing UI-first or batch-oriented architecture
- Often a **retrofit** — functionality bolted onto a platform originally designed around a UI or scheduled job, not programmatic consumption
- API coverage is partial; not every operation is accessible programmatically; some lifecycle transitions remain UI-only or batch-only
- Adding missing capabilities requires vendor roadmap negotiation or professional services engagements

### Headless / Platform-Agnostic

- The platform is **unopinionated about the consuming system** — any UI, integration, or automated process can consume it on equal terms
- By nature requires strong API coverage to function; in practice, headless and API-first are often used interchangeably
- Retrofitted "headless" solutions carry hidden complexity costs (e.g., billing systems that still require manual UI steps for dunning configuration, tax jurisdiction overrides, or settlement reconciliation that should be API-triggerable)

### API-First (the gold standard)

- Every capability the platform offers is accessible programmatically **before** any consuming system is built
- Full read/write access to all operations via documented, versioned endpoints
- True API-first platforms have no operations that are only reachable through a UI, a batch job, or a support ticket

---

## Market Reality

| Platform Type                         | Examples                                             | Reality                                                                                                                                                                                              |
| ------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Genuine API-first                     | Stripe, Modern Treasury, Adyen                       | Built API-first from day one; every operation — charges, payouts, reconciliation, disputes, webhooks — is a first-class API resource                                                                 |
| Legacy enterprise systems adding APIs | SAP BRIM, Oracle BRM, legacy telco billing platforms | REST wrappers over decades-old data models; partial API coverage; some operations still require UI interaction or batch job triggers                                                                 |
| Hybrid / strong core API coverage     | Zuora, Chargebee                                     | Good API coverage for standard billing lifecycles; edge cases (complex dunning rules, tax authority overrides, multi-entity consolidation) may still require vendor tooling or professional services |
| New entrants                          | Various fintech / billing-as-a-service startups      | Targeting legacy replacements; API design maturity, backward compatibility practices, and SLA guarantees vary significantly                                                                          |

---

## Guiding Principles

### 1. Demand API-First, Not Just "Modern"

> If it wasn't designed API-first, "modernized" is a marketing claim, not an architecture.

Before evaluating any platform, ask: _Can every operation — reads, writes, reconciliation, configuration, admin tasks — be performed via a documented API without touching a UI?_

### 2. Test the Seams

Retrofitted platforms hide complexity behind the API layer. A billing platform may expose a `/invoices` endpoint while still requiring a nightly batch settlement job that cannot be triggered or monitored via API. Audit what the platform actually does to fulfill a request — especially around lifecycle transitions, reconciliation, dunning, and regulatory reporting.

### 3. Coupling Has a Cost

Even when a vendor offers both a billing back-end and a consumer portal or reporting product, verify they are **loosely coupled**. The portal should function with a different billing engine (and vice versa). Tight bundling across vendor products is a warning sign that replaces one monolith with another.

### 4. Match Complexity to Use Case

- Single product, single currency, fixed billing periods → API-wrapped or hybrid platform may be sufficient
- Multi-entity, multi-currency, usage-based billing, complex dunning, revenue recognition, regulatory reporting → only a true API-first platform will scale without accumulating architectural debt

### 5. Ask for References — Specifically

When a vendor claims API-first billing, ask: _"Can you show me three integrations where the consuming team never needed to use the vendor's UI or contact vendor support to operate the system day-to-day?"_ Retrofitted platforms cannot produce these references.

### 6. Watch for Ecosystem Lock-in Patterns

Vendors that acquire payment acceptance, reporting, or portal tooling and push it as the default integration path — without decoupling it — are recreating monolithic dependencies. Evaluate whether each acquired product genuinely interoperates via open APIs, or whether the "platform" is a collection of tightly coupled proprietary tools where switching any one component means switching all of them.

### 7. Vocabulary Discipline Matters

The industry has diluted "API-first" and "modern" the same way it diluted "cloud" and "headless." Align internally on precise definitions:

- **API-first**: every feature is API-accessible from day one, before any consuming UI or integration is built
- **Headless**: no prescribed consuming interface; UI and integration patterns are fully owned by the implementer
- **Composable**: independent, interchangeable services assembled into a product (MACH: Microservices, API-first, Cloud-native, Headless)

---

## TL;DR

> A platform with an API is not the same as an API-first platform.
> API-first is the prerequisite. Headless is the outcome. Composable is the goal.
