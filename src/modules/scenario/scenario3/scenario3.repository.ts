import { pool } from '@/database/index.js';
import { execQuery, type QueryClient } from '@/database/query.js';
import {
  findScenarioIdByProfile,
  insertScenario,
} from '../scenario.repository.js';

const toNumberOrNull = (value: unknown) =>
  value == null ? null : Number(value);

export const upsertScenario3 = async (
  profileId: number,
  scenarioTypeId: number,
  lifeExpectancy: number,
  inputFfpAge: number,
  outputFfpAnnualSpending: number,
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
      INSERT INTO scenario_3 (
        scenario_id,
        input_life_expectancy,
        input_ffp_age,
        output_ffp_annual_spending
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (scenario_id)
      DO UPDATE SET
        input_life_expectancy = EXCLUDED.input_life_expectancy,
        input_ffp_age = EXCLUDED.input_ffp_age,
        output_ffp_annual_spending = EXCLUDED.output_ffp_annual_spending
    `,
    [scenarioId, lifeExpectancy, inputFfpAge, outputFfpAnnualSpending],
  );
};

export const getScenario3Input = async (
  profileId: number,
  scenarioTypeId: number,
  client: QueryClient = pool,
) => {
  const res = await execQuery(
    client,
    `
      SELECT
        s3.input_life_expectancy AS "lifeExpectancy",
        s3.input_ffp_age AS "inputFfpAge"
      FROM scenario s
      JOIN scenario_3 s3 ON s3.scenario_id = s.id
      WHERE s.profile_id = $1 AND s.scenario_type_id = $2
    `,
    [profileId, scenarioTypeId],
  );

  const row = res.rows[0];
  if (!row) return null;

  return {
    lifeExpectancy: toNumberOrNull(row.lifeExpectancy),
    inputFfpAge: toNumberOrNull(row.inputFfpAge),
  };
};

export const getScenario3Output = async (
  profileId: number,
  scenarioTypeId: number,
  client: QueryClient = pool,
) => {
  const res = await execQuery(
    client,
    `
      SELECT
        s3.input_life_expectancy AS "lifeExpectancy",
        s3.input_ffp_age AS "inputFfpAge",
        s3.output_ffp_annual_spending AS "outputFfpAnnualSpending"
      FROM scenario s
      JOIN scenario_3 s3 ON s3.scenario_id = s.id
      WHERE s.profile_id = $1 AND s.scenario_type_id = $2
    `,
    [profileId, scenarioTypeId],
  );

  const row = res.rows[0];
  if (!row) return null;

  return {
    lifeExpectancy: toNumberOrNull(row.lifeExpectancy),
    inputFfpAge: toNumberOrNull(row.inputFfpAge),
    outputFfpAnnualSpending: toNumberOrNull(row.outputFfpAnnualSpending),
  };
};
