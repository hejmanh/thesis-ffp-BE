import bcrypt from 'bcrypt';

const DEFAULT_SALT_ROUNDS = 10;

const getSaltRounds = () => {
  const raw = process.env.BCRYPT_SALT_ROUNDS;
  if (!raw) return DEFAULT_SALT_ROUNDS;

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : DEFAULT_SALT_ROUNDS;
};

export const hashPassword = async (password: string) =>
  bcrypt.hash(password, getSaltRounds());

export const comparePassword = async (password: string, hash: string) =>
  bcrypt.compare(password, hash);
