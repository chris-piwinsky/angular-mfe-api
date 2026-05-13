import { Router, Request, Response } from 'express';
import { fetchBillById, fetchBills } from '../services/bills.service';
import { fetchPaymentsForBill } from '../services/payments.service';

export const billsRouter = Router();

// GET /api/bills — proxy to bills-api with query params
billsRouter.get('/', async (req: Request, res: Response) => {
  const correlationId: string = res.locals['correlationId'];

  try {
    const params = new URLSearchParams();
    if (req.query['status']) params.set('status', req.query['status'] as string);
    if (req.query['accountId']) params.set('accountId', req.query['accountId'] as string);
    if (req.query['limit']) params.set('limit', req.query['limit'] as string);
    if (req.query['offset']) params.set('offset', req.query['offset'] as string);

    const bills = await fetchBills(params, correlationId);
    res.setHeader('x-arch-note', 'A3:BFF-PROXY; bills-api proxied; MFE never calls domain APIs directly');
    res.json({ data: bills, requestId: correlationId });
  } catch {
    res.status(502).json({
      error: 'bills_unavailable',
      message: 'Unable to retrieve bills at this time.',
      requestId: correlationId,
    });
  }
});

// GET /api/bills/:id — aggregate bill + payment history
billsRouter.get('/:id', async (req: Request, res: Response) => {
  const correlationId: string = res.locals['correlationId'];

  let bill;
  try {
    bill = await fetchBillById(req.params.id, correlationId);
  } catch {
    res.status(502).json({
      error: 'bills_unavailable',
      message: 'Unable to retrieve bill at this time.',
      requestId: correlationId,
    });
    return;
  }

  if (!bill) {
    res.status(404).json({
      error: 'bill_not_found',
      message: `Bill ${req.params.id} not found.`,
      requestId: correlationId,
    });
    return;
  }

  // Graceful degradation: payments-api failure does not fail this request
  let payments: unknown[] = [];
  let paymentsApiDown = false;
  try {
    payments = await fetchPaymentsForBill(req.params.id, correlationId);
  } catch {
    paymentsApiDown = true;
    process.stdout.write(
      JSON.stringify({
        event: 'payments_api_unavailable',
        billId: req.params.id,
        correlationId,
      }) + '\n'
    );
  }

  if (paymentsApiDown) {
    res.setHeader('x-arch-note', 'E5:GRACEFUL-DEGRADE; payments-api unavailable; returned payments:[] without failing the bill response');
  } else {
    res.setHeader('x-arch-note', 'E3:BFF-AGGREGATE; 1 BFF call -> bills-api + payments-api merged into single response');
  }

  // Keep response shape consistent with other BFF endpoints.
  res.json({ data: { ...bill, payments }, requestId: correlationId });
});
