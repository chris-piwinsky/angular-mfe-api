import { randomUUID } from 'crypto';
import { Bill } from '../types/bill';

type BillSeed = Omit<Bill, 'id' | 'balance' | 'requestId'>;

function makeBill(seed: BillSeed): Bill {
  return {
    ...seed,
    id: randomUUID(),
    balance: Math.round((seed.totalAmount - seed.amountPaid) * 100) / 100,
    requestId: '', // populated per-request, not stored
  };
}

export const bills: Bill[] = [
  // ── 2 unpaid bills (future due dates) ───────────────────────────────────
  makeBill({
    accountId: 'acct-001',
    invoiceNumber: 'INV-2026-0049',
    billingPeriod: { start: '2026-04-01', end: '2026-04-30' },
    issuedDate: '2026-05-01',
    dueDate: '2026-06-01',
    totalAmount: 275.00,
    amountPaid: 0,
    status: 'unpaid',
    lineItems: [
      { id: randomUUID(), description: 'Monthly service fee', quantity: 1, unitPrice: 200.00, total: 200.00 },
      { id: randomUUID(), description: 'Usage overage – 7.5 GB', quantity: 7.5, unitPrice: 10.00, total: 75.00 },
    ],
  }),
  makeBill({
    accountId: 'acct-001',
    invoiceNumber: 'INV-2026-0050',
    billingPeriod: { start: '2026-05-01', end: '2026-05-31' },
    issuedDate: '2026-06-01',
    dueDate: '2026-07-01',
    totalAmount: 200.00,
    amountPaid: 0,
    status: 'unpaid',
    lineItems: [
      { id: randomUUID(), description: 'Monthly service fee', quantity: 1, unitPrice: 200.00, total: 200.00 },
    ],
  }),

  // ── 2 overdue bills (dueDate in the past, balance > 0) ──────────────────
  makeBill({
    accountId: 'acct-001',
    invoiceNumber: 'INV-2026-0041',
    billingPeriod: { start: '2026-01-01', end: '2026-01-31' },
    issuedDate: '2026-02-01',
    dueDate: '2026-03-01',
    totalAmount: 320.50,
    amountPaid: 0,
    status: 'overdue',
    lineItems: [
      { id: randomUUID(), description: 'Monthly service fee', quantity: 1, unitPrice: 200.00, total: 200.00 },
      { id: randomUUID(), description: 'Usage overage – 12 GB', quantity: 12, unitPrice: 10.00, total: 120.00 },
      { id: randomUUID(), description: 'Tax (2.5%)', quantity: 1, unitPrice: 0.50, total: 0.50 },
    ],
  }),
  makeBill({
    accountId: 'acct-001',
    invoiceNumber: 'INV-2026-0043',
    billingPeriod: { start: '2026-02-01', end: '2026-02-28' },
    issuedDate: '2026-03-01',
    dueDate: '2026-04-01',
    totalAmount: 250.00,
    amountPaid: 0,
    status: 'overdue',
    lineItems: [
      { id: randomUUID(), description: 'Monthly service fee', quantity: 1, unitPrice: 200.00, total: 200.00 },
      { id: randomUUID(), description: 'Late fee', quantity: 1, unitPrice: 25.00, total: 25.00 },
      { id: randomUUID(), description: 'Usage overage – 2.5 GB', quantity: 2.5, unitPrice: 10.00, total: 25.00 },
    ],
  }),

  // ── 2 paid bills (amountPaid === totalAmount, balance === 0) ────────────
  makeBill({
    accountId: 'acct-001',
    invoiceNumber: 'INV-2025-0031',
    billingPeriod: { start: '2025-10-01', end: '2025-10-31' },
    issuedDate: '2025-11-01',
    dueDate: '2025-12-01',
    totalAmount: 215.00,
    amountPaid: 215.00,
    status: 'paid',
    lineItems: [
      { id: randomUUID(), description: 'Monthly service fee', quantity: 1, unitPrice: 200.00, total: 200.00 },
      { id: randomUUID(), description: 'Usage overage – 1.5 GB', quantity: 1.5, unitPrice: 10.00, total: 15.00 },
    ],
  }),
  makeBill({
    accountId: 'acct-001',
    invoiceNumber: 'INV-2025-0032',
    billingPeriod: { start: '2025-11-01', end: '2025-11-30' },
    issuedDate: '2025-12-01',
    dueDate: '2026-01-01',
    totalAmount: 200.00,
    amountPaid: 200.00,
    status: 'paid',
    lineItems: [
      { id: randomUUID(), description: 'Monthly service fee', quantity: 1, unitPrice: 200.00, total: 200.00 },
    ],
  }),

  // ── 1 partial bill (amountPaid > 0 but < totalAmount) ───────────────────
  makeBill({
    accountId: 'acct-001',
    invoiceNumber: 'INV-2026-0044',
    billingPeriod: { start: '2026-03-01', end: '2026-03-31' },
    issuedDate: '2026-04-01',
    dueDate: '2026-05-01',
    totalAmount: 380.00,
    amountPaid: 200.00,
    status: 'partial',
    lineItems: [
      { id: randomUUID(), description: 'Monthly service fee', quantity: 1, unitPrice: 200.00, total: 200.00 },
      { id: randomUUID(), description: 'Usage overage – 15 GB', quantity: 15, unitPrice: 10.00, total: 150.00 },
      { id: randomUUID(), description: 'Support add-on', quantity: 1, unitPrice: 30.00, total: 30.00 },
    ],
  }),

  // ── Additional bills for pagination testing ──────────────────────────────
  makeBill({
    accountId: 'acct-001',
    invoiceNumber: 'INV-2025-0028',
    billingPeriod: { start: '2025-07-01', end: '2025-07-31' },
    issuedDate: '2025-08-01',
    dueDate: '2025-09-01',
    totalAmount: 245.00,
    amountPaid: 245.00,
    status: 'paid',
    lineItems: [
      { id: randomUUID(), description: 'Monthly service fee', quantity: 1, unitPrice: 200.00, total: 200.00 },
      { id: randomUUID(), description: 'Usage overage – 4.5 GB', quantity: 4.5, unitPrice: 10.00, total: 45.00 },
    ],
  }),
  makeBill({
    accountId: 'acct-002',
    invoiceNumber: 'INV-2026-0045',
    billingPeriod: { start: '2026-03-01', end: '2026-03-31' },
    issuedDate: '2026-04-01',
    dueDate: '2026-05-15',
    totalAmount: 500.00,
    amountPaid: 0,
    status: 'unpaid',
    lineItems: [
      { id: randomUUID(), description: 'Enterprise service fee', quantity: 1, unitPrice: 500.00, total: 500.00 },
    ],
  }),
];
