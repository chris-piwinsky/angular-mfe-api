# Definitions & Vocabulary Guide

**Purpose:** Plain-English definitions for every term used in the Suite Architecture Standards. Use this as a reference when reading the standards document or participating in architecture conversations.

---

## How to Use This Guide

Terms are grouped by theme. Within each group, they are ordered from most fundamental to most specific. If a term refers to another term in this guide, it is written in **bold**.

---

## 1. The Big Picture

### Architecture

The deliberate set of decisions about how a software system is structured — what the major pieces are, how they connect, who owns what, and what rules govern the whole. Architecture is not a single document; it is the sum of consequential design decisions made over time. Good architecture makes the right decisions easy and the wrong decisions hard.

### Pit of Success

A design philosophy: a well-structured system should make it easy to do the right thing and genuinely difficult to do the wrong thing. Named after the idea that you should be able to "fall into" correct behavior without heroic effort. The standards document is built around this principle — guardrails, contracts, and anti-patterns are the mechanisms that create the pit.

### Standards (Architecture Standards)

Agreed-upon rules and principles that guide how teams build systems. They exist to prevent each team from solving the same problems differently, creating a fragmented and expensive-to-maintain ecosystem. Standards are guardrails, not handcuffs — they define the boundaries of acceptable decisions, not every detail of implementation.

### Guardrail

A rule or mechanism that prevents a harmful decision. Like a highway guardrail: it doesn't tell you where to drive, it stops you from going off a cliff. In software, guardrails can be code (interceptors, linters), process (contract review), or standards (this document).

### Anti-Pattern

A common approach that seems reasonable but causes harm. Anti-patterns are documented not because teams are careless, but because the harm is often not obvious until much later. Knowing the name of an anti-pattern lets teams recognize and reject it quickly.

### Monolith / Monolithic System

A single, large, tightly connected system where all functionality is bundled together. Monoliths are not inherently bad, but they become a problem at scale: changing one part risks breaking others, teams step on each other, and the whole system must be released together. The architecture in the standards document is a deliberate alternative to the monolith.

---

## 2. The Three Layers

### Micro Frontend (MFE)

A small, independently owned and deployed piece of the user interface. Instead of one giant front-end application that every team contributes to (a monolith), the screen is composed of multiple smaller applications — one per business domain — that appear seamless to the user. Each piece is owned end-to-end by a single team: they build it, test it, and deploy it without waiting for other teams.

**Analogy:** Think of a dashboard made of independent widgets. The billing widget is owned by the billing team; the payments widget is owned by the payments team. Each can be updated independently without touching the others.

### Shell / Container Application

The host application that holds all the micro frontends together. It owns the common chrome — the header, footer, navigation — and handles authentication. It decides which micro frontend to show based on the URL. It is intentionally thin: all real business functionality lives in the micro frontends it hosts, not in the shell itself.

**Analogy:** A picture frame. The frame defines the border and hangs on the wall, but the picture inside can be swapped without changing the frame.

### Backend for Frontend (BFF)

A small server-side component that sits between a micro frontend and the back-end services. It is purpose-built for one specific front-end experience (web, mobile, partner). It handles authentication, combines data from multiple back-end services into a single response, and shapes that response to exactly what the screen needs — no more, no less. It is owned by the same team that owns the front end it serves.

**Analogy:** A personal shopper. The shopper (BFF) knows exactly what you need, goes to multiple stores (back-end services), and brings back exactly the right items assembled the way you want them. You never have to deal with the individual stores directly.

**Key rule:** If logic exists only because this specific UI needs it, it belongs in the BFF. If the logic would be useful to any consumer, it belongs in the domain service.

**BFF is a pattern, not a technology.** The implementation can take several forms depending on team context and surface requirements:

- **REST API (Express/TypeScript, Go, Java)** — purpose-built HTTP endpoints, one per screen or interaction type. Simple to reason about; response shape is explicit in the code. This is the form used in the Billing Portal sample app.
- **GraphQL server (Apollo Server)** — the schema becomes the contract; resolvers do the aggregation. Well-suited when multiple surfaces (web, mobile, partner) need meaningfully different field selections from the same underlying domain data. Auth, correlation IDs, and the PCI scope boundary still live here — the technology changes, the responsibilities do not.

