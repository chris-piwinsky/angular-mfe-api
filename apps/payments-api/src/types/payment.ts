export type PaymentMethod = 'card' | 'ach';
export type PaymentStatus = 'pending' | 'completed' | 'failed';

export interface PaymentRequest {
  billId: string;
  amount: number;
  method: PaymentMethod;
  maskedAccount: string;
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

export interface ErrorResponse {
  error: string;
  message: string;
  requestId: string;
}
