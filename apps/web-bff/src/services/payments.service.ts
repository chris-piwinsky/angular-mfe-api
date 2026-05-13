import { Payment, PaymentRequest } from '../types';

const PAYMENTS_API_URL = process.env.PAYMENTS_API_URL ?? 'http://localhost:4002';

export async function fetchPaymentsForBill(billId: string, correlationId: string): Promise<Payment[]> {
  const res = await fetch(`${PAYMENTS_API_URL}/v1/payments?billId=${encodeURIComponent(billId)}`, {
    headers: { 'x-correlation-id': correlationId },
  });

  if (!res.ok) {
    throw new Error(`payments-api responded with ${res.status}`);
  }

  const body = await res.json() as { data: Payment[] };
  // Sort most recent first
  return body.data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function submitPayment(payload: PaymentRequest, correlationId: string): Promise<Payment> {
  const res = await fetch(`${PAYMENTS_API_URL}/v1/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-correlation-id': correlationId,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`payments-api responded with ${res.status}`);
  }

  return res.json() as Promise<Payment>;
}
