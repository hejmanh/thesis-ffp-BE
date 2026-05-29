import { z } from 'zod';

export const CreateAssetItemDto = z.object({
  assetTypeId: z.number().int().positive(),
  initialAnnualIncome: z
    .number()
    .min(0, 'initial annual income must be at least 0'),
  growthRate: z
    .number()
    .gt(-1, 'growth rate must be greater than -1'),
});

export const CreateAssetDataDto = z.object({
  assetData: z
    .array(CreateAssetItemDto)
    .min(1, 'At least one asset must be provided')
    .superRefine((assets, ctx) => {
      const seen = new Set<number>();
      for (const asset of assets) {
        if (seen.has(asset.assetTypeId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Duplicate asset type id: ${asset.assetTypeId}`,
          });
        }
        seen.add(asset.assetTypeId);
      }
    }),
});

export type CreateAssetDataDto = z.infer<typeof CreateAssetDataDto>;

export const PortfolioAllocationItemDto = z.object({
  allocationType: z.enum(['PRE_FFP', 'POST_FFP']),
  u: z
    .number()
    .min(0, 'u must be at least 0')
    .max(1, 'u must be at most 1'),
  mu: z.number().gt(-1, 'mu must be greater than -1'),
  rf: z.number().gt(-1, 'rf must be greater than -1'),
});

export const portfolioAllocationsRefine = (
  allocations: { allocationType: 'PRE_FFP' | 'POST_FFP' }[],
  ctx: z.RefinementCtx,
) => {
  const allocationTypes = new Set(allocations.map((a) => a.allocationType));

  if (!allocationTypes.has('PRE_FFP')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'portfolio allocations must include PRE_FFP',
    });
  }

  if (!allocationTypes.has('POST_FFP')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'portfolio allocations must include POST_FFP',
    });
  }

  if (allocationTypes.size !== allocations.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        'portfolio allocations must not contain duplicate allocation type values',
    });
  }
};

export const UpdateFinancialProfileBasicDto = z
  .object({
    currentSavings: z
      .number()
      .min(0, 'current savings must be at least 0')
      .optional(),
    desiredLifeExpectancy: z
      .number()
      .int('desired life expectancy must be an integer')
      .min(1, 'desired life expectancy must be at least 1')
      .max(150, 'desired life expectancy must be at most 150')
      .optional(),
    currencyId: z
      .number()
      .int('currency id must be an integer')
      .positive('currency id must be positive')
      .optional(),
  })
  .refine(
    (data) =>
      data.currentSavings !== undefined ||
      data.desiredLifeExpectancy !== undefined ||
      data.currencyId !== undefined,
    { message: 'At least one field must be provided' },
  );

export type UpdateFinancialProfileBasicDto = z.infer<
  typeof UpdateFinancialProfileBasicDto
>;

const UpdatePortfolioAllocationItemDto = PortfolioAllocationItemDto;

export const UpdatePortfolioAllocationsDto = z
  .array(UpdatePortfolioAllocationItemDto)
  .length(2, 'portfolio allocations must include PRE_FFP and POST_FFP')
  .superRefine(portfolioAllocationsRefine);

export type UpdatePortfolioAllocationsDto = z.infer<
  typeof UpdatePortfolioAllocationsDto
>;

const CreateStageItemDto = z.object({
  lifeStageRangeId: z.number().int().positive(),
  initialAnnualSavings: z
    .number()
    .gt(0, 'initial annual savings must be greater than 0'),
  growthRate: z
    .number()
    .gt(-1, 'growth rate must be greater than -1'),
});

export const CreateStageDataDto = z
  .array(CreateStageItemDto)
  .min(1, 'At least one stage must be provided')
  .superRefine((stages, ctx) => {
    const seen = new Set<number>();
    for (const stage of stages) {
      if (seen.has(stage.lifeStageRangeId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate life stage range id: ${stage.lifeStageRangeId}`,
        });
      }
      seen.add(stage.lifeStageRangeId);
    }
  });

export type CreateStageDataDto = z.infer<typeof CreateStageDataDto>;

const UpdateStageItemDto = z
  .object({
    lifeStageRangeId: z.number().int().positive(),
    initialAnnualSavings: z
      .number()
      .gt(0, 'initial annual savings must be greater than 0')
      .optional(),
    growthRate: z
      .number()
      .gt(-1, 'growth rate must be greater than -1')
      .optional(),
  })
  .refine(
    (data) =>
      data.initialAnnualSavings !== undefined || data.growthRate !== undefined,
    {
      message:
        'At least one of initial annual savings or growth rate must be provided',
    },
  );

export const UpdateStageDataDto = z
  .array(UpdateStageItemDto)
  .min(1, 'At least one stage must be provided');

export type UpdateStageDataDto = z.infer<typeof UpdateStageDataDto>;

const UpdateAssetItemDto = z
  .object({
    uid: z.string().uuid('uid must be a valid UUID'),
    initialAnnualIncome: z
      .number()
      .min(0, 'initial annual income must be at least 0')
      .optional(),
    growthRate: z
      .number()
      .gt(-1, 'growth rate must be greater than -1')
      .optional(),
  })
  .refine(
    (data) =>
      data.initialAnnualIncome !== undefined || data.growthRate !== undefined,
    {
      message:
        'At least one of initial annual income or growth rate must be provided',
    },
  );

export const UpdateAssetDataDto = z
  .array(UpdateAssetItemDto)
    .min(1, 'At least one asset must be provided')
  .superRefine((assets, ctx) => {
    const seen = new Set<string>();
    for (const asset of assets) {
      if (seen.has(asset.uid)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate uid: ${asset.uid}`,
        });
      }
      seen.add(asset.uid);
    }
  });

export type UpdateAssetDataDto = z.infer<typeof UpdateAssetDataDto>;

export const UpdateLifestyleProfileDto = z.object({
  smokingTypeId: z
    .number()
    .int('smoking type id must be an integer')
    .positive('smoking type id must be positive'),
  physicalActivityTypeId: z
    .number()
    .int('physical activity type id must be an integer')
    .positive('physical activity type id must be positive'),
  dietQualityTypeId: z
    .number()
    .int('diet quality type id must be an integer')
    .positive('diet quality type id must be positive'),
  alcoholConsumptionTypeId: z
    .number()
    .int('alcohol consumption type id must be an integer')
    .positive('alcohol consumption type id must be positive'),
});

export type UpdateLifestyleProfileDto = z.infer<
  typeof UpdateLifestyleProfileDto
>;
