import { randomUUID } from 'crypto';
import { Bill } from '../types/bill';

// Fixed seed IDs — stable across restarts so curl examples and demo pages always work
export const BILL_IDS = {
  UNPAID_APR:  'b1110001-0000-0000-0000-000000000001', // INV-2026-0049
  UNPAID_MAY:  'b1110001-0000-0000-0000-000000000002', // INV-2026-0050
  OVERDUE_JAN: 'b1110001-0000-0000-0000-000000000003', // INV-2026-0041
  OVERDUE_FEB: 'b1110001-0000-0000-0000-000000000004', // INV-2026-0043
  PAID_OCT:    'b1110001-0000-0000-0000-000000000005', // INV-2025-0031
  PAID_NOV:    'b1110001-0000-0000-0000-000000000006', // INV-2025-0032
  PARTIAL_MAR: 'b1110001-0000-0000-0000-000000000007', // INV-2026-0044
  PAID_JUL:    'b1110001-0000-0000-0000-000000000008', // INV-2025-0028
  UNPAID_ENT:  'b1110001-0000-0000-0000-000000000009', // INV-2026-0045 (acct-002)
} as const;

type BillSeed = Omit<Bill, 'balance' | 'requestId'>;

function makeBill(seed: BillSeed): Bill {
  return {
    ...seed,
    balance: Math.round((seed.totalAmount - seed.amountPaid) * 100) / 100,
    requestId: '', // populated per-request, not stored
  };
}

