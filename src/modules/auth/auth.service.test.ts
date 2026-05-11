import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authService from './auth.service.js';
import { execQuery } from '@/database/query.js';
import { sendPasswordResetEmail } from '@/utils/email/index.js';
import { generateEmailVerificationToken } from '@/utils/auth/token.js';

vi.mock('@/database/query.js', () => ({
  execQuery: vi.fn(),
}));

vi.mock('@/utils/email/index.js', () => ({
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock('@/utils/auth/token.js', async () => {
  const actual = await vi.importActual<typeof import('@/utils/auth/token.js')>(
    '@/utils/auth/token.js',
  );

  return {
    ...actual,
    generateEmailVerificationToken: vi.fn(),
  };
});

const asMock = <T>(fn: T) => fn as unknown as ReturnType<typeof vi.fn>;

describe('Auth Service - requestPasswordReset', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles concurrent reset requests without throwing', async () => {
    const execQueryMock = asMock(execQuery);
    execQueryMock.mockImplementation((_client, query) => {
      if (query.includes('SELECT id FROM credential')) {
        return Promise.resolve({ rows: [{ id: 10 }] });
      }

      return Promise.resolve({ rows: [] });
    });

    asMock(generateEmailVerificationToken)
      .mockReturnValueOnce({ raw: 'raw-1', hashed: 'hash-1' })
      .mockReturnValueOnce({ raw: 'raw-2', hashed: 'hash-2' });

    asMock(sendPasswordResetEmail).mockResolvedValue(undefined);

    await expect(
      Promise.all([
        authService.requestPasswordReset('user@example.com'),
        authService.requestPasswordReset('user@example.com'),
      ]),
    ).resolves.toBeDefined();

    const insertCall = execQueryMock.mock.calls.find((call) =>
      (call[1] as string).includes('INSERT INTO password_reset_token'),
    );

    expect(insertCall?.[1]).toContain(
      'ON CONFLICT (credential_id) WHERE used_at IS NULL',
    );
    expect(sendPasswordResetEmail).toHaveBeenCalledTimes(2);
  });

  it('returns success when email sending fails', async () => {
    const execQueryMock = asMock(execQuery);
    execQueryMock.mockImplementation((_client, query) => {
      if (query.includes('SELECT id FROM credential')) {
        return Promise.resolve({ rows: [{ id: 10 }] });
      }

      return Promise.resolve({ rows: [] });
    });

    asMock(generateEmailVerificationToken).mockReturnValue({
      raw: 'raw-1',
      hashed: 'hash-1',
    });

    asMock(sendPasswordResetEmail).mockRejectedValue(new Error('Email failed'));

    await expect(
      authService.requestPasswordReset('user@example.com'),
    ).resolves.toBeUndefined();

    const markUsedCall = execQueryMock.mock.calls.find((call) =>
      (call[1] as string).includes('UPDATE password_reset_token'),
    );

    expect(markUsedCall).toBeTruthy();
  });
});
