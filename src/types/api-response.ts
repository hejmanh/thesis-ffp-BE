export type ApiResponse<T> = {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
};

export type ApiEmptyResponse = ApiResponse<null>;

export type ApiErrorDetail = {
  path?: string;
  code?: string;
  message: string;
};

export type ApiErrorResponse = {
  success: false;
  code: string;
  message: string;
  errors?: ApiErrorDetail[];
  meta?: Record<string, unknown>;
};