export const bills: Bill[] = [
  // ── 2 unpaid bills (future due dates) ───────────────────────────────────
  makeBill({
    id: BILL_IDS.UNPAID_APR,
    accountId: 'acct-001',
    invoiceNumber: 'INV-2026-0049',
    billingPeriod: { start: '2026-04-01', end: '2026-04-30' },
    issuedDate: '2026-05-01',
    dueDate: '2026-06-01',
    totalAmount: 275.0,
    amountPaid: 0,
    status: 'unpaid',
    lineItems: [
      {
        id: randomUUID(),
        description: 'Monthly service fee',
        quantity: 1,
        unitPrice: 200.0,
        total: 200.0,
      },
      {
        id: randomUUID(),
        description: 'Usage overage – 7.5 GB',
        quantity: 7.5,
        unitPrice: 10.0,
        total: 75.0,
      },
    ],
  }),
  makeBill({
    id: BILL_IDS.UNPAID_MAY,
    accountId: 'acct-001',
    invoiceNumber: 'INV-2026-0050',
    billingPeriod: { start: '2026-05-01', end: '2026-05-31' },
    issuedDate: '2026-06-01',
    dueDate: '2026-07-01',
    totalAmount: 200.0,
    amountPaid: 0,
    status: 'unpaid',
    lineItems: [
      {
        id: randomUUID(),
        description: 'Monthly service fee',
        quantity: 1,
        unitPrice: 200.0,
        total: 200.0,
      },
    ],
  }),

  // ── 2 overdue bills (dueDate in the past, balance > 0) ──────────────────
  makeBill({
    id: BILL_IDS.OVERDUE_JAN,
    accountId: 'acct-001',
    invoiceNumber: 'INV-2026-0041',
    billingPeriod: { start: '2026-01-01', end: '2026-01-31' },
    issuedDate: '2026-02-01',
    dueDate: '2026-03-01',
    totalAmount: 320.5,
    amountPaid: 0,
    status: 'overdue',
    lineItems: [
      {
        id: randomUUID(),
        description: 'Monthly service fee',
        quantity: 1,
        unitPrice: 200.0,
        total: 200.0,
      },
      {
        id: randomUUID(),
        description: 'Usage overage – 12 GB',
        quantity: 12,
        unitPrice: 10.0,
        total: 120.0,
      },
      {
        id: randomUUID(),
        description: 'Tax (2.5%)',
        quantity: 1,
        unitPrice: 0.5,
        total: 0.5,
      },
    ],
  }),
  makeBill({
    id: BILL_IDS.OVERDUE_FEB,
    accountId: 'acct-001',
    invoiceNumber: 'INV-2026-0043',
    billingPeriod: { start: '2026-02-01', end: '2026-02-28' },
    issuedDate: '2026-03-01',
    dueDate: '2026-04-01',
    totalAmount: 250.0,
    amountPaid: 0,
    status: 'overdue',
    lineItems: [
      {
        id: randomUUID(),
        description: 'Monthly service fee',
        quantity: 1,
        unitPrice: 200.0,
        total: 200.0,
      },
      {
        id: randomUUID(),
        description: 'Late fee',
        quantity: 1,
        unitPrice: 25.0,
        total: 25.0,
      },
      {
        id: randomUUID(),
        description: 'Usage overage – 2.5 GB',
        quantity: 2.5,
        unitPrice: 10.0,
        total: 25.0,
      },
    ],
  }),

  // ── 2 paid bills (amountPaid === totalAmount, balance === 0) ────────────
  makeBill({
    id: BILL_IDS.PAID_OCT,
    accountId: 'acct-001',
    invoiceNumber: 'INV-2025-0031',
    billingPeriod: { start: '2025-10-01', end: '2025-10-31' },
    issuedDate: '2025-11-01',
    dueDate: '2025-12-01',
    totalAmount: 215.0,
    amountPaid: 215.0,
    status: 'paid',
    lineItems: [
      {
        id: randomUUID(),
        description: 'Monthly service fee',
        quantity: 1,
        unitPrice: 200.0,
        total: 200.0,
      },
      {
        id: randomUUID(),
        description: 'Usage overage – 1.5 GB',
        quantity: 1.5,
        unitPrice: 10.0,
        total: 15.0,
      },
    ],
  }),
  makeBill({
    id: BILL_IDS.PAID_NOV,
    accountId: 'acct-001',
    invoiceNumber: 'INV-2025-0032',
    billingPeriod: { start: '2025-11-01', end: '2025-11-30' },
    issuedDate: '2025-12-01',
    dueDate: '2026-01-01',
    totalAmount: 200.0,
    amountPaid: 200.0,
    status: 'paid',
    lineItems: [
      {
        id: randomUUID(),
        description: 'Monthly service fee',
        quantity: 1,
        unitPrice: 200.0,
        total: 200.0,
      },
    ],
  }),

  // ── 1 partial bill (amountPaid > 0 but < totalAmount) ───────────────────
  makeBill({
    id: BILL_IDS.PARTIAL_MAR,
    accountId: 'acct-001',
    invoiceNumber: 'INV-2026-0044',
    billingPeriod: { start: '2026-03-01', end: '2026-03-31' },
    issuedDate: '2026-04-01',
    dueDate: '2026-05-01',
    totalAmount: 380.0,
    amountPaid: 200.0,
    status: 'partial',
    lineItems: [
      {
        id: randomUUID(),
        description: 'Monthly service fee',
        quantity: 1,
        unitPrice: 200.0,
        total: 200.0,
      },
      {
        id: randomUUID(),
        description: 'Usage overage – 15 GB',
        quantity: 15,
        unitPrice: 10.0,
        total: 150.0,
      },
      {
        id: randomUUID(),
        description: 'Support add-on',
        quantity: 1,
        unitPrice: 30.0,
        total: 30.0,
      },
    ],
  }),

  // ── Additional bills for pagination testing ──────────────────────────────
  makeBill({
    id: BILL_IDS.PAID_JUL,
    accountId: 'acct-001',
    invoiceNumber: 'INV-2025-0028',
    billingPeriod: { start: '2025-07-01', end: '2025-07-31' },
    issuedDate: '2025-08-01',
    dueDate: '2025-09-01',
    totalAmount: 245.0,
    amountPaid: 245.0,
    status: 'paid',
    lineItems: [
      {
        id: randomUUID(),
        description: 'Monthly service fee',
        quantity: 1,
        unitPrice: 200.0,
        total: 200.0,
      },
      {
        id: randomUUID(),
        description: 'Usage overage – 4.5 GB',
        quantity: 4.5,
        unitPrice: 10.0,
        total: 45.0,
      },
    ],
  }),
  makeBill({
    id: BILL_IDS.UNPAID_ENT,
    accountId: 'acct-002',
    invoiceNumber: 'INV-2026-0045',
    billingPeriod: { start: '2026-03-01', end: '2026-03-31' },
    issuedDate: '2026-04-01',
    dueDate: '2026-05-15',
    totalAmount: 500.0,
    amountPaid: 0,
    status: 'unpaid',
    lineItems: [
      {
        id: randomUUID(),
        description: 'Enterprise service fee',
        quantity: 1,
        unitPrice: 500.0,
        total: 500.0,
      },
    ],
  }),
];
