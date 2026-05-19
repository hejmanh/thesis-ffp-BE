import { z } from 'zod';

export const CurrencyDto = z.object({
  id: z.number().int(),
  code: z.string(),
});

export type CurrencyDto = z.infer<typeof CurrencyDto>;

export const CountryDto = z.object({
  id: z.number().int(),
  code: z.string().nullable(),
  name: z.string().nullable(),
  currencyId: z.number().int().nullable(),
  currencyCode: z.string().nullable(),
});

export type CountryDto = z.infer<typeof CountryDto>;

export const SexTypeDto = z.object({
  id: z.number().int(),
  code: z.string().nullable(),
  title: z.string().nullable(),
});

export type SexTypeDto = z.infer<typeof SexTypeDto>;

export const AssetTypeDto = z.object({
  id: z.number().int(),
  code: z.string().nullable(),
  title: z.string().nullable(),
});

export type AssetTypeDto = z.infer<typeof AssetTypeDto>;

export const ScenarioTypeDto = z.object({
  id: z.number().int(),
  no: z.number().int(),
  title: z.string(),
  description: z.string().nullable(),
});

export type ScenarioTypeDto = z.infer<typeof ScenarioTypeDto>;

export const LifeStageRangeDto = z.object({
  id: z.number().int(),
  stageNo: z.number().int().nullable(),
  title: z.string(),
  beginningAge: z.number().int().nullable(),
  endingAge: z.number().int().nullable(),
});

export type LifeStageRangeDto = z.infer<typeof LifeStageRangeDto>;

export const SmokingTypeDto = z.object({
  id: z.number().int(),
  code: z.string().nullable(),
  title: z.string().nullable(),
  adjustmentYears: z.number().nullable(),
});

export type SmokingTypeDto = z.infer<typeof SmokingTypeDto>;

export const PhysicalActivityTypeDto = z.object({
  id: z.number().int(),
  code: z.string().nullable(),
  title: z.string().nullable(),
  adjustmentYears: z.number().nullable(),
});

export type PhysicalActivityTypeDto = z.infer<typeof PhysicalActivityTypeDto>;

export const DietQualityTypeDto = z.object({
  id: z.number().int(),
  code: z.string().nullable(),
  title: z.string().nullable(),
  adjustmentYears: z.number().nullable(),
});

export type DietQualityTypeDto = z.infer<typeof DietQualityTypeDto>;

export const AlcoholConsumptionTypeDto = z.object({
  id: z.number().int(),
  code: z.string().nullable(),
  title: z.string().nullable(),
  adjustmentYears: z.number().nullable(),
});

export type AlcoholConsumptionTypeDto = z.infer<
  typeof AlcoholConsumptionTypeDto
>;
