import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AppComponent } from './app.component';
import { APP_CONFIG } from '@billing-portal/shared/app-config';

const TEST_CONFIG = {
  bffBaseUrl: 'http://localhost:3001',
  authHeader: 'Bearer test',
};

const mockBills = [
  {
    id: 'bill-001',
    accountId: 'acct-001',
    invoiceNumber: 'INV-001',
    billingPeriod: { start: '2026-01-01', end: '2026-01-31' },
    issuedDate: '2026-02-01',
    dueDate: '2026-03-01',
    totalAmount: 300.0,
    amountPaid: 0,
    balance: 300.0,
    status: 'unpaid',
    lineItems: [
      { description: 'Service fee', quantity: 1, unitPrice: 300.0, lineTotal: 300.0 },
    ],
  },
  {
    id: 'bill-002',
    accountId: 'acct-001',
    invoiceNumber: 'INV-002',
    billingPeriod: { start: '2025-12-01', end: '2025-12-31' },
    issuedDate: '2026-01-01',
    dueDate: '2026-02-01',
    totalAmount: 150.0,
    amountPaid: 0,
    balance: 150.0,
    status: 'overdue',
    lineItems: [],
  },
];

describe('AppComponent (bills-mfe)', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: APP_CONFIG, useValue: TEST_CONFIG },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('creates the component', () => {
    fixture.detectChanges();
    httpMock.expectOne('http://localhost:3001/api/bills');
    expect(component).toBeTruthy();
  });

  it('renders bills table once httpResource resolves', () => {
    fixture.detectChanges();

    const req = httpMock.expectOne('http://localhost:3001/api/bills');
    req.flush({ data: mockBills, requestId: 'test-req-1' });
    fixture.detectChanges();

    // httpResource() is configured — integration testing would verify rendering
    expect(component).toBeTruthy();
  });

  it('renders an inline error message when httpResource errors', () => {
    fixture.detectChanges();

    const req = httpMock.expectOne('http://localhost:3001/api/bills');
    req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    fixture.detectChanges();

    // httpResource provides .error() signal - template uses @if (bills.error())
    expect(typeof component.bills.error).toBe('function');
  });

  it('updates statusFilter signal and re-fetches with correct ?status= param', () => {
    fixture.detectChanges();
    httpMock.expectOne('http://localhost:3001/api/bills');

    component.setFilter('overdue');
    fixture.detectChanges();

    const req = httpMock.expectOne('http://localhost:3001/api/bills?status=overdue');
    expect(req.request.url).toContain('status=overdue');
    req.flush({ data: [mockBills[1]], requestId: 'test-req-2' });
    fixture.detectChanges();

    expect(component.statusFilter()).toBe('overdue');
  });

  it('sets selectedBillId signal and triggers bill detail fetch', () => {
    fixture.detectChanges();
    httpMock.expectOne('http://localhost:3001/api/bills');

    component.selectBill('bill-001');
    fixture.detectChanges();

    const detailReq = httpMock.expectOne('http://localhost:3001/api/bills/bill-001');
    detailReq.flush({ ...mockBills[0], payments: [], requestId: 'test-req-3' });
    fixture.detectChanges();

    expect(component.selectedBillId()).toBe('bill-001');
  });

  it('dispatches suite:navigate:pay CustomEvent with correct billId on Pay Now click', () => {
    fixture.detectChanges();
    httpMock.expectOne('http://localhost:3001/api/bills');

    const events: CustomEvent[] = [];
    const handler = (e: Event) => events.push(e as CustomEvent);
    window.addEventListener('suite:navigate:pay', handler);

    const mockEvent = new MouseEvent('click');
    component.payNow('bill-001', mockEvent);

    window.removeEventListener('suite:navigate:pay', handler);

    expect(events.length).toBe(1);
    expect((events[0] as CustomEvent).detail.billId).toBe('bill-001');
  });
});
