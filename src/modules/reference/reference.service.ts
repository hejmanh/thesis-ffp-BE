import type { Pagination } from '@/utils/pagination.js';
import { buildPaginationMeta } from '@/utils/pagination.js';
import { adjustFirstBeginningAge } from '@/utils/lifeStage.js';
import { badRequest } from '@/utils/error.js';
import { withCache } from '@/utils/cache/cache.js';
import { CACHE_TTL } from '@/types/cache.js';
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toPaginationOptions = (
  pagination: Pagination | null,
): PaginationOptions => {
  if (!pagination) return null;
  return { limit: pagination.limit, offset: pagination.offset };
};

const cacheKey = (
  name: string,
  pagination: Pagination | null,
  sort: SortDirection,
  extra?: Record<string, unknown>,
) =>
  [
    'ref',
    name,
    sort,
    `limit=${pagination?.limit ?? 'all'}`,
    `offset=${pagination?.offset ?? 0}`,
    extra ? JSON.stringify(extra) : null,
  ]
    .filter(Boolean)
    .join(':');

const getCurrentAge = (birthYear: number) =>
  new Date().getFullYear() - birthYear;

// ─── Services ─────────────────────────────────────────────────────────────────

export const getCurrencies = async (
  pagination: Pagination | null,
  sort: SortDirection,
) =>
  withCache(
    cacheKey('currencies', pagination, sort),
    CACHE_TTL.STATIC,
    async () => {
      const result = await listCurrencies(
        toPaginationOptions(pagination),
        sort,
      );
      return {
        data: result.rows,
        meta: buildPaginationMeta(result.totalCount, pagination),
      };
    },
  );

export const getCountries = async (
  pagination: Pagination | null,
  sort: SortDirection,
) =>
  withCache(
    cacheKey('countries', pagination, sort),
    CACHE_TTL.STATIC,
    async () => {
      const result = await listCountries(toPaginationOptions(pagination), sort);
      return {
        data: result.rows,
        meta: buildPaginationMeta(result.totalCount, pagination),
      };
    },
  );

export const getSexTypes = async (
  pagination: Pagination | null,
  sort: SortDirection,
) =>
  withCache(
    cacheKey('sexTypes', pagination, sort),
    CACHE_TTL.STATIC,
    async () => {
      const result = await listSexTypes(toPaginationOptions(pagination), sort);
      return {
        data: result.rows,
        meta: buildPaginationMeta(result.totalCount, pagination),
      };
    },
  );

export const getAssetTypes = async (
  pagination: Pagination | null,
  sort: SortDirection,
) =>
  withCache(
    cacheKey('assetTypes', pagination, sort),
    CACHE_TTL.STATIC,
    async () => {
      const result = await listAssetTypes(
        toPaginationOptions(pagination),
        sort,
      );
      return {
        data: result.rows,
        meta: buildPaginationMeta(result.totalCount, pagination),
      };
    },
  );

export const getScenarioTypes = async (
  pagination: Pagination | null,
  sort: SortDirection,
) =>
  withCache(
    cacheKey('scenarioTypes', pagination, sort),
    CACHE_TTL.STATIC,
    async () => {
      const result = await listScenarioTypes(
        toPaginationOptions(pagination),
        sort,
      );
      return {
        data: result.rows,
        meta: buildPaginationMeta(result.totalCount, pagination),
      };
    },
  );

export const getSmokingTypes = async (
  pagination: Pagination | null,
  sort: SortDirection,
) =>
  withCache(
    cacheKey('smokingTypes', pagination, sort),
    CACHE_TTL.STATIC,
    async () => {
      const result = await listSmokingTypes(
        toPaginationOptions(pagination),
        sort,
      );
      return {
        data: result.rows,
        meta: buildPaginationMeta(result.totalCount, pagination),
      };
    },
  );

export const getPhysicalActivityTypes = async (
  pagination: Pagination | null,
  sort: SortDirection,
) =>
  withCache(
    cacheKey('physicalActivityTypes', pagination, sort),
    CACHE_TTL.STATIC,
    async () => {
      const result = await listPhysicalActivityTypes(
        toPaginationOptions(pagination),
        sort,
      );
      return {
        data: result.rows,
        meta: buildPaginationMeta(result.totalCount, pagination),
      };
    },
  );

export const getDietQualityTypes = async (
  pagination: Pagination | null,
  sort: SortDirection,
) =>
  withCache(
    cacheKey('dietQualityTypes', pagination, sort),
    CACHE_TTL.STATIC,
    async () => {
      const result = await listDietQualityTypes(
        toPaginationOptions(pagination),
        sort,
      );
      return {
        data: result.rows,
        meta: buildPaginationMeta(result.totalCount, pagination),
      };
    },
  );

export const getAlcoholConsumptionTypes = async (
  pagination: Pagination | null,
  sort: SortDirection,
) =>
  withCache(
    cacheKey('alcoholConsumptionTypes', pagination, sort),
    CACHE_TTL.STATIC,
    async () => {
      const result = await listAlcoholConsumptionTypes(
        toPaginationOptions(pagination),
        sort,
      );
      return {
        data: result.rows,
        meta: buildPaginationMeta(result.totalCount, pagination),
      };
    },
  );

export const getLifeStageRanges = async (
  pagination: Pagination | null,
  sort: SortDirection,
  birthYear?: number,
) =>
  withCache(
    cacheKey('lifeStageRanges', pagination, sort, { birthYear }),
    CACHE_TTL.DYNAMIC,
    async () => {
      let minBeginningAge: number | undefined = undefined;
      let currentAge: number | undefined = undefined;

      if (birthYear != null) {
        if (birthYear < 1900)
          throw badRequest('birthYear is too far in the past');

        const derivedAge = getCurrentAge(birthYear);
        if (derivedAge < 0)
          throw badRequest('birthYear cannot be in the future');

        currentAge = derivedAge;
        if (sort === 'asc') minBeginningAge = derivedAge;
      }

      const result = await listLifeStageRanges(
        toPaginationOptions(pagination),
        sort,
        minBeginningAge,
      );

      const shouldAdjust =
        currentAge != null &&
        sort === 'asc' &&
        (pagination == null || pagination.offset === 0);

      const data =
        shouldAdjust && currentAge != null
          ? adjustFirstBeginningAge(result.rows, currentAge)
          : result.rows;

      return { data, meta: buildPaginationMeta(result.totalCount, pagination) };
    },
  );
