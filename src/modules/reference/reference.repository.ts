import { pool } from '@/database/index.js';
import { execQuery } from '@/database/query.js';
import type { SortDirection } from '@/utils/pagination.js';
import type {
  AlcoholConsumptionTypeDto,
  AssetTypeDto,
  CountryDto,
  CurrencyDto,
  DietQualityTypeDto,
  LifeStageRangeDto,
  PhysicalActivityTypeDto,
  ScenarioTypeDto,
  SexTypeDto,
  SmokingTypeDto,
} from './dto/reference.dto.js';

export type PaginationOptions = {
  limit: number;
  offset: number;
} | null;

const applyPagination = (
  sql: string,
  params: unknown[],
  pagination: PaginationOptions,
  orderBy: string,
) => {
  const orderedSql = `${sql} ORDER BY ${orderBy}`;
  if (!pagination) return { sql: orderedSql, params };

  const limitIndex = params.length + 1;
  const offsetIndex = params.length + 2;

  return {
    sql: `${orderedSql} LIMIT $${limitIndex} OFFSET $${offsetIndex}`,
    params: [...params, pagination.limit, pagination.offset],
  };
};

export const listCurrencies = async (
  pagination: PaginationOptions,
  sort: SortDirection,
) => {
  const countRes = await execQuery(
    pool,
    'SELECT COUNT(*)::int AS count FROM currency',
  );

  const baseSql = 'SELECT id, code FROM currency';
  const { sql, params } = applyPagination(
    baseSql,
    [],
    pagination,
    `id ${sort}`,
  );
  const rowsRes = await execQuery(pool, sql, params);

  return {
    rows: rowsRes.rows as CurrencyDto[],
    totalCount: Number(countRes.rows[0].count),
  };
};

export const listCountries = async (
  pagination: PaginationOptions,
  sort: SortDirection,
) => {
  const countRes = await execQuery(
    pool,
    'SELECT COUNT(*)::int AS count FROM country',
  );

  const baseSql = `
    SELECT
      c.id,
      c.code,
      c.name,
      c.currency_id AS "currencyId",
      cur.code AS "currencyCode"
    FROM country c
    LEFT JOIN currency cur ON cur.id = c.currency_id
  `;

  const { sql, params } = applyPagination(
    baseSql,
    [],
    pagination,
    `c.id ${sort}`,
  );
  const rowsRes = await execQuery(pool, sql, params);

  return {
    rows: rowsRes.rows as CountryDto[],
    totalCount: Number(countRes.rows[0].count),
  };
};

export const listSexTypes = async (
  pagination: PaginationOptions,
  sort: SortDirection,
) => {
  const countRes = await execQuery(
    pool,
    'SELECT COUNT(*)::int AS count FROM sex_type',
  );

  const baseSql = 'SELECT id, code, title FROM sex_type';
  const { sql, params } = applyPagination(
    baseSql,
    [],
    pagination,
    `id ${sort}`,
  );
  const rowsRes = await execQuery(pool, sql, params);

  return {
    rows: rowsRes.rows as SexTypeDto[],
    totalCount: Number(countRes.rows[0].count),
  };
};

export const listAssetTypes = async (
  pagination: PaginationOptions,
  sort: SortDirection,
) => {
  const countRes = await execQuery(
    pool,
    'SELECT COUNT(*)::int AS count FROM asset_type',
  );

  const baseSql = 'SELECT id, code, title FROM asset_type';
  const { sql, params } = applyPagination(
    baseSql,
    [],
    pagination,
    `id ${sort}`,
  );
  const rowsRes = await execQuery(pool, sql, params);

  return {
    rows: rowsRes.rows as AssetTypeDto[],
    totalCount: Number(countRes.rows[0].count),
  };
};

export const listScenarioTypes = async (
  pagination: PaginationOptions,
  sort: SortDirection,
) => {
  const countRes = await execQuery(
    pool,
    'SELECT COUNT(*)::int AS count FROM scenario_type',
  );

  const baseSql = 'SELECT id, no, title, description FROM scenario_type';
  const { sql, params } = applyPagination(
    baseSql,
    [],
    pagination,
    `id ${sort}`,
  );
  const rowsRes = await execQuery(pool, sql, params);

  return {
    rows: rowsRes.rows as ScenarioTypeDto[],
    totalCount: Number(countRes.rows[0].count),
  };
};

