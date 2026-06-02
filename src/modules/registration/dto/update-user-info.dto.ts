import { z } from 'zod';

const currentYear = new Date().getFullYear();

export const UpdateUserInfoContextFieldsDto = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    birthYear: z
      .number()
      .int('birthYear must be an integer')
      .min(1900, 'birthYear must be at least 1900')
      .max(currentYear, 'birthYear is invalid')
      .optional(),
    countryId: z
      .number()
      .int('countryId must be an integer')
      .positive('countryId must be positive')
      .optional(),
    sexTypeId: z
      .number()
      .int('sexTypeId must be an integer')
      .positive('sexTypeId must be positive')
      .optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.birthYear !== undefined ||
      data.countryId !== undefined ||
      data.sexTypeId !== undefined,
    {
      message: 'At least one field must be provided',
    },
  );

export const UpdateUserInfoContextDto = z.object({
  userInfo: UpdateUserInfoContextFieldsDto,
});

export type UpdateUserInfoContextDto = z.infer<typeof UpdateUserInfoContextDto>;
export type UpdateUserInfoContextFieldsDto = z.infer<
  typeof UpdateUserInfoContextFieldsDto
>;