The choice of technology does not change the BFF's responsibilities: authenticate the caller, aggregate domain data, shape the response for this surface, enforce the security boundary, propagate the correlation ID.

### Headless API / Domain API / Domain Service

A back-end service that owns a specific business domain — bills, payments, identity, content. It exposes all its capabilities through a documented, versioned interface (API) and has no opinion about which front end consumes it. The same service can power a web app, a mobile app, a partner integration, or a kiosk without modification.

**"Headless"** means the service has no built-in user interface ("head"). The UI is always someone else's responsibility. This is the opposite of traditional systems where the UI and back end were designed and deployed together as one thing.

**Analogy:** A kitchen in a restaurant. The kitchen (domain service) produces food (data) according to standardized recipes (API). It doesn't care whether the food goes to the dining room, a takeout bag, or a delivery driver — that's the front-of-house's job.

---

## 3. API Concepts

### API (Application Programming Interface)

A defined, documented way for one software system to ask another for something. An API specifies: what you can ask for, how to ask for it, and what you will get back. It is a contract between systems, not a user interface.

**Analogy:** A restaurant menu. The menu tells you what is available, how to order it, and what you will receive. You don't need to know how the kitchen works to use the menu.

### API-First

A discipline where the API contract (what the service can do and how to call it) is designed, written down, and agreed upon _before_ any code is written. This allows front-end and back-end teams to work in parallel: the front end builds against a mock of the contract while the back end implements it. The contract is the shared agreement; the code is just one implementation of it.

### REST / REST API

The most common style of API. REST uses standard web conventions — URLs identify resources (e.g., `/bills/123`), and standard verbs (`GET`, `POST`, `PUT`, `DELETE`) describe what to do with them. It is widely understood and supported by essentially every technology stack.

### GraphQL

An alternative API style where the caller specifies exactly which fields they want in the response, rather than receiving a fixed response shape. Useful when different consumers need different subsets of the same data. More flexible than REST but more complex to implement and govern.

### OpenAPI / OpenAPI Schema

A standard format for writing down (documenting) what a REST API does — its endpoints, inputs, outputs, and error codes. An OpenAPI schema is machine-readable, which means tools can automatically generate documentation, test stubs, and client code from it. In an API-First approach, the OpenAPI schema is written first, before implementation begins.

### API Contract

The agreed-upon definition of what an API does: its inputs, outputs, error responses, and versioning rules. A contract is a binding agreement between the team that produces the API and the teams that consume it. Breaking a contract without notice is a violation of the standards.

### Versioning (API Versioning)

The practice of giving each major revision of an API a distinct identifier (e.g., `/v1/`, `/v2/`) so that existing consumers are not broken when the API changes. Old versions are supported for a defined period (minimum 90 days notice before removal) so consumers have time to migrate.

### Schema / Schema-First

A schema is a formal description of the structure of data — what fields exist, what types they are, what is required. "Schema-first" means the schema is agreed upon before any code is written, establishing the contract that both sides build toward.

### Omnichannel

Delivering the same business capability (content, data, transactions) consistently across multiple channels — web, mobile, kiosk, partner integrations — from a single back-end source. A headless API architecture enables omnichannel delivery because the back end has no opinion about which channel it is serving.

---

## 4. Team & Organization Concepts

### Vertical Domain Slice / Vertical Team

A team organized around a complete business capability — owning the database, API, and UI for their domain end-to-end. A vertical team can design, build, test, and deploy their part of the product without waiting for other teams. This is the team structure the standards prescribe.

**Example:** The billing team owns the bills domain API, the bills BFF, and the bills micro frontend. They can deploy any of these independently.

### Horizontal Technical Team

A team organized around a technical discipline rather than a business domain — e.g., a "styling team," a "forms team," or a "shared API team." The standards explicitly discourage this structure because it creates bottlenecks: every domain team must wait for the horizontal team whenever they need styling, forms, or API changes. This recreates the coordination overhead of a monolith.

### Conway's Law

Coined by computer scientist Melvin Conway in 1968: _"organizations which design systems are constrained to produce designs which are copies of the communication structures of these organizations."_ In plain English: your software will look like your org chart. If your teams are siloed, your systems will be siloed. If your teams are fragmented, your systems will be fragmented.

