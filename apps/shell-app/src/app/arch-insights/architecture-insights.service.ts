import { Injectable, signal } from '@angular/core';
import { ArchEvent } from './arch-event.interface';
import { STANDARDS_CONFIG } from '../architecture-standards/standards.config';

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

  private readonly standardsByCode = new Map(
    STANDARDS_CONFIG.map((standard) => [
      standard.code,
      {
        name: standard.title,
        anchor: `/architecture/standards#${standard.anchor}`,
      },
    ]),
  );

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
    const principleCode = code.split(':')[0];
    return this.standardsByCode.get(principleCode) ?? null;
  }
}
