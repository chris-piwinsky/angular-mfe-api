import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { correlationIdMiddleware } from './middleware/correlationId';
import { requestLogger } from './middleware/requestLogger';
import { authMiddleware } from './middleware/auth';
import { billsRouter } from './routes/bills';
import { paymentsRouter } from './routes/payments';

export function createApp(): Application {
  const app = express();

  // Allow shell-app (4200) and partner-bff demo page (3002)
  const allowedOrigins = ['http://localhost:4200', 'http://localhost:3002'];
  app.use(cors({ 
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  }));
  app.use(express.json());
  app.use(correlationIdMiddleware);
  app.use(requestLogger);

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  // All /api routes require auth
  app.use('/api', authMiddleware);
  app.use('/api/bills', billsRouter);
  app.use('/api/payments', paymentsRouter);

  return app;
}
