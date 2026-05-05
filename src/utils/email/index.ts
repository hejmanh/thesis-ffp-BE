import nodemailer from 'nodemailer';
import { internal } from '@/utils/error.js';

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

    await transporter.sendMail({
        from: 'Coinfused <noreply@coinfused.com>',
        to,
        subject: 'Verify Your Email',
        html: `
            <p>Thank you for registering! Please click the link below to verify your email address:</p>
            <a href="${verificationLink}">Verify Email</a>
        `,
    });
};

export const sendPasswordResetEmail = async (to: string, token: string) => {
    const { frontendUrl } = getEmailConfig();
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    const transporter = createTransporter();

    await transporter.sendMail({
        from: 'Coinfused <noreply@coinfused.com>',
        to,
        subject: 'Reset Your Password',
        html: `
            <p>You have requested to reset your password. Please click the link below to proceed:</p>
            <a href="${resetLink}">Reset Password</a>
        `,
    });
};