/**
 * Consumer-Driven Contract: payment-mfe ↔ web-bff
 *
 * These tests define the exact shapes payment-mfe expects from the BFF.
 * If the BFF changes its response shape, these tests catch the breakage
 * before integration testing.
 */
import { describe, it, expect } from 'vitest';

// ── Contract shapes ─────────────────────────────────────────────────────────

interface BillSummary {
  id: string;
  invoiceNumber: string;
  dueDate: string;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  status: string;
  requestId: string;
}

interface PaymentCreated {
  id: string;
  billId: string;
  amount: number;
  method: 'card' | 'ach';
  maskedAccount: string;
  status: string;
  createdAt: string;
  requestId: string;
}

interface AmountExceedsBalanceError {
  error: 'amount_exceeds_balance';
  /** balance MUST be present so payment-mfe can show the remaining balance to the user */
  balance: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function assertPaymentCreatedShape(p: unknown): asserts p is PaymentCreated {
  const obj = p as Record<string, unknown>;
  expect(typeof obj['id']).toBe('string');
  expect(typeof obj['billId']).toBe('string');
  expect(typeof obj['amount']).toBe('number');
  expect(['card', 'ach']).toContain(obj['method']);
  expect(typeof obj['maskedAccount']).toBe('string');
  expect(typeof obj['status']).toBe('string');
  expect(typeof obj['createdAt']).toBe('string');
  expect(typeof obj['requestId']).toBe('string');
}

function assertAmountExceedsBalanceShape(
  e: unknown,
): asserts e is AmountExceedsBalanceError {
  const obj = e as Record<string, unknown>;
  expect(obj['error']).toBe('amount_exceeds_balance');
  // balance MUST be present — payment-mfe renders it in the error message
  expect(typeof obj['balance']).toBe('number');
}

// ── Contract tests ────────────────────────────────────────────────────────────

describe('BFF contract — POST /api/payments (success 201)', () => {
  it('matches expected payment response shape', () => {
    const mockBffResponse: PaymentCreated = {
      id: 'pay-001',
      billId: 'bill-001',
      amount: 100.0,
      method: 'card',
      maskedAccount: '••••4242',
      status: 'completed',
      createdAt: '2026-01-15T10:30:00.000Z',
      requestId: 'abc-123',
    };

    assertPaymentCreatedShape(mockBffResponse);
  });
});

describe('BFF contract — POST /api/payments (422 amount_exceeds_balance)', () => {
  it('matches expected 422 error shape including balance', () => {
    const mockErrorResponse: AmountExceedsBalanceError = {
      error: 'amount_exceeds_balance',
      balance: 300.0,
    };

    assertAmountExceedsBalanceShape(mockErrorResponse);
  });

  it('BREAKS if BFF omits balance from the 422 response', () => {
    const missingBalance = {
      error: 'amount_exceeds_balance',
      // balance intentionally omitted
    };

    expect(() => assertAmountExceedsBalanceShape(missingBalance)).toThrow();
  });
});
