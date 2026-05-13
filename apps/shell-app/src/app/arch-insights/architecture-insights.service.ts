import { Injectable, signal } from '@angular/core';
import { ArchEvent } from './arch-event.interface';

/**
 * Manages architecture events for the Architecture Insights Panel.
 * Tracks last 8 events, newest first.
 */
@Injectable({ providedIn: 'root' })
export class ArchitectureInsightsService {
  /** Last 8 architecture events, newest first */
  readonly events = signal<ArchEvent[]>([]);

  /** Whether the insights panel is visible */
  readonly active = signal<boolean>(false);

  /** Mapping of principle codes to their full names and standards doc anchors */
  readonly PRINCIPLE_ANCHORS = {
    A2: {
      name: 'BFF Per Surface, Not Per Service',
      anchor: '../suite-architecture-standards.md#a2',
    },
    A3: {
      name: 'Frontends Call the BFF. Only the BFF.',
      anchor: '../suite-architecture-standards.md#a3',
    },
    A9: {
      name: 'Inter-MFE Communication via CustomEvents',
      anchor: '../suite-architecture-standards.md#a9',
    },
    E3: {
      name: 'Data at the Right Granularity',
      anchor: '../suite-architecture-standards.md#e3',
    },
    E4: {
      name: 'Authentication Is Centralized, Authorization Is Distributed',
      anchor: '../suite-architecture-standards.md#e4',
    },
    E5: {
      name: 'Fail Gracefully, Not Silently',
      anchor: '../suite-architecture-standards.md#e5',
    },
    E8: {
      name: 'Vocabulary Discipline',
      anchor: '../suite-architecture-standards.md#e8',
    },
  };

  /** Toggle panel visibility */
  toggle(): void {
    this.active.update((current) => !current);
  }

  /** Add event to the front of the list, trim to 8 most recent */
  push(event: ArchEvent): void {
    this.events.update((current) => [event, ...current].slice(0, 8));
  }

  /** Get principle metadata by code (e.g., 'A3') */
  getPrincipleMetadata(code: string): { name: string; anchor: string } | null {
    const principleCode = code.split(':')[0] as keyof typeof this.PRINCIPLE_ANCHORS;
    return this.PRINCIPLE_ANCHORS[principleCode] || null;
  }
}
