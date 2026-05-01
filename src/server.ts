import app from '@/app.js';
import config from '@/config/config.js';
import { checkDBConnection } from '@/utils/checkDB.js';

async function start() {
  try {
    await checkDBConnection();

    app.listen(config.port, () => {
      console.log(`Server is running on port ${config.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();