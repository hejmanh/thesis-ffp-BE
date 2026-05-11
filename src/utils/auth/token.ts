import jwt from 'jsonwebtoken';
import type { StringValue } from 'ms';
import crypto from 'crypto';
import config from '@/config/config.js';

export type TokenPayload = {
  userId: number;
};

export type GeneratedToken = {
  raw: string;
  hashed: string;
};

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const generateAccessToken = (payload: TokenPayload): string => {
  const secret = config.jwt.accessSecret;
  const expiresIn = config.jwt.accessExpiresIn as StringValue;
  return jwt.sign(payload, secret, { expiresIn });
};

export const generateRefreshToken = (): GeneratedToken => {
  const raw = crypto.randomBytes(40).toString('hex');
  const hashed = hashToken(raw);
  return { raw, hashed };
};

export const generateOneTimeToken = (): GeneratedToken => {
  const raw = crypto.randomBytes(32).toString('hex');
  const hashed = hashToken(raw);
  return { raw, hashed };
};

export const verifyAccessToken = (token: string): TokenPayload => {
  const secret = config.jwt.accessSecret;
  return jwt.verify(token, secret) as TokenPayload;
};

export const decodeToken = (token: string): TokenPayload | null => {
  return jwt.decode(token) as TokenPayload | null;
};

export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  return token ?? null;
};
