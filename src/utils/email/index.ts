import nodemailer from 'nodemailer';
import { internal } from '@/utils/error.js';
import config from '@/config/config.js';

const getEmailConfig = () => {
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

  const transporter = createTransporter();

  const expiresText = config.security.emailVerificationExpiresIn || '24 hours';

  const html = `
            <div style="font-family: Arial, sans-serif; background: #f4f8ff; margin: 0; padding: 0;">
  
                <!-- Wrapper -->
                <div style="max-width: 600px; margin: 0 auto; padding: 24px;">
        
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #4da3ff 0%, #1e6fe8 100%); padding: 36px 24px; border-radius: 10px 10px 0 0; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 30px; font-weight: 800; letter-spacing: 0.5px;">
                            Welcome to Coinfused
                        </h1>
                    </div>

                    <!-- Card -->
                    <div style="background: #ffffff; padding: 36px 28px; border: 1px solid #e3edff; border-top: none; border-radius: 0 0 10px 10px;">
                    
                        <p style="font-size: 16px; color: #374151; margin: 0 0 16px; font-weight: 600;">
                            Hello,
                        </p>

                        <p style="font-size: 15px; line-height: 1.7; color: #334155; margin: 0 0 28px;">
                            Thanks for joining <strong style="color:#1e6fe8;">Coinfused</strong>.  
                            Please confirm your email address to activate your account and get started.
                        </p>

                        <!-- CTA -->
                        <div style="text-align: center; margin: 32px 0;">
                            <a href="${verificationLink}"
                            style="background: #3b82f6; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 700; display: inline-block; box-shadow: 0 4px 12px rgba(59,130,246,0.25);">
                            Verify Email
                            </a>
                        </div>

                        <!-- Divider -->
                        <div style="border-top: 1px solid #e3edff; margin: 28px 0;"></div>

                        <!-- Security note -->
                        <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin: 0;">
                            <strong style="color:#374151;">Note:</strong>  
                            This link expires in <strong>${expiresText}</strong>.  
                            If you didn’t create an account, you can safely ignore this email.
                        </p>

                        <!-- Fallback link -->
                        <p style="font-size: 12px; color: #94a3b8; margin-top: 16px; word-break: break-all;">
                            Or copy and paste this link into your browser:<br/>
                            ${verificationLink}
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style="text-align: center; padding: 20px 10px;">
                        <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                            © 2026 Coinfused. All rights reserved.
                        </p>
                    </div>

                </div>
            </div>
        `;

  await transporter.sendMail({
    from: 'Coinfused <noreply@coinfused.com>',
    to,
    subject: 'Verify Your Email',
    html,
  });
};

export const sendPasswordResetEmail = async (to: string, token: string) => {
  const { frontendUrl } = getEmailConfig();
  const resetLink = `${frontendUrl}/reset-password?token=${token}`;

  const transporter = createTransporter();

  const expiresText = config.security.passwordResetExpiresIn || '24 hours';

  const html = `
            <div style="font-family: Arial, sans-serif; background: #f4f8ff; margin: 0; padding: 0;">

                <!-- Wrapper -->
                <div style="max-width: 600px; margin: 0 auto; padding: 24px;">

                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #4da3ff 0%, #1e6fe8 100%); padding: 36px 24px; border-radius: 10px 10px 0 0; text-align: center;">
                        <h1 style="margin: 0; color: #ffffff; font-size: 30px; font-weight: 800; letter-spacing: 0.5px;">
                            Reset Your Password
                        </h1>
                    </div>

                    <!-- Card -->
                    <div style="background: #ffffff; padding: 36px 28px; border: 1px solid #e3edff; border-top: none; border-radius: 0 0 10px 10px;">

                        <p style="font-size: 16px; color: #374151; margin: 0 0 16px; font-weight: 600;">
                            Hello,
                        </p>

                        <p style="font-size: 15px; line-height: 1.7; color: #334155; margin: 0 0 28px;">
                            We received a request to reset your <strong style="color:#1e6fe8;">Coinfused</strong> password.
                            Click the button below to set a new password.
                        </p>

                        <!-- CTA -->
                        <div style="text-align: center; margin: 32px 0;">
                            <a href="${resetLink}"
                            style="background: #3b82f6; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 700; display: inline-block; box-shadow: 0 4px 12px rgba(59,130,246,0.25);">
                            Reset Password
                            </a>
                        </div>

                        <!-- Divider -->
                        <div style="border-top: 1px solid #e3edff; margin: 28px 0;"></div>

                        <!-- Security note -->
                        <p style="font-size: 13px; line-height: 1.6; color: #64748b; margin: 0;">
                            <strong style="color:#374151;">Note:</strong>
                            This link expires in <strong>${expiresText}</strong>.
                            If you didn't request a password reset, you can safely ignore this email.
                        </p>

                        <!-- Fallback link -->
                        <p style="font-size: 12px; color: #94a3b8; margin-top: 16px; word-break: break-all;">
                            Or copy and paste this link into your browser:<br/>
                            ${resetLink}
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style="text-align: center; padding: 20px 10px;">
                        <p style="font-size: 12px; color: #94a3b8; margin: 0;">
                            © 2026 Coinfused. All rights reserved.
                        </p>
                    </div>

                </div>
            </div>
        `;

  await transporter.sendMail({
    from: 'Coinfused <noreply@coinfused.com>',
    to,
    subject: 'Reset Your Password',
    html,
  });
};
