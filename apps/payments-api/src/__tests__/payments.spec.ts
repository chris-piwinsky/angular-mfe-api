import request from 'supertest';
import { createApp } from '../app';

// Re-create a fresh app per test to avoid shared mutable payments state
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  // Reset module registry so data/payments.ts is re-imported fresh each test
  jest.resetModules();
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createApp: freshCreateApp } = require('../app');
  app = freshCreateApp();
});

describe('GET /v1/payments', () => {
  it('returns 400 when billId query param is missing', async () => {
    const res = await request(app).get('/v1/payments');

    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body.error).toBe('missing_parameter');
    expect(typeof res.body.requestId).toBe('string');
  });

  it('returns seeded payments for billId=bill-001', async () => {
    const res = await request(app).get('/v1/payments?billId=bill-001');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    for (const p of res.body.data) {
      expect(p.billId).toBe('bill-001');
    }
  });
});

describe('POST /v1/payments', () => {
  it('returns 201 with a Payment object for a valid body', async () => {
    const body = {
      billId: 'bill-001',
      amount: 50.0,
      method: 'card',
      maskedAccount: '••••1234',
    };

    const res = await request(app).post('/v1/payments').send(body);

    expect(res.status).toBe(201);
    expect(typeof res.body.id).toBe('string');
    expect(res.body.billId).toBe('bill-001');
    expect(res.body.amount).toBe(50.0);
    expect(res.body.method).toBe('card');
    expect(res.body.maskedAccount).toBe('••••1234');
    expect(res.body.status).toBe('completed');
    expect(typeof res.body.createdAt).toBe('string');
    expect(typeof res.body.requestId).toBe('string');
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/v1/payments').send({ amount: 50.0 });

    expect(res.status).toBe(400);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(typeof res.body.requestId).toBe('string');
  });
});
