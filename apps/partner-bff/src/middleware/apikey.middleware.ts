import { Request, Response, NextFunction } from 'express';

export function apikeyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const apiKey = req.header('X-Partner-Key');

  if (!apiKey || apiKey !== 'demo-partner-key') {
    res.status(401).json({
      error: 'Unauthorized',
      requestId: res.locals.correlationId,
    });
    return;
  }

  next();
}
