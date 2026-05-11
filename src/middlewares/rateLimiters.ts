import rateLimit from 'express-rate-limit';
import { buildErrorPayload } from '@/utils/errorResponse.js';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 100 req / 15 min
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: buildErrorPayload({
    message: 'Too many requests, please try again later',
  }),
});

export const emailVerificationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 5 req / 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: buildErrorPayload({
    message: 'Too many email verification attempts, please try again later',
  }),
  skip: (req) => !req.query.token, // only apply if token is present
});

export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 5 req / 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: buildErrorPayload({
    message: 'Too many password reset attempts, please try again later',
  }),
});