export const listLifeStageRanges = async (
  pagination: PaginationOptions,
  sort: SortDirection,
  currentAge?: number,
) => {
  const whereParams: unknown[] = [];
  let whereClause = '';

  if (currentAge != null) {
    whereParams.push(currentAge);
    whereClause = `WHERE ending_age IS NULL OR ending_age >= $1`;
  }

  const countRes = await execQuery(
    pool,
    `SELECT COUNT(*)::int AS count FROM life_stage_range ${whereClause}`,
    whereParams,
  );

  const baseSql = `
    SELECT
      id,
      stage_no AS "stageNo",
      title,
      beginning_age AS "beginningAge",
      ending_age AS "endingAge"
    FROM life_stage_range
    ${whereClause}
  `;

  const { sql, params } = applyPagination(
    baseSql,
    whereParams,
    pagination,
    `id ${sort}`,
  );
  const rowsRes = await execQuery(pool, sql, params);

  return {
    rows: rowsRes.rows as LifeStageRangeDto[],
    totalCount: Number(countRes.rows[0].count),
  };
};

export const listSmokingTypes = async (
  pagination: PaginationOptions,
  sort: SortDirection,
) => {
  const countRes = await execQuery(
    pool,
    'SELECT COUNT(*)::int AS count FROM smoking_type',
  );

  const baseSql = `
    SELECT
      id,
      code,
      title,
      adjustment_years AS "adjustmentYears"
    FROM smoking_type
  `;

  const { sql, params } = applyPagination(
    baseSql,
    [],
    pagination,
    `id ${sort}`,
  );
  const rowsRes = await execQuery(pool, sql, params);

  return {
    rows: rowsRes.rows as SmokingTypeDto[],
    totalCount: Number(countRes.rows[0].count),
  };
};

export const listPhysicalActivityTypes = async (
  pagination: PaginationOptions,
  sort: SortDirection,
) => {
  const countRes = await execQuery(
    pool,
    'SELECT COUNT(*)::int AS count FROM physical_activity_type',
  );

  const baseSql = `
    SELECT
      id,
      code,
      title,
      adjustment_years AS "adjustmentYears"
    FROM physical_activity_type
  `;

  const { sql, params } = applyPagination(
    baseSql,
    [],
    pagination,
    `id ${sort}`,
  );
  const rowsRes = await execQuery(pool, sql, params);

  return {
    rows: rowsRes.rows as PhysicalActivityTypeDto[],
    totalCount: Number(countRes.rows[0].count),
  };
};

export const listDietQualityTypes = async (
  pagination: PaginationOptions,
  sort: SortDirection,
) => {
  const countRes = await execQuery(
    pool,
    'SELECT COUNT(*)::int AS count FROM diet_quality_type',
  );

  const baseSql = `
    SELECT
      id,
      code,
      title,
      adjustment_years AS "adjustmentYears"
    FROM diet_quality_type
  `;

  const { sql, params } = applyPagination(
    baseSql,
    [],
    pagination,
    `id ${sort}`,
  );
  const rowsRes = await execQuery(pool, sql, params);

  return {
    rows: rowsRes.rows as DietQualityTypeDto[],
    totalCount: Number(countRes.rows[0].count),
  };
};

export const findLifeExpectancyByUserProfile = async (userId: number) => {
  const res = await execQuery(
    pool,
    `SELECT estimated_life_expectancy FROM profile WHERE user_account_id = $1`,
    [userId],
  );

  const age = res.rows[0]?.estimated_life_expectancy;
  return age == null ? null : Number(age);
};

export const listAlcoholConsumptionTypes = async (
  pagination: PaginationOptions,
  sort: SortDirection,
) => {
  const countRes = await execQuery(
    pool,
    'SELECT COUNT(*)::int AS count FROM alcohol_consumption_type',
  );

  const baseSql = `
    SELECT
      id,
      code,
      title,
      adjustment_years AS "adjustmentYears"
    FROM alcohol_consumption_type
  `;

  const { sql, params } = applyPagination(
    baseSql,
    [],
    pagination,
    `id ${sort}`,
  );
  const rowsRes = await execQuery(pool, sql, params);

  return {
    rows: rowsRes.rows as AlcoholConsumptionTypeDto[],
    totalCount: Number(countRes.rows[0].count),
  };
};
