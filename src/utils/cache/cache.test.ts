import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const redisClientMock = vi.hoisted(() => ({
  isOpen: false,
  isReady: false,
  scan: vi.fn(),
  del: vi.fn(),
}));

vi.mock('./redis.js', () => ({
  redisClient: redisClientMock,
}));

import { invalidateCache } from './cache.js';

describe('invalidateCache', () => {
  beforeEach(() => {
    redisClientMock.isOpen = false;
    redisClientMock.isReady = false;
    redisClientMock.scan.mockReset();
    redisClientMock.del.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should no-op when redis is not ready', async () => {
    await expect(invalidateCache('reference:*')).resolves.toBeUndefined();

    expect(redisClientMock.scan).not.toHaveBeenCalled();
    expect(redisClientMock.del).not.toHaveBeenCalled();
  });

  it('should swallow redis errors during invalidation', async () => {
    redisClientMock.isOpen = true;
    redisClientMock.isReady = true;
    redisClientMock.scan.mockRejectedValue(new Error('Redis down'));

    await expect(invalidateCache('reference:*')).resolves.toBeUndefined();

    expect(redisClientMock.scan).toHaveBeenCalledTimes(1);
    expect(redisClientMock.del).not.toHaveBeenCalled();
  });
});
