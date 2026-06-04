import nodemailer from 'nodemailer';
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
  frontendUrl: string;
};

const getEmailConfig = (): EmailConfig => {
  const user = process.env.GOOGLE_EMAIL;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
  const frontendUrl = process.env.FRONTEND_URL;

  if (!user || !clientId || !clientSecret || !refreshToken || !frontendUrl) {
    throw internal('Email service not configured');
  }

  return { user, clientId, clientSecret, refreshToken, frontendUrl };
};

const getGoogleAccessToken = async ({
  clientId,
  clientSecret,
  refreshToken,
}: Pick<
  EmailConfig,
  'clientId' | 'clientSecret' | 'refreshToken'
>): Promise<string> => {
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);

  oauth2Client.setCredentials({
    refresh_token: refreshToken,
  });

  const accessToken = await oauth2Client.getAccessToken();

  if (!accessToken.token) {
    throw internal('Email service could not get Google access token');
  }

  return accessToken.token;
};

const createTransporter = async ({
  user,
  clientId,
  clientSecret,
  refreshToken,
}: EmailConfig) => {
  const accessToken = await getGoogleAccessToken({ // s nodemailer 0 tu lay access tok dc uhuhu
    clientId,
    clientSecret,
    refreshToken,
  });

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

export const sendVerificationEmail = async (to: string, token: string) => {
  const emailConfig = getEmailConfig();
  const { frontendUrl, user } = emailConfig;
  const verificationLink = `${frontendUrl}/verify-email?token=${token}`;
  const recipient = normalizeEmail(to);

  const transporter = await createTransporter(emailConfig);

  const expiresText = config.security.emailVerificationExpiresIn || '24 hours';
  const html = buildVerificationEmail({ verificationLink, expiresText });

  await transporter.sendMail({
    from: `Coinfused <${user}>`, // 0 co user thi se bi overwritten thanh byunmanh34, sdt het tao them mail dc r uhuhu
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

  const transporter = await createTransporter(emailConfig);

  const expiresText = config.security.passwordResetExpiresIn || '24 hours';
  const html = buildPasswordResetEmail({ resetLink, expiresText });

  const info = await transporter.sendMail({
    from: `Coinfused <${user}>`,
    to: recipient,
    subject: 'Reset Your Password',
    html,
  });

  // console.log('[Email] Password reset email sent', {
  //   messageId: info.messageId,
  //   accepted: info.accepted,
  //   rejected: info.rejected,
  //   response: info.response,
  // });
};
