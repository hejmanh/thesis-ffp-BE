export type ErrorPayload = {
  success: false;
  message: string;
  errors?: { path?: string; message: string }[];
  stack?: string;
};

type BuildErrorPayloadOptions = {
  message: string;
  errors?: { path?: string; message: string }[];
  stack?: string;
};

export const buildErrorPayload = ({
  message,
  errors,
  stack,
}: BuildErrorPayloadOptions): ErrorPayload => {
  return {
    success: false,
    message,
    ...(errors && { errors }),
    ...(stack && { stack }),
  };
};
