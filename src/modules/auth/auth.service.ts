import crypto from 'crypto';
import {
  createProfile,
  createUser,
  findUserByEmail,
  updateEstimatedLifeExpectancy,
} from './auth.repository.js';
import { hashPassword, comparePassword } from '@/utils/auth/hash.js';
import {
  generateAccessToken,
  generateOneTimeToken,
  generateRefreshToken,
  hashToken,
} from '@/utils/auth/token.js';
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from '@/modules/email/email.service.js';
import { execQuery } from '@/database/query.js';
import { withTransaction } from '@/database/transaction.js';
import config from '@/config/config.js';
import type { RegisterDto } from './dto/register.dto.js';
import type { LoginRequestDto, LoginResponseDto } from './dto/login.dto.js';
import type { UserDto } from './dto/user.dto.js';
import { normalizeEmail } from '@/utils/normalizeEmail.js';
import {
  badRequest,
  unauthorized,
  forbidden,
  internal,
} from '@/utils/error.js';
import { pool } from '@/database/index.js';

export const register = async (data: RegisterDto) => {
  const existingUser = await findUserByEmail(data.email);
  if (existingUser) throw badRequest('Email already exists');

  const normalizedEmail = normalizeEmail(data.email);
  const hashedPassword = await hashPassword(data.password);
  const { rawToken, hashedToken } = await withTransaction(async (client) => {
    const userId = await createUser(normalizedEmail, hashedPassword, client);

    await createProfile(
      userId,
      data.name,
      data.birthYear,
      data.countryId,
      data.sexTypeId,
      client,
    );

    await updateEstimatedLifeExpectancy(userId, client);

    // verification token
    const { raw: rawToken, hashed: hashedToken } = generateOneTimeToken();

    await execQuery(
      client,
      `INSERT INTO email_verification_token (user_account_id, token_hash, expires_at)
            VALUES ($1, $2, NOW() + $3::interval)`,
      [userId, hashedToken, config.security.emailVerificationExpiresIn],
    );

    return { rawToken, hashedToken };
  });

  if (config.nodeEnv !== 'production') {
    console.log('Email verification token (dev):', rawToken);
  }

  // try {
  //   await sendVerificationEmail(normalizedEmail, rawToken);
  // } catch (err) {
  //   await execQuery(
  //     pool,
  //     `UPDATE email_verification_token
  //           SET used_at = NOW()
  //           WHERE token_hash = $1`,
  //     [hashedToken],
  //   );

  //   throw internal('Failed to send verification email');
  // }
};

export const login = async (
  data: LoginRequestDto,
): Promise<LoginResponseDto & { refreshToken: string }> => {
  const user = await findUserByEmail(data.email);
  if (!user) throw unauthorized('Invalid credentials');

  const match = await comparePassword(data.password, user.hashed_password);
  if (!match) throw unauthorized('Invalid credentials');

  // if (!user.is_email_verified) throw forbidden('Email not verified');

  const accessToken = generateAccessToken({ userId: user.id });
  const { raw: refreshTokenRaw, hashed: refreshTokenHashed } =
    generateRefreshToken();
  const isFirstLogin = user.last_login_at == null;

  await execQuery(
    pool,
    `INSERT INTO refresh_token (user_account_id, token_hash, expires_at)
        VALUES ($1, $2, NOW() + $3::interval)`,
    [user.id, refreshTokenHashed, config.security.refreshTokenExpiresIn],
  );

  await execQuery(
    pool,
    `UPDATE user_account SET last_login_at = NOW() WHERE id = $1`,
    [user.id],
  );

  const userDto: UserDto = {
    id: user.uid,
    email: user.email,
  };

  return {
    accessToken: accessToken,
    refreshToken: refreshTokenRaw,
    user: userDto,
    isFirstLogin: isFirstLogin,
  };
};

