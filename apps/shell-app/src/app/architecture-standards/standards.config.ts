export interface StandardSection {
  code: string;
  title: string;
  anchor: string;
  order: number;
  summary: string;
}

export const STANDARDS_CONFIG: StandardSection[] = [
  {
    code: 'A1',
    title: 'API-First, Always',
    anchor: 'a1',
    order: 1,
    summary:
      'Every feature of every domain service must be accessible via a documented API endpoint before any UI is built against it. Schema-first design (OpenAPI or GraphQL SDL) is required. Code is an implementation of the contract, not the source of truth.',
  },
  {
    code: 'A2',
    title: 'BFF Per Surface, Not Per Service',
    anchor: 'a2',
    order: 2,
    summary:
      'One BFF instance serves one frontend surface type. Do not create a BFF per downstream service and do not build one BFF for all surfaces.',
  },
  {
    code: 'A3',
    title: 'Frontends Call the BFF. Only the BFF.',
    anchor: 'a3',
    order: 3,
    summary:
      'No micro frontend makes direct calls to domain APIs. The BFF is the only network boundary the frontend crosses.',
  },
  {
    code: 'A4',
    title: 'Loose Coupling, Explicit Contracts',
    anchor: 'a4',
    order: 4,
    summary:
      'Services communicate through versioned, documented API contracts. When a contract changes, version it instead of silently breaking consumers.',
  },
  {
    code: 'A5',
    title: 'Independent Deployability',
    anchor: 'a5',
    order: 5,
    summary:
      'Each micro frontend, BFF, and domain service must be deployable independently without coordinated cross-layer releases.',
  },
  {
    code: 'A6',
    title: 'Composable by Default',
    anchor: 'a6',
    order: 6,
    summary:
      'Prefer assembling functionality from purpose-built domain APIs over building bespoke backend logic.',
  },
  {
    code: 'A7',
    title: 'No Vendor Lock-in at the Architecture Level',
    anchor: 'a7',
    order: 7,
    summary:
      'Vendor-specific APIs must be abstracted behind Suite-owned interfaces so replacement is contained to adapter layers.',
  },
  {
    code: 'A8',
    title: 'Observability Is Not Optional',
    anchor: 'a8',
    order: 8,
    summary:
      'Every layer emits structured logs, distributed traces, and health/readiness endpoints.',
  },
  {
    code: 'A9',
    title: 'Teams Own Vertical Slices, Not Horizontal Layers',
    anchor: 'a9',
    order: 9,
    summary:
      'Team boundaries follow business domain capabilities, not technical disciplines.',
  },
  {
    code: 'E1',
    title: 'Contract Before Code',
    anchor: 'e1',
    order: 10,
    summary:
      'API design is written, reviewed, and approved before implementation begins.',
  },
  {
    code: 'E2',
    title: 'Backend and Frontend Develop in Parallel',
    anchor: 'e2',
    order: 11,
    summary:
      'Once the BFF contract is established, frontend and backend can build in parallel.',
  },
  {
    code: 'E3',
    title: 'Data at the Right Granularity',
    anchor: 'e3',
    order: 12,
    summary:
      'BFFs request only required data and domain APIs return only what is asked for.',
  },
  {
    code: 'E4',
    title: 'Authentication Is Centralized, Authorization Is Distributed',
    anchor: 'e4',
    order: 13,
    summary:
      'Tokens are issued centrally, but every layer validates and enforces authorization independently.',
  },
  {
    code: 'E5',
    title: 'Fail Gracefully, Not Silently',
    anchor: 'e5',
    order: 14,
    summary:
      'BFFs implement fallback behavior and domain services return structured error responses.',
  },
  {
    code: 'E6',
    title: 'Versioning Is a First-Class Concern',
    anchor: 'e6',
    order: 15,
    summary:
      'All APIs are versioned from day one; breaking changes require a new version.',
  },
  {
    code: 'E7',
    title: 'Security at Every Boundary',
    anchor: 'e7',
    order: 16,
    summary:
      'Enforce TLS, token validation, boundary checks, and least-privilege data handling at every layer.',
  },
  {
    code: 'E8',
    title: 'Vocabulary Discipline',
    anchor: 'e8',
    order: 17,
    summary: 'Teams align on precise terms to prevent architectural drift.',
  },
  {
    code: 'E9',
    title: 'Style Isolation Is Mandatory',
    anchor: 'e9',
    order: 18,
    summary:
      'Every micro frontend must scope CSS to avoid leaking styles into other MFEs or the shell.',
  },
  {
    code: 'E10',
    title: 'Technology Alignment Over Technology Anarchy',
    anchor: 'e10',
    order: 19,
    summary:
      'Teams can choose from an approved frontend set; avoid uncontrolled stack fragmentation.',
  },
  {
    code: 'E11',
    title: 'Shared Components Are Harvested, Not Designed Upfront',
    anchor: 'e11',
    order: 20,
    summary:
      'Harvest shared components after real usage patterns emerge; do not over-centralize too early.',
  },
  {
    code: 'E12',
    title: 'Each Micro Frontend Has Its Own Test Suite',
    anchor: 'e12',
    order: 21,
    summary:
      'Each micro frontend maintains unit and integration tests, with minimal end-to-end coverage.',
  },
];
