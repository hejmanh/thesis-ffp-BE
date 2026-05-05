import { z } from 'zod';
import type { UserDto } from './user.dto.js';
import type { ApiResponse } from '@/types/api-response.js';

export const LoginRequestDto = z.object({
    email: z.email("Invalid email address").toLowerCase(),
    password: z.string().min(8, "Password must be at least 8 characters")
                        .max(100, "Password must be at most 100 characters")
});

export type LoginRequestDto = z.infer<typeof LoginRequestDto>;

export type LoginResponseDto = {
    accessToken: string;
    user: UserDto;
}

export type LoginSuccessResponseDto = ApiResponse<LoginResponseDto>;