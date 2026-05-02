import type { Request, Response, NextFunction } from 'express';
import { AppError } from "@/utils/AppError.js";
import config from "@/config/config.js";

const isAppError = (err: any): err is AppError => err instanceof AppError

export const errorHandler = (
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    let isOperational = false;

    if (isAppError(err)) {
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

    res.status(statusCode).json({
        success: false,
        error: {
            message: isOperational ? message : 'Something went wrong',
            ...(config.nodeEnv === 'development' && { 
                stack: err instanceof Error ? err.stack : undefined 
            }),
        } 
    });
}