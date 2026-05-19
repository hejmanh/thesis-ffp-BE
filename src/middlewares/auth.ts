import type { Request, Response, NextFunction } from 'express';
import {
  extractTokenFromHeader,
  verifyAccessToken,
} from '@/utils/auth/token.js';
import { unauthorized } from '@/utils/error.js';

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.get('authorization');
  const token = extractTokenFromHeader(authHeader);
  if (!token) return next(unauthorized('No token provided'));

  try {
    const decodedPayload = verifyAccessToken(token);
    req.userId = decodedPayload.userId;
    next();
  } catch (err) {
    return next(unauthorized('Invalid token'));
  }
};
