import { Component, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArchitectureInsightsService } from './architecture-insights.service';

@Component({
  selector: 'app-architecture-insights',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (insightsService.active()) {
      <aside class="arch-insights-panel">
        <header class="arch-header">
          <h2>Architecture Insights</h2>
          <button
            class="close-btn"
            (click)="insightsService.toggle()"
            aria-label="Close Architecture Insights"
          >
            ×
          </button>
        </header>

        <div class="arch-content">
          @if (insightsService.events().length === 0) {
            <p class="empty-state">Interact with the app to see architecture events.</p>
          } @else {
            @for (event of insightsService.events(); track event.timestamp) {
              <div class="arch-event-card">
                <div class="event-header">
                  <span class="layer-badge" [ngClass]="'layer-' + event.layer">
                    {{ event.layer.toUpperCase() }}
                  </span>
                  <code class="event-code">{{ event.code }}</code>
                </div>
                <p class="event-description">{{ event.description }}</p>
                @if (getPrincipleMetadata(event.code); as principle) {
                  <p class="principle-name">{{ principle.name }}</p>
                  <a
                    [href]="principle.anchor"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="principle-link"
                  >
                    View in Standards →
                  </a>
                }
                <div class="event-footer">
                  <code class="request-id">{{ truncateRequestId(event.requestId) }}</code>
                  <span class="timestamp">{{ formatTimestamp(event.timestamp) }}</span>
                </div>
              </div>
            }
          }
        </div>
      </aside>
    }
  `,
  styles: `
    .arch-insights-panel {
      position: fixed;
      top: 0;
      right: 0;
      width: 300px;
      height: 100vh;
      background: #1e1e1e;
      color: #e0e0e0;
      border-left: 1px solid #444;
      z-index: 1000;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: -2px 0 8px rgba(0, 0, 0, 0.3);
    }

    .arch-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid #444;
      background: #252525;
    }

    .arch-header h2 {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
    }

    .close-btn {
      background: transparent;
      border: none;
      color: #e0e0e0;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      color: #ff5555;
    }

    .arch-content {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
    }

    .empty-state {
      color: #999;
      font-style: italic;
      text-align: center;
      margin-top: 2rem;
    }

    .arch-event-card {
      background: #2a2a2a;
      border: 1px solid #444;
      border-radius: 4px;
      padding: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .event-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .layer-badge {
      font-size: 0.7rem;
      font-weight: bold;
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      text-transform: uppercase;
    }

    .layer-mfe {
      background: #3b82f6;
      color: white;
    }

    .layer-bff {
      background: #10b981;
      color: white;
    }

    .layer-domain {
      background: #f97316;
      color: white;
    }

    .event-code {
      font-size: 0.85rem;
      font-weight: 600;
      color: #fbbf24;
    }

    .event-description {
      margin: 0.5rem 0;
      font-size: 0.85rem;
      line-height: 1.4;
      color: #d1d5db;
    }

    .principle-name {
      margin: 0.5rem 0 0.25rem;
      font-size: 0.75rem;
      color: #9ca3af;
      font-weight: 500;
    }

    .principle-link {
      font-size: 0.75rem;
      color: #60a5fa;
      text-decoration: none;
    }

    .principle-link:hover {
      text-decoration: underline;
    }

    .event-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 0.5rem;
      padding-top: 0.5rem;
      border-top: 1px solid #444;
    }

    .request-id {
      font-size: 0.7rem;
      color: #6b7280;
    }

    .timestamp {
      font-size: 0.7rem;
      color: #6b7280;
    }
  `,
})
export class ArchitectureInsightsComponent {
  constructor(protected insightsService: ArchitectureInsightsService) {}

  getPrincipleMetadata(code: string) {
    return this.insightsService.getPrincipleMetadata(code);
  }

  truncateRequestId(requestId: string): string {
    return requestId.length > 12 ? requestId.slice(0, 12) + '…' : requestId;
  }

  formatTimestamp(timestamp: number): string {
    const secondsAgo = Math.floor((Date.now() - timestamp) / 1000);
    if (secondsAgo < 5) return 'just now';
    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    const minutesAgo = Math.floor(secondsAgo / 60);
    if (minutesAgo < 60) return `${minutesAgo}m ago`;
    const hoursAgo = Math.floor(minutesAgo / 60);
    return `${hoursAgo}h ago`;
  }
}
