import { ERROR_CODES } from '@/constants/errorCodes.js';

export class AppError extends Error {
  code: string;
  statusCode: number;
  isOperational: boolean;

  constructor(
    message: string,
    statusCode: number,
    code: string = ERROR_CODES.SYSTEM.ERROR,
  ) {
    super(message);

    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}
