import app from '@/app.js';
import config from '@/config/config.js';
import { checkDBConnection } from '@/utils/checkDB.js';

function startServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    const server = app.listen(config.port, () => {
      console.log(`Server is running on port ${config.port}`);
      console.log(`API documentation available at http://localhost:${config.port}/api-docs`);
      resolve();
    });

    server.once('error', reject);
  });
}

async function start() {
  try {
    await checkDBConnection();
    await startServer();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();