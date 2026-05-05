import bcrypt from 'bcrypt';

export const hashPassword = async (password: string) => bcrypt.hash(password, process.env.BCRYPT_SALT_ROUNDS ? parseInt(process.env.BCRYPT_SALT_ROUNDS) : 10);

export const comparePassword = async (password: string, hash: string) => bcrypt.compare(password, hash);