import { z } from 'zod';

export const ResetPasswordDto = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be at most 100 characters')
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/,
      'Password must contain at least 1 letter, 1 number and 1 special character',
    ),
});

export type ResetPasswordDto = z.infer<typeof ResetPasswordDto>;
