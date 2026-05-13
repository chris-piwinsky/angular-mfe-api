import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export function correlationMiddleware(req: Request, res: Response, next: NextFunction): void {
  const correlationId = req.header('x-correlation-id') || randomUUID();
  res.locals.correlationId = correlationId;
  res.setHeader('x-request-id', correlationId);
  next();
}
