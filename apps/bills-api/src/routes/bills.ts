import { Router, Request, Response } from 'express';
import { bills } from '../data/bills';
import { BillStatus } from '../types/bill';

export const billsRouter = Router();

billsRouter.get('/', (req: Request, res: Response) => {
  const requestId = res.locals['correlationId'] as string;
  const { status, accountId, limit = '20', offset = '0' } = req.query;

  let result = [...bills];

  if (status) {
    result = result.filter((b) => b.status === (status as BillStatus));
  }
  if (accountId) {
    result = result.filter((b) => b.accountId === accountId);
  }

  const limitNum = Math.max(1, parseInt(limit as string, 10) || 20);
  const offsetNum = Math.max(0, parseInt(offset as string, 10) || 0);
  const page = result.slice(offsetNum, offsetNum + limitNum);

  res.json({
    data: page.map((b) => ({ ...b, requestId })),
    requestId,
  });
});

billsRouter.get('/:id', (req: Request, res: Response) => {
  const requestId = res.locals['correlationId'] as string;
  const bill = bills.find((b) => b.id === req.params.id);

  if (!bill) {
    res.status(404).json({
      error: 'bill_not_found',
      message: `Bill ${req.params.id} not found.`,
      requestId,
    });
    return;
  }

  res.json({ ...bill, requestId });
});
