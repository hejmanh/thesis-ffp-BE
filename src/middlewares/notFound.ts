import type { Request, Response, NextFunction } from 'express';
import { notFound } from '@/utils/error.js';
import { ERROR_CODES } from '@/constants/errorCodes.js';

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  next(
    notFound(
      ERROR_CODES.SYSTEM.ROUTE_NOT_FOUND,
      `Cannot ${req.method} ${req.originalUrl}`,
    ),
  );
};
