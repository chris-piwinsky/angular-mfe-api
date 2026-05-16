import { randomUUID } from 'crypto';
import { Payment } from '../types/payment';

// Seeded historical payments for bill-001 so payment history has data on first load
export const payments: Payment[] = [
  {
    id: randomUUID(),
    billId: 'bill-001',
    amount: 100.0,
    method: 'card',
    maskedAccount: '••••4242',
    status: 'completed',
    createdAt: '2026-01-15T10:30:00.000Z',
    requestId: '',
  },
  {
    id: randomUUID(),
    billId: 'bill-001',
    amount: 75.5,
    method: 'ach',
    maskedAccount: '••••8832',
    status: 'completed',
    createdAt: '2026-02-03T14:20:00.000Z',
    requestId: '',
  },
  {
    id: randomUUID(),
    billId: 'bill-001',
    amount: 50.0,
    method: 'card',
    maskedAccount: '••••1234',
    status: 'completed',
    createdAt: '2026-03-10T09:05:00.000Z',
    requestId: '',
  },
];
