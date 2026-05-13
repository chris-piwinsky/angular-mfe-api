import { Request, Response, NextFunction } from 'express';

const VALID_TOKEN = process.env.DEMO_TOKEN ?? 'demo-token';

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];

  if (!authHeader || authHeader !== `Bearer ${VALID_TOKEN}`) {
    res.setHeader('x-arch-note', 'E4:AUTH-BOUNDARY; token validated at BFF; downstream services never received an unauthenticated call');
    res.status(401).json({
      error: 'unauthorized',
      message: 'A valid Authorization header is required.',
      requestId: res.locals['correlationId'],
    });
    return;
  }

  next();
}
