import { Router, Request, Response } from 'express';
import { fetchBillById } from '../services/bills.service';
import { fetchPaymentsForBill, submitPayment } from '../services/payments.service';
import { PaymentRequest } from '../types';

export const paymentsRouter = Router();

// GET /api/payments?billId= — proxy to payments-api
paymentsRouter.get('/', async (req: Request, res: Response) => {
  const correlationId: string = res.locals['correlationId'];
  const { billId } = req.query;

  if (!billId) {
    res.status(400).json({
      error: 'missing_parameter',
      message: 'Query parameter "billId" is required.',
      requestId: correlationId,
    });
    return;
  }

  try {
    const payments = await fetchPaymentsForBill(billId as string, correlationId);
    res.json({ data: payments, requestId: correlationId });
  } catch {
    res.status(502).json({
      error: 'payments_unavailable',
      message: 'Unable to retrieve payments at this time.',
      requestId: correlationId,
    });
  }
});

// POST /api/payments — validate then proxy to payments-api
paymentsRouter.post('/', async (req: Request, res: Response) => {
  const correlationId: string = res.locals['correlationId'];
  const { billId, amount, method, maskedAccount } = req.body as PaymentRequest;

  // Validate amount is a positive number
  if (typeof amount !== 'number' || amount <= 0) {
    res.status(400).json({
      error: 'invalid_amount',
      message: 'Amount must be a number greater than zero.',
      requestId: correlationId,
    });
    return;
  }

  // Validate bill exists
  let bill;
  try {
    bill = await fetchBillById(billId, correlationId);
  } catch {
    res.status(502).json({
      error: 'bills_unavailable',
      message: 'Unable to validate bill at this time.',
      requestId: correlationId,
    });
    return;
  }

  if (!bill) {
    res.status(404).json({
      error: 'bill_not_found',
      message: `Bill ${billId} not found.`,
      requestId: correlationId,
    });
    return;
  }

  // Validate amount does not exceed remaining balance (BFF owns this rule)
  if (amount > bill.balance) {
    res.setHeader('x-arch-note', 'A3:BALANCE-GUARD; amount <= balance validated at BFF; payments-api never received an invalid amount');
    res.status(422).json({
      error: 'amount_exceeds_balance',
      message: `Amount exceeds the remaining balance of $${bill.balance.toFixed(2)}.`,
      balance: bill.balance,
      requestId: correlationId,
    });
    return;
  }

  // Proxy to payments-api
  try {
    const payment = await submitPayment({ billId, amount, method, maskedAccount }, correlationId);
    res.setHeader('x-arch-note', 'A3:BFF-PROXY; payment validated and proxied; domain API did not re-validate business rules');
    res.status(201).json({ ...payment, requestId: correlationId });
  } catch {
    res.status(502).json({
      error: 'payments_unavailable',
      message: 'Unable to submit payment at this time.',
      requestId: correlationId,
    });
  }
});
