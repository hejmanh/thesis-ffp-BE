import { pool } from '@/database/index.js';
import { execQuery, type QueryClient } from '@/database/query.js';
import {
  findScenarioIdByProfile,
  insertScenario,
} from '../scenario.repository.js';

const toNumberOrNull = (value: unknown) =>
  value == null ? null : Number(value);

export const upsertScenario4 = async (
  profileId: number,
  scenarioTypeId: number,
  lifeExpectancy: number,
  inputFfpAge: number,
  inputFfpAnnualSpending: number,
  outputAnnualSaving: number,
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
      INSERT INTO scenario_4 (
        scenario_id,
        input_life_expectancy,
        input_ffp_age,
        input_ffp_annual_spending,
        output_annual_saving
      )
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (scenario_id)
      DO UPDATE SET
        input_life_expectancy = EXCLUDED.input_life_expectancy,
        input_ffp_age = EXCLUDED.input_ffp_age,
        input_ffp_annual_spending = EXCLUDED.input_ffp_annual_spending,
        output_annual_saving = EXCLUDED.output_annual_saving
    `,
    [
      scenarioId,
      lifeExpectancy,
      inputFfpAge,
      inputFfpAnnualSpending,
      outputAnnualSaving,
    ],
  );
};

export const getScenario4Input = async (
  profileId: number,
  scenarioTypeId: number,
  client: QueryClient = pool,
) => {
  const res = await execQuery(
    client,
    `
      SELECT
        s4.input_life_expectancy AS "lifeExpectancy",
        s4.input_ffp_age AS "inputFfpAge",
        s4.input_ffp_annual_spending AS "inputFfpAnnualSpending"
      FROM scenario s
      JOIN scenario_4 s4 ON s4.scenario_id = s.id
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

export const getScenario4Output = async (
  profileId: number,
  scenarioTypeId: number,
  client: QueryClient = pool,
) => {
  const res = await execQuery(
    client,
    `
      SELECT s4.output_annual_saving AS "outputAnnualSaving"
      FROM scenario s
      JOIN scenario_4 s4 ON s4.scenario_id = s.id
      WHERE s.profile_id = $1 AND s.scenario_type_id = $2
    `,
    [profileId, scenarioTypeId],
  );

  const row = res.rows[0];
  if (!row) return null;

  return {
    outputAnnualSaving: toNumberOrNull(row.outputAnnualSaving),
  };
};
