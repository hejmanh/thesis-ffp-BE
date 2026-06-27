import nodemailer from 'nodemailer';
import type { SendMailOptions } from 'nodemailer';
import { google } from 'googleapis';
import { internal } from '@/utils/error.js';
import config from '@/config/config.js';
import { normalizeEmail } from '@/utils/normalizeEmail.js';
import { buildVerificationEmail } from './templates/verificationEmail.js';
import { buildPasswordResetEmail } from './templates/passwordResetEmail.js';

type EmailConfig = {
  user: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  redirectUri: string | undefined;
  frontendUrl: string;
};

type CachedAccessToken = {
  token: string;
  expiresAt: number;
};

type EmailErrorDetails = {
  code: string | undefined;
  responseCode: number | undefined;
  status: number | undefined;
  error?: unknown;
  errorDescription?: unknown;
  message: string | undefined;
};

const ACCESS_TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000;
let cachedAccessToken: CachedAccessToken | null = null;

const getEmailConfig = (): EmailConfig => {
  const {
    googleEmail: user,
    googleClientId: clientId,
    googleClientSecret: clientSecret,
    googleRefreshToken: refreshToken,
    googleRedirectUri: redirectUri,
    frontendUrl,
  } = config.email;

  if (
    !user ||
    !clientId ||
    !clientSecret ||
    !refreshToken ||
    !redirectUri ||
    !frontendUrl
  ) {
    throw internal('Email service not configured');
  }

  return {
    user,
    clientId,
    clientSecret,
    refreshToken,
    redirectUri,
    frontendUrl,
  };
};

const getGoogleAccessToken = async ({
  clientId,
  clientSecret,
  refreshToken,
  redirectUri,
}: Pick<
  EmailConfig,
  'clientId' | 'clientSecret' | 'refreshToken' | 'redirectUri'
>, forceRefresh = false): Promise<string> => {
  if (
    !forceRefresh &&
    cachedAccessToken &&
    cachedAccessToken.expiresAt - ACCESS_TOKEN_REFRESH_BUFFER_MS > Date.now()
  ) {
    return cachedAccessToken.token;
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri,
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  const accessToken = await oauth2Client.getAccessToken();

  if (!accessToken.token) {
    throw internal('Email service could not get Google access token');
  }

  cachedAccessToken = {
    token: accessToken.token,
    expiresAt:
      accessToken.res?.data?.expiry_date ?? Date.now() + 55 * 60 * 1000,
  };

  return accessToken.token;
};

const createTransporter = async ({
  user,
  clientId,
  clientSecret,
  refreshToken,
  redirectUri,
}: EmailConfig, forceRefreshToken = false) => {
  const accessToken = await getGoogleAccessToken({
    clientId,
    clientSecret,
    refreshToken,
    redirectUri,
  }, forceRefreshToken);

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user,
      clientId,
      clientSecret,
      refreshToken,
      accessToken,
    },
  });
};

const isAuthError = (err: unknown): boolean => {
  const error = err as {
    code?: string;
    responseCode?: number;
    message?: string;
  };

  return (
    error.code === 'EAUTH' ||
    error.responseCode === 535 ||
    /auth|credential|expired|invalid token/i.test(error.message ?? '')
  );
};

export const getEmailErrorDetails = (err: unknown): EmailErrorDetails => {
  const error = err as {
    code?: string;
    responseCode?: number;
    response?: {
      status?: number;
      data?: {
        error?: unknown;
        error_description?: unknown;
      };
    };
    message?: string;
  };

  return {
    code: error.code,
    responseCode: error.responseCode,
    status: error.response?.status,
    error: error.response?.data?.error,
    errorDescription: error.response?.data?.error_description,
    message: error.message,
  };
};

const sendEmail = async (
  label: string,
  emailConfig: EmailConfig,
  mailOptions: SendMailOptions,
) => {
  const recipient = mailOptions.to;

  try {
    const transporter = await createTransporter(emailConfig);
    const info = await transporter.sendMail(mailOptions);

    if (Array.isArray(info.rejected) && info.rejected.length > 0) {
      console.warn(`[Email] ${label} rejected by SMTP`, {
        rejected: info.rejected,
      });
    }

    return info;
  } catch (err) {
    if (!isAuthError(err)) {
      console.error(`[Email] ${label} failed`, getEmailErrorDetails(err));
      throw err;
    }

    console.warn(
      `[Email] ${label} auth failed, retrying with fresh token`,
      getEmailErrorDetails(err),
    );
    cachedAccessToken = null;

    try {
      const transporter = await createTransporter(emailConfig, true);
      const info = await transporter.sendMail(mailOptions);

      if (Array.isArray(info.rejected) && info.rejected.length > 0) {
        console.warn(`[Email] ${label} rejected by SMTP`, {
          rejected: info.rejected,
        });
      }

      return info;
    } catch (retryErr) {
      console.error(
        `[Email] ${label} failed after auth retry`,
        getEmailErrorDetails(retryErr),
      );
      throw retryErr;
    }
  }
};

export const sendVerificationEmail = async (to: string, token: string) => {
  const emailConfig = getEmailConfig();
  const { frontendUrl, user } = emailConfig;
  const verificationLink = `${frontendUrl}/verify-email?token=${token}`;
  const recipient = normalizeEmail(to);

  const expiresText = config.security.emailVerificationExpiresIn || '24 hours';
  const html = buildVerificationEmail({ verificationLink, expiresText });

  await sendEmail('verification email', emailConfig, {
    from: `Retire Safely <${user}>`,
    to: recipient,
    subject: 'Verify Your Email',
    html,
  });
};

export const sendPasswordResetEmail = async (to: string, token: string) => {
  const emailConfig = getEmailConfig();
  const { frontendUrl, user } = emailConfig;
  const resetLink = `${frontendUrl}/reset-password?token=${token}`;
  const recipient = normalizeEmail(to);

  const expiresText = config.security.passwordResetExpiresIn || '24 hours';
  const html = buildPasswordResetEmail({ resetLink, expiresText });

  await sendEmail('password reset email', emailConfig, {
    from: `Retire Safely <${user}>`,
    to: recipient,
    subject: 'Reset Your Password',
    html,
  });
};
