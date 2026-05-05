import { pool } from '@/database/index.js';
import { execQuery, type QueryClient } from '@/database/query.js';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const createUser = async (
  email: string,
  passwordHash: string,
  client: QueryClient = pool,
) => {
  const user = await execQuery(
    client,
    `INSERT INTO user_account DEFAULT VALUES RETURNING id`,
  );

  const userId = user.rows[0].id;
  const normalizedEmail = normalizeEmail(email);

  await execQuery(
    client,
    `INSERT INTO credential (user_account_id, email, hashed_password, is_email_verified)
        VALUES ($1, $2, $3, false)`,
    [userId, normalizedEmail, passwordHash],
  );

  return userId;
};

export const createProfile = async (
  userAccountId: number,
  name: string,
  birthYear: number,
  countryId: number,
  sexTypeId: number,
  client: QueryClient = pool,
) => {
  await execQuery(
    client,
    `INSERT INTO profile (user_account_id, name, birth_year, country_id, sex_type_id)
        VALUES ($1, $2, $3, $4, $5)`,
    [userAccountId, name, birthYear, countryId, sexTypeId],
  );
};

export const findUserByEmail = async (
  email: string,
  client: QueryClient = pool,
) => {
  const normalizedEmail = normalizeEmail(email);

  const res = await execQuery(
    client,
    `SELECT ua.id, ua.uid, ua.last_login_at, c.email, c.hashed_password, c.is_email_verified
        FROM user_account ua
            JOIN credential c ON ua.id = c.user_account_id
        WHERE c.email = $1`,
    [normalizedEmail],
  );

  return res.rows[0];
};
