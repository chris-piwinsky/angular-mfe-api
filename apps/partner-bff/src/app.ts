import express, { Application } from 'express';
import { correlationMiddleware } from './middleware/correlation.middleware.js';
import { apikeyMiddleware } from './middleware/apikey.middleware.js';
import { requestLogger } from './middleware/requestLogger.js';
import billsRouter from './routes/bills.routes.js';
import paymentsRouter from './routes/payments.routes.js';

export function createApp(): Application {
  const app = express();

  // Body parsing
  app.use(express.json());

  // Correlation ID on all routes
  app.use(correlationMiddleware);

  // Structured JSON request logging (E10)
  app.use(requestLogger);

  // Health check (no auth required)
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', surface: 'partner' });
  });

  // API key auth on all /partner/* routes
  app.use('/partner', apikeyMiddleware);

  // Mount routers
  app.use('/partner', billsRouter);
  app.use('/partner', paymentsRouter);

  // Note: NO CORS middleware — partner-bff serves server-to-server B2B consumers, not browsers
  // Adding CORS here would be incorrect and misleading

  return app;
}
