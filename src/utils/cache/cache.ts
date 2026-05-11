import { redisClient } from './redis.js';

export const isRedisAvailable = (): boolean =>
  redisClient.isOpen && redisClient.isReady;

export const withCache = async <T>(
  key: string,
  ttlSeconds: number | null,
  fetchFunction: () => Promise<T>,
): Promise<T> => {
  if (isRedisAvailable()) {
    try {
      const cachedData = await redisClient.get(key);

      if (cachedData) {
        return JSON.parse(cachedData) as T;
      }
    } catch (err) {
      console.error(`[Cache] Read error, falling through to DB: `, err);
    }
  }

  const data = await fetchFunction();

  if (isRedisAvailable()) {
    try {
      if (ttlSeconds !== null) {
        await redisClient.setEx(key, ttlSeconds, JSON.stringify(data));
      } else {
        await redisClient.set(key, JSON.stringify(data));
      }
    } catch (err) {
      console.error(`[Cache] Write error: `, err);
    }
  }

  return data;
};

export const invalidateCache = async (pattern: string) => {
  if (!isRedisAvailable()) {
    console.warn(`[Cache] Invalidation skipped — Redis unavailable`);
    return;
  }

  try {
    let cursor = '0';
    let totalDeleted = 0;

    do {
      const result = await redisClient.scan(cursor, {
        MATCH: pattern,
        COUNT: 100,
      });

      cursor = result.cursor;
      const keys = result.keys;

      if (keys.length > 0) {
        await redisClient.del(keys);
        totalDeleted += keys.length;
      }
    } while (cursor !== '0');

    console.log(
      `[Cache] Invalidated ${totalDeleted} keys matching "${pattern}"`,
    );
  } catch (error) {
    console.warn(
      `[Cache] Invalidation skipped for pattern "${pattern}" due to Redis error`,
      error,
    );
  }
};
