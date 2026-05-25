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
    desiredLifeExpectancy: z
      .number()
      .int('desiredLifeExpectancy must be an integer')
      .min(1, 'desiredLifeExpectancy must be at least 1')
      .max(150, 'desiredLifeExpectancy must be at most 150'),
    currentSavings: z.number().min(0, 'currentSavings must be at least 0'),
    currencyId: z
      .number()
      .int()
      .positive('currencyId must be a positive integer'),
  }),
  portfolioAllocations: z
    .array(PortfolioAllocationItemDto)
    .length(2, 'portfolioAllocations must include PRE_FFP and POST_FFP')
    .superRefine(portfolioAllocationsRefine),
  lifestyleProfile: z.object({
    smokingTypeId: z
      .number()
      .int('smokingTypeId must be an integer')
      .positive('smokingTypeId must be positive'),
    physicalActivityTypeId: z
      .number()
      .int('physicalActivityTypeId must be an integer')
      .positive('physicalActivityTypeId must be positive'),
    dietQualityTypeId: z
      .number()
      .int('dietQualityTypeId must be an integer')
      .positive('dietQualityTypeId must be positive'),
    alcoholConsumptionTypeId: z
      .number()
      .int('alcoholConsumptionTypeId must be an integer')
      .positive('alcoholConsumptionTypeId must be positive'),
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
