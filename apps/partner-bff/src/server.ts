import { createApp } from './app.js';

const PORT = process.env['PORT'] || 3002;

const app = createApp();

app.listen(PORT, () => {
  process.stdout.write(
    JSON.stringify({ event: 'server_started', service: 'partner-bff', port: PORT }) + '\n',
  );
});
