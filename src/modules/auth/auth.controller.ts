import type { Request, Response } from 'express';
import { z } from 'zod';
import { asyncHandler } from '@/utils/asyncHandler.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginRequestDto } from './dto/login.dto.js';
import { ForgotPasswordDto } from './dto/forgot-password.dto.js';
import { ResetPasswordDto } from './dto/reset-password.dto.js';
import { UpdatePasswordDto } from './dto/update-password.dto.js';
import { VerifyEmailDto } from './dto/verify-email.dto.js';
import * as authService from './auth.service.js';
import type {
  RegisterResponseDto,
  VerifyEmailResponseDto,
  ForgotPasswordResponseDto,
  ResetPasswordResponseDto,
  UpdatePasswordResponseDto,
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
  path: '/api/v1/auth',
};

const csrfCookieOptions = {
  httpOnly: false,
  secure: config.nodeEnv === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

export const registerHandler = asyncHandler(
  async (req: Request, res: Response<RegisterResponseDto>) => {
    const data = RegisterDto.parse(req.body);

    await authService.register(data);

    res.status(201).json({
      success: true,
      data: null,
      message: 'Check your email to verify your account',
    });
  },
);

export const verifyEmailHandler = asyncHandler(
  async (req: Request, res: Response<VerifyEmailResponseDto>) => {
    const { token } = VerifyEmailDto.parse(req.body);

    await authService.verifyEmail(token);

    res.json({
      success: true,
      data: null,
      message: 'Email verified',
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
      message: 'Login successful',
    });
  },
);

export const forgotPasswordHandler = asyncHandler(
  async (req: Request, res: Response<ForgotPasswordResponseDto>) => {
    const data = ForgotPasswordDto.parse(req.body);

    await authService.requestPasswordReset(data.email);

    res.json({
      success: true,
      data: null,
      message: 'Check your email to reset your password',
    });
  },
);

export const resetPasswordHandler = asyncHandler(
  async (req: Request, res: Response<ResetPasswordResponseDto>) => {
    const data = ResetPasswordDto.parse(req.body);

    await authService.resetPassword(data.token, data.password);

    res.json({
      success: true,
      data: null,
      message: 'Password reset successful',
    });
  },
);

export const updatePasswordHandler = asyncHandler(
  async (req: Request, res: Response<UpdatePasswordResponseDto>) => {
    if (!req.userId) throw unauthorized('No token provided');

    const data = UpdatePasswordDto.parse(req.body);

    await authService.updatePassword(
      req.userId,
      data.currentPassword,
      data.newPassword,
    );

    res.json({
      success: true,
      data: null,
      message: 'Password updated successfully',
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
      message: 'Token refreshed',
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
    res.json({ success: true, data: null, message: 'Logged out' });
  },
);
