import { createApp } from './app.js';

const PORT = process.env['PORT'] || 3002;

const app = createApp();

app.listen(PORT, () => {
  console.log(`partner-bff listening on :${PORT}`);
});
