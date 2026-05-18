import { pool } from '@/database/index.js';
import { execQuery, type QueryClient } from '@/database/query.js';

export type RegistrationProfileContext = {
  profileId: number;
  profileUid: string;
  birthYear: number | null;
  countryId: number | null;
  sexTypeId: number | null;
  hasFinancialProfile: boolean;
  hasHabitsProfile: boolean;
  hasPortfolioProfile: boolean;
  hasLifeStageProfile: boolean;
  hasPostFfpAsset: boolean;
};

export type FinancialProfileDetails = {
  currentSavings: number | null;
  desiredLifeExpectancy: number | null;
  estimatedLifeExpectancy: number | null;
  currencyCode: string | null;
};

export type PortfolioAllocationDetails = {
  allocationType: 'PRE_FFP' | 'POST_FFP';
  u: number | null;
  mu: number | null;
  rf: number | null;
};

export type StageDataDetails = {
  lifeStageRangeId: number;
  stageNo: number | null;
  title: string;
  beginningAge: number | null;
  endingAge: number | null;
  initialAnnualSavings: number | null;
  growthRate: number | null;
};

export type AssetDataDetails = {
  assetId: number;
  assetTypeCode: string | null;
  assetTypeTitle: string | null;
  initialAnnualIncome: number | null;
  growthRate: number | null;
};

const toNumberOrNull = (value: unknown) =>
  value == null ? null : Number(value);

const findAdjustmentByCode = async (
  tableName: string,
  code: string,
  client: QueryClient = pool,
) => {
  const res = await execQuery(
    client,
    `
      SELECT adjustment_years AS "adjustmentYears"
      FROM ${tableName}
      WHERE code = $1
    `,
    [code],
  );

  const adjustment = res.rows[0]?.adjustmentYears;
  return adjustment == null ? null : Number(adjustment);
};

export const findProfileContextByUserId = async (
  userId: number,
  client: QueryClient = pool,
) => {
  const res = await execQuery(
    client,
    `
      SELECT
        p.id AS "profileId",
        p.uid::text AS "profileUid",
        p.birth_year AS "birthYear",
        p.country_id AS "countryId",
        p.sex_type_id AS "sexTypeId",
        (
          p.current_savings IS NOT NULL
          AND p.desired_life_expectancy IS NOT NULL
          AND p.estimated_life_expectancy IS NOT NULL
        ) AS "hasFinancialProfile",
        EXISTS(
          SELECT 1
          FROM habits_profile hp
          WHERE hp.profile_id = p.id
        ) AS "hasHabitsProfile",
        EXISTS(
          SELECT 1
          FROM portfolio_profile pp
          WHERE pp.profile_id = p.id
        ) AS "hasPortfolioProfile",
        EXISTS(
          SELECT 1
          FROM life_stage_profile lsp
          WHERE lsp.profile_id = p.id
        ) AS "hasLifeStageProfile",
        EXISTS(
          SELECT 1
          FROM post_ffp_asset pfa
          WHERE pfa.profile_id = p.id
        ) AS "hasPostFfpAsset"
      FROM profile p
      WHERE p.user_account_id = $1
    `,
    [userId],
  );

  return res.rows[0] as RegistrationProfileContext | undefined;
};

export const findCurrencyIdByCode = async (
  code: string,
  client: QueryClient = pool,
) => {
  const res = await execQuery(
    client,
    'SELECT id FROM currency WHERE code = $1',
    [code],
  );

  return (res.rows[0]?.id as number | undefined) ?? null;
};

export const findLifeExpectancyByCountryAndSex = async (
  countryId: number,
  sexTypeId: number,
  client: QueryClient = pool,
) => {
  const res = await execQuery(
    client,
    `
      SELECT age
      FROM life_expectancy_estimation
      WHERE country_id = $1 AND sex_type_id = $2
    `,
    [countryId, sexTypeId],
  );

  const age = res.rows[0]?.age;
  return age == null ? null : Number(age);
};

export const findSmokingAdjustmentByCode = async (
  code: string,
  client: QueryClient = pool,
) => findAdjustmentByCode('smoking_type', code, client);

