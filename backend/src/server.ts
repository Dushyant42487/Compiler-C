import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';

const PORT = parseInt(process.env.PORT || '5005', 10);
const HOST = process.env.HOST || '0.0.0.0';

const app = createApp();

app.listen(PORT, HOST, () => {
  console.log(`================================================================`);
  console.log(`  C Compiler Backend API Server Started`);
  console.log(`  Listening on: http://${HOST}:${PORT}`);
  console.log(`  Health Check: http://${HOST}:${PORT}/api/health`);
  console.log(`  Compiler Info: http://${HOST}:${PORT}/api/compiler/info`);
  console.log(`================================================================`);
});
