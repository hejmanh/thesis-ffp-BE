import { pool } from '@/database/index.js';
import { execQuery, type QueryClient } from '@/database/query.js';

export type ConsentRow = {
  id: number;
  agreed: boolean;
  consentedAt: string;
  consentVersion: string;
};

export const getProfileIdByUserId = async (
  userId: number,
  client: QueryClient = pool,
): Promise<number | null> => {
  const res = await execQuery(
    client,
    `SELECT id FROM profile WHERE user_account_id = $1`,
    [userId],
  );

  const id = res.rows[0]?.id;
  return id == null ? null : Number(id);
};

export const findConsentByProfileId = async (
  profileId: number,
  client: QueryClient = pool,
): Promise<ConsentRow | null> => {
  const res = await execQuery(
    client,
    `
      SELECT
        id,
        agreed,
        consented_at AS "consentedAt",
        consent_version AS "consentVersion"
      FROM consent_record
      WHERE profile_id = $1
    `,
    [profileId],
  );

  const row = res.rows[0];
  if (!row) return null;

  return {
    id: Number(row.id),
    agreed: Boolean(row.agreed),
    consentedAt: row.consentedAt as string,
    consentVersion: String(row.consentVersion),
  };
};

export const createConsent = async (
  profileId: number,
  agreed: boolean,
  consentVersion: string,
  client: QueryClient = pool,
): Promise<ConsentRow | null> => {
  const res = await execQuery(
    client,
    `
      INSERT INTO consent_record (profile_id, agreed, consent_version)
      VALUES ($1, $2, $3)
      ON CONFLICT (profile_id) DO NOTHING
      RETURNING id, agreed, consented_at AS "consentedAt", consent_version AS "consentVersion"
    `,
    [profileId, agreed, consentVersion],
  );

  const row = res.rows[0];
  if (!row) return null;

  return {
    id: Number(row.id),
    agreed: Boolean(row.agreed),
    consentedAt: row.consentedAt as string,
    consentVersion: String(row.consentVersion),
  };
};
