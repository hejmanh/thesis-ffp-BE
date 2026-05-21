import { pool } from '@/database/index.js';
import { execQuery, type QueryClient } from '@/database/query.js';

const toNumberOrNull = (value: unknown) =>
  value == null ? null : Number(value);

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

export const upsertScenario1 = async (
  profileId: number,
  scenarioTypeId: number,
  lifeExpectancy: number,
  inputFfpAge: number,
  inputFfpAnnualSpending: number,
  outputIsAchievable: boolean,
  client: QueryClient = pool,
) => {
  let scenarioId = await findScenarioIdByProfile(
    profileId,
    scenarioTypeId,
    client,
  );

  if (!scenarioId) {
    scenarioId = await insertScenario(profileId, scenarioTypeId, client);
  }

  await execQuery(
    client,
    `
      INSERT INTO scenario_1 (
        scenario_id,
        input_life_expectancy,
        input_ffp_age,
        input_ffp_annual_spending,
        output_is_achievable
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (scenario_id)
      DO UPDATE SET
        input_life_expectancy = EXCLUDED.input_life_expectancy,
        input_ffp_age = EXCLUDED.input_ffp_age,
        input_ffp_annual_spending = EXCLUDED.input_ffp_annual_spending,
        output_is_achievable = EXCLUDED.output_is_achievable
    `,
    [
      scenarioId,
      lifeExpectancy,
      inputFfpAge,
      inputFfpAnnualSpending,
      outputIsAchievable,
    ],
  );
};

export const getScenario1Input = async (
  profileId: number,
  scenarioTypeId: number,
  client: QueryClient = pool,
) => {
  const res = await execQuery(
    client,
    `
      SELECT
        s1.input_life_expectancy AS "lifeExpectancy",
        s1.input_ffp_age AS "inputFfpAge",
        s1.input_ffp_annual_spending AS "inputFfpAnnualSpending"
      FROM scenario s
      JOIN scenario_1 s1 ON s1.scenario_id = s.id
      WHERE s.profile_id = $1 AND s.scenario_type_id = $2
    `,
    [profileId, scenarioTypeId],
  );

  const row = res.rows[0];
  if (!row) return null;

  return {
    lifeExpectancy: toNumberOrNull(row.lifeExpectancy),
    inputFfpAge: toNumberOrNull(row.inputFfpAge),
    inputFfpAnnualSpending: toNumberOrNull(row.inputFfpAnnualSpending),
  };
};

export const getScenario1Output = async (
  profileId: number,
  scenarioTypeId: number,
  client: QueryClient = pool,
) => {
  const res = await execQuery(
    client,
    `
      SELECT s1.output_is_achievable AS "outputIsAchievable"
      FROM scenario s
      JOIN scenario_1 s1 ON s1.scenario_id = s.id
      WHERE s.profile_id = $1 AND s.scenario_type_id = $2
    `,
    [profileId, scenarioTypeId],
  );

  const row = res.rows[0];
  if (!row) return null;

  return {
    outputIsAchievable: Boolean(row.outputIsAchievable),
  };
};
