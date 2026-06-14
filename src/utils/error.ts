import { AppError } from './AppError.js';
import { ERROR_CODES } from '@/constants/errorCodes.js';

type ErrorInput = {
  code: string;
  message: string;
};

const ERROR_CODE_PATTERN = /^[A-Z][A-Z0-9_]*(?:\.[A-Z][A-Z0-9_]*)+$/;

function resolveErrorInput(
  defaultCode: string,
  defaultMessage: string,
  codeOrMessage?: string,
  maybeMessage?: string,
): ErrorInput {
  if (!codeOrMessage) {
    return { code: defaultCode, message: defaultMessage };
  }

  if (maybeMessage) {
    return { code: codeOrMessage, message: maybeMessage };
  }

  return ERROR_CODE_PATTERN.test(codeOrMessage)
    ? { code: codeOrMessage, message: defaultMessage }
    : { code: defaultCode, message: codeOrMessage };
}

export const badRequest = (codeOrMessage?: string, message?: string) => {
  const error = resolveErrorInput(
    ERROR_CODES.VALIDATION.BAD_REQUEST,
    'Bad Request',
    codeOrMessage,
    message,
  );
  return new AppError(error.message, 400, error.code);
};

export const unauthorized = (codeOrMessage?: string, message?: string) => {
  const error = resolveErrorInput(
    ERROR_CODES.AUTH.UNAUTHORIZED,
    'Unauthorized',
    codeOrMessage,
    message,
  );
  return new AppError(error.message, 401, error.code);
};

export const forbidden = (codeOrMessage?: string, message?: string) => {
  const error = resolveErrorInput(
    ERROR_CODES.AUTH.FORBIDDEN,
    'Forbidden',
    codeOrMessage,
    message,
  );
  return new AppError(error.message, 403, error.code);
};

export const notFound = (codeOrMessage?: string, message?: string) => {
  const error = resolveErrorInput(
    ERROR_CODES.SYSTEM.NOT_FOUND,
    'Resource not found',
    codeOrMessage,
    message,
  );
  return new AppError(error.message, 404, error.code);
};

export const internal = (codeOrMessage?: string, message?: string) => {
  const error = resolveErrorInput(
    ERROR_CODES.SYSTEM.INTERNAL_ERROR,
    'Internal server error',
    codeOrMessage,
    message,
  );
  return new AppError(error.message, 500, error.code);
};
