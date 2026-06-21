import { z } from 'zod';
import type { ApiResponse } from '@/types/api-response.js';

export const RecordConsentDto = z.object({
  agreed: z.boolean(),
  consentVersion: z.string().default('v1'),
});

export type RecordConsentDto = z.infer<typeof RecordConsentDto>;

export type ConsentStatus = {
  hasSeen: boolean;
  hasConsented: boolean;
  consentedAt: string | null;
  consentVersion: string | null;
};

export type RecordConsentResult = {
  agreed: boolean;
  consentedAt: string;
  consentVersion: string;
};

export type GetConsentStatusResponseDto = ApiResponse<ConsentStatus>;
export type RecordConsentResponseDto = ApiResponse<RecordConsentResult>;
