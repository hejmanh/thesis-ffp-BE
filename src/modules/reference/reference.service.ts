import type { Pagination } from '@/utils/pagination.js';
import { buildPaginationMeta } from '@/utils/pagination.js';
import { adjustFirstBeginningAge } from '@/utils/lifeStage.js';
import { badRequest } from '@/utils/error.js';
import type {
  PaginationOptions,
  SortDirection,
} from './reference.repository.js';
import {
  listAlcoholConsumptionTypes,
  listAssetTypes,
  listCountries,
  listCurrencies,
  listDietQualityTypes,
  listLifeStageRanges,
  listPhysicalActivityTypes,
  listScenarioTypes,
  listSexTypes,
  listSmokingTypes,
} from './reference.repository.js';

const toPaginationOptions = (
  pagination: Pagination | null,
): PaginationOptions => {
  if (!pagination) return null;

  return {
    limit: pagination.limit,
    offset: pagination.offset,
  };
};

const getCurrentAge = (birthYear: number) => {
  const currentYear = new Date().getFullYear();
  return currentYear - birthYear;
};

export const getCurrencies = async (
  pagination: Pagination | null,
  sort: SortDirection,
) => {
  const result = await listCurrencies(toPaginationOptions(pagination), sort);
  return {
    data: result.rows,
    meta: buildPaginationMeta(result.totalCount, pagination),
  };
};

export const getCountries = async (
  pagination: Pagination | null,
  sort: SortDirection,
) => {
  const result = await listCountries(toPaginationOptions(pagination), sort);
  return {
    data: result.rows,
    meta: buildPaginationMeta(result.totalCount, pagination),
  };
};

export const getSexTypes = async (
  pagination: Pagination | null,
  sort: SortDirection,
) => {
  const result = await listSexTypes(toPaginationOptions(pagination), sort);
  return {
    data: result.rows,
    meta: buildPaginationMeta(result.totalCount, pagination),
  };
};

export const getAssetTypes = async (
  pagination: Pagination | null,
  sort: SortDirection,
) => {
  const result = await listAssetTypes(toPaginationOptions(pagination), sort);
  return {
    data: result.rows,
    meta: buildPaginationMeta(result.totalCount, pagination),
  };
};

export const getScenarioTypes = async (
  pagination: Pagination | null,
  sort: SortDirection,
) => {
  const result = await listScenarioTypes(toPaginationOptions(pagination), sort);
  return {
    data: result.rows,
    meta: buildPaginationMeta(result.totalCount, pagination),
  };
};

export const getLifeStageRanges = async (
  pagination: Pagination | null,
  sort: SortDirection,
  birthYear?: number,
) => {
  let minBeginningAge: number | undefined = undefined;
  let currentAge: number | undefined = undefined;

  if (birthYear != null) {
    if (birthYear < 1900) {
      throw badRequest('birthYear is too far in the past');
    }

    const derivedAge = getCurrentAge(birthYear);
    if (derivedAge < 0) {
      throw badRequest('birthYear cannot be in the future');
    }

    currentAge = derivedAge;
    if (sort === 'asc') {
      minBeginningAge = derivedAge;
    }
  }

  const result = await listLifeStageRanges(
    toPaginationOptions(pagination),
    sort,
    minBeginningAge,
  );

  const shouldAdjustFirstBeginningAge =
    currentAge != null &&
    sort === 'asc' &&
    (pagination == null || pagination.offset === 0);

  let data = result.rows;

  if (shouldAdjustFirstBeginningAge && currentAge != null) {
    data = adjustFirstBeginningAge(result.rows, currentAge);
  }

  return {
    data,
    meta: buildPaginationMeta(result.totalCount, pagination),
  };
};

export const getSmokingTypes = async (
  pagination: Pagination | null,
  sort: SortDirection,
) => {
  const result = await listSmokingTypes(toPaginationOptions(pagination), sort);
  return {
    data: result.rows,
    meta: buildPaginationMeta(result.totalCount, pagination),
  };
};

export const getPhysicalActivityTypes = async (
  pagination: Pagination | null,
  sort: SortDirection,
) => {
  const result = await listPhysicalActivityTypes(
    toPaginationOptions(pagination),
    sort,
  );
  return {
    data: result.rows,
    meta: buildPaginationMeta(result.totalCount, pagination),
  };
};

export const getDietQualityTypes = async (
  pagination: Pagination | null,
  sort: SortDirection,
) => {
  const result = await listDietQualityTypes(
    toPaginationOptions(pagination),
    sort,
  );
  return {
    data: result.rows,
    meta: buildPaginationMeta(result.totalCount, pagination),
  };
};

export const getAlcoholConsumptionTypes = async (
  pagination: Pagination | null,
  sort: SortDirection,
) => {
  const result = await listAlcoholConsumptionTypes(
    toPaginationOptions(pagination),
    sort,
  );
  return {
    data: result.rows,
    meta: buildPaginationMeta(result.totalCount, pagination),
  };
};
