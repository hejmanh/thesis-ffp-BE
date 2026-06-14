import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { forbidden } from '@/utils/error.js';
import { ERROR_CODES } from '@/constants/errorCodes.js';

export const createCsrfToken = (): string =>
  crypto.randomBytes(32).toString('hex');

export const csrfProtection = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const cookieToken = req.cookies?.csrfToken;
  const headerToken = req.headers['x-csrf-token'];

  // reject if CSRF cookie is missing, header is absent/wrong type, or tokens don't match
  if (
    !cookieToken ||
    typeof headerToken !== 'string' ||
    headerToken !== cookieToken
  ) {
    return next(
      forbidden(ERROR_CODES.AUTH.INVALID_CSRF_TOKEN, 'Invalid CSRF token'),
    );
  }

  next();
};
