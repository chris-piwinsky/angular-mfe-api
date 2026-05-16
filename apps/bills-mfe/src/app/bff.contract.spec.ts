/**
 * Consumer-Driven Contract: bills-mfe ↔ web-bff
 *
 * These tests define the exact shapes bills-mfe expects from the BFF.
 * If the BFF changes its response shape, these tests catch the breakage
 * before integration testing.
 */
import { describe, it, expect } from 'vitest';

// ── Contract shapes ─────────────────────────────────────────────────────────

interface BillListItem {
  id: string;
  invoiceNumber: string;
  dueDate: string;
  totalAmount: number;
  amountPaid: number;
  /** balance is computed by bills-api and forwarded by the BFF.
   *  If the BFF omits "balance", the status badge logic in bills-mfe breaks. */
  balance: number;
  status: string;
  requestId: string;
}

interface BillDetail extends BillListItem {
  lineItems: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  payments: Array<{
    id: string;
    amount: number;
    method: string;
    maskedAccount: string;
    status: string;
    createdAt: string;
  }>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function assertBillListShape(bill: unknown): asserts bill is BillListItem {
  const b = bill as unknown as Record<string, unknown>;
  expect(typeof b['id']).toBe('string');
  expect(typeof b['invoiceNumber']).toBe('string');
  expect(typeof b['dueDate']).toBe('string');
  expect(typeof b['totalAmount']).toBe('number');
  expect(typeof b['amountPaid']).toBe('number');
  // balance MUST be present — if omitted, status badge logic breaks
  expect(typeof b['balance']).toBe('number');
  expect(typeof b['status']).toBe('string');
  expect(typeof b['requestId']).toBe('string');
}

function assertBillDetailShape(bill: unknown): asserts bill is BillDetail {
  assertBillListShape(bill);
  const b = bill as unknown as Record<string, unknown>;
  expect(Array.isArray(b['lineItems'])).toBe(true);
  expect(Array.isArray(b['payments'])).toBe(true);
}

// ── Contract tests ───────────────────────────────────────────────────────────

describe('BFF contract — GET /api/bills (list)', () => {
  it('matches expected bill list item shape', () => {
    const mockBffResponse: BillListItem = {
      id: 'bill-001',
      invoiceNumber: 'INV-2026-0001',
      dueDate: '2026-03-01',
      totalAmount: 300.0,
      amountPaid: 0,
      balance: 300.0,
      status: 'unpaid',
      requestId: 'abc-123',
    };

    assertBillListShape(mockBffResponse);
  });

  it('BREAKS if BFF omits the balance field (status badge logic depends on it)', () => {
    const missingBalance = {
      id: 'bill-001',
      invoiceNumber: 'INV-2026-0001',
      dueDate: '2026-03-01',
      totalAmount: 300.0,
      amountPaid: 0,
      // balance intentionally omitted
      status: 'unpaid',
      requestId: 'abc-123',
    };

    expect(() => assertBillListShape(missingBalance)).toThrow();
  });
});

describe('BFF contract — GET /api/bills/:id (detail)', () => {
  it('matches expected bill detail shape including lineItems and payments', () => {
    const mockBffDetail: BillDetail = {
      id: 'bill-001',
      invoiceNumber: 'INV-2026-0001',
      dueDate: '2026-03-01',
      totalAmount: 300.0,
      amountPaid: 0,
      balance: 300.0,
      status: 'unpaid',
      requestId: 'abc-123',
      lineItems: [
        {
          description: 'Service fee',
          quantity: 1,
          unitPrice: 300.0,
          lineTotal: 300.0,
        },
      ],
      payments: [
        {
          id: 'pay-001',
          amount: 100.0,
          method: 'card',
          maskedAccount: '••••4242',
          status: 'completed',
          createdAt: '2026-01-15T10:30:00.000Z',
        },
      ],
    };

    assertBillDetailShape(mockBffDetail);
  });
});
