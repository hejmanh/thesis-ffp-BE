import type { Request, Response } from 'express';
import { asyncHandler } from '@/utils/asyncHandler.js';
import type { Pagination } from '@/utils/pagination.js';
import type { PaginationParams } from '@/utils/pagination.js';
import { parsePaginationParams, parseSortParam } from '@/utils/pagination.js';
import type { SortDirection } from '../modules/reference/reference.repository.js';
import type { ReferenceListResponseDto } from '../modules/reference/dto/response.dto.js';
import { z, type ZodTypeAny } from 'zod';

type ReferenceListMeta = ReferenceListResponseDto<unknown>['meta'];

type ListResult<T> = {
  data: T[];
  meta: ReferenceListMeta;
};

export const listHandler = <T, Schema extends ZodTypeAny>(
  schema: Schema,
  handler: (
    pagination: Pagination | null,
    sort: SortDirection,
    query: z.infer<Schema>,
  ) => Promise<ListResult<T>>,
) =>
  asyncHandler(
    async (req: Request, res: Response<ReferenceListResponseDto<T>>) => {
      const query = schema.parse(req.query);
      const pagination = parsePaginationParams(query as PaginationParams);
      const sort = parseSortParam(query as PaginationParams);
      const result = await handler(pagination, sort, query);

      res.json({
        success: true,
        data: result.data,
        meta: result.meta,
      });
    },
  );
