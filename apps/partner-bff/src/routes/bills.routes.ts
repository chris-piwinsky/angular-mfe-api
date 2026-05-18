import { Router, Request, Response } from 'express';

const router = Router();

const BILLS_API_URL = process.env['BILLS_API_URL'] || 'http://localhost:4001';

interface BillDetail {
  id: string;
  accountId: string;
  balance: number;
  dueDate: string;
  status: string;
  // ... other fields we'll ignore
  [key: string]: unknown;
}

// GET /partner/bills - List bills with reduced projection
router.get('/bills', async (req: Request, res: Response) => {
  const { status, accountId, limit, offset } = req.query;
  const correlationId = res.locals.correlationId;

  const params = new URLSearchParams();
  if (status) params.set('status', status as string);
  if (accountId) params.set('accountId', accountId as string);
  if (limit) params.set('limit', limit as string);
  if (offset) params.set('offset', offset as string);

  const queryString = params.toString();
  const url = queryString
    ? `${BILLS_API_URL}/v1/bills?${queryString}`
    : `${BILLS_API_URL}/v1/bills`;

  try {
    const response = await fetch(url, {
      headers: { 'x-correlation-id': correlationId },
    });

    if (!response.ok) {
      res.status(502).json({
        error: 'Bills service unavailable',
        requestId: correlationId,
      });
      return;
    }

    const responseData = await response.json();
    const bills: BillDetail[] = responseData.data || [];

    // Reduce to partner payload: only billId, accountId, balance, dueDate, status
    const reducedBills = bills.map((bill) => ({
      billId: bill.id,
      accountId: bill.accountId,
      balance: bill.balance,
      dueDate: bill.dueDate,
      status: bill.status,
    }));

    res.json(reducedBills);
  } catch (error) {
    res.status(502).json({
      error: 'Bills service unavailable',
      requestId: correlationId,
    });
  }
});

// GET /partner/bills/:id - Single bill with reduced projection, no payment history
router.get('/bills/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const correlationId = res.locals.correlationId;

  const url = `${BILLS_API_URL}/v1/bills/${id}`;

  try {
    const response = await fetch(url, {
      headers: { 'x-correlation-id': correlationId },
    });

    if (response.status === 404) {
      res.status(404).json({
        error: 'Bill not found',
        requestId: correlationId,
      });
      return;
    }

    if (!response.ok) {
      res.status(502).json({
        error: 'Bills service unavailable',
        requestId: correlationId,
      });
      return;
    }

    const bill: BillDetail = await response.json();

    // Reduce to partner payload: only billId, accountId, balance, dueDate, status
    // Note: NO call to payments-api — partners don't see payment history
    const reducedBill = {
      billId: bill.id,
      accountId: bill.accountId,
      balance: bill.balance,
      dueDate: bill.dueDate,
      status: bill.status,
      requestId: correlationId,
    };

    res.json(reducedBill);
  } catch (error) {
    res.status(502).json({
      error: 'Bills service unavailable',
      requestId: correlationId,
    });
  }
});

export default router;
