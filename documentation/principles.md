# Billing & Payments — Engineering Principles

> These principles are the standards every architecture and engineering team in Billing and Payments is expected to promote, defend, and apply. They are not aspirational — they are the agreed-upon way we work.
>
> For the full technical standards behind these principles, see [suite-architecture-standards.md](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/suite-architecture-standards.md).
> For plain-English definitions of any term used here, see [definitions.md](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md).

---

## Why These Principles Exist

Billing and Payments has accumulated numerous separate UIs — not because that many surfaces were planned, but because every new screen requirement produced a new interface with a tightly coupled API to match. The UI team owned the API. Each new view extended it further: fields bolted on for one screen that other consumers didn't need, response shapes drifting steadily away from the domain and toward whatever a specific screen required. Every UI change demanded a backend change. Every release required coordination.

The result is a growing number of surfaces to maintain, test, and evolve — instead of one platform that powers all of them.

These principles exist to stop that pattern from compounding further and to give us the foundation to consolidate. A well-designed [headless](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#headless-api--domain-api--domain-service) platform means the next surface — web, mobile, partner, internal tool — consumes the same [domain APIs](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#headless-api--domain-api--domain-service) through a purpose-built [BFF](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#backend-for-frontend-bff), rather than spawning another bespoke integration. Over time, surfaces that were built as one-offs can be replaced by composable [MFEs](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#micro-frontend-mfe) drawing from a stable API layer. The goal is not numerous UIs maintained in parallel. The goal is one platform, expressed through many surfaces.

We are deliberately breaking that pattern.

Our goal is a **B2B2C-ready** Billing and Payments platform: a standardized, decoupled set of services that can power internal web applications, mobile experiences, partner integrations, and future channels we haven't imagined yet — all from the same headless API layer. The principles below are what make that possible and what prevent us from drifting back to where we started.

---

## The Guiding Test

Before every design decision, ask: **"Am I making the right thing easy and the wrong thing hard?"**

If the answer is no — if the architecture makes it easier to bypass the BFF, couple the UI to the API, or create a release dependency — the design needs to change. This is the [Pit of Success](https://blog.codinghorror.com/falling-into-the-pit-of-success/) principle applied to our platform.

---

## Architectural Principles

### P1 — The API Is the Product

Build every Billing and Payments domain capability as a headless API first. The UI is a consumer — not the owner. An API designed only to answer a specific screen's question is not a platform; it is a bespoke integration that will need to be rebuilt when the next screen has a different need.

**In practice:**

- Define the [OpenAPI](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#openapi--openapi-schema) schema before writing any implementation code
- Any capability that exists only inside a UI does not count as a platform capability
- Domain APIs (bills, payments) must be usable by web, mobile, partner, and internal tooling consumers without modification

**Watch out for:** A domain API that returns data shaped for a specific screen. That shaping belongs in the BFF, not the domain service.

---

### P2 — The BFF Owns the Screen Contract; the Domain API Owns the Business Truth

The domain service owns the data and the rules. The BFF owns the question "what does this specific screen need?" These are different responsibilities and must live in different places.

**The right question:** _"Does this logic exist only because this specific UI needs it?"_

- Yes → belongs in the BFF
- No → belongs in the domain service

**In practice:**

- A new view requirement should never require a new domain API endpoint — it should require a new BFF response shape composed from existing domain data
- BFF duplication across surfaces (web-BFF, mobile-BFF) is acceptable; shared BFF logic libraries are not — shared logic that belongs across consumers belongs in the domain service
- The BFF team and the frontend team are the same team

**Watch out for:** The old pattern — a new screen request creates a new API. That is the pattern we are replacing.

**BFF is a pattern, not a technology.** This project implements the BFF as an Express/TypeScript REST service. That is one valid choice, not a definition of the pattern. A [GraphQL](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#graphql) server whose resolvers aggregate domain APIs is equally a BFF — the schema is the contract, resolvers handle the aggregation, and auth, PCI boundary enforcement, and correlation ID propagation still live there. A .NET minimal API, a Go service, or a set of serverless functions can all fulfill the same role. What makes something a BFF is its purpose and placement — purpose-built for one consumer surface, sitting between that surface and the domain APIs — not the language or protocol it uses.

---

### P3 — Frontends Call the BFF. Only the BFF.

No micro frontend makes direct calls to domain APIs. The BFF is the single network boundary the frontend crosses.

**Why this matters for Billing and Payments:**

- Payment data is sensitive. The BFF is the security perimeter — it validates tokens, enforces authorization, and masks data before it reaches the browser
- Direct frontend-to-domain-API calls bypass all of this and expose internal service contracts to the browser
- [PCI DSS](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#pci-dss-payment-card-industry-data-security-standard) scope is contained at the [tokenization](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#tokenization-payment-tokenization) boundary; card data never transits the BFF or MFE. Only masked references (last 4 digits, payment method token) are handled by Suite-owned systems

**Watch out for:** A micro frontend that calls `localhost:4001` or any domain API URL directly. This is a violation, not a shortcut.

---

### P4 — Design for Decoupling; Deploy for Independence

Every micro frontend, every BFF, and every domain service must be deployable on its own — without coordinating with other teams, without a shared release window, and without awareness of the current state of other pipelines.

**In practice:**

- Each MFE has its own [CI/CD](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#cicd-pipeline-continuous-integration--continuous-delivery) pipeline; deploying bills-MFE does not require payment-MFE to be deployed simultaneously
- Coupling that forces coordinated releases is a design problem, not a scheduling problem — fix the coupling
- Use runtime composition (Module Federation / Native Federation) — never bundle MFEs together at build time
- BFFs and domain APIs are stateless — no in-memory session state, no sticky sessions. Any state that must persist lives in a backing service (cache, database). Stateless processes scale horizontally and restart cleanly; stateful ones do neither

**Watch out for:** "We need to coordinate the release of X and Y together." That sentence describes a coupling violation.

---

### P5 — Design Teams the Way You Want the System to Look

Teams organized around [horizontal technical concerns](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#horizontal-technical-team) (a "forms team," a "shared API team," a "styling team") will produce systems with horizontal layers that every domain team must navigate through. That is [Conway's Law](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#conways-law) working against you.

Organize Billing and Payments teams around **[vertical business domain slices](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#vertical-domain-slice--vertical-team)** — a team owns the database, the domain API, the BFF, and the micro frontend for their domain. That team can design, build, test, and deploy without waiting for anyone else.

**In practice:**

- The bills team owns everything in the bills domain end-to-end
- The payments team owns everything in the payments domain end-to-end
- Cross-cutting concerns (design system, shared auth patterns, observability tooling) are platforms or guilds — they enable teams, they do not block them

**Watch out for:** Any team structure where one team must wait on another team's roadmap to deliver a feature within their own domain.

---

### P6 — Assemble First; Build Only What Is Genuinely Unique

The default answer to "we need a new capability" is to assemble it from existing domain APIs and vendor integrations behind a Suite-owned interface — not to build net-new. Reserve building from scratch for capabilities that are a genuine competitive differentiator.

**For Billing and Payments specifically:**

- Vendor integrations (payment processors, identity providers) are abstracted behind Suite-owned interfaces so vendors can be replaced without touching MFEs or domain APIs
- The organization is moving toward [build/assemble over buy](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#build-vs-buy-vs-assemble); this does not mean building commodity capabilities — it means owning the integration layer and avoiding [lock-in](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#vendor-lock-in)

**Watch out for:** A vendor SDK called directly from a micro frontend or domain API. Replacing that vendor becomes a rewrite.

---

### P7 — Caching Is a Strategy, Not an Afterthought

Decoupling the UI from the domain API introduces latency that must be managed deliberately. The BFF layer is the right place to implement caching strategy — not the MFE, and not the domain API.

**In Billing and Payments context:**

- Domain APIs in their current state carry known performance constraints; the BFF caching layer is an opportunity to mask that latency from users while APIs mature
- Caching strategy should be designed alongside the BFF contract, not bolted on after performance complaints
- Cache invalidation rules are owned by the BFF team — they know the staleness tolerance of each screen

**Watch out for:** A micro frontend that polls a domain API directly to work around slow response times. The fix is BFF-level caching, not a bypass.

---

### P8 — Observability Is Non-Negotiable

You cannot debug a distributed system you cannot observe. Every service emits [structured logs](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#structured-logs) with [correlation IDs](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#correlation-id--request-id) to `stdout` — not to files. Every request is traceable from the MFE through the BFF to each domain API call. Every service exposes a [health endpoint](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#health-endpoint).

**Why this matters here:** When a payment fails, the question "where did it fail?" must be answerable in minutes from logs and traces — not from a cross-team investigation. Correlation IDs propagated from the BFF through all downstream calls are the mechanism.

**Watch out for:** A service that logs free-form text, writes logs to disk files, omits correlation IDs, or has no health endpoint. These are the services that are impossible to diagnose at 2am.

---

## Engineering Principles

### E1 — Contract Before Code

The API schema is written, reviewed, and agreed upon before implementation begins. This is not bureaucracy — it is the artifact that lets frontend and backend teams work in parallel without stepping on each other.

**In practice:** A BFF contract defined on Monday lets the MFE team build against a mock and the domain team implement the real thing simultaneously. Integration is the final step, not the starting gate.

---

### E2 — Domain Data Stays Domain Data; Screen Data Stays in the BFF

Services return domain data — normalized, business-accurate, and reusable by any consumer. Screens consume BFF data — shaped, filtered, and projected to exactly what the UI needs.

A billing summary card on mobile and a full billing detail page on web call the same domain API. The BFF for each surface shapes the response differently. The domain API changes for neither.

---

### E3 — Fail Gracefully, Not Silently

If the payments service is unavailable, the billing micro frontend still loads and shows bill information. It does not crash. It does not show a blank screen. It shows the data it has and clearly communicates what it cannot show.

[Circuit breakers](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#circuit-breaker) at the BFF layer prevent cascading failures. Structured error responses from domain services give the BFF enough information to degrade gracefully. MFEs handle partial failures at the component level — one broken widget does not take down the page.

---

### E4 — Authentication Is the Shell's Job; Authorization Is Everyone's Job

The [shell/container application](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#shell--container-application) handles [authentication](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#authentication-vs-authorization) — it obtains tokens and injects them into MFEs on initialization. MFEs do not manage auth sessions.

Authorization — validating that a caller is permitted to take a specific action — is the responsibility of every layer independently. The BFF validates the token before any downstream call. Domain APIs validate on inbound service-to-service calls. No layer trusts a caller simply because it came from inside the network.

---

### E5 — Versioning Starts on Day One

Every API is [versioned](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#versioning-api-versioning) from its first release. Breaking changes get a new version — not a silent modification. Consumers receive minimum 90 days notice before an old version is removed.

In Billing and Payments, a silent breaking change to a payment API endpoint can affect multiple MFEs, partner integrations, and internal tools simultaneously. Versioning is not optional overhead; it is the mechanism that makes independent deployability safe.

---

### E6 — Security at Every Boundary

- All traffic is [TLS](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#tls-transport-layer-security)-encrypted — including service-to-service calls that never touch the public internet
- Auth tokens are validated at the BFF before any downstream call is made; domain APIs validate on inbound service calls
- [Rate limiting](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#rate-limiting) at the BFF layer protects domain services from abuse and prevents payment endpoints from being a direct attack surface
- Payment card data (PAN, CVV, expiry) never passes through the BFF or MFEs; use PSP-provided tokenization at the point of entry; handle only masked references thereafter
- All deployment-varying config (service URLs, credentials, feature flags, hostnames) lives in environment variables — not hardcoded in source code, not in checked-in config files. This applies to BFFs and domain APIs equally, not just the frontend
- No secrets in frontend code — the BFF manages credentials for downstream services

---

### E7 — Share Vocabulary; Prevent Architectural Drift

"Headless" is not "API-first." "Decoupled" does not mean "microservices." "BFF" is not a generic API gateway. Using these terms loosely in design conversations leads to systems that loosely implement the ideas — which means they don't actually achieve the benefits.

When someone uses a term imprecisely in a design review, correct it. Vocabulary discipline is an engineering discipline.

---

### E8 — Style Isolation Is Mandatory

Every micro frontend scopes its CSS so that styles cannot leak into the shell or other MFEs. Use framework-native encapsulation (Angular view encapsulation, Vue scoped styles) or CSS Modules. Unscoped global selectors in an MFE are caught in code review — they are not a style preference, they are an architectural violation.

Billing and Payments MFEs are composed on the same page. A leaked style from the bills MFE affecting the payment form is not a cosmetic bug — it is a team isolation failure.

---

### E9 — Technology Alignment, Not Technology Anarchy

Teams choose their frontend framework from an approved list — not from personal preference. Every additional framework in the ecosystem adds hiring complexity, maintenance burden, and friction for shared tooling and design systems.

New technology additions to the approved list require documented rationale and architecture review. Mixing technologies is acceptable during a deliberate migration — not as a standing operating mode.

---

### E10 — Harvest Shared Components; Never Speculate Them Into Existence

Do not create a shared component library before real usage data exists. Build components within each team's own codebase first. When the same pattern stabilizes across multiple MFEs, harvest it into the shared library.

Shared components contain only UI logic — never business rules or domain data. The payment methods component is an example: it demonstrated the pattern in production before becoming a reference for other teams.

---

### E11 — Each Team Owns Its Own Quality

Each MFE has its own unit tests, integration tests, and consumer-driven contract tests. End-to-end tests across MFEs are kept minimal — they are slow, brittle, and expensive. The test pyramid applies.

A team cannot rely on another team's test suite to validate their own behavior. Independent deployability requires independent quality gates.

---

## The Standard We Hold Each Other To

These principles are not aspirational statements on a wall. They are the lens through which we review designs, conduct code reviews, and make architectural decisions.

When a design violates a principle, the right response is not to update the principle — it is to understand whether the design needs to change or whether the team has discovered a legitimate exception that the principle should account for. In either case, the exception is documented, not silently absorbed.

> **"If our engineers aren't finding success on their own, it's not their fault. It's our fault."**
> — Jeff Atwood, [Falling Into the Pit of Success](https://blog.codinghorror.com/falling-into-the-pit-of-success/)

The job of architecture and engineering leadership is to make the right path the obvious path.
