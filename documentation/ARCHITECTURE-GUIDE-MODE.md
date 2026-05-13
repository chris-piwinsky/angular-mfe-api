# Architecture Guide Mode — Prompt 11 Complete ✅

The Billing Portal now includes an **Architecture Insights Panel** that narrates architectural decisions in real-time as users interact with the app.

---

## What Was Built

### STEP 1 — BFF: `x-arch-note` Response Headers

**Modified files:**
- [`apps/web-bff/src/routes/bills.ts`](../apps/web-bff/src/routes/bills.ts)
- [`apps/web-bff/src/routes/payments.ts`](../apps/web-bff/src/routes/payments.ts)
- [`apps/web-bff/src/middleware/auth.ts`](../apps/web-bff/src/middleware/auth.ts)

Every successful BFF response now includes an `x-arch-note` header with format:
```
PRINCIPLE_CODE:EVENT_ID|human description
```

**Header mappings:**

| Route | Scenario | Header Value |
|---|---|---|
| `GET /api/bills` | Success | `A3:BFF-PROXY\|bills-api proxied; MFE never calls domain APIs directly` |
| `GET /api/bills/:id` | Success (both APIs) | `E3:BFF-AGGREGATE\|1 BFF call → bills-api + payments-api merged into single response` |
| `GET /api/bills/:id` | Payments-api degraded | `E5:GRACEFUL-DEGRADE\|payments-api unavailable; returned payments:[] without failing the bill response` |
| `POST /api/payments` | Balance validation (422) | `A3:BALANCE-GUARD\|amount <= balance validated at BFF; payments-api never received an invalid amount` |
| `POST /api/payments` | Success (201) | `A3:BFF-PROXY\|payment validated and proxied; domain API did not re-validate business rules` |
| Any route | Auth failure (401) | `E4:AUTH-BOUNDARY\|token validated at BFF; downstream services never received an unauthenticated call` |

**Not included:** `/health` endpoint (excluded per prompt specification)

---

### STEP 2 — MFE Interceptors: Read Headers & Emit Events

**New files:**
- [`apps/bills-mfe/src/app/arch-note.interceptor.ts`](../apps/bills-mfe/src/app/arch-note.interceptor.ts)
- [`apps/payment-mfe/src/app/arch-note.interceptor.ts`](../apps/payment-mfe/src/app/arch-note.interceptor.ts)

**Modified files:**
- [`apps/bills-mfe/src/app/app.config.ts`](../apps/bills-mfe/src/app/app.config.ts) — registered `archNoteInterceptor`
- [`apps/payment-mfe/src/app/app.config.ts`](../apps/payment-mfe/src/app/app.config.ts) — registered `archNoteInterceptor`

**How it works:**
1. HTTP interceptor reads `x-arch-note` header from every BFF response
2. Parses `code` and `description` (split on `|`)
3. Dispatches `window.dispatchEvent(new CustomEvent('suite:arch:event', { detail: { code, description, requestId, timestamp, layer: 'bff' } }))`
4. Pure side-effect — does not modify request or response

**Implementation detail:** Uses `event.type === 4` to detect `HttpResponse` events

---

### STEP 3 — shell-app: Service, Component, and Event Listeners

**New files:**
- [`apps/shell-app/src/app/arch-insights/arch-event.interface.ts`](../apps/shell-app/src/app/arch-insights/arch-event.interface.ts)
- [`apps/shell-app/src/app/arch-insights/architecture-insights.service.ts`](../apps/shell-app/src/app/arch-insights/architecture-insights.service.ts)
- [`apps/shell-app/src/app/arch-insights/architecture-insights.component.ts`](../apps/shell-app/src/app/arch-insights/architecture-insights.component.ts)

**Modified files:**
- [`apps/shell-app/src/app/app.ts`](../apps/shell-app/src/app/app.ts) — added event listeners, synthetic events
- [`apps/shell-app/src/app/app.html`](../apps/shell-app/src/app/app.html) — added toggle button and component
- [`apps/shell-app/src/app/app.css`](../apps/shell-app/src/app/app.css) — styled toggle button

#### ArchitectureInsightsService

**State:**
- `events: Signal<ArchEvent[]>` — last 8 events, newest first
- `active: Signal<boolean>` — panel visibility (default: false)

**Methods:**
- `toggle(): void` — flip panel visibility
- `push(event: ArchEvent): void` — prepend event, trim to 8
- `getPrincipleMetadata(code: string)` — returns principle name and standards doc anchor

**Principle mappings:**
```typescript
A2 → "BFF Per Surface, Not Per Service"
A3 → "Frontends Call the BFF. Only the BFF."
A9 → "Inter-MFE Communication via CustomEvents"
E3 → "Data at the Right Granularity"
E4 → "Authentication Is Centralized, Authorization Is Distributed"
E5 → "Fail Gracefully, Not Silently"
E8 → "Vocabulary Discipline"
```

#### ArchitectureInsightsComponent

**Visual design:**
- Fixed sidebar panel on right edge, 300px wide
- Shown only when `insightsService.active() === true`
- Dark theme (`#1e1e1e` background, `#e0e0e0` text)
- Header with "Architecture Insights" title and close (×) button
- Event cards with:
  - Layer badge (color-coded: mfe=blue, bff=green, domain=orange)
  - Principle code (e.g., `A3:BFF-PROXY`)
  - Description text
  - Principle name below code
  - Link to standards doc anchor
  - Request ID (truncated to 12 chars)
  - Relative timestamp ("just now", "3s ago", "5m ago")
