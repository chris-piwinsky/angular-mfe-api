import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const requestId = randomUUID();
  console.error(
    JSON.stringify({
      event: 'unhandled_error',
      message: err.message,
      requestId,
    }),
  );
  res.status(500).json({
    error: 'internal_error',
    message: 'An unexpected error occurred.',
    requestId,
  });
}
