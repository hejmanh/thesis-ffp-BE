import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { asyncHandler } from './asyncHandler.js';

describe('asyncHandler', () => {
  it('should wrap async function and pass through result', async () => {
    const mockReq = {} as Request;
    const mockRes = {} as Response;
    const mockNext = vi.fn() as unknown as NextFunction;

    const asyncFn = vi.fn(async () => {
      return 'success';
    });

    const handler = asyncHandler(asyncFn as any);

    await handler(mockReq, mockRes, mockNext);

    expect(asyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should catch errors and pass to next middleware', async () => {
    const mockReq = {} as Request;
    const mockRes = {} as Response;
    const mockNext = vi.fn() as unknown as NextFunction;
    const testError = new Error('Test error');

    const asyncFn = vi.fn(async () => {
      throw testError;
    });

    const handler = asyncHandler(asyncFn as any);

    await handler(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(testError);
  });
});
