import { Component, signal, computed, inject, OnInit, isDevMode } from '@angular/core';
import { CommonModule } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { APP_CONFIG } from '@billing-portal/shared/app-config';

interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  maskedAccount: string;
  status: string;
  createdAt: string;
}

interface Bill {
  id: string;
  accountId: string;
  invoiceNumber: string;
  billingPeriod: { start: string; end: string };
  issuedDate: string;
  dueDate: string;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  status: string;
  lineItems: LineItem[];
  payments?: Payment[];
}

interface BillsResponse {
  data: Bill[];
  requestId: string;
}

interface BillDetailResponse {
  data: Bill;
  requestId: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
// Emulated encapsulation (default) — Angular auto-scopes all styles to this component.
// Do NOT change to ViewEncapsulation.None — unscoped styles bleed into the shell and sibling MFEs.
export class AppComponent implements OnInit {
  private readonly config = inject(APP_CONFIG);

  private logArch(action: string, detail: Record<string, unknown> = {}): void {
    if (!isDevMode()) return;
    console.info('[ARCH-FLOW][bills-mfe]', {
      action,
      timestamp: new Date().toISOString(),
      ...detail,
    });
  }

  statusFilter = signal<string>('');
  selectedBillId = signal<string | null>(null);

  private readonly billsUrl = computed(() => {
    const q = this.statusFilter() ? `?status=${this.statusFilter()}` : '';
    return `${this.config.bffBaseUrl}/api/bills${q}`;
  });

  bills = httpResource<BillsResponse>(() => ({
    url: this.billsUrl(),
    headers: { Authorization: this.config.authHeader },
  }));

  billsData = computed(() => this.bills.value()?.data || []);

  private readonly detailUrl = computed(() => {
    const id = this.selectedBillId();
    return id ? `${this.config.bffBaseUrl}/api/bills/${id}` : null;
  });

  billDetail = httpResource<BillDetailResponse>(() => {
    const url = this.detailUrl();
    if (!url) return undefined;
    return { url, headers: { Authorization: this.config.authHeader } };
  });

  billDetailData = computed(() => {
    const response = this.billDetail.value();
    if (!response) return undefined;
    return response.data;
  });

  readonly filters = [
    { label: 'All', value: '' },
    { label: 'Unpaid', value: 'unpaid' },
    { label: 'Overdue', value: 'overdue' },
    { label: 'Partial', value: 'partial' },
    { label: 'Paid', value: 'paid' },
  ];

  ngOnInit(): void {}

  setFilter(value: string): void {
    this.statusFilter.set(value);
  }

  selectBill(billId: string): void {
    this.selectedBillId.set(billId);
  }

  backToList(): void {
    this.selectedBillId.set(null);
  }

  payNow(billId: string, event: Event): void {
    event.stopPropagation();
    this.logArch('pay_now_clicked', { billId });
    window.dispatchEvent(
      new CustomEvent('suite:navigate:pay', { detail: { billId } })
    );
  }

  isPayable(status: string): boolean {
    return status === 'unpaid' || status === 'overdue' || status === 'partial';
  }
}

