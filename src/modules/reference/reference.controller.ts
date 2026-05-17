import type { Request, Response } from 'express';
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
import {
  LifeStageQueryDto,
  PaginationQueryDto,
} from './dto/query.dto.js';
import { listHandler } from './utils/listHandler.js';
import { asyncHandler } from '@/utils/asyncHandler.js';
import { unauthorized } from '@/utils/error.js';
import * as referenceService from './reference.service.js';

export const getCurrencies = listHandler(
  PaginationQueryDto,
  (pagination, sort) => referenceService.getCurrencies(pagination, sort),
);

export const getCountries = listHandler(
  PaginationQueryDto,
  (pagination, sort) => referenceService.getCountries(pagination, sort),
);

export const getSexTypes = listHandler(
  PaginationQueryDto,
  (pagination, sort) => referenceService.getSexTypes(pagination, sort),
);

export const getAssetTypes = listHandler(
  PaginationQueryDto,
  (pagination, sort) => referenceService.getAssetTypes(pagination, sort),
);

export const getScenarioTypes = listHandler(
  PaginationQueryDto,
  (pagination, sort) => referenceService.getScenarioTypes(pagination, sort),
);

export const getLifeStageRanges = listHandler(
  LifeStageQueryDto,
  (pagination, sort, query) =>
    referenceService.getLifeStageRanges(pagination, sort, query.birthYear),
);

export const getSmokingTypes = listHandler(
  PaginationQueryDto,
  (pagination, sort) => referenceService.getSmokingTypes(pagination, sort),
);

export const getPhysicalActivityTypes = listHandler(
  PaginationQueryDto,
  (pagination, sort) => referenceService.getPhysicalActivityTypes(pagination, sort),
);

export const getDietQualityTypes = listHandler(
  PaginationQueryDto,
  (pagination, sort) => referenceService.getDietQualityTypes(pagination, sort),
);

export const getAlcoholConsumptionTypes = listHandler(
  PaginationQueryDto,
  (pagination, sort) => referenceService.getAlcoholConsumptionTypes(pagination, sort),
);

export const getEstimateLifeExpectancy = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.userId;
    if (!userId) throw unauthorized('No token provided');
    const result = await referenceService.getEstimateLifeExpectancy(userId);
    res.json(result);
  },
);
