import { Router, Request, Response } from 'express';

const router = Router();

const BILLS_API_URL = process.env['BILLS_API_URL'] || 'http://localhost:4001';
const PAYMENTS_API_URL = process.env['PAYMENTS_API_URL'] || 'http://localhost:4002';

interface BillDetail {
  id: string;
  balance: number;
  [key: string]: unknown;
}

// POST /partner/payments - Webhook pattern (returns 202 Accepted)
router.post('/payments', async (req: Request, res: Response) => {
  const { billId, amount, callbackUrl } = req.body;
  const correlationId = res.locals.correlationId;
  
  // Validate required fields
  if (!billId || amount === undefined || !callbackUrl) {
    res.status(400).json({
      error: 'Missing required fields: billId, amount, callbackUrl',
      requestId: correlationId
    });
    return;
  }
  
  // Fetch bill to validate amount <= balance
  try {
    const billResponse = await fetch(`${BILLS_API_URL}/v1/bills/${billId}`, {
      headers: { 'x-correlation-id': correlationId }
    });
    
    if (billResponse.status === 404) {
      res.status(404).json({
        error: 'Bill not found',
        requestId: correlationId
      });
      return;
    }
    
    if (!billResponse.ok) {
      res.status(502).json({
        error: 'Bills service unavailable',
        requestId: correlationId
      });
      return;
    }
    
    const bill: BillDetail = await billResponse.json();
    
    // Balance guard: amount must be <= balance (same rule as web-bff)
    if (amount > bill.balance) {
      res.status(422).json({
        error: `Amount ${amount} exceeds balance ${bill.balance}`,
        requestId: correlationId
      });
      return;
    }
    
    // Submit payment to payments-api
    const paymentResponse = await fetch(`${PAYMENTS_API_URL}/v1/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-correlation-id': correlationId
      },
      body: JSON.stringify({
        billId,
        amount,
        method: 'ach',
        maskedAccount: '0000'
      })
    });
    
    if (!paymentResponse.ok) {
      res.status(502).json({
        error: 'Payment service unavailable',
        requestId: correlationId
      });
      return;
    }
    
    const payment = await paymentResponse.json();
    
    // Simulate webhook callback (log only, no real HTTP call)
    console.log(`CALLBACK SIMULATION: would POST { billId: "${billId}", paymentId: "${payment.id}", status: "completed" } to ${callbackUrl}`);
    
    // Return 202 Accepted (async processing pattern)
    res.status(202).json({
      requestId: correlationId,
      message: 'Payment accepted',
      callbackUrl
    });
  } catch (error) {
    res.status(502).json({
      error: 'Service unavailable',
      requestId: correlationId
    });
  }
});

export default router;
