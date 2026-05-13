export type BillStatus = 'unpaid' | 'paid' | 'overdue' | 'partial';
export type PaymentMethod = 'card' | 'ach';
export type PaymentStatus = 'pending' | 'completed' | 'failed';

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Bill {
  id: string;
  accountId: string;
  invoiceNumber: string;
  billingPeriod: { start: string; end: string };
  issuedDate: string;
  dueDate: string;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  status: BillStatus;
  lineItems: LineItem[];
  requestId: string;
}

export interface Payment {
  id: string;
  billId: string;
  amount: number;
  method: PaymentMethod;
  maskedAccount: string;
  status: PaymentStatus;
  createdAt: string;
  requestId: string;
}

export interface PaymentRequest {
  billId: string;
  amount: number;
  method: PaymentMethod;
  maskedAccount: string;
}
