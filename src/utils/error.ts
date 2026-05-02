import { AppError } from "./AppError.js"

export const badRequest = (msg = "Bad Request") => new AppError(msg, 400);

export const unauthorized = (msg = "Unauthorized") => new AppError(msg, 401);

export const forbidden = (msg = "Forbidden") => new AppError(msg, 403);

export const notFound = (msg = "Resource not found") => new AppError(msg, 404);

export const internal = (msg = "Internal server error") => new AppError(msg, 500);