import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as authService from './auth.service.js';
import { execQuery } from '@/database/query.js';
import { sendPasswordResetEmail } from '@/modules/email/email.service.js';
import { generateOneTimeToken } from '@/utils/auth/token.js';
import { withTransaction } from '@/database/transaction.js';
import { hashPassword } from '@/utils/auth/hash.js';

vi.mock('@/database/query.js', () => ({
  execQuery: vi.fn(),
}));

vi.mock('@/database/transaction.js', () => ({
  withTransaction: vi.fn(),
}));

vi.mock('@/utils/auth/hash.js', () => ({
  hashPassword: vi.fn(),
  comparePassword: vi.fn(),
}));

vi.mock('@/modules/email/email.service.js', () => ({
  sendPasswordResetEmail: vi.fn(),
  sendVerificationEmail: vi.fn(),
}));

vi.mock('@/utils/auth/token.js', async () => {
  const actual = await vi.importActual<typeof import('@/utils/auth/token.js')>(
    '@/utils/auth/token.js',
  );

  return {
    ...actual,
    generateOneTimeToken: vi.fn(),
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

    asMock(generateOneTimeToken)
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

    asMock(generateOneTimeToken).mockReturnValue({
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

describe('Auth Service - resetPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates credential, revokes refresh tokens, and marks reset token used', async () => {
    const execQueryMock = asMock(execQuery);
    execQueryMock.mockImplementation((_client, query) => {
      if (query.includes('FROM password_reset_token')) {
        return Promise.resolve({
          rows: [{ id: 11, credential_id: 22, user_account_id: 33 }],
        });
      }

      return Promise.resolve({ rows: [] });
    });

    asMock(hashPassword).mockResolvedValue('hashed-new-password');
    asMock(withTransaction).mockImplementation(async (callback) =>
      callback({} as any),
    );

    await expect(
      authService.resetPassword('raw-token', 'new-pass'),
    ).resolves.toBeUndefined();

    const updateCredentialCall = execQueryMock.mock.calls.find((call) =>
      (call[1] as string).includes('UPDATE credential SET hashed_password'),
    );
    const revokeRefreshCall = execQueryMock.mock.calls.find((call) =>
      (call[1] as string).includes('UPDATE refresh_token SET revoked = true'),
    );
    const markUsedCall = execQueryMock.mock.calls.find((call) =>
      (call[1] as string).includes('UPDATE password_reset_token'),
    );

    expect(updateCredentialCall).toBeTruthy();
    expect(revokeRefreshCall).toBeTruthy();
    expect(markUsedCall).toBeTruthy();
    expect(withTransaction).toHaveBeenCalledTimes(1);
  });

  it('throws when the reset token is invalid', async () => {
    const execQueryMock = asMock(execQuery);
    execQueryMock.mockImplementation((_client, query) => {
      if (query.includes('FROM password_reset_token')) {
        return Promise.resolve({ rows: [] });
      }

      return Promise.resolve({ rows: [] });
    });

    asMock(withTransaction).mockImplementation(async (callback) =>
      callback({} as any),
    );

    await expect(
      authService.resetPassword('raw-token', 'new-pass'),
    ).rejects.toBeTruthy();
  });
});
