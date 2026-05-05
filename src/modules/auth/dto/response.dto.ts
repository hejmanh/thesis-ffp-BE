import type { ApiResponse, ApiMessageResponse, ApiEmptyResponse } from '@/types/api-response.js';

export type RegisterResponseDto = ApiMessageResponse;

export type VerifyEmailResponseDto = ApiMessageResponse;

export type RefreshResponseDto = ApiResponse<{
    accessToken: string;
}>;

export type LogoutResponseDto = ApiEmptyResponse;
