import express, { Application } from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';
import { correlationMiddleware } from './middleware/correlation.middleware.js';
import { apikeyMiddleware } from './middleware/apikey.middleware.js';
import { requestLogger } from './middleware/requestLogger.js';
import billsRouter from './routes/bills.routes.js';
import paymentsRouter from './routes/payments.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

  // ⚠️ DEMO-ONLY: CORS + static file serving for visual demo page
  // Production partner-bff would NOT have CORS (server-to-server only)
  // This is infrastructure to demonstrate A2 to non-technical stakeholders
  if (process.env['ENABLE_DEMO_CORS'] === 'true') {
    app.use(
      cors({
        origin: ['http://localhost:3002', 'http://localhost:3001'],
        credentials: true,
      }),
    );
  }

  // Serve static demo page at http://localhost:3002/demo.html
  // In dev mode (nx serve), serve from source; in production, serve from dist
  const publicDistPath = join(__dirname, 'public');
  const publicSrcPath = join(process.cwd(), 'apps', 'partner-bff', 'src', 'public');
  const publicPath = existsSync(publicDistPath) ? publicDistPath : publicSrcPath;
  app.use(express.static(publicPath));

  return app;
}
