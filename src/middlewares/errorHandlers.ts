import type { Request, Response, NextFunction } from 'express';
import { AppError } from '@/utils/AppError.js';
import config from '@/config/config.js';
import { ZodError } from 'zod';

const isAppError = (err: any): err is AppError => err instanceof AppError;

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let isOperational = false;

  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation error';
    isOperational = true;
  } else if (err instanceof SyntaxError && 'body' in (err as SyntaxError)) {
    statusCode = 400;
    message = 'Invalid JSON payload';
    isOperational = true;
  } else if (isAppError(err)) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  } else if (err instanceof Error) {
    message = err.message;
  }

  // logging
  console.error({
    time: new Date().toISOString(),
    method: req.method,
    url: req.url,
    statusCode,
    message,
    stack: err instanceof Error ? err.stack : undefined,
  });

  const errorDetails =
    err instanceof ZodError
      ? err.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }))
      : undefined;

  res.status(statusCode).json({
    success: false,
    message: isOperational ? message : 'Something went wrong',
    ...(errorDetails && { errors: errorDetails }),
    ...(config.nodeEnv !== 'production' && {
      stack: err instanceof Error ? err.stack : undefined,
    }),
  });
};
