import {
  Component,
  signal,
  computed,
  inject,
  OnInit,
  isDevMode,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, httpResource } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { APP_CONFIG } from '@billing-portal/shared/app-config';

interface Bill {
  id: string;
  invoiceNumber: string;
  dueDate: string;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  status: string;
}

interface PaymentResponse {
  id: string;
  billId: string;
  amount: number;
  method: string;
  maskedAccount: string;
  status: string;
  createdAt: string;
}

interface BillDetailResponse {
  data: Bill;
  requestId: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
// Emulated encapsulation (default) — Angular auto-scopes all styles to this component.
// Do NOT change to ViewEncapsulation.None — unscoped styles bleed into the shell and sibling MFEs.
export class AppComponent implements OnInit {
  private readonly config = inject(APP_CONFIG);
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute, { optional: true });

  private logArch(action: string, detail: Record<string, unknown> = {}): void {
    if (!isDevMode()) return;
    console.info('[ARCH-FLOW][payment-mfe]', {
      action,
      timestamp: new Date().toISOString(),
      ...detail,
    });
  }

  billId = signal<string>('');

  // Form fields
  amount = signal<number>(0);
  method = signal<'card' | 'ach'>('card');
  last4 = signal<string>('');

  // UI state
  submitting = signal(false);
  submitError = signal<string | null>(null);
  balanceError = signal<string | null>(null);
  confirmation = signal<PaymentResponse | null>(null);

  // Validation state
  amountTouched = signal(false);
  last4Touched = signal(false);

  bill = httpResource<BillDetailResponse>(() => {
    const id = this.billId();
    if (!id) return undefined;
    return {
      url: `${this.config.bffBaseUrl}/api/bills/${id}`,
      headers: { Authorization: this.config.authHeader },
    };
  });

  readonly billData = computed(() => {
    const response = this.bill.value();
    if (!response) return undefined;
    return response.data;
  });

  readonly amountError = computed(() => {
    if (!this.amountTouched()) return null;
    const a = this.amount();
    const bill = this.billData();
    if (a <= 0) return 'Amount must be greater than 0.';
    if (bill && a > bill.balance)
      return `Amount cannot exceed the balance of ${bill.balance}.`;
    return null;
  });

  readonly last4Error = computed(() => {
    if (!this.last4Touched()) return null;
    return /^\d{4}$/.test(this.last4()) ? null : 'Must be exactly 4 digits.';
  });

  readonly formValid = computed(() => {
    const bill = this.billData();
    if (!bill) return false;
    return (
      this.amount() > 0 &&
      this.amount() <= bill.balance &&
      /^\d{4}$/.test(this.last4())
    );
  });

  ngOnInit(): void {
    const id = this.route?.snapshot.paramMap.get('billId') ?? '';
    this.billId.set(id);
    this.logArch('payment_form_loaded', { billId: id });
  }

  onAmountChange(val: string): void {
    this.amountTouched.set(true);
    const parsed = parseFloat(val);
    this.amount.set(isNaN(parsed) ? 0 : parsed);
  }

  onLast4Change(val: string): void {
    this.last4Touched.set(true);
    this.last4.set(val);
  }

  onMethodChange(val: 'card' | 'ach'): void {
    this.method.set(val);
  }

  submitPayment(): void {
    this.amountTouched.set(true);
    this.last4Touched.set(true);
    if (!this.formValid()) return;

    this.submitting.set(true);
    this.submitError.set(null);
    this.balanceError.set(null);

    const body = {
      billId: this.billId(),
      amount: this.amount(),
      method: this.method(),
      maskedAccount: '••••' + this.last4(),
    };

    this.http
      .post<PaymentResponse>(`${this.config.bffBaseUrl}/api/payments`, body, {
        headers: { Authorization: this.config.authHeader },
      })
      .subscribe({
        next: (res) => {
          this.submitting.set(false);
          this.confirmation.set(res);
          this.logArch('payment_submitted_success', {
            billId: res.billId,
            amount: res.amount,
            requestId: (res as { requestId?: string }).requestId ?? 'unknown',
          });
          window.dispatchEvent(
            new CustomEvent('suite:payment:submitted', {
              detail: { billId: this.billId(), amount: this.amount() },
            }),
          );
        },
        error: (err) => {
          this.submitting.set(false);
          if (err.status === 422) {
            const balance = err.error?.balance ?? this.billData()?.balance;
            this.balanceError.set(
              `The amount entered exceeds the remaining balance of ${balance ? '$' + balance.toFixed(2) : 'the bill'}.`,
            );
          } else {
            this.submitError.set(
              'Payment could not be submitted. Please try again.',
            );
          }
        },
      });
  }

  navigateToBills(event: Event): void {
    event.preventDefault();
    this.logArch('navigate_back_to_bills', { billId: this.billId() });
    window.dispatchEvent(new CustomEvent('suite:navigate:bills'));
  }
}
