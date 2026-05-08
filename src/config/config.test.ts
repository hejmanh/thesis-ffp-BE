import { afterEach, describe, expect, it, vi } from 'vitest';

const loadConfig = async (saltRounds?: string) => {
  vi.resetModules();

  if (saltRounds === undefined) {
    vi.unstubAllEnvs();
  } else {
    vi.stubEnv('BCRYPT_SALT_ROUNDS', saltRounds);
  }

  const { default: config } = await import('./config.js');
  return config;
};

describe('config security settings', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should accept a valid bcrypt cost factor', async () => {
    const config = await loadConfig('12');

    expect(config.security.saltRounds).toBe(12);
  });

  it('should fall back for non-integer or out-of-range bcrypt cost factors', async () => {
    expect((await loadConfig('12.5')).security.saltRounds).toBe(10);
    expect((await loadConfig('Infinity')).security.saltRounds).toBe(10);
    expect((await loadConfig('3')).security.saltRounds).toBe(10);
    expect((await loadConfig('32')).security.saltRounds).toBe(10);
  });
});
