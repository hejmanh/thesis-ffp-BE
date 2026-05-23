import { z } from 'zod';

export const Scenario2InputDto = z.object({
  lifeExpectancy: z
    .number()
    .int('lifeExpectancy must be an integer')
    .min(1, 'lifeExpectancy must be at least 1')
    .max(150, 'lifeExpectancy must be at most 150'),
  inputFfpAnnualSpending: z
    .number()
    .min(0, 'inputFfpAnnualSpending must be at least 0'),
});

export type Scenario2InputDto = z.infer<typeof Scenario2InputDto>;
