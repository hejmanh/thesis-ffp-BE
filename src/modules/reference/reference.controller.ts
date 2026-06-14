import { LifeStageQueryDto, PaginationQueryDto } from './dto/query.dto.js';
import { listHandler } from '@/utils/listHandler.js';
import * as referenceService from './reference.service.js';

export const getCurrencies = listHandler(
  PaginationQueryDto,
  (pagination, sort, _query, locale) =>
    referenceService.getCurrencies(pagination, sort, locale),
);

export const getCountries = listHandler(
  PaginationQueryDto,
  (pagination, sort, _query, locale) =>
    referenceService.getCountries(pagination, sort, locale),
);

export const getSexTypes = listHandler(PaginationQueryDto, (
  pagination,
  sort,
  _query,
  locale,
) =>
  referenceService.getSexTypes(pagination, sort, locale),
);

export const getAssetTypes = listHandler(
  PaginationQueryDto,
  (pagination, sort, _query, locale) =>
    referenceService.getAssetTypes(pagination, sort, locale),
);

export const getScenarioTypes = listHandler(
  PaginationQueryDto,
  (pagination, sort, _query, locale) =>
    referenceService.getScenarioTypes(pagination, sort, locale),
);

export const getLifeStageRanges = listHandler(
  LifeStageQueryDto,
  (pagination, sort, query, locale) =>
    referenceService.getLifeStageRanges(
      pagination,
      sort,
      locale,
      query.birthYear,
    ),
);

export const getSmokingTypes = listHandler(
  PaginationQueryDto,
  (pagination, sort, _query, locale) =>
    referenceService.getSmokingTypes(pagination, sort, locale),
);

export const getPhysicalActivityTypes = listHandler(
  PaginationQueryDto,
  (pagination, sort, _query, locale) =>
    referenceService.getPhysicalActivityTypes(pagination, sort, locale),
);

export const getDietQualityTypes = listHandler(
  PaginationQueryDto,
  (pagination, sort, _query, locale) =>
    referenceService.getDietQualityTypes(pagination, sort, locale),
);

export const getAlcoholConsumptionTypes = listHandler(
  PaginationQueryDto,
  (pagination, sort, _query, locale) =>
    referenceService.getAlcoholConsumptionTypes(pagination, sort, locale),
);
