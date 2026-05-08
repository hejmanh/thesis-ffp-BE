import { createClient } from 'redis';
import config from '@/config/config.js';

export const redisClient = createClient({ url: config.redis.redisUrl });

redisClient.on('error', (err) => console.error('[Redis] Client Error', err));
redisClient.on('connect', () => console.log('[Redis] Client connected'));
redisClient.on('reconnecting', () => console.log('[Redis] Client reconnecting'));
