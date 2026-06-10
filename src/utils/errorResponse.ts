import { ERROR_CODES } from '@/constants/errorCodes.js';

export type ErrorPayload = {
  success: false;
  code: string;
  message: string;
  errors?: { path?: string; code?: string; message: string }[];
  stack?: string;
};

type BuildErrorPayloadOptions = {
  code?: string;
  message: string;
  errors?: { path?: string; code?: string; message: string }[];
  stack?: string;
};

export const buildErrorPayload = ({
  code = ERROR_CODES.SYSTEM.UNKNOWN,
  message,
  errors,
  stack,
}: BuildErrorPayloadOptions): ErrorPayload => {
  return {
    success: false,
    code,
    message,
    ...(errors && { errors }),
    ...(stack && { stack }),
  };
};
