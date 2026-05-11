import { z } from 'zod';

export const ForgotPasswordDto = z.object({
  email: z.email('Invalid email address').toLowerCase(),
});

export type ForgotPasswordDto = z.infer<typeof ForgotPasswordDto>;
