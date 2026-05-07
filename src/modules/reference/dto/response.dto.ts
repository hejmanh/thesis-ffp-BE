import type { ApiResponse } from '@/types/api-response.js';

export type PaginationMetaDto = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type ReferenceListResponseDto<T> = ApiResponse<T[]> & {
  meta: PaginationMetaDto;
};
