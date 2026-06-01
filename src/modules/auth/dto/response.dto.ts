import type { ApiResponse, ApiEmptyResponse } from '@/types/api-response.js';

export type RegisterResponseDto = ApiEmptyResponse;

export type VerifyEmailResponseDto = ApiEmptyResponse;

export type ForgotPasswordResponseDto = ApiEmptyResponse;

export type ResetPasswordResponseDto = ApiEmptyResponse;
export type UpdatePasswordResponseDto = ApiEmptyResponse;

export type RefreshResponseDto = ApiResponse<{
  accessToken: string;
}>;

export type LogoutResponseDto = ApiEmptyResponse;