export const findPhysicalActivityAdjustmentByCode = async (
  code: string,
  client: QueryClient = pool,
) => findAdjustmentByCode('physical_activity_type', code, client);

export const findDietQualityAdjustmentByCode = async (
  code: string,
  client: QueryClient = pool,
) => findAdjustmentByCode('diet_quality_type', code, client);

export const findAlcoholConsumptionAdjustmentByCode = async (
  code: string,
  client: QueryClient = pool,
) => findAdjustmentByCode('alcohol_consumption_type', code, client);

export const updateProfileFinancialProfile = async (
  profileId: number,
  currentSavings: number,
  desiredLifeExpectancy: number,
  estimatedLifeExpectancy: number,
  preferredCurrencyId: number,
  client: QueryClient = pool,
) => {
  await execQuery(
    client,
    `
      UPDATE profile
      SET
        current_savings = $2,
        desired_life_expectancy = $3,
        estimated_life_expectancy = $4,
        preferred_currency_id = $5
      WHERE id = $1
    `,
    [
      profileId,
      currentSavings,
      desiredLifeExpectancy,
      estimatedLifeExpectancy,
      preferredCurrencyId,
    ],
  );
};

export const getFinancialProfileDetails = async (
  profileId: number,
  client: QueryClient = pool,
) => {
  const res = await execQuery(
    client,
    `
      SELECT
        current_savings AS "currentSavings",
        desired_life_expectancy AS "desiredLifeExpectancy",
        estimated_life_expectancy AS "estimatedLifeExpectancy",
        c.code AS "currencyCode"
      FROM profile p
      LEFT JOIN currency c ON c.id = p.preferred_currency_id
      WHERE p.id = $1
    `,
    [profileId],
  );

  const row = res.rows[0];
  if (!row) return null;

  return {
    currentSavings: toNumberOrNull(row.currentSavings),
    desiredLifeExpectancy: toNumberOrNull(row.desiredLifeExpectancy),
    estimatedLifeExpectancy: toNumberOrNull(row.estimatedLifeExpectancy),
    currencyCode: row.currencyCode ?? null,
  } satisfies FinancialProfileDetails;
};

export const insertPortfolioProfile = async (
  profileId: number,
  allocationType: 'PRE_FFP' | 'POST_FFP',
  u: number,
  mu: number,
  rf: number,
  client: QueryClient = pool,
) => {
  await execQuery(
    client,
    `
      INSERT INTO portfolio_profile (
        profile_id,
        type,
        u,
        mu,
        r_f
      )
      VALUES ($1, $2, $3, $4, $5)
    `,
    [profileId, allocationType, u, mu, rf],
  );
};

export const listPortfolioAllocationDetails = async (
  profileId: number,
  client: QueryClient = pool,
) => {
  const res = await execQuery(
    client,
    `
      SELECT
        type AS "allocationType",
        u,
        mu,
        r_f AS rf
      FROM portfolio_profile
      WHERE profile_id = $1
      ORDER BY CASE type WHEN 'PRE_FFP' THEN 1 ELSE 2 END
    `,
    [profileId],
  );

  return res.rows.map(
    (row) =>
      ({
        allocationType: row.allocationType as 'PRE_FFP' | 'POST_FFP',
        u: toNumberOrNull(row.u),
        mu: toNumberOrNull(row.mu),
        rf: toNumberOrNull(row.rf),
      }) satisfies PortfolioAllocationDetails,
  );
};

export const insertHabitsProfile = async (
  profileId: number,
  smokingTypeId: number,
  physicalActivityTypeId: number,
  dietQualityTypeId: number,
  alcoholConsumptionTypeId: number,
  client: QueryClient = pool,
) => {
  await execQuery(
    client,
    `
      INSERT INTO habits_profile (
        profile_id,
        smoking_type_id,
        physical_activity_type_id,
        diet_quality_type_id,
        alcohol_consumption_type_id
      )
      VALUES ($1, $2, $3, $4, $5)
    `,
    [
      profileId,
      smokingTypeId,
      physicalActivityTypeId,
      dietQualityTypeId,
      alcoholConsumptionTypeId,
    ],
  );
};

