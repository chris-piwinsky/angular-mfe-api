export interface BillingPeriod {
  start: string;
  end: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type BillStatus = 'unpaid' | 'paid' | 'overdue' | 'partial';

export interface Bill {
  id: string;
  accountId: string;
  invoiceNumber: string;
  billingPeriod: BillingPeriod;
  issuedDate: string;
  dueDate: string;
  totalAmount: number;
  amountPaid: number;
  balance: number; // always totalAmount - amountPaid
  status: BillStatus;
  lineItems: LineItem[];
  requestId: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
  requestId: string;
}
