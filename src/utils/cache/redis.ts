import { createClient } from 'redis';
import config from '@/config/config.js';

const redisUrl = config.redis.redisUrl || 'redis://localhost:6379';
export const redisClient = createClient({ url: redisUrl });

redisClient.on('error', (err) => console.error('[Redis] Client Error', err));
redisClient.on('connect', () => console.log('[Redis] Client connected'));
redisClient.on('reconnecting', () =>
  console.log('[Redis] Client reconnecting'),
);
