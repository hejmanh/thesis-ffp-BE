import { z } from 'zod';

type RawValue = string | string[] | undefined | null;

const normalizeValue = (value: RawValue) => {
  if (Array.isArray(value)) return value[0];
  if (value === '' || value == null) return undefined;
  return value;
};

const optionalPositiveInt = z.preprocess(
  (value) => {
    const normalized = normalizeValue(value as RawValue);
    if (normalized === undefined) return undefined;
    const parsed = Number.parseInt(String(normalized), 10);
    return Number.isNaN(parsed) ? normalized : parsed;
  },
  z.number().int().positive().optional(),
);

const optionalInt = z.preprocess(
  (value) => {
    const normalized = normalizeValue(value as RawValue);
    if (normalized === undefined) return undefined;
    const parsed = Number.parseInt(String(normalized), 10);
    return Number.isNaN(parsed) ? normalized : parsed;
  },
  z.number().int().optional(),
);

const sortDirection = z.preprocess(
  (value) => {
    const normalized = normalizeValue(value as RawValue);
    if (normalized === undefined) return undefined;
    return String(normalized).toLowerCase();
  },
  z.enum(['asc', 'desc']).optional(),
);

export const PaginationQueryDto = z.object({
  page: optionalPositiveInt,
  pageSize: optionalPositiveInt,
  sort: sortDirection,
});

export type PaginationQueryDto = z.infer<typeof PaginationQueryDto>;

export const LifeStageQueryDto = PaginationQueryDto.extend({
  birthYear: optionalInt,
});

export type LifeStageQueryDto = z.infer<typeof LifeStageQueryDto>;
