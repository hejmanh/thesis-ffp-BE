import { pool } from '@/database/index.js';
import { execQuery, type QueryClient } from '@/database/query.js';
import {
  findScenarioIdByProfile,
  findScenarioTypeIdByNo,
  insertScenario,
} from '../scenario.repository.js';

const toNumberOrNull = (value: unknown) =>
  value == null ? null : Number(value);

export const upsertScenario2 = async (
  profileId: number,
  scenarioTypeId: number,
  lifeExpectancy: number,
  inputFfpAnnualSpending: number,
  outputFfpAge: number | null,
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
      INSERT INTO scenario_2 (
        scenario_id,
        input_life_expectancy,
        input_ffp_annual_spending,
        output_ffp_age
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (scenario_id)
      DO UPDATE SET
        input_life_expectancy = EXCLUDED.input_life_expectancy,
        input_ffp_annual_spending = EXCLUDED.input_ffp_annual_spending,
        output_ffp_age = EXCLUDED.output_ffp_age
    `,
    [scenarioId, lifeExpectancy, inputFfpAnnualSpending, outputFfpAge],
  );
};

export const getScenario2Input = async (
  profileId: number,
  scenarioTypeId: number,
  client: QueryClient = pool,
) => {
  const res = await execQuery(
    client,
    `
      SELECT
        s2.input_life_expectancy AS "lifeExpectancy",
        s2.input_ffp_annual_spending AS "inputFfpAnnualSpending"
      FROM scenario s
      JOIN scenario_2 s2 ON s2.scenario_id = s.id
      WHERE s.profile_id = $1 AND s.scenario_type_id = $2
    `,
    [profileId, scenarioTypeId],
  );

  const row = res.rows[0];
  if (!row) return null;

  return {
    lifeExpectancy: toNumberOrNull(row.lifeExpectancy),
    inputFfpAnnualSpending: toNumberOrNull(row.inputFfpAnnualSpending),
  };
};

export const getScenario2Output = async (
  profileId: number,
  scenarioTypeId: number,
  client: QueryClient = pool,
) => {
  const res = await execQuery(
    client,
    `
      SELECT s2.output_ffp_age AS "outputFfpAge"
      FROM scenario s
      JOIN scenario_2 s2 ON s2.scenario_id = s.id
      WHERE s.profile_id = $1 AND s.scenario_type_id = $2
    `,
    [profileId, scenarioTypeId],
  );

  const row = res.rows[0];
  if (!row) return null;

  return {
    outputFfpAge: toNumberOrNull(row.outputFfpAge),
  };
};
