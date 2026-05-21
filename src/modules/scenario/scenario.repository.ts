import { pool } from '@/database/index.js';
import { execQuery, type QueryClient } from '@/database/query.js';

export const findScenarioTypeIdByNo = async (
  no: number,
  client: QueryClient = pool,
) => {
  const res = await execQuery(
    client,
    'SELECT id FROM scenario_type WHERE no = $1',
    [no],
  );

  return (res.rows[0]?.id as number | undefined) ?? null;
};

export const findScenarioIdByProfile = async (
  profileId: number,
  scenarioTypeId: number,
  client: QueryClient = pool,
) => {
  const res = await execQuery(
    client,
    `
      SELECT id
      FROM scenario
      WHERE profile_id = $1 AND scenario_type_id = $2
    `,
    [profileId, scenarioTypeId],
  );

  return (res.rows[0]?.id as number | undefined) ?? null;
};

export const insertScenario = async (
  profileId: number,
  scenarioTypeId: number,
  client: QueryClient = pool,
) => {
  const res = await execQuery(
    client,
    `
      INSERT INTO scenario (profile_id, scenario_type_id)
      VALUES ($1, $2)
      RETURNING id
    `,
    [profileId, scenarioTypeId],
  );

  return Number(res.rows[0].id);
};
