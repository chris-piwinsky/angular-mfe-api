import { createApp } from './app';

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3001;

const app = createApp();

app.listen(port, host, () => {
  console.log(JSON.stringify({ event: 'server_started', host, port }));
});
