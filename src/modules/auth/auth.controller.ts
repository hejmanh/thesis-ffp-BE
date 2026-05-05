import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginRequestDto } from './dto/login.dto.js';
import * as authService from './auth.service.js';
import type {
  RegisterResponseDto,
  VerifyEmailResponseDto,
  RefreshResponseDto,
  LogoutResponseDto,
} from './dto/response.dto.js';
import type { LoginSuccessResponseDto } from './dto/login.dto.js';
import { badRequest, unauthorized } from '@/utils/error.js';
import config from '@/config/config.js';
import { createCsrfToken } from '@/middlewares/csrf.js';

const refreshCookieOptions = {
  httpOnly: true,
  secure: config.nodeEnv === 'production',
  sameSite: 'strict' as const,
  path: '/api/v1/auth/refresh',
};

const csrfCookieOptions = {
  httpOnly: false,
  secure: config.nodeEnv === 'production',
  sameSite: 'strict' as const,
  path: '/api/v1',
};

export const registerHandler = asyncHandler(
  async (req: Request, res: Response<RegisterResponseDto>) => {
    const data = RegisterDto.parse(req.body);

    await authService.register(data);

    res.status(201).json({
      success: true,
      data: { message: 'Check your email to verify your account' },
    });
  },
);

export const verifyEmailHandler = asyncHandler(
  async (req: Request, res: Response<VerifyEmailResponseDto>) => {
    const { token } = req.query;
    if (typeof token !== 'string') throw badRequest('Invalid token');

    await authService.verifyEmail(token);

    res.json({
      success: true,
      data: { message: 'Email verified' },
    });
  },
);

export const loginHandler = asyncHandler(
  async (req: Request, res: Response<LoginSuccessResponseDto>) => {
    const data = LoginRequestDto.parse(req.body);

    const { accessToken, refreshToken, user, isFirstLogin } =
      await authService.login(data);
    const csrfToken = createCsrfToken();

    res.cookie('refreshToken', refreshToken, refreshCookieOptions);
    res.cookie('csrfToken', csrfToken, csrfCookieOptions);

    res.json({
      success: true,
      data: {
        accessToken: accessToken,
        user: user,
        isFirstLogin: isFirstLogin,
      },
    });
  },
);

export const refreshHandler = asyncHandler(
  async (req: Request, res: Response<RefreshResponseDto>) => {
    const rawToken = req.cookies?.refreshToken;
    if (!rawToken) throw unauthorized('Missing refresh token');

    const response = await authService.refresh(rawToken);
    const csrfToken = createCsrfToken();

    res.cookie('refreshToken', response.refreshToken, refreshCookieOptions);
    res.cookie('csrfToken', csrfToken, csrfCookieOptions);

    res.json({
      success: true,
      data: { accessToken: response.accessToken },
    });
  },
);

export const logoutHandler = asyncHandler(
  async (req: Request, res: Response<LogoutResponseDto>) => {
    const rawToken = req.cookies?.refreshToken;
    if (!rawToken) throw unauthorized('Missing refresh token');

    await authService.logout(rawToken);

    res.clearCookie('refreshToken', refreshCookieOptions);
    res.clearCookie('csrfToken', csrfCookieOptions);
    res.json({ success: true });
  },
);
