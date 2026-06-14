import { describe, it, expect } from 'vitest';
import { AppError } from './AppError.js';
import { ERROR_CODES } from '@/constants/errorCodes.js';

describe('AppError', () => {
  it('should create error with custom status code', () => {
    const error = new AppError('Something went wrong', 500);

    expect(error.message).toBe('Something went wrong');
    expect(error.code).toBe(ERROR_CODES.SYSTEM.ERROR);
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(true);
  });

  it('should preserve stable error code', () => {
    const error = new AppError(
      'Invalid credentials',
      401,
      ERROR_CODES.AUTH.INVALID_CREDENTIALS,
    );

    expect(error.code).toBe(ERROR_CODES.AUTH.INVALID_CREDENTIALS);
    expect(error.message).toBe('Invalid credentials');
  });

  it('should create error with 404 status code', () => {
    const error = new AppError('Not found', 404);

    expect(error.message).toBe('Not found');
    expect(error.statusCode).toBe(404);
    expect(error.isOperational).toBe(true);
  });

  it('should be an instance of Error', () => {
    const error = new AppError('Test error', 400);

    expect(error).toBeInstanceOf(Error);
  });

  it('should capture stack trace', () => {
    const error = new AppError('Test error', 500);

    expect(error.stack).toBeDefined();
  });
});
