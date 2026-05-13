import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { paymentsRouter } from './routes/payments';
import { errorHandler } from './middleware/errorHandler';

export function createApp(): Application {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.use('/v1/payments', paymentsRouter);

  // Must be registered last
  app.use(errorHandler);

  return app;
}
