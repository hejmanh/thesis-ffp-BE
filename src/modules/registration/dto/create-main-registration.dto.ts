import { z } from 'zod';
import {
  PortfolioAllocationItemDto,
  portfolioAllocationsRefine,
} from './update-financial-profile.dto.js';

const StageDataDto = z.object({
  lifeStageRangeId: z.number().int().positive(),
  initialAnnualSavings: z.number(),
  growthRate: z.number(),
});

const AssetDataDto = z.object({
  assetTypeId: z.number().int().positive(),
  initialAnnualIncome: z
    .number()
    .min(0, 'initialAnnualIncome must be at least 0'),
  growthRate: z.number(),
});

export const UserInfoDto = z.object({
  financialProfile: z.object({
    estimatedLifeExpectancy: z
      .number()
      .int('estimatedLifeExpectancy must be an integer')
      .min(1, 'estimatedLifeExpectancy must be at least 1')
      .max(150, 'estimatedLifeExpectancy must be at most 150')
      .optional(),
    desiredLifeExpectancy: z
      .number()
      .int('desiredLifeExpectancy must be an integer')
      .min(1, 'desiredLifeExpectancy must be at least 1')
      .max(150, 'desiredLifeExpectancy must be at most 150'),
    currentSavings: z.number().min(0, 'currentSavings must be at least 0'),
    currencyCode: z
      .string()
      .trim()
      .length(3, 'currencyCode must be a 3-letter code')
      .transform((value) => value.toUpperCase()),
  }),
  portfolioAllocations: z
    .array(PortfolioAllocationItemDto)
    .length(2, 'portfolioAllocations must include PRE_FFP and POST_FFP')
    .superRefine(portfolioAllocationsRefine),
  lifestyleProfile: z.object({
    smokingCode: z.string().trim().min(1, 'smokingCode is required'),
    physicalActivityCode: z
      .string()
      .trim()
      .min(1, 'physicalActivityCode is required'),
    dietQualityCode: z.string().trim().min(1, 'dietQualityCode is required'),
    alcoholConsumptionCode: z
      .string()
      .trim()
      .min(1, 'alcoholConsumptionCode is required'),
  }),
  stageData: z
    .array(StageDataDto)
    .min(1, 'stageData must contain at least 1 stage'),
  assetData: z.array(AssetDataDto),
});

export const CreateUserInfoDto = z.object({
  userInfo: UserInfoDto,
});

export type UserInfoDto = z.infer<typeof UserInfoDto>;

export type CreateUserInfoDto = z.infer<typeof CreateUserInfoDto>;
