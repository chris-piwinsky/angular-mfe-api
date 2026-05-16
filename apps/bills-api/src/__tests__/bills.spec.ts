import request from 'supertest';
import { createApp } from '../app';
import { bills } from '../data/bills';

const app = createApp();

describe('GET /v1/bills', () => {
  it('returns an array and each item has the correct schema', async () => {
    const res = await request(app).get('/v1/bills');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    for (const bill of res.body.data) {
      expect(bill).toHaveProperty('id');
      expect(bill).toHaveProperty('invoiceNumber');
      expect(bill).toHaveProperty('dueDate');
      expect(bill).toHaveProperty('totalAmount');
      expect(bill).toHaveProperty('amountPaid');
      expect(bill).toHaveProperty('balance');
      expect(bill).toHaveProperty('status');
      expect(bill).toHaveProperty('lineItems');
      expect(Array.isArray(bill.lineItems)).toBe(true);
      expect(typeof bill.requestId).toBe('string');
    }
  });

  it('returns only overdue bills when ?status=overdue', async () => {
    const res = await request(app).get('/v1/bills?status=overdue');

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    for (const bill of res.body.data) {
      expect(bill.status).toBe('overdue');
    }
  });

  it('balance is always totalAmount - amountPaid', async () => {
    const res = await request(app).get('/v1/bills');

    for (const bill of res.body.data) {
      const expected =
        Math.round((bill.totalAmount - bill.amountPaid) * 100) / 100;
      expect(bill.balance).toBeCloseTo(expected, 5);
    }
  });

  it('every response includes a requestId string', async () => {
    const res = await request(app).get('/v1/bills');

    expect(typeof res.body.requestId).toBe('string');
    expect(res.body.requestId.length).toBeGreaterThan(0);
  });
});

describe('GET /v1/bills/:id', () => {
  it('returns a single bill with lineItems for a valid id', async () => {
    const validId = bills[0].id;
    const res = await request(app).get(`/v1/bills/${validId}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(validId);
    expect(Array.isArray(res.body.lineItems)).toBe(true);
    expect(typeof res.body.requestId).toBe('string');
  });

  it('returns JSON 404 for an unknown id', async () => {
    const res = await request(app).get('/v1/bills/bad-id');

    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body.error).toBe('bill_not_found');
    expect(typeof res.body.requestId).toBe('string');
  });
});
