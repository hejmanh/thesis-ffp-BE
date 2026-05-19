import { z } from 'zod';

export const CreateAssetItemDto = z.object({
  assetTypeId: z.number().int().positive(),
  initialAnnualIncome: z
    .number()
    .min(0, 'initialAnnualIncome must be at least 0'),
  growthRate: z.number(),
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
            message: `Duplicate assetTypeId: ${asset.assetTypeId}`,
          });
        }
        seen.add(asset.assetTypeId);
      }
    }),
});

export type CreateAssetDataDto = z.infer<typeof CreateAssetDataDto>;

export const PortfolioAllocationItemDto = z.object({
  allocationType: z.enum(['PRE_FFP', 'POST_FFP']),
  u: z.number().min(0, 'u must be at least 0').max(1, 'u must be at most 1'),
  mu: z.number().min(0, 'mu must be at least 0'),
  rf: z.number().min(0, 'rf must be at least 0'),
});

export const portfolioAllocationsRefine = (
  allocations: { allocationType: 'PRE_FFP' | 'POST_FFP' }[],
  ctx: z.RefinementCtx,
) => {
  const allocationTypes = new Set(allocations.map((a) => a.allocationType));

  if (!allocationTypes.has('PRE_FFP')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'portfolioAllocations must include PRE_FFP',
    });
  }

  if (!allocationTypes.has('POST_FFP')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'portfolioAllocations must include POST_FFP',
    });
  }

  if (allocationTypes.size !== allocations.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        'portfolioAllocations must not contain duplicate allocationType values',
    });
  }
};

export const UpdateFinancialProfileBasicDto = z
  .object({
    currentSavings: z
      .number()
      .min(0, 'currentSavings must be at least 0')
      .optional(),
    desiredLifeExpectancy: z
      .number()
      .int('desiredLifeExpectancy must be an integer')
      .min(1, 'desiredLifeExpectancy must be at least 1')
      .max(150, 'desiredLifeExpectancy must be at most 150')
      .optional(),
    currencyCode: z
      .string()
      .trim()
      .length(3, 'currencyCode must be a 3-letter code')
      .transform((value) => value.toUpperCase())
      .optional(),
  })
  .refine(
    (data) =>
      data.currentSavings !== undefined ||
      data.desiredLifeExpectancy !== undefined ||
      data.currencyCode !== undefined,
    { message: 'At least one field must be provided' },
  );

export type UpdateFinancialProfileBasicDto = z.infer<
  typeof UpdateFinancialProfileBasicDto
>;

const UpdatePortfolioAllocationItemDto = PortfolioAllocationItemDto;

export const UpdatePortfolioAllocationsDto = z
  .array(UpdatePortfolioAllocationItemDto)
  .length(2, 'portfolioAllocations must include PRE_FFP and POST_FFP')
  .superRefine(portfolioAllocationsRefine);

export type UpdatePortfolioAllocationsDto = z.infer<
  typeof UpdatePortfolioAllocationsDto
>;

const UpdateStageItemDto = z
  .object({
    lifeStageRangeId: z.number().int().positive(),
    initialAnnualSavings: z.number().optional(),
    growthRate: z.number().optional(),
  })
  .refine(
    (data) =>
      data.initialAnnualSavings !== undefined || data.growthRate !== undefined,
    {
      message:
        'At least one of initialAnnualSavings or growthRate must be provided',
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
      .min(0, 'initialAnnualIncome must be at least 0')
      .optional(),
    growthRate: z.number().optional(),
  })
  .refine(
    (data) =>
      data.initialAnnualIncome !== undefined || data.growthRate !== undefined,
    {
      message:
        'At least one of initialAnnualIncome or growthRate must be provided',
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
});

export type UpdateLifestyleProfileDto = z.infer<
  typeof UpdateLifestyleProfileDto
>;
