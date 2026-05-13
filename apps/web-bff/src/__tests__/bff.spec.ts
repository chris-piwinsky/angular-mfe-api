import request from 'supertest';
import { createApp } from '../app';

// Mock the service layer so tests do not make real HTTP calls to domain APIs
jest.mock('../services/bills.service');
jest.mock('../services/payments.service');

import * as billsService from '../services/bills.service';
import * as paymentsService from '../services/payments.service';

const mockedFetchBills = billsService.fetchBills as jest.MockedFunction<typeof billsService.fetchBills>;
const mockedFetchBillById = billsService.fetchBillById as jest.MockedFunction<typeof billsService.fetchBillById>;
const mockedFetchPaymentsForBill = paymentsService.fetchPaymentsForBill as jest.MockedFunction<typeof paymentsService.fetchPaymentsForBill>;
const mockedSubmitPayment = paymentsService.submitPayment as jest.MockedFunction<typeof paymentsService.submitPayment>;

const app = createApp();

const mockBill = {
  id: 'bill-001',
  accountId: 'acct-001',
  invoiceNumber: 'INV-2026-0001',
  billingPeriod: { start: '2026-01-01', end: '2026-01-31' },
  issuedDate: '2026-02-01',
  dueDate: '2026-03-01',
  totalAmount: 300.0,
  amountPaid: 0,
  balance: 300.0,
  status: 'unpaid' as const,
  lineItems: [],
  requestId: '',
};

const mockPayment = {
  id: 'pay-001',
  billId: 'bill-001',
  amount: 100.0,
  method: 'card' as const,
  maskedAccount: '••••4242',
  status: 'completed' as const,
  createdAt: '2026-01-15T10:30:00.000Z',
  requestId: '',
};

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Auth ────────────────────────────────────────────────────────────────────

describe('GET /api/bills — auth', () => {
  it('returns 401 when Authorization header is missing', async () => {
    const res = await request(app).get('/api/bills');

    expect(res.status).toBe(401);
    expect(res.headers['content-type']).toMatch(/json/);
  });
});

// ─── Bills proxy ─────────────────────────────────────────────────────────────

describe('GET /api/bills', () => {
  it('returns bill list when Authorization header is valid', async () => {
    mockedFetchBills.mockResolvedValue([mockBill]);

    const res = await request(app)
      .get('/api/bills')
      .set('Authorization', 'Bearer demo-token');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].id).toBe('bill-001');
    expect(typeof res.body.requestId).toBe('string');
  });

  it('returns 502 when bills-api is unavailable', async () => {
    mockedFetchBills.mockRejectedValue(new Error('connection refused'));

    const res = await request(app)
      .get('/api/bills')
      .set('Authorization', 'Bearer demo-token');

    expect(res.status).toBe(502);
    expect(res.body.error).toBe('bills_unavailable');
  });
});

describe('GET /api/bills/:id', () => {
  it('returns bill enriched with payments array', async () => {
    mockedFetchBillById.mockResolvedValue(mockBill);
    mockedFetchPaymentsForBill.mockResolvedValue([mockPayment]);

    const res = await request(app)
      .get('/api/bills/bill-001')
      .set('Authorization', 'Bearer demo-token');

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('bill-001');
    expect(Array.isArray(res.body.data.payments)).toBe(true);
    expect(res.body.data.payments[0].id).toBe('pay-001');
    expect(typeof res.body.requestId).toBe('string');
  });

  it('returns bill with payments: [] when payments-api is down (graceful degradation)', async () => {
    mockedFetchBillById.mockResolvedValue(mockBill);
    mockedFetchPaymentsForBill.mockRejectedValue(new Error('payments-api down'));

    const res = await request(app)
      .get('/api/bills/bill-001')
      .set('Authorization', 'Bearer demo-token');

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('bill-001');
    expect(res.body.data.payments).toEqual([]);
    expect(typeof res.body.requestId).toBe('string');
  });
});

// ─── Payments proxy ───────────────────────────────────────────────────────────

describe('POST /api/payments — balance validation', () => {
  it('returns 422 with amount_exceeds_balance when amount > bill.balance', async () => {
    mockedFetchBillById.mockResolvedValue({ ...mockBill, balance: 50.0 });

    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', 'Bearer demo-token')
      .send({ billId: 'bill-001', amount: 200.0, method: 'card', maskedAccount: '••••4242' });

    expect(res.status).toBe(422);
    expect(res.body.error).toBe('amount_exceeds_balance');
    expect(typeof res.body.balance).toBe('number');
  });

  it('proxies to payments-api and returns 201 for a valid payment', async () => {
    mockedFetchBillById.mockResolvedValue(mockBill);
    mockedSubmitPayment.mockResolvedValue(mockPayment);

    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', 'Bearer demo-token')
      .send({ billId: 'bill-001', amount: 100.0, method: 'card', maskedAccount: '••••4242' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('pay-001');
    expect(res.body.billId).toBe('bill-001');
    expect(typeof res.body.requestId).toBe('string');
  });

  it('returns 404 bill_not_found for unknown billId', async () => {
    mockedFetchBillById.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/payments')
      .set('Authorization', 'Bearer demo-token')
      .send({ billId: 'unknown-bill', amount: 50.0, method: 'card', maskedAccount: '••••4242' });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('bill_not_found');
  });
});