export const verifyEmail = async (token: string) => {
  const hashedToken = hashToken(token);

  const res = await execQuery(
    pool,
    `SELECT user_account_id FROM email_verification_token
        WHERE token_hash = $1 AND expires_at > NOW() AND used_at IS NULL`,
    [hashedToken],
  );

  const record = res.rows[0];
  if (!record) throw badRequest('Invalid or expired token');

  await execQuery(
    pool,
    `UPDATE credential SET is_email_verified = true
        WHERE user_account_id = $1`,
    [record.user_account_id],
  );

  await execQuery(
    pool,
    `UPDATE email_verification_token
        SET used_at = NOW()
        WHERE token_hash = $1`,
    [hashedToken],
  );
};

export const requestPasswordReset = async (email: string) => {
  const normalizedEmail = normalizeEmail(email);
  const res = await execQuery(
    pool,
    `SELECT id FROM credential WHERE email = $1`,
    [normalizedEmail],
  );

  const credential = res.rows[0];
  if (!credential) return;

  const { raw: rawToken, hashed: hashedToken } = generateOneTimeToken();

  await execQuery(
    pool,
    `INSERT INTO password_reset_token (credential_id, token_hash, expires_at)
        VALUES ($1, $2, NOW() + $3::interval)
        ON CONFLICT (credential_id) WHERE used_at IS NULL
        DO UPDATE SET token_hash = EXCLUDED.token_hash,
          expires_at = NOW() + $3::interval`,
    [credential.id, hashedToken, config.security.passwordResetExpiresIn],
  );

  if (config.nodeEnv !== 'production') {
    console.log('Password reset token (dev):', rawToken);
  }

  try {
    await sendPasswordResetEmail(normalizedEmail, rawToken);
  } catch (err) {
    await execQuery(
      pool,
      `UPDATE password_reset_token
          SET used_at = NOW()
          WHERE token_hash = $1`,
      [hashedToken],
    );
    console.error('Failed to send password reset email', err);
    return;
  }
};

export const resetPassword = async (token: string, password: string) => {
  const hashedToken = hashToken(token);

  await withTransaction(async (client) => {
    const res = await execQuery(
      client,
      `SELECT prt.id, prt.credential_id, c.user_account_id
          FROM password_reset_token prt
          JOIN credential c ON c.id = prt.credential_id
          WHERE prt.token_hash = $1 AND prt.expires_at > NOW() AND prt.used_at IS NULL`,
      [hashedToken],
    );

    const record = res.rows[0];
    if (!record) throw badRequest('Invalid or expired token');

    const hashedPassword = await hashPassword(password);

    await execQuery(
      client,
      `UPDATE credential SET hashed_password = $1 WHERE id = $2`,
      [hashedPassword, record.credential_id],
    );

    await execQuery(
      client,
      `UPDATE refresh_token SET revoked = true WHERE user_account_id = $1`,
      [record.user_account_id],
    );

    await execQuery(
      client,
      `UPDATE password_reset_token
          SET used_at = NOW()
          WHERE id = $1`,
      [record.id],
    );
  });
};

export const refresh = async (rawToken: string) => {
  const hashedToken = hashToken(rawToken);

  return withTransaction(async (client) => {
    const res = await execQuery(
      client,
      `SELECT id, user_account_id FROM refresh_token
            WHERE token_hash = $1 AND revoked = false AND expires_at > NOW()`,
      [hashedToken],
    );

    const token = res.rows[0];
    if (!token) throw unauthorized('Invalid refresh token');

    await execQuery(
      client,
      `UPDATE refresh_token SET revoked = true WHERE id = $1`,
      [token.id],
    );

    const accessToken = generateAccessToken({ userId: token.user_account_id });
    const { raw: newRawToken, hashed: newHashedToken } = generateRefreshToken();

    await execQuery(
      client,
      `INSERT INTO refresh_token (user_account_id, token_hash, expires_at)
            VALUES ($1, $2, NOW() + $3::interval)`,
      [
        token.user_account_id,
        newHashedToken,
        config.security.refreshTokenExpiresIn,
      ],
    );

    return { accessToken, refreshToken: newRawToken };
  });
};

export const logout = async (rawToken: string) => {
  const hashedToken = hashToken(rawToken);

  await execQuery(
    pool,
    `UPDATE refresh_token SET revoked = true WHERE token_hash = $1`,
    [hashedToken],
  );
};