export const listEligibleLifeStageRangeIds = async (
  currentAge: number,
  client: QueryClient = pool,
) => {
  const res = await execQuery(
    client,
    `
      SELECT id
      FROM life_stage_range
      WHERE ending_age IS NULL OR ending_age >= $1
      ORDER BY id ASC
    `,
    [currentAge],
  );

  return res.rows.map((row) => Number(row.id));
};

export const insertLifeStageProfile = async (
  profileId: number,
  lifeStageRangeId: number,
  initialAnnualSavings: number,
  growthRate: number,
  client: QueryClient = pool,
) => {
  await execQuery(
    client,
    `
      INSERT INTO life_stage_profile (
        profile_id,
        life_stage_range_id,
        initial_annual_savings,
        growth_rate
      )
      VALUES ($1, $2, $3, $4)
    `,
    [profileId, lifeStageRangeId, initialAnnualSavings, growthRate],
  );
};

export const listStageDataDetails = async (
  profileId: number,
  client: QueryClient = pool,
) => {
  const res = await execQuery(
    client,
    `
      SELECT
        lsp.life_stage_range_id AS "lifeStageRangeId",
        lsr.stage_no AS "stageNo",
        lsr.title,
        lsr.beginning_age AS "beginningAge",
        lsr.ending_age AS "endingAge",
        lsp.initial_annual_savings AS "initialAnnualSavings",
        lsp.growth_rate AS "growthRate"
      FROM life_stage_profile lsp
      JOIN life_stage_range lsr ON lsr.id = lsp.life_stage_range_id
      WHERE lsp.profile_id = $1
      ORDER BY lsr.id ASC
    `,
    [profileId],
  );

  return res.rows.map(
    (row) =>
      ({
        lifeStageRangeId: Number(row.lifeStageRangeId),
        stageNo: toNumberOrNull(row.stageNo),
        title: row.title,
        beginningAge: toNumberOrNull(row.beginningAge),
        endingAge: toNumberOrNull(row.endingAge),
        initialAnnualSavings: toNumberOrNull(row.initialAnnualSavings),
        growthRate: toNumberOrNull(row.growthRate),
      }) satisfies StageDataDetails,
  );
};

export const findExistingAssetTypeIds = async (
  assetTypeIds: number[],
  client: QueryClient = pool,
) => {
  if (assetTypeIds.length === 0) return [];

  const res = await execQuery(
    client,
    `
      SELECT id
      FROM asset_type
      WHERE id = ANY($1::int[])
    `,
    [assetTypeIds],
  );

  return res.rows.map((row) => Number(row.id));
};

export const insertPostFfpAsset = async (
  profileId: number,
  assetTypeId: number,
  initialAnnualIncome: number,
  growthRate: number,
  client: QueryClient = pool,
) => {
  await execQuery(
    client,
    `
      INSERT INTO post_ffp_asset (
        profile_id,
        asset_type_id,
        initial_annual_income,
        growth_rate
      )
      VALUES ($1, $2, $3, $4)
    `,
    [profileId, assetTypeId, initialAnnualIncome, growthRate],
  );
};

export const listAssetDataDetails = async (
  profileId: number,
  client: QueryClient = pool,
) => {
  const res = await execQuery(
    client,
    `
      SELECT
        pfa.id AS "assetId",
        at.code AS "assetTypeCode",
        at.title AS "assetTypeTitle",
        pfa.initial_annual_income AS "initialAnnualIncome",
        pfa.growth_rate AS "growthRate"
      FROM post_ffp_asset pfa
      LEFT JOIN asset_type at ON at.id = pfa.asset_type_id
      WHERE pfa.profile_id = $1
      ORDER BY pfa.id ASC
    `,
    [profileId],
  );

  return res.rows.map(
    (row) =>
      ({
        assetId: Number(row.assetId),
        assetTypeCode: row.assetTypeCode ?? null,
        assetTypeTitle: row.assetTypeTitle ?? null,
        initialAnnualIncome: toNumberOrNull(row.initialAnnualIncome),
        growthRate: toNumberOrNull(row.growthRate),
      }) satisfies AssetDataDetails,
  );
};

