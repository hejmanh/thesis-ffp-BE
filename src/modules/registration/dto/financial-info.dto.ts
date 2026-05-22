import { z } from 'zod';
import {
  PortfolioAllocationItemDto,
  portfolioAllocationsRefine,
  UpdateFinancialProfileBasicDto,
  UpdateLifestyleProfileDto,
  type UpdateFinancialProfileBasicDto as UpdateFinancialProfileBasicDtoType,
  type UpdateLifestyleProfileDto as UpdateLifestyleProfileDtoType,
} from './update-financial-profile.dto.js';

export const FinancialProfileDto = z.object({
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
});

export const FinancialInfoDto = z.object({
  financialProfile: FinancialProfileDto,
  portfolioAllocations: z
    .array(PortfolioAllocationItemDto)
    .length(2, 'portfolioAllocations must include PRE_FFP and POST_FFP')
    .superRefine(portfolioAllocationsRefine),
  lifestyleProfile: UpdateLifestyleProfileDto,
});

export const CreateFinancialInfoDto = z.object({
  financial: FinancialInfoDto,
});

export const UpdateFinancialInfoDto = z
  .object({
    financialProfile: UpdateFinancialProfileBasicDto.optional(),
    portfolioAllocations: z
      .array(PortfolioAllocationItemDto)
      .length(2, 'portfolioAllocations must include PRE_FFP and POST_FFP')
      .superRefine(portfolioAllocationsRefine)
      .optional(),
    lifestyleProfile: UpdateLifestyleProfileDto.optional(),
  })
  .refine(
    (data) =>
      data.financialProfile !== undefined ||
      data.portfolioAllocations !== undefined ||
      data.lifestyleProfile !== undefined,
    { message: 'At least one section must be provided' },
  );

export type FinancialProfileDto = z.infer<typeof FinancialProfileDto>;
export type FinancialInfoDto = z.infer<typeof FinancialInfoDto>;
export type CreateFinancialInfoDto = z.infer<typeof CreateFinancialInfoDto>;
export type UpdateFinancialInfoDto = z.infer<typeof UpdateFinancialInfoDto>;
export type UpdateFinancialSectionDto = {
  financialProfile?: UpdateFinancialProfileBasicDtoType;
  portfolioAllocations?: FinancialInfoDto['portfolioAllocations'];
  lifestyleProfile?: UpdateLifestyleProfileDtoType;
};
