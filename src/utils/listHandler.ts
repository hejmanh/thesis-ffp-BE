import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler.js';
import type {
  Pagination,
  PaginationMeta,
  PaginationParams,
  SortDirection,
} from '@/utils/pagination.js';
import { parsePaginationParams, parseSortParam } from '@/utils/pagination.js';
import type { ApiResponse } from '@/types/api-response.js';
import { z, type ZodTypeAny } from 'zod';

type ListResult<T> = {
  data: T[];
  meta: PaginationMeta;
};

type ApiListResponse<T> = ApiResponse<T[]> & {
  meta: PaginationMeta;
};

export const listHandler = <T, Schema extends ZodTypeAny>(
  schema: Schema,
  handler: (
    pagination: Pagination | null,
    sort: SortDirection,
    query: z.infer<Schema>,
  ) => Promise<ListResult<T>>,
) =>
  asyncHandler(async (req: Request, res: Response<ApiListResponse<T>>) => {
    const query = schema.parse(req.query);
    const pagination = parsePaginationParams(query as PaginationParams);
    const sort = parseSortParam(query as PaginationParams);
    const result = await handler(pagination, sort, query);

    res.json({
      success: true,
      data: result.data,
      meta: result.meta,
    });
  });
