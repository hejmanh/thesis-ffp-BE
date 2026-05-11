import app from '@/app.js';
import config from '@/config/config.js';
import { checkDBConnection } from '@/utils/checkDB.js';
import { redisClient } from '@/utils/cache/redis.js';
import { warmCache } from '@/utils/cache/warmCache.js';

function startServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    const server = app.listen(config.port, () => {
      console.log(`[Server] Server is running on port ${config.port}`);
      console.log(
        `[Server] API documentation available at http://localhost:${config.port}/api-docs`,
      );
      resolve();
    });

    server.once('error', reject);
  });
}

async function start() {
  try {
    await checkDBConnection();
  } catch (error) {
    console.error('[Server] DB connection failed:', error);
    process.exit(1);
  }

  if (config.redis.enabled) {
    try {
      await redisClient.connect();
    } catch (error) {
      console.warn('[Server] Redis unavailable, running without cache:', error);
    }

    try {
      await warmCache();
    } catch (error) {
      console.warn(
        '[Server] Cache warm-up failed, continuing without preloaded cache:',
        error,
      );
    }
  } else {
    console.log('[Server] Redis disabled, skipping cache connection');
  }

  await startServer();
}

start();