export const findSmokingTypeIdByCode = async (
  code: string,
  client: QueryClient = pool,
) => {
  const res = await execQuery(
    client,
    'SELECT id FROM smoking_type WHERE code = $1',
    [code],
  );

  return (res.rows[0]?.id as number | undefined) ?? null;
};

export const findPhysicalActivityTypeIdByCode = async (
  code: string,
  client: QueryClient = pool,
) => {
  const res = await execQuery(
    client,
    'SELECT id FROM physical_activity_type WHERE code = $1',
    [code],
  );

  return (res.rows[0]?.id as number | undefined) ?? null;
};

export const findDietQualityTypeIdByCode = async (
  code: string,
  client: QueryClient = pool,
) => {
  const res = await execQuery(
    client,
    'SELECT id FROM diet_quality_type WHERE code = $1',
    [code],
  );

  return (res.rows[0]?.id as number | undefined) ?? null;
};

export const findAlcoholConsumptionTypeIdByCode = async (
  code: string,
  client: QueryClient = pool,
) => {
  const res = await execQuery(
    client,
    'SELECT id FROM alcohol_consumption_type WHERE code = $1',
    [code],
  );

  return (res.rows[0]?.id as number | undefined) ?? null;
};

export const updateFinancialProfileBasic = async (
  profileId: number,
  fields: {
    currentSavings?: number;
    desiredLifeExpectancy?: number;
    preferredCurrencyId?: number;
  },
  client: QueryClient = pool,
) => {
  const setClauses: string[] = [];
  const values: unknown[] = [profileId];
  let idx = 2;

  if (fields.currentSavings !== undefined) {
    setClauses.push(`current_savings = $${idx++}`);
    values.push(fields.currentSavings);
  }
  if (fields.desiredLifeExpectancy !== undefined) {
    setClauses.push(`desired_life_expectancy = $${idx++}`);
    values.push(fields.desiredLifeExpectancy);
  }
  if (fields.preferredCurrencyId !== undefined) {
    setClauses.push(`preferred_currency_id = $${idx++}`);
    values.push(fields.preferredCurrencyId);
  }

  if (setClauses.length === 0) return;

  await execQuery(
    client,
    `UPDATE profile SET ${setClauses.join(', ')} WHERE id = $1`,
    values,
  );
};

export const updatePortfolioAllocation = async (
  profileId: number,
  allocationType: 'PRE_FFP' | 'POST_FFP',
  u: number,
  mu: number,
  rf: number,
  client: QueryClient = pool,
) => {
  await execQuery(
    client,
    `
      UPDATE portfolio_profile
      SET u = $3, mu = $4, r_f = $5
      WHERE profile_id = $1 AND type = $2
    `,
    [profileId, allocationType, u, mu, rf],
  );
};

export const updateLifeStageProfile = async (
  profileId: number,
  lifeStageRangeId: number,
  fields: { initialAnnualSavings?: number; growthRate?: number },
  client: QueryClient = pool,
) => {
  const setClauses: string[] = [];
  const values: unknown[] = [profileId, lifeStageRangeId];
  let idx = 3;

  if (fields.initialAnnualSavings !== undefined) {
    setClauses.push(`initial_annual_savings = $${idx++}`);
    values.push(fields.initialAnnualSavings);
  }
  if (fields.growthRate !== undefined) {
    setClauses.push(`growth_rate = $${idx++}`);
    values.push(fields.growthRate);
  }

  if (setClauses.length === 0) return;

  await execQuery(
    client,
    `
      UPDATE life_stage_profile
      SET ${setClauses.join(', ')}
      WHERE profile_id = $1 AND life_stage_range_id = $2
    `,
    values,
  );
};

