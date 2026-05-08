import bcrypt from 'bcrypt';
import config from '@/config/config.js';

export const hashPassword = async (password: string) =>
  bcrypt.hash(password, config.security.saltRounds);

export const comparePassword = async (password: string, hash: string) =>
  bcrypt.compare(password, hash);
