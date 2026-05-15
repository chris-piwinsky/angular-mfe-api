# Suite Architecture Standards
## Micro Frontend · Backend for Frontend · Headless API

> **Purpose:** Establish shared vocabulary, architectural guardrails, and engineering principles for the Suite across all teams and products.

> **New to any of these terms?** See the [Definitions & Vocabulary Guide](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md) for plain-English explanations of every term in this document — written for directors and first-line leaders.

> **Design philosophy:** These standards are built around the [Pit of Success](https://blog.codinghorror.com/falling-into-the-pit-of-success/) principle — a well-designed system makes it easy to do the right things and annoying (but not impossible) to do the wrong things. If engineers are consistently making the wrong architectural call, the system hasn't made the right call obvious enough. The guardrails, anti-patterns, and explicit contracts in this document are the mechanism.

---

## 1. The Model: Three Layers, One Coherent System

```
┌─────────────────────────────────────────────────────┐
│              MICRO FRONTENDS (Presentation)          │
│   Web App  │  Mobile  │  Kiosk  │  Third-Party UI   │
└──────────────────────┬──────────────────────────────┘
                       │  (HTTP / GraphQL / WebSocket)
┌──────────────────────▼──────────────────────────────┐
│         BACKEND FOR FRONTEND — BFF (Orchestration)   │
│   Auth · Aggregation · Transformation · Caching      │
└──────────────────────┬──────────────────────────────┘
                       │  (REST / GraphQL / Events)
┌──────────────────────▼──────────────────────────────┐
│           HEADLESS DOMAIN APIs (Services)            │
│  Commerce │ Payments │ Content │ Identity │ Analytics│
└─────────────────────────────────────────────────────┘
```

Each layer has **one responsibility**. No layer reaches across another to bypass it.

---

## 2. Core Concepts

### Micro Frontend — [definition](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#micro-frontend-mfe)
The presentation layer is decomposed into [independently deliverable frontend applications that are composed into a greater whole](https://martinfowler.com/articles/micro-frontends.html). Each micro frontend is owned end-to-end by a single team, built in the team's chosen framework, and deployed independently. No shared monolithic front end exists in the Suite.

**Key properties:**
- Independent deployment and release cadence per frontend unit — no lockstep releases
- Isolated failure boundaries — one broken micro frontend does not crash the shell
- Teams choose their own frontend technology within an approved list (React, Angular, Vue, etc.)
- Each micro frontend can be developed and run in **standalone mode** without the container
- Composed at **runtime** by a shell/container application — never at build time

**Team structure:**
Teams are organized around [**vertical business domain slices**](https://martinfowler.com/articles/micro-frontends.html) — owning a section of a product from ideation through production (database, API, UI). Do not form teams around horizontal technical concerns (e.g., a "styling team" or "forms team") — this recreates the coupling micro frontends are designed to eliminate.

This is a deliberate application of the **[Inverse Conway Maneuver](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#inverse-conway-maneuver)**: rather than letting org structure accidentally dictate system shape ([Conway's Law](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#conways-law) — *"organizations design systems that mirror their own communication structure"*), you intentionally design team boundaries to match the architecture you want. Vertical domain teams produce independently deployable vertical slices. Horizontal technical teams produce layered monoliths.

**Container application:**
A single shell/container application is responsible for:
- Rendering common elements (global header, footer, navigation)
- Handling authentication — obtaining tokens and injecting them into micro frontends on initialization
- Routing — determining which micro frontend to mount based on the current URL
- Composing micro frontends onto the page and managing their lifecycle (mount/unmount)

The container itself contains minimal logic. Business functionality lives in the micro frontends it hosts.

### Backend for Frontend (BFF) — [definition](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#backend-for-frontend-bff)
The BFF is a purpose-built API gateway that sits between the micro frontend and the downstream headless APIs. It is **not** a generic API gateway — it is tailored to the needs of a specific frontend surface (web, mobile, internal tooling, etc.).

**What the BFF does:**
- Authenticates and authorizes requests on behalf of the frontend
- Aggregates calls to multiple downstream services into a single response
- Transforms data shapes to match what the frontend actually needs (no over-fetching)
- Handles caching, retry logic, and circuit breaking so frontends don't have to
- Acts as the single security surface the frontend talks to — downstream APIs are never exposed directly to the browser

**What the BFF does NOT do:**
- Own business logic or domain rules (those live in domain APIs)
- Persist data (it is stateless)
- Serve multiple, radically different frontend surfaces from the same BFF instance

**Decision heuristic — BFF vs. domain service:**
When you are unsure where a piece of logic belongs, ask: *"Does this logic exist only because this specific UI needs it?"* If yes, it belongs in the BFF. If the honest answer is *"this is reusable behaviour that any consumer could need"*, it belongs in the domain service. Duplication of logic across BFFs for different surfaces is acceptable — that is duplication across team boundaries, not within a codebase. Moving shared behaviour into a BFF library to avoid that duplication recreates the coupling the BFF boundary was designed to eliminate.

### Headless API / API-First — [definitions](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#domain-api--domain-service--headless-api)
Domain services expose all of their capabilities through a documented, versioned, and platform-agnostic API before any frontend is built. The API is the product.

**API-First means:**
- The [OpenAPI / GraphQL schema is defined and reviewed *before* implementation begins](https://medium.com/@vbansal0803/headless-api-first-and-decoupled-architectures-a-professional-guide-f2775e450279) — API design is contract-driven development; the schema is the shared agreement between frontend, backend, and third-party consumers
- Every operation available in the domain is accessible programmatically
- No capability exists only inside a UI — if it can't be called via an API, it doesn't count

**Headless means:**
- The domain service has no opinion about the front end
- The same service powers web, mobile, kiosk, and third-party consumers equally — enabling [omnichannel delivery from a single content/data source](https://www.dotcms.com/blog/what-is-a-headless-api)
- Responses are raw data (JSON) — presentation is the frontend's responsibility

### Decoupled vs. Headless vs. Composable

| Term | What it means |
|---|---|
| [**Decoupled**](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#domain-api--domain-service--headless-api) | Frontend and backend are separate systems connected only via APIs |
| [**Headless**](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#domain-api--domain-service--headless-api) | Backend has no predefined UI; any frontend can consume it |
| [**API-First**](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#api-first) | APIs are designed and contracted before implementation; they are the primary interface |
| [**Composable**](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#composable-architecture) | Independent services are assembled into a product ([MACH](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#mach): Microservices, API-first, Cloud-native, Headless) |

These are not synonyms. API-First is the prerequisite. Headless is the outcome. Composable is the goal.

---

## 2.5 Micro Frontend Composition Approaches

How micro frontends are integrated onto a page has [major architectural implications](https://martinfowler.com/articles/micro-frontends.html). Prefer runtime approaches that preserve independent deployability.

| Approach | Mechanism | Verdict |
|---|---|---|
| [**Build-time integration**](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#build-time-integration) | Micro frontends published as npm packages, bundled by the container at build time | **Avoid** — any change to one MFE forces a rebuild and release of the container and all sibling MFEs |
| [**Run-time via JavaScript / Module Federation**](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#module-federation--native-federation) | Each MFE exposes an entry-point function; container loads and mounts at runtime via Module Federation (Webpack Module Federation for React/Vue; Native Federation for Angular — Vite/ESBuild-based equivalent) | **Preferred** — fully independent deployability; dependency sharing without lockstep releases |
| [**Run-time via Web Components / Custom Elements**](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#web-components--custom-elements) | Each MFE registers a Custom Element; container instantiates via standard HTML tags | **Good** — framework-agnostic; leverages browser standards; works across tech stacks |
| **Server-side composition** | Server assembles HTML fragments (SSI / ESI / edge rendering) before delivery to browser | **Appropriate for content-heavy pages** — improves initial load; renders without JavaScript; use skeleton screens for dynamic fragments |
| **Run-time via iframes** | Each MFE embedded in an iframe | **Last resort** — strong isolation but breaks routing, history, deep-linking, and responsive layout |

### Where a micro frontend falls on the [Documents-to-Applications Continuum](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#documents-to-applications-continuum)
Not every micro frontend is the same kind of thing. [The Documents-to-Applications Continuum](https://ar.al/notes/the-documents-to-applications-continuum/) provides a useful diagnostic: ask *"if I removed all behaviour, would the content still have value?"* The answer changes both the appropriate rendering strategy and how progressive enhancement applies.

| MFE type | Continuum position | Rendering guidance |
|---|---|---|
| Transaction forms (payment entry, checkout) | Application end | CSR only — no meaningful content survives removing behaviour; SSR adds overhead with no benefit |
| Interactive data views (filterable bill lists) | Mid-spectrum | CSR preferred; consider partial SSR for initial list payload |
| Document-like views (invoice detail, billing history, PDF viewer) | Document end | SSR or prerendering appropriate — content has value without interaction; improves initial load and accessibility |
| Document library / asset browser | Document end | SSR or static prerender strongly preferred — progressive enhancement applies; crawlable and accessible without JavaScript |

This distinction matters when adding MFEs that surface a document library or read-heavy content alongside interactive transaction flows. The shell composes both kinds of MFE; each team chooses the rendering strategy appropriate to their position on the continuum.

### Composition Rules
- **Never compose at build time** for features that need independent deployment cadences
- Prefer **Module Federation** for JavaScript-framework micro frontends — Webpack Module Federation (React, Vue) or Native Federation (Angular, Vite-based toolchains)
- Use **Custom Elements / Web Components** as the integration boundary when teams span different frameworks
- The container passes the **auth token and routing history** to each micro frontend on mount — micro frontends do not manage their own auth session
- Each micro frontend must expose a **mount function** and an **unmount function** as its public contract with the container; this is the only interface the container touches

---

## 3. Layer Responsibilities

### Layer 1 — Micro Frontend (Presentation)

| Responsibility | Owner |
|---|---|
| User experience and interaction | Frontend team |
| Component library / design system adherence | Frontend team + Design |
| Routing within the micro frontend boundary | Frontend team |
| Calling *only* the BFF (never domain APIs directly) | Frontend team |
| Accessibility (WCAG 2.1 AA minimum) | Frontend team |
| Performance budget compliance (Core Web Vitals) | Frontend team |
| Style isolation — all CSS scoped to the micro frontend's own DOM | Frontend team |
| Exposing mount and unmount lifecycle functions to the container | Frontend team |
| Standalone development mode (runs outside container for local dev) | Frontend team |

**Does NOT own:** business rules, data persistence, authentication token lifecycle (container), global navigation (container)

**Styling isolation:**
[CSS is inherently global](https://martinfowler.com/articles/micro-frontends.html) — inheriting, and cascading, with no built-in module system or encapsulation. Each micro frontend must scope all styles to prevent leaking into the container or other micro frontends. Approved approaches:
- **CSS Modules or CSS-in-JS** (styled-components, Emotion) — styles are scoped to components by construction; preferred for React/Vue micro frontends
- **Angular view encapsulation** (Emulated or ShadowDom mode) — framework-native scoping; components emit uniquely attributed selectors so styles cannot leak; preferred for Angular micro frontends
- **Vue scoped styles** (`<style scoped>`) — framework-native attribute-based scoping; preferred for Vue micro frontends
- **Shadow DOM** — full native encapsulation when using Web Components / Custom Elements
- **[BEM with team namespace prefix](https://micro-frontends.org/)** — only as a fallback; agree on a prefix convention (e.g., `billing-`, `payment-`) to avoid collisions. Namespace CSS, Events, Local Storage, and Cookies to clarify ownership
- Never use unscoped global selectors (`h2 { }`, `.button { }`) from within a micro frontend

**Cross-micro-frontend communication:**
Micro frontends should communicate as little as possible — every communication channel is a coupling point. When communication is necessary:
- **Preferred — URL / routing:** The [page URL is shared state](https://martinfowler.com/articles/micro-frontends.html) visible to all micro frontends. Pass context through route parameters and query strings. This is declarative, auditable, bookmarkable, and forces micro frontends to communicate indirectly without knowing about each other directly.
- **Acceptable — Custom browser events:** [Dispatch and listen to namespaced `CustomEvent`s](https://micro-frontends.org/) on `window` (e.g., `suite:payment:submitted`, `suite:navigate:pay`). Namespace events with a team prefix to clarify ownership. Micro frontends subscribe without holding direct references to each other.
- **Avoid — Shared global state:** Do not share a Redux store or any global in-memory object across micro frontend boundaries. This recreates monolith coupling.
- **Avoid — Direct function calls between micro frontends:** Micro frontends must not import from or hold references to each other's internal APIs.

### Layer 2 — Backend for Frontend (Orchestration)

| Responsibility | Owner |
|---|---|
| Token validation and session management | BFF team |
| Request aggregation from multiple domain APIs | BFF team |
| Response shaping / field projection | BFF team |
| Rate limiting and circuit breaking | BFF team |
| Logging and distributed tracing correlation | BFF team |
| API versioning for frontend consumers | BFF team |

**Does NOT own:** domain business logic, data storage, authentication issuance (deferred to Identity service)

### Layer 3 — Headless Domain APIs (Services)

| Responsibility | Owner |
|---|---|
| Domain business rules and invariants | Domain team |
| Data persistence and schema management | Domain team |
| Event publishing for async consumers | Domain team |
| API contract (OpenAPI / GraphQL schema) | Domain team |
| Backward compatibility and versioning | Domain team |
| Service-to-service authentication (not user-facing) | Domain team |

**Does NOT own:** frontend concerns, BFF aggregation logic, presentation formatting

---

## 4. Architectural Guiding Principles

### A1 — API-First, Always
Every feature of every domain service must be accessible via a documented API endpoint before any UI is built against it. Schema-first design (OpenAPI or GraphQL SDL) is required. Code is an implementation of the contract — not the source of truth for it.

### A2 — BFF Per Surface, Not Per Service
One BFF instance serves one frontend surface type (e.g., `web-bff`, `mobile-bff`, `partner-bff`). Do not create a BFF per downstream service — that recreates a gateway, not a BFF. Do not build one BFF for all surfaces — that recreates a monolith.

The BFF is **owned and maintained by the same team that owns the frontend surface** — not a separate backend platform team. This preserves autonomy: the team controls both the UI contract and the server-side component that backs it, and can iterate both without cross-team coordination. As [Sam Newman](https://samnewman.io/patterns/architectural/bff/) states: *"one experience, one BFF"* — if two interfaces diverge significantly in their data needs or interaction patterns, they warrant separate BFFs.

**Cross-cutting concerns (auth token validation, rate limiting, logging) at the BFF vs. a dedicated API gateway layer:** Placing these inside the BFF keeps the deployment surface smaller and avoids an extra network hop. Extracting them to a shared gateway (e.g., Nginx, API Management) avoids duplication across multiple BFFs but adds latency and operational overhead. For a single-surface deployment (one BFF), inline auth middleware at the BFF is the pragmatic choice. For a multi-surface deployment with several BFFs, consider a shared [gateway layer](https://learn.microsoft.com/en-us/azure/architecture/patterns/backends-for-frontends) for token validation while keeping aggregation and response shaping inside each BFF.

### A3 — Frontends Call the BFF. Only the BFF.
No micro frontend makes direct calls to domain APIs. The BFF is the only network boundary the frontend crosses. This enforces a single security perimeter and prevents frontend teams from accumulating hidden dependencies on internal service contracts.

### A4 — Loose Coupling, Explicit Contracts
Services communicate through versioned, documented API contracts. Avoid shared libraries that couple domain logic across service boundaries. When a contract changes, version it — do not silently break consumers.

### A5 — [Independent Deployability](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#independent-deployability)
Each micro frontend, each BFF, and each domain service must be deployable independently without coordinating a simultaneous release across layers. If a deployment requires coordination across more than one layer, that is a coupling violation to be resolved — not a process to be scheduled.

Each micro frontend must have its own [CI/CD pipeline](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#cicd-pipeline-continuous-integration--continuous-delivery) that builds, tests, and deploys it to production independently. A deployment of one MFE should require no awareness of the current state of other MFE pipelines.

### A6 — Composable by Default
Prefer assembling functionality from purpose-built domain APIs over building bespoke backend logic that could be a domain service. Evaluate **[build vs. buy vs. assemble](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#build-vs-buy-vs-assemble)** for every new capability, with preference toward assemble.

| Option | What it means | When to choose it |
|---|---|---|
| **Build** | Your team writes and owns the capability from scratch | The capability is a genuine competitive differentiator that off-the-shelf products cannot match; you can justify the long-term maintenance cost |
| **Assemble** | Wire together existing internal domain APIs and/or vendor APIs behind a Suite-owned interface | The capability already exists as a building block (your own or a vendor's); you need a custom combination or workflow on top of it — not a net-new service |
| **Buy** | License a SaaS or COTS product (e.g., Stripe for payments, Auth0 for identity) | The problem is commodity; the vendor's solution is well-understood; integration cost is lower than build cost |

The Suite default is **assemble**: use your domain APIs as the building blocks, abstract vendor integrations behind Suite-owned contracts (A7), and reserve **build** for capabilities that are genuinely unique to your business. **Buy** is appropriate for commodity infrastructure; always abstract the vendor behind a Suite-owned interface so the vendor can be replaced without touching micro frontends or other domain services.

### A7 — No [Vendor Lock-in](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#vendor-lock-in) at the Architecture Level
[Vendor-specific APIs must be abstracted behind Suite-owned interfaces](https://www.paragon-inc.com/content/post/why-organizations-should-build-custom-apis-for-a-headless-cms-experience). If a vendor is replaced, the change is contained to the adapter layer — no micro frontend or BFF should require modification.

### A8 — [Observability](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#observability) Is Not Optional
Every layer must emit [structured logs](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#structured-logs), [distributed traces](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#distributed-tracing) (with correlation IDs propagated across the BFF and into domain calls), and health/readiness endpoints. You cannot debug what you cannot observe.

### A9 — [Teams Own Vertical Slices](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#vertical-domain-slice--vertical-team), Not [Horizontal Layers](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#horizontal-technical-team)
Team boundaries follow business domain capabilities, not technical disciplines. A team owns everything from the database through the API to the UI for their domain. Do not create teams organized around horizontal concerns (styling, forms, validation) without a corresponding domain. Horizontal concerns become shared services, design systems, or guilds — not blocking dependencies on another team's roadmap.

**[Conway's Law](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#conways-law) in practice:** If you draw team boundaries incorrectly, the architecture will follow. A separate "BFF team" will produce a BFF that drifts from the frontend's needs. A shared "API team" will produce APIs too generic to serve any consumer well. The rule that the BFF is owned by the same team as the frontend surface (A2) is a direct consequence of this — [as Sam Newman notes](https://samnewman.io/patterns/architectural/bff/), BFF boundaries are ultimately driven by team structure, not technology.

---

## 5. Engineering Guiding Principles

### E1 — Contract Before Code
API design (schema or OpenAPI spec) is written, reviewed, and approved before any implementation begins. The contract is the artifact that unblocks parallel frontend and backend development.

### E2 — Backend and Frontend Develop in Parallel
Once the BFF contract is established, frontend teams mock the BFF response and build UI. Backend teams implement the contract. Integration is the final step — not the starting gate.

### E3 — Data at the Right Granularity
BFFs must request only the data they need from domain APIs. Domain APIs must return only what is asked for. GraphQL field selection or sparse fieldsets in REST are the mechanisms. Over-fetching at the BFF-to-domain boundary creates hidden performance problems and couples the BFF to internal domain data shapes.

### E4 — [Authentication](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#authentication-vs-authorization) Is Centralized, [Authorization](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#authentication-vs-authorization) Is Distributed
A single Identity service issues [tokens](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#token--auth-token). Each layer validates tokens independently — the BFF validates on behalf of the frontend, and domain services validate on inbound service-to-service calls. No layer trusts a caller simply because it came from inside the network.

### E5 — [Fail Gracefully](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#graceful-degradation--fail-gracefully), Not Silently
BFFs implement [circuit breakers](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#circuit-breaker) and fallback responses. Micro frontends handle partial failures (one widget fails, others still render). Domain services return structured error responses, never raw stack traces.

### E6 — Versioning Is a First-Class Concern
All APIs are versioned from day one. Breaking changes require a new version — not a silent modification to an existing endpoint. Deprecation timelines are communicated to consumers before old versions are removed.

### E7 — Security at Every Boundary
- All traffic is TLS-encrypted, including service-to-service
- Authentication tokens (JWT/OAuth 2.0) are validated at the BFF before any downstream call is made
- Domain APIs use mTLS or signed tokens for service-to-service calls
- No secrets in frontend code — the BFF manages credentials for downstream services
- [Rate limiting at the BFF layer prevents abuse from reaching domain services](https://www.paragon-inc.com/content/post/why-organizations-should-build-custom-apis-for-a-headless-cms-experience) and reduces the attack surface exposed by domain APIs
- API responses expose only the minimum fields required (principle of least privilege)
- Payment card data (PAN, CVV, expiry) must never pass through or be stored by a BFF or micro frontend; use PSP-provided tokenization (e.g., Stripe Elements, Adyen Web Drop-in) at the point of entry; BFFs and MFEs handle only masked references (last 4 digits, payment method token) — this contains PCI DSS scope to the tokenization boundary

### E8 — Vocabulary Discipline
Teams align on precise terms. "Headless" is not interchangeable with "API-first." "Decoupled" does not mean "microservices." "BFF" is not a general-purpose API gateway. Shared vocabulary prevents architectural drift.

### E9 — Style Isolation Is Mandatory
Every micro frontend must scope its CSS so that styles do not leak into the container or other micro frontends. Use CSS Modules, CSS-in-JS, or Shadow DOM. Unscoped global selectors within a micro frontend are a violation that will be caught in code review.

### E10 — Technology Alignment Over Technology Anarchy
Teams have freedom to choose their frontend framework within an approved set. [Allowing every team to independently pick a completely different stack creates a fragmented ecosystem](https://micro-frontends.org/) that is expensive to maintain, hire for, and govern. Establish a short approved list; document the rationale for any addition. Mixing technologies is acceptable when migrating legacy systems — not as a default mode of operation.

### E11 — Shared Components Are Harvested, Not Designed Upfront

[Do not create a shared component library before you have real-world usage data](https://martinfowler.com/articles/micro-frontends.html). Let teams build components within their own codebases first. When the same component pattern stabilizes across multiple micro frontends, harvest it into the shared library. Shared components must contain only UI logic — never business or domain logic. The shared library requires a named custodian responsible for quality and consistency.

### E12 — Each Micro Frontend Has Its Own Test Suite
Each micro frontend maintains [unit tests](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#unit-test) for business and rendering logic, and [integration tests](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#integration-test) for its contract with the container. [End-to-end tests](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#end-to-end-e2e-test) validate integration across micro frontends but are kept minimal ([test pyramid](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#test-pyramid)). [Consumer-driven contract tests](https://martinfowler.com/articles/micro-frontends.html) validate the interface between micro frontends without requiring a fully integrated environment.

---

## 6. API Design Standards

### Protocol Selection

| Use Case | Protocol |
|---|---|
| CRUD operations, broad compatibility | REST (OpenAPI 3.x) |
| Complex queries, flexible data fetching, frontend-driven shape | GraphQL |
| Real-time events, notifications | WebSocket / Server-Sent Events |
| Async domain events between services | Message broker (e.g., Kafka, SNS/SQS) |

### REST Conventions
- Use nouns for resources, not verbs (`/orders`, not `/getOrders`)
- Standard HTTP methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`
- HTTP status codes must be semantically correct (no `200 OK` with an error body)
- Pagination required on all collection endpoints (`limit`, `offset` or cursor-based)
- All responses include a `requestId` / `correlationId` for tracing

### GraphQL Conventions
- Schema-first: SDL is the source of truth
- Mutations follow the `input` / `payload` envelope pattern
- Errors use the GraphQL `errors` array — never swallow errors in `data`
- No N+1 queries — DataLoader or equivalent batching is required

### Versioning
- REST: URL versioning (`/v1/`, `/v2/`)
- GraphQL: Field deprecation + additive-only schema evolution; breaking changes via schema versioning
- Minimum 90-day deprecation notice before removing a version

---

## 7. Technology Reference Stack

| Layer | Recommended | Notes |
|---|---|---|
| Micro Frontend shell / container | Angular (Native Federation), React (Webpack MF), Single-SPA | Native Federation for Angular toolchains; Webpack Module Federation for React/Vue; Single-SPA for framework-agnostic orchestration |
| Micro Frontend composition | Native Federation (Angular/Vite), Webpack Module Federation (React/Vue), Custom Elements (Web Components) | Module Federation variant matched to framework toolchain; Custom Elements for cross-framework integration |
| Micro Frontend styling | Angular view encapsulation (Emulated/ShadowDom), CSS Modules, Vue scoped styles, styled-components | Shadow DOM for Web Components; framework-native scoping preferred over global CSS in all cases |
| BFF | Node.js (NestJS / Express), Next.js API Routes | Stateless; deploy to edge where possible |
| Domain API | Node.js, Java (Spring Boot), Python (FastAPI) | Team choice per domain |
| API Protocol | REST (OpenAPI 3.x) or GraphQL | Mandate one per service; no mixing within a service |
| Identity / Auth | OAuth 2.0 + OIDC (Auth0, Okta) | Centralized; no custom auth implementations |
| Async Messaging | Kafka, AWS SNS/SQS | For domain events only; not for request/response |
| Observability | OpenTelemetry + structured JSON logs | Correlation IDs required across all layers |

---

## 8. Trade-offs & When This Architecture Applies

### Apply this model when:
- The Suite serves multiple frontend surfaces (web, mobile, partner integrations, in-store)
- Multiple teams own separate domain capabilities and need independent release cycles
- The product must integrate third-party services that may be replaced over time
- Omnichannel delivery, B2B integrations, or compliance requirements are present

### Use a simpler model when:
- Single-team, single-surface, short-lived project
- Prototype or MVP where architectural overhead exceeds the benefit
- The cost of managing distributed systems is not justified by scale or complexity

---

## 9. Anti-Patterns to Avoid

| Anti-Pattern | Why It's Harmful |
|---|---|
| Micro frontend calling a domain API directly | Bypasses the BFF security perimeter; couples frontend to internal service contracts |
| One BFF for all frontend surfaces | Recreates a monolith; BFF accumulates conflicting concerns |
| Domain API serving presentation-formatted data | Couples domain logic to a specific frontend; breaks composability |
| Shared database between domain services | Creates hidden coupling; schema changes in one service break others |
| "Headless" via retrofitted monolith | Hidden performance tax — [platforms silently render a full page and scrape the result before returning it via API](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/api-vs-headless-commerce.md), adding latency while appearing headless; architectural debt compounds over time |
| Skipping API contract review | Breaks parallel development; frontend and backend become tightly coordinated again |
| Vendor-specific SDK calls in micro frontends | Lock-in at the presentation layer; replacing a vendor requires frontend rewrites |
| [Build-time integration of micro frontends (npm packages)](https://martinfowler.com/articles/micro-frontends.html) | Any change to one MFE forces a full rebuild and redeploy of the container; recreates lockstep releases |
| Shared global state across micro frontends (single Redux store) | Recreates monolith coupling at the state layer; defeats independent deployability and failure isolation |
| Teams organized around horizontal technical concerns | Creates cross-team blocking dependencies; a "styling team" or "forms team" becomes a bottleneck for every domain team |
| Unscoped CSS in micro frontends | Style bleed between micro frontends causes unpredictable rendering and breaks team isolation |
| Creating a new domain API endpoint per UI view | Couples domain API shape to a specific screen; the BFF exists precisely to translate between stable domain data and screen-specific shapes — new views should recombine existing API data via the BFF, not spawn new domain endpoints |
| [Micro frontend framework anarchy (every team a different stack)](https://micro-frontends.org/) | Exponential hiring, maintenance, and governance complexity; shared tooling, design systems, and code review become impractical |

---

## 10. References

| Source | URL | Key Contributions to This Document |
|---|---|---|
| Internal: API-First vs Retrofitted Platforms | [./api-vs-headless-commerce.md](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/api-vs-headless-commerce.md) | Vocabulary definitions (API-first, headless, composable); billing and payments platform landscape; retrofitted platform anti-patterns; 7 guiding principles for platform evaluation |
| Contentful: What is a Headless API? | https://www.contentful.com/guides/api/headless-api/ | Composable architecture benefits; build vs. buy vs. assemble decision framing; platform independence; omnichannel delivery |
| Varun Bansal: Headless, API-First, and Decoupled Architectures | https://medium.com/@vbansal0803/headless-api-first-and-decoupled-architectures-a-professional-guide-f2775e450279 | Contract-driven development (schema before code); API-first as an organizational discipline; headless content atomization; distributed debugging trade-offs |
| Paragon: Why Organizations Should Build Custom APIs for a Headless CMS Experience | https://www.paragon-inc.com/content/post/why-organizations-should-build-custom-apis-for-a-headless-cms-experience | Vendor abstraction to prevent lock-in and messy re-platforming; security surface area reduction via custom APIs; rate limiting as a security layer |
| dotCMS: What Is a Headless API? | https://www.dotcms.com/blog/what-is-a-headless-api | REST / GraphQL / Webhook protocol overview; token-based auth as a headless API default; omnichannel content from a single source of truth; compliance-led use cases |
| Cam Jackson / Martin Fowler: Micro Frontends | https://martinfowler.com/articles/micro-frontends.html | Definition of independently deliverable frontend applications; vertical team ownership; build-time vs. runtime composition trade-offs; CSS scoping; URL and CustomEvent communication patterns; BFF pattern; harvested component library; consumer-driven contract tests; standalone dev mode |
| micro-frontends.org | https://micro-frontends.org/ | Technology-agnostic core ideas; team namespace prefixes for CSS / Events / Local Storage; Custom Elements as the cross-framework integration boundary; server-side rendering with SSI; framework anarchy warning |
| Vivek Shukla / AppFoster: A Comprehensive Guide to Micro Frontend Architecture | https://medium.com/appfoster/a-comprehensive-guide-to-micro-frontend-architecture-cc0e31e0c053 | Webpack Module Federation and Single-SPA tooling guidance; approved technology list rationale; CI/CD pipeline considerations for independent MFE deployments |
| Sam Newman: Backends for Frontends (original pattern) | https://samnewman.io/patterns/architectural/bff/ | Canonical BFF pattern definition; one experience, one BFF; BFF owned by the same team as the UI; graceful degradation for partial downstream failures; trade-off between inline BFF auth vs. upstream perimeter layer; team structure as the primary driver for BFF boundaries (Conway's Law) |
| Microsoft Azure Architecture Center: Backends for Frontends pattern | https://learn.microsoft.com/en-us/azure/architecture/patterns/backends-for-frontends | BFF per client interface; cross-cutting concerns (auth, monitoring, rate limiting) may be abstracted to a gateway layer vs. inline in the BFF; Azure Well-Architected Framework alignment (Reliability, Security, Performance); when BFFs add less value (GraphQL, single-interface apps) |
| AWS: Backends for Frontends Pattern | https://aws.amazon.com/blogs/mobile/backends-for-frontends-pattern/ | Event-driven BFF pattern combining BFF + pub/sub for near-real-time UI updates; BFF as a subscriber to domain aggregate events; denormalized UI-ready projections in BFF-owned read store; REST and GraphQL BFF variants |
| itnext.io: Backend for Frontend — What It Is and When to Use It | https://itnext.io/backend-for-frontend-bff-what-it-is-and-when-to-use-it-6e8edb72e32c | BFF use-case guidance and when-to-use heuristics |
| Aral Balkan: The Documents-to-Applications Continuum | https://ar.al/notes/the-documents-to-applications-continuum/ | Diagnostic framework for distinguishing content-centric (site/document) from behaviour-centric (app) products; "remove all behaviour — does the content still have value?"; informs when SSR and progressive enhancement are appropriate vs. meaningless for a given micro frontend |
| Melvin Conway: How Do Committees Invent? (1968) | https://www.melconway.com/Home/Committees_Paper.html | Original statement of Conway's Law: "organizations which design systems are constrained to produce designs which are copies of the communication structures of these organizations"; foundational basis for A9 and the team ownership model |
| Matthew Skelton & Manuel Pais: Team Topologies (2019) | https://teamtopologies.com/ | Formalises the Inverse Conway Maneuver — deliberately shaping team structure to produce the desired architecture; stream-aligned teams, enabling teams, complicated-subsystem teams, platform teams; cognitive load as a first-class team design constraint; directly informs vertical domain team structure and the anti-pattern of horizontal technical teams |
| Jeff Atwood: Falling Into the Pit of Success | https://blog.codinghorror.com/falling-into-the-pit-of-success/ | Foundational philosophy for this document's guardrails approach — systems should make correct decisions the path of least resistance; architectural standards, anti-patterns, interceptors, and contract reviews are the mechanisms that create the pit |