export const updatePostFfpAsset = async (
  profileId: number,
  assetId: number,
  fields: { initialAnnualIncome?: number; growthRate?: number },
  client: QueryClient = pool,
) => {
  const setClauses: string[] = [];
  const values: unknown[] = [profileId, assetId];
  let idx = 3;

  if (fields.initialAnnualIncome !== undefined) {
    setClauses.push(`initial_annual_income = $${idx++}`);
    values.push(fields.initialAnnualIncome);
  }
  if (fields.growthRate !== undefined) {
    setClauses.push(`growth_rate = $${idx++}`);
    values.push(fields.growthRate);
  }

  if (setClauses.length === 0) return;

  await execQuery(
    client,
    `
      UPDATE post_ffp_asset
      SET ${setClauses.join(', ')}
      WHERE profile_id = $1 AND id = $2
    `,
    values,
  );
};

export const deletePostFfpAsset = async (
  profileId: number,
  assetId: number,
  client: QueryClient = pool,
) => {
  await execQuery(
    client,
    `DELETE FROM post_ffp_asset WHERE profile_id = $1 AND id = $2`,
    [profileId, assetId],
  );
};

export const findExistingLifeStageRangeIdsForProfile = async (
  profileId: number,
  client: QueryClient = pool,
) => {
  const res = await execQuery(
    client,
    `SELECT life_stage_range_id AS id FROM life_stage_profile WHERE profile_id = $1`,
    [profileId],
  );

  return res.rows.map((row) => Number(row.id));
};

export const findExistingAssetIdsForProfile = async (
  profileId: number,
  client: QueryClient = pool,
) => {
  const res = await execQuery(
    client,
    `SELECT id FROM post_ffp_asset WHERE profile_id = $1`,
    [profileId],
  );

  return res.rows.map((row) => Number(row.id));
};

export type LifestyleProfileDetails = {
  smokingCode: string | null;
  physicalActivityCode: string | null;
  dietQualityCode: string | null;
  alcoholConsumptionCode: string | null;
};

export const getHabitsProfileDetails = async (
  profileId: number,
  client: QueryClient = pool,
) => {
  const res = await execQuery(
    client,
    `
      SELECT
        st.code AS "smokingCode",
        pat.code AS "physicalActivityCode",
        dqt.code AS "dietQualityCode",
        act.code AS "alcoholConsumptionCode"
      FROM habits_profile hp
      LEFT JOIN smoking_type st ON st.id = hp.smoking_type_id
      LEFT JOIN physical_activity_type pat ON pat.id = hp.physical_activity_type_id
      LEFT JOIN diet_quality_type dqt ON dqt.id = hp.diet_quality_type_id
      LEFT JOIN alcohol_consumption_type act ON act.id = hp.alcohol_consumption_type_id
      WHERE hp.profile_id = $1
    `,
    [profileId],
  );

  const row = res.rows[0];
  if (!row) return null;

  return {
    smokingCode: row.smokingCode ?? null,
    physicalActivityCode: row.physicalActivityCode ?? null,
    dietQualityCode: row.dietQualityCode ?? null,
    alcoholConsumptionCode: row.alcoholConsumptionCode ?? null,
  } satisfies LifestyleProfileDetails;
};

export const updateHabitsProfile = async (
  profileId: number,
  smokingTypeId: number,
  physicalActivityTypeId: number,
  dietQualityTypeId: number,
  alcoholConsumptionTypeId: number,
  client: QueryClient = pool,
) => {
  await execQuery(
    client,
    `
      UPDATE habits_profile
      SET
        smoking_type_id = $2,
        physical_activity_type_id = $3,
        diet_quality_type_id = $4,
        alcohol_consumption_type_id = $5
      WHERE profile_id = $1
    `,
    [profileId, smokingTypeId, physicalActivityTypeId, dietQualityTypeId, alcoholConsumptionTypeId],
  );
};

export const updateEstimatedLifeExpectancy = async (
  profileId: number,
  estimatedLifeExpectancy: number,
  client: QueryClient = pool,
) => {
  await execQuery(
    client,
    `UPDATE profile SET estimated_life_expectancy = $2 WHERE id = $1`,
    [profileId, estimatedLifeExpectancy],
  );
};
