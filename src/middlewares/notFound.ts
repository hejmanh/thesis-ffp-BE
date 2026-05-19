import type { Request, Response, NextFunction } from 'express';
import { notFound } from '@/utils/error.js';

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  next(notFound(`Cannot ${req.method} ${req.originalUrl}`));
};
