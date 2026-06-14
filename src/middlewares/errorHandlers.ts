import type { Request, Response, NextFunction } from 'express';
import { AppError } from '@/utils/AppError.js';
import { buildErrorPayload } from '@/utils/errorResponse.js';
import config from '@/config/config.js';
import { ZodError } from 'zod';
import { ERROR_CODES } from '@/constants/errorCodes.js';

const isAppError = (err: any): err is AppError => err instanceof AppError;

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode = 500;
  let code: string = ERROR_CODES.SYSTEM.INTERNAL_ERROR;
  let message = 'Internal Server Error';
  let isOperational = false;

  if (err instanceof ZodError) {
    statusCode = 400;
    code = ERROR_CODES.VALIDATION.INVALID_INPUT;
    message = 'Validation error';
    isOperational = true;
  } else if (err instanceof SyntaxError && 'body' in (err as SyntaxError)) {
    statusCode = 400;
    code = ERROR_CODES.VALIDATION.INVALID_JSON;
    message = 'Invalid JSON payload';
    isOperational = true;
  } else if (isAppError(err)) {
    statusCode = err.statusCode;
    code = err.code;
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
          code: ERROR_CODES.VALIDATION.FIELD_INVALID,
          message: issue.message,
        }))
      : undefined;

  const payload = buildErrorPayload({
    code: isOperational ? code : ERROR_CODES.SYSTEM.UNKNOWN,
    message: isOperational ? message : 'Something went wrong',
    ...(errorDetails && { errors: errorDetails }),
    ...(config.nodeEnv === 'development' && err instanceof Error
      ? { stack: err.stack }
      : {}),
  });

  res.status(statusCode).json(payload);
};
