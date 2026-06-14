import { z } from 'zod';

export const ResendVerificationEmailDto = z.object({
  email: z.email('Invalid email address').toLowerCase(),
});

export type ResendVerificationEmailDto = z.infer<
  typeof ResendVerificationEmailDto
>;