- Empty state: "Interact with the app to see architecture events."

**Toggle button:**
- "⚡ Arch" button in shell header (right side of nav bar)
- Styled with purple background (`#6366f1`)
- Calls `insightsService.toggle()` on click

---

### STEP 4 — Synthetic Architecture Events

**Shell-app AppComponent** now pushes synthetic events for three key interactions:

1. **On initial load (`ngOnInit`):**
   ```
   A2:MODULE-FED | shell loaded: bills-mfe and payment-mfe resolved at runtime 
                   via loadRemoteModule() — not npm dependencies
   ```

2. **When `suite:navigate:pay` event fires:**
   ```
   A9:MFE-EVENT | bills-mfe dispatched suite:navigate:pay via CustomEvent — 
                  MFEs never import each other directly
   ```

3. **When `suite:payment:submitted` event fires:**
   ```
   A9:MFE-EVENT | payment-mfe dispatched suite:payment:submitted — 
                  shell refreshing overdue count without a full reload
   ```

**Lifecycle:**
- Event listeners added in `ngOnInit`
- Removed in `ngOnDestroy` (proper cleanup)

---

## Architecture Principles Demonstrated

| Code | Principle | Event Trigger |
|---|---|---|
| **A2** | BFF Per Surface, Not Per Service | Shell initial load |
| **A3** | Frontends Call the BFF. Only the BFF. | Every BFF proxy or validation |
| **A9** | Inter-MFE Communication | MFE CustomEvents |
| **E3** | Data at the Right Granularity | BFF aggregation |
| **E4** | Auth Centralized, Authorization Distributed | BFF auth boundary |
| **E5** | Fail Gracefully, Not Silently | payments-api graceful degradation |

---

## How To Use

1. **Start the full stack:**
   ```bash
   cd billing-portal
   
   # Terminal 1: Domain APIs
   npx nx run-many -t serve --projects=bills-api,payments-api
   
   # Terminal 2: BFF
   npx nx serve web-bff
   
   # Terminal 3: Shell + MFEs
   npx nx serve shell-app --devRemotes=bills-mfe,payment-mfe
   ```

2. **Open the app:** http://localhost:4200

3. **Click "⚡ Arch" button** in the top-right header

4. **Interact with the app:**
   - View bills list → see `A3:BFF-PROXY` event
   - Click a bill row → see `E3:BFF-AGGREGATE` event (or `E5:GRACEFUL-DEGRADE` if payments-api is down)
   - Click "Pay Now" → see `A9:MFE-EVENT` for navigation
   - Submit a payment → see `A3:BALANCE-GUARD` (if amount too high) or `A3:BFF-PROXY` (success)
   - After payment succeeds → see `A9:MFE-EVENT` for overdue count refresh

5. **Click principle codes** in events to view the full standards doc

---

## Key Implementation Patterns

### HTTP Interceptor for Side-Effects Only
```typescript
export const archNoteInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    tap((event) => {
      if (event.type === 4) {  // HttpResponse
        const archNote = event.headers.get('x-arch-note');
        if (archNote) {
          // Parse and emit CustomEvent
        }
      }
    })
  );
};
```

**Why this pattern:**
- No mutation of request or response
- Passive observer — other interceptors (like `archGuardInterceptor`) can coexist
- Angular automatically handles cleanup on subscription teardown

### Signal-Based State Management
```typescript
readonly events = signal<ArchEvent[]>([]);
push(event: ArchEvent): void {
  this.events.update((current) => [event, ...current].slice(0, 8));
}
```

**Why signals:**
- Automatic change detection
- No need for `ChangeDetectorRef.markForCheck()`
- Cleaner than `BehaviorSubject` for simple state

### CustomEvent for Cross-MFE Communication
```typescript
window.dispatchEvent(new CustomEvent('suite:arch:event', { detail: event }));
```

**Why CustomEvent:**
- MFEs remain decoupled (no imports)
- Shell acts as orchestrator
- Standard browser API — no framework lock-in

---

## Testing Considerations

**BFF tests:** Headers are metadata — existing tests don't break. Headers can be verified with:
```typescript
expect(res.headers['x-arch-note']).toBe('A3:BFF-PROXY|...');
```

**MFE tests:** Interceptor is a side-effect that doesn't affect component behavior. Can be tested in isolation:
```typescript
const event = new CustomEvent('suite:arch:event', { detail: ... });
expect(lastDispatchedEvent.detail.code).toBe('A3:BFF-PROXY');
```

**Integration tests:** End-to-end tests can verify panel opens, events appear, and principle links work.

---

## Future Enhancements (Not In Scope)

- **Export events:** Download JSON log of architecture decisions
- **Filter by layer:** Show only MFE, BFF, or domain events
- **Pause/play:** Freeze event stream while inspecting
- **Timeline view:** Visual timeline with event grouping
- **Dark/light theme toggle:** User preference
- **Persistence:** Store last 50 events in localStorage

---

## Documentation Links

- [Suite Architecture Standards](./suite-architecture-standards.md) — Full principles reference
- [Principles](./principles.md) — Engineering philosophy
- [Definitions](./definitions.md) — Vocabulary reference

---

**Next Prompt:** Prompt 12 (details in `sample-app-prompts.md`)