### Inverse Conway Maneuver

The deliberate practice of designing your team structure to match the architecture you want — rather than letting your existing org structure accidentally determine your system shape. The standards prescribe vertical domain teams _because_ that is the team structure that produces independently deployable, loosely coupled services.

### Independent Deployability

The ability of a team to release their component (micro frontend, BFF, domain service) to production without coordinating with other teams or scheduling a joint release. This is a key property of the architecture. If two teams must release together, there is a coupling problem to be solved — not a release process to be managed.

### CI/CD Pipeline (Continuous Integration / Continuous Delivery)

An automated assembly line for software: every time code is changed, the pipeline automatically builds it, runs tests against it, and (if everything passes) deploys it to production. Each micro frontend must have its own pipeline, independent of other micro frontends' pipelines.

---

## 5. Composability & Build Decisions

### Composable Architecture

An approach where a product is assembled from independent, purpose-built services rather than built as a single monolithic system. Each service does one thing well; the product is the composition of many such services. Sometimes described as MACH architecture.

### 12-Factor App

A methodology for building software-as-a-service applications that are portable, resilient, and scalable. Published at [12factor.net](https://12factor.net/). The twelve factors cover: codebase management, dependency isolation, config in environment variables, treating backing services as attached resources, separating build/release/run stages, stateless processes, port binding, horizontal scaling, fast startup and graceful shutdown, dev/prod parity, treating logs as event streams, and running admin tasks as one-off processes. The methodology underpins what "cloud-native" means in the MACH definition — services that follow these factors are portable across infrastructure without code changes.

### MACH

An acronym for a set of architectural principles: **M**icroservices, **A**PI-first, **C**loud-native, **H**eadless. MACH describes a category of modern software platforms built on composable, independently deployable services.

**A note on "cloud-native":** In MACH, cloud-native means _designed for cloud deployment patterns_ — containerized, horizontally scalable, stateless, following [12-factor app](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#12-factor-app) principles. It does not mean deep coupling to a specific cloud provider's proprietary services. There is an important distinction:

- **Cloud-portable:** Containerized and stateless; works on any cloud provider or on-prem. This is what MACH intends.
- **Cloud-coupled:** Built directly on proprietary managed services (e.g., calling AWS SDK directly from business logic) in a way that makes switching providers a rewrite.

Using cloud provider services is not the problem — the problem is coupling to them without an abstraction layer. A queue backed by SQS today that could be swapped for Azure Service Bus tomorrow without touching application code is cloud-native. An application that would require significant rewrite to move providers is not. Abstracting provider-specific services behind Suite-owned interfaces is how you stay cloud-native while avoiding lock-in.

### Build vs. Buy vs. Assemble

The three options when a new capability is needed:

- **Build:** Write it from scratch. Reserve for genuine competitive differentiators that no vendor can match.
- **Buy:** License a vendor's product (SaaS). Appropriate for commodity capabilities (payments processing, identity, email). Always abstract the vendor behind a Suite-owned interface so the vendor can be replaced later.
- **Assemble:** Wire together existing domain APIs and/or vendor integrations into a new capability. The preferred default — avoids reinventing what already exists while keeping the system composable.

### SaaS (Software as a Service)

A software product delivered over the internet and licensed on a subscription basis — the vendor hosts and maintains it; you use it via an API or UI. Examples: Stripe (payments), Auth0 (identity), Salesforce (CRM).

### Vendor Lock-in

The condition where a system is so tightly coupled to a specific vendor's technology that replacing the vendor would require rewriting large parts of the system. The standards require all vendor integrations to be abstracted behind Suite-owned interfaces to prevent lock-in.

---

## 6. Authentication & Security

### Authentication vs. Authorization

Two different concepts often confused:

- **Authentication:** Proving who you are. ("Are you who you claim to be?") — handled by logging in with credentials and receiving a token.
- **Authorization:** Proving what you are allowed to do. ("Are you permitted to take this action?") — handled at each service layer independently.

### Token / Auth Token

A digitally signed piece of data issued by an identity service after successful login. The token proves who the caller is and is passed with every subsequent request. The BFF validates the token on behalf of the micro frontend before making any downstream calls.

### OAuth 2.0 / OIDC

Industry-standard protocols for authentication and authorization. OAuth 2.0 defines how tokens are issued and validated. OIDC (OpenID Connect) adds identity on top of OAuth 2.0. These are the protocols the Suite uses rather than custom authentication implementations.

### JWT (JSON Web Token)

The specific format commonly used for auth tokens. A JWT contains encoded claims (who the user is, what roles they have) and a cryptographic signature that proves the token was issued by a trusted identity service and has not been tampered with.

### TLS (Transport Layer Security)

The encryption protocol that secures data in transit between systems. When a web address starts with `https://`, TLS is in use. The standards require TLS for all traffic, including internal service-to-service communication — not just browser-facing calls.

### Rate Limiting

Controlling how many requests a caller can make to a service within a given time window. Prevents abuse and protects back-end services from being overwhelmed. Applied at the BFF layer so domain services are shielded from direct exposure to the internet.

### PCI DSS (Payment Card Industry Data Security Standard)

The security standard that governs how payment card data (card numbers, CVV codes, expiry dates) must be handled. The Suite's architecture contains PCI scope to the tokenization boundary — card data never passes through the BFF or micro frontends; only masked references (last 4 digits) are handled by Suite-owned systems.

### Tokenization (Payment Tokenization)

The process of replacing sensitive card data with a non-sensitive placeholder (a token) that can be stored and transmitted safely. Provided by payment service providers (e.g., Stripe Elements, Adyen). This is different from auth tokens — payment tokenization is about protecting card numbers.

---

## 7. Reliability & Observability

### Graceful Degradation / Fail Gracefully

The ability of a system to continue functioning — at reduced capability — when one of its components fails, rather than crashing entirely. Example: if the payments service is unavailable, the bills micro frontend still loads and displays bill information; it just cannot show payment history.

### Circuit Breaker

An automated mechanism that detects when a downstream service is failing and stops sending requests to it temporarily, allowing it time to recover. Named after the electrical circuit breaker that trips to prevent damage. Implemented at the BFF layer.

### Observability

The ability to understand what is happening inside a system from the outside, using the data it emits. Three pillars: logs (a record of events), metrics (measurements over time), and traces (the path of a request through multiple services). You cannot diagnose or improve what you cannot observe.

### Structured Logs

Log entries written in a consistent, machine-readable format (usually JSON) rather than free-form text, emitted to `stdout` rather than written to files. Writing to stdout means the execution environment — not the application — is responsible for routing and storing logs. Structured logs can be queried, filtered, and aggregated by monitoring tools to diagnose problems at scale. This is the approach mandated by [12-factor app](https://github.com/chris-piwinsky/angular-mfe-api/blob/main/documentation/definitions.md#12-factor-app) Factor XI.

### Correlation ID / Request ID

A unique identifier attached to a request at the entry point (BFF) and propagated through every downstream service call. When something goes wrong, the correlation ID lets engineers trace the full path of a request across all the services it touched — even across separate systems.

### Distributed Tracing

The practice of tracking the journey of a single request as it flows through multiple services. Each service records when it received and completed its part of the work. Combined traces give a timeline of the entire request, making it possible to find where delays or failures occur in a chain of services.

### Health Endpoint

A dedicated URL on a service that returns a simple status response (e.g., `{ "status": "ok" }`). Monitoring systems call health endpoints continuously to detect when a service goes down, so they can alert teams and route traffic away from unhealthy instances.

---

## 8. Rendering & User Interface Concepts

### CSR (Client-Side Rendering)

The browser downloads a minimal HTML page and JavaScript, then the JavaScript builds and displays the full page in the browser. The server sends code; the browser does the rendering work. Standard for interactive applications.

### SSR (Server-Side Rendering)

The server builds the full HTML page and sends it to the browser ready to display. The browser shows content immediately, before JavaScript loads. Best for content-heavy pages where users benefit from seeing content quickly without waiting for JavaScript.

### Prerendering

Building and storing a fully rendered page at build time, so it can be served instantly as a static file. Appropriate for content that does not change per user or per request — e.g., a public bill format template or a static document.

### Progressive Enhancement

Building a feature starting from a baseline that works for everyone (readable content, accessible HTML), then layering richer behavior on top for users with capable browsers. Meaningful on the document side of the continuum; not applicable to pure transaction applications.

### Documents-to-Applications Continuum

A framework for thinking about what kind of thing a micro frontend is. At one end: pure documents — content that has value even without any interactive behavior (an invoice, a billing history page). At the other end: pure applications — tools that only make sense with behavior (a payment entry form). The position on this continuum determines the right rendering strategy and whether progressive enhancement and SSR apply.

### CSS (Cascading Style Sheets)

The language that controls visual appearance — colors, layout, fonts, spacing — in a web browser. CSS is inherently global by default: a style defined in one place can unintentionally affect other parts of the page. This is why the standards require each micro frontend to scope its styles.

### Style Isolation / Style Scoping

Restricting CSS to apply only within the micro frontend that defines it, preventing styles from leaking into other micro frontends or the shell. Achieved through CSS Modules, framework-native encapsulation (Angular, Vue), or Shadow DOM.

### Shadow DOM

A browser-native mechanism for complete style and DOM isolation. Elements inside a Shadow DOM are invisible to CSS and JavaScript outside it, and vice versa. Used by Web Components to guarantee isolation regardless of the surrounding page.

### WCAG 2.1 AA (Web Content Accessibility Guidelines)

An internationally recognized standard for making web content accessible to people with disabilities — visual, auditory, motor, and cognitive. AA is the middle tier and is the minimum required by the standards. Compliance is verified by the front-end team.

### Core Web Vitals

A set of standardized metrics defined by Google that measure real-world user experience: how fast the page loads, how soon it becomes interactive, and how stable the layout is. Used as a performance budget benchmark.

---

## 9. Module Federation & Composition

### Module Federation / Native Federation

A technical mechanism that allows independently deployed micro frontends to share code at runtime — the shell can load a micro frontend from a separately deployed server and mount it on the page, without bundling everything together at build time. Webpack Module Federation is the original implementation (for React/Vue toolchains). Native Federation is the equivalent for Angular-based toolchains.

### Build-Time Integration

Composing micro frontends by bundling them all together during the build process — the opposite of runtime composition. Avoided in the standards because any change to one micro frontend requires rebuilding and redeploying the entire container, recreating lockstep releases.

### Runtime Composition

Composing micro frontends at the moment the page loads in the browser — the shell fetches and mounts each micro frontend independently from its own deployed location. Enables true independent deployability: each team can release on their own schedule.

### Web Components / Custom Elements

A browser-native standard for defining reusable UI components that work in any framework — React, Angular, Vue, or plain HTML. Used as a cross-framework integration boundary when micro frontends from different technology stacks need to appear on the same page.

---

## 10. Testing Concepts

### Unit Test

A test of a single, isolated piece of logic — one function or component — to verify it behaves correctly on its own. Fast to run; the foundation of the test pyramid.

### Integration Test

A test that verifies two or more components work correctly together. Slower than unit tests; used to validate that a micro frontend correctly calls its BFF contract, for example.

### End-to-End (E2E) Test

A test that simulates a complete user workflow through the full system — browser through BFF through domain APIs. Slow and expensive; kept minimal by design (test pyramid principle).

### Consumer-Driven Contract Test

A test where the consuming team (e.g., the micro frontend) defines the expectations it has of the provider (e.g., the BFF) and that definition becomes a test the provider must pass. Validates integration between systems without requiring both to be deployed and running simultaneously.

### Test Pyramid

A principle for how to allocate testing effort: many fast unit tests at the base, fewer integration tests in the middle, very few slow end-to-end tests at the top. Inverted pyramids (many E2E tests, few unit tests) are slow, brittle, and expensive to maintain.

---

## 11. Async & Event Concepts

### Synchronous vs. Asynchronous Communication

- **Synchronous:** Caller sends a request and waits for a response before continuing. Standard for user-facing API calls.
- **Asynchronous:** Caller sends a message and continues without waiting. The receiver processes the message in its own time. Used for background work, notifications, and domain events between services.

### Domain Event

A message published by a domain service to notify other services that something meaningful happened — e.g., "a payment was completed," "a bill was issued." Consumers subscribe to events they care about and react accordingly. Enables loose coupling between services.

### Message Broker (Kafka, SNS/SQS)

Infrastructure that receives, stores, and delivers messages between services asynchronously. Kafka is a high-throughput, durable event streaming platform. SNS/SQS are Amazon Web Services equivalents. Used for domain events — not for user-facing request/response.

### WebSocket / Server-Sent Events

Mechanisms for a server to push real-time updates to a browser without the browser having to ask repeatedly. Used for notifications, live status updates, and streaming data.

---

## 12. Quick-Reference Glossary

| Term                        | One-Line Definition                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| 12-Factor App               | A methodology for building portable, cloud-native services; underpins what MACH means by "cloud-native"                   |
| API                         | A defined way for one system to request something from another                                                            |
| API-First                   | Design the API contract before writing any code                                                                           |
| Anti-Pattern                | A common approach that causes harm; documented so teams can avoid it                                                      |
| Authentication              | Proving who you are                                                                                                       |
| Authorization               | Proving what you are allowed to do                                                                                        |
| BFF                         | A server-side component purpose-built for one frontend surface                                                            |
| Build vs. Buy vs. Assemble  | Three options for adding a new capability; assemble is the default                                                        |
| CI/CD Pipeline              | Automated build, test, and deploy process for a single component                                                          |
| Circuit Breaker             | Automatically stops calling a failing service to let it recover                                                           |
| Composable                  | Assembled from independent, purpose-built services                                                                        |
| Container / Shell           | The thin host application that composes micro frontends                                                                   |
| Conway's Law                | Org structure determines system structure, whether you plan it or not                                                     |
| Correlation ID              | A unique ID that traces a request across multiple services                                                                |
| CSR                         | Browser builds and renders the page using JavaScript                                                                      |
| Domain API / Domain Service | Back-end service that owns one business domain; no opinion about the UI                                                   |
| Graceful Degradation        | System continues at reduced capability when a component fails                                                             |
| GraphQL                     | API style where the caller specifies exactly which fields to return                                                       |
| Guardrail                   | A rule or mechanism that prevents harmful decisions                                                                       |
| Headless API                | A back-end service with no built-in user interface                                                                        |
| Independent Deployability   | A team can release their component without coordinating with other teams                                                  |
| Inverse Conway Maneuver     | Deliberately design team structure to match the desired architecture                                                      |
| JWT                         | Standard format for auth tokens; digitally signed and tamper-evident                                                      |
| MACH                        | Microservices, API-first, Cloud-native, Headless — cloud-native means cloud-portable patterns, not deep provider coupling |
| MFE                         | Micro Frontend — an independently owned piece of the UI                                                                   |
| Module Federation           | Runtime mechanism for loading independently deployed micro frontends                                                      |
| Monolith                    | A single, tightly bundled system that must be released as one unit                                                        |
| OAuth 2.0 / OIDC            | Industry-standard protocols for authentication and authorization                                                          |
| Observability               | The ability to understand system behavior from the data it emits                                                          |
| Omnichannel                 | Serving web, mobile, partner, and kiosk from a single back-end source                                                     |
| OpenAPI                     | Standard format for documenting a REST API's contract                                                                     |
| PCI DSS                     | Payment card security standard; card data must not pass through BFFs or MFEs                                              |
| Pit of Success              | Design that makes the right decision easy and the wrong decision hard                                                     |
| Progressive Enhancement     | Build a working baseline first; layer richer behavior on top                                                              |
| Rate Limiting               | Capping how many requests a caller can make in a time window                                                              |
| REST                        | Most common API style; uses URLs and standard HTTP verbs                                                                  |
| Schema                      | A formal description of data structure — fields, types, constraints                                                       |
| SSR                         | Server builds the full HTML page before sending it to the browser                                                         |
| TLS                         | Encryption for data in transit; required for all traffic                                                                  |
| Tokenization (payment)      | Replacing sensitive card data with a safe placeholder                                                                     |
| Vendor Lock-in              | System so coupled to a vendor that replacing them requires a rewrite                                                      |
| Versioning                  | Giving API revisions distinct identifiers so consumers are not broken                                                     |
| WCAG 2.1 AA                 | Minimum accessibility standard for web content                                                                            |
| Web Components              | Browser-native standard for framework-agnostic UI components                                                              |
| Vertical Team               | Team organized around a complete business domain end-to-end                                                               |
