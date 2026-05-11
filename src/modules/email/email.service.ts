import nodemailer from 'nodemailer';
import { internal } from '@/utils/error.js';
import config from '@/config/config.js';
import { normalizeEmail } from '@/utils/normalizeEmail.js';
import { buildVerificationEmail } from './templates/verificationEmail.js';
import { buildPasswordResetEmail } from './templates/passwordResetEmail.js';

type EmailConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  frontendUrl: string;
};

const getEmailConfig = (): EmailConfig => {
  const host = process.env.EMAIL_HOST;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const frontendUrl = process.env.FRONTEND_URL;

  if (!host || !user || !pass || !frontendUrl) {
    throw internal('Email service not configured');
  }

  const port = process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 2525;

  return { host, port, user, pass, frontendUrl };
};

const createTransporter = () => {
  const { host, port, user, pass } = getEmailConfig();

  return nodemailer.createTransport({
    host,
    port,
    auth: { user, pass },
  });
};

export const sendVerificationEmail = async (to: string, token: string) => {
  const { frontendUrl } = getEmailConfig();
  const verificationLink = `${frontendUrl}/verify-email?token=${token}`;
  const recipient = normalizeEmail(to);

  const transporter = createTransporter();

  const expiresText = config.security.emailVerificationExpiresIn || '24 hours';
  const html = buildVerificationEmail({ verificationLink, expiresText });

  await transporter.sendMail({
    from: 'Coinfused <noreply@coinfused.com>',
    to: recipient,
    subject: 'Verify Your Email',
    html,
  });
};

export const sendPasswordResetEmail = async (to: string, token: string) => {
  const { frontendUrl } = getEmailConfig();
  const resetLink = `${frontendUrl}/reset-password?token=${token}`;
  const recipient = normalizeEmail(to);

  const transporter = createTransporter();

  const expiresText = config.security.passwordResetExpiresIn || '24 hours';
  const html = buildPasswordResetEmail({ resetLink, expiresText });

  await transporter.sendMail({
    from: 'Coinfused <noreply@coinfused.com>',
    to: recipient,
    subject: 'Reset Your Password',
    html,
  });
};
