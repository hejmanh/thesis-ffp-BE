import { z } from 'zod';

export const VerifyEmailDto = z.object({
  token: z.string().min(1, 'Token is required'),
});

export type VerifyEmailDto = z.infer<typeof VerifyEmailDto>;