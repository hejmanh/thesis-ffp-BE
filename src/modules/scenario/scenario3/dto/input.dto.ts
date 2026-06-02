import { z } from 'zod';

export const Scenario3InputDto = z.object({
  lifeExpectancy: z
    .number()
    .int('lifeExpectancy must be an integer')
    .min(1, 'lifeExpectancy must be at least 1')
    .max(150, 'lifeExpectancy must be at most 150'),
  inputFfpAge: z
    .number()
    .int('inputFfpAge must be an integer')
    .min(1, 'inputFfpAge must be at least 1')
    .max(150, 'inputFfpAge must be at most 150'),
});

export type Scenario3InputDto = z.infer<typeof Scenario3InputDto>;
