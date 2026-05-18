import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  inject,
  isDevMode,
} from '@angular/core';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { APP_CONFIG } from './app-config.token';
import { ArchitectureInsightsService } from './arch-insights/architecture-insights.service';
import { ArchitectureInsightsComponent } from './arch-insights/architecture-insights.component';
import { ArchEvent } from './arch-insights/arch-event.interface';

@Component({
  imports: [RouterModule, ArchitectureInsightsComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, OnDestroy {
  private config = inject(APP_CONFIG);
  private http = inject(HttpClient);
  private router = inject(Router);
  protected insightsService = inject(ArchitectureInsightsService);

  overdueCount = signal(0);

  private logArch(event: string, detail: Record<string, unknown> = {}): void {
    if (!isDevMode()) return;
    console.info('[ARCH-FLOW][shell-app]', {
      event,
      timestamp: new Date().toISOString(),
      ...detail,
    });
  }

  private paymentHandler = (event: Event) => {
    const customEvent = event as CustomEvent<{
      billId?: string;
      amount?: number;
    }>;
    this.logArch('suite:payment:submitted:received', {
      billId: customEvent.detail?.billId,
      amount: customEvent.detail?.amount,
    });
    this.fetchOverdueCount();
    // Push synthetic arch event for payment:submitted
    this.insightsService.push({
      code: 'A9:MFE-EVENT',
      description:
        'payment-mfe dispatched suite:payment:submitted — shell refreshing overdue count without a full reload',
      layer: 'mfe',
      requestId: 'shell',
      timestamp: Date.now(),
    });
  };

  private navigatePayHandler = (event: Event) => {
    const customEvent = event as CustomEvent<{ billId?: string }>;
    const billId = customEvent.detail?.billId;

    this.logArch('suite:navigate:pay:received', { billId });

    if (billId) {
      this.router.navigate(['/pay', billId]);
    }

    // Push synthetic arch event for navigate:pay
    this.insightsService.push({
      code: 'A9:MFE-EVENT',
      description:
        'bills-mfe dispatched suite:navigate:pay via CustomEvent — MFEs never import each other directly',
      layer: 'mfe',
      requestId: 'shell',
      timestamp: Date.now(),
    });
  };

  private navigateBillsHandler = (_event: Event) => {
    this.logArch('suite:navigate:bills:received');
    this.router.navigate(['/']);

    this.insightsService.push({
      code: 'A9:MFE-EVENT',
      description:
        'payment-mfe dispatched suite:navigate:bills via CustomEvent — shell routed back to bills list',
      layer: 'mfe',
      requestId: 'shell',
      timestamp: Date.now(),
    });
  };

  private archEventHandler = (event: Event) => {
    const customEvent = event as CustomEvent<ArchEvent>;
    this.logArch('suite:arch:event:received', {
      code: customEvent.detail.code,
      description: customEvent.detail.description,
      requestId: customEvent.detail.requestId,
      layer: customEvent.detail.layer,
    });
    this.insightsService.push(customEvent.detail);
  };

  ngOnInit(): void {
    // Push initial load synthetic event
    this.insightsService.push({
      code: 'A2:MODULE-FED',
      description:
        'shell loaded: bills-mfe and payment-mfe resolved at runtime via loadRemoteModule() — not npm dependencies',
      layer: 'mfe',
      requestId: 'shell',
      timestamp: Date.now(),
    });

    this.fetchOverdueCount();

    window.addEventListener('suite:payment:submitted', this.paymentHandler);
    window.addEventListener('suite:navigate:pay', this.navigatePayHandler);
    window.addEventListener('suite:navigate:bills', this.navigateBillsHandler);
    window.addEventListener('suite:arch:event', this.archEventHandler);
  }

  ngOnDestroy(): void {
    window.removeEventListener('suite:payment:submitted', this.paymentHandler);
    window.removeEventListener('suite:navigate:pay', this.navigatePayHandler);
    window.removeEventListener(
      'suite:navigate:bills',
      this.navigateBillsHandler,
    );
    window.removeEventListener('suite:arch:event', this.archEventHandler);
  }

  private fetchOverdueCount(): void {
    const headers = new HttpHeaders({ Authorization: this.config.authHeader });
    this.http
      .get<{
        data: unknown[];
      }>(`${this.config.bffBaseUrl}/api/bills?status=overdue`, { headers })
      .subscribe({
        next: (res) => this.overdueCount.set(res.data.length),
        error: () => this.overdueCount.set(0),
      });
  }
}
