import { Bill } from '../types';

const BILLS_API_URL = process.env.BILLS_API_URL ?? 'http://localhost:4001';

export async function fetchBills(
  params: URLSearchParams,
  correlationId: string,
): Promise<Bill[]> {
  const query = params.toString();
  const url = `${BILLS_API_URL}/v1/bills${query ? '?' + query : ''}`;

  const res = await fetch(url, {
    headers: { 'x-correlation-id': correlationId },
  });

  if (!res.ok) {
    throw new Error(`bills-api responded with ${res.status}`);
  }

  const body = (await res.json()) as { data: Bill[] };
  return body.data;
}

export async function fetchBillById(
  id: string,
  correlationId: string,
): Promise<Bill | null> {
  const res = await fetch(`${BILLS_API_URL}/v1/bills/${id}`, {
    headers: { 'x-correlation-id': correlationId },
  });

  if (res.status === 404) return null;

  if (!res.ok) {
    throw new Error(`bills-api responded with ${res.status}`);
  }

  return res.json() as Promise<Bill>;
}
