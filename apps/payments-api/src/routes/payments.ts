import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { payments } from '../data/payments';
import { PaymentRequest } from '../types/payment';

export const paymentsRouter = Router();

// GET /v1/payments?billId= — billId is required
paymentsRouter.get('/', (req: Request, res: Response) => {
  const requestId = (req.headers['x-correlation-id'] as string) ?? randomUUID();
  const { billId } = req.query;

  if (!billId) {
    res.status(400).json({
      error: 'missing_parameter',
      message: 'Query parameter "billId" is required.',
      requestId,
    });
    return;
  }

  const result = payments.filter((p) => p.billId === billId);

  res.json({
    data: result.map((p) => ({ ...p, requestId })),
    requestId,
  });
});

// POST /v1/payments
paymentsRouter.post('/', (req: Request, res: Response) => {
  const requestId = (req.headers['x-correlation-id'] as string) ?? randomUUID();
  const body = req.body as PaymentRequest;

  if (
    !body.billId ||
    body.amount == null ||
    !body.method ||
    !body.maskedAccount
  ) {
    res.status(400).json({
      error: 'missing_fields',
      message: 'billId, amount, method, and maskedAccount are required.',
      requestId,
    });
    return;
  }

  const payment = {
    id: randomUUID(),
    billId: body.billId,
    amount: body.amount,
    method: body.method,
    maskedAccount: body.maskedAccount,
    status: 'completed' as const,
    createdAt: new Date().toISOString(),
    requestId,
  };

  payments.push(payment);

  res.status(201).json(payment);
});

// GET /v1/payments/:id
paymentsRouter.get('/:id', (req: Request, res: Response) => {
  const requestId = (req.headers['x-correlation-id'] as string) ?? randomUUID();
  const payment = payments.find((p) => p.id === req.params.id);

  if (!payment) {
    res.status(404).json({
      error: 'payment_not_found',
      message: `Payment ${req.params.id} not found.`,
      requestId,
    });
    return;
  }

  res.json({ ...payment, requestId });
});
