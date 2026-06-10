import rateLimit from 'express-rate-limit';
import type { Request } from 'express';
import { buildErrorPayload } from '@/utils/errorResponse.js';
import { ERROR_CODES } from '@/constants/errorCodes.js';

const getEmailRateLimitKey = (req: Request) => {
  const email =
    typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  return email || req.ip || 'unknown';
};

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 100 req / 15 min
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: buildErrorPayload({
    code: ERROR_CODES.RATE_LIMIT.AUTH,
    message: 'Too many requests, please try again later',
  }),
});

export const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 5 req / 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: buildErrorPayload({
    code: ERROR_CODES.RATE_LIMIT.EMAIL_VERIFICATION,
    message: 'Too many email verification attempts, please try again later',
  }),
  skip: (req) => !req.query.token, // only apply if token is present
});

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 5 req / 1 hour
  max: 5,
  keyGenerator: getEmailRateLimitKey,
  standardHeaders: true,
  legacyHeaders: false,
  message: buildErrorPayload({
    code: ERROR_CODES.RATE_LIMIT.PASSWORD_RESET,
    message: 'Too many password reset attempts, please try again later',
  }),
});
