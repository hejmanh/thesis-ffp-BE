export type PaginationParams = {
  page?: number | undefined;
  pageSize?: number | undefined;
  sort?: 'asc' | 'desc' | undefined;
};

export type Pagination = {
  page: number;
  pageSize: number;
  limit: number;
  offset: number;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export const parsePaginationParams = (query: PaginationParams): Pagination | null => {
  const page = query.page;
  const pageSize = query.pageSize;
  const shouldPaginate = page != null || pageSize != null;

  if (!shouldPaginate) return null;

  const finalPage = page ?? 1;
  const finalPageSize = pageSize ?? 20;

  return {
    page: finalPage,
    pageSize: finalPageSize,
    limit: finalPageSize,
    offset: (finalPage - 1) * finalPageSize,
  };
};

export const parseSortParam = (query: Pick<PaginationParams, 'sort'>) => {
  return query.sort ?? 'asc';
};

export const buildPaginationMeta = (
  totalCount: number,
  pagination: Pagination | null,
): PaginationMeta => {
  if (!pagination) {
    const pageSize = totalCount;
    return {
      page: 1,
      pageSize: pageSize,
      totalCount,
      totalPages: totalCount === 0 ? 0 : 1,
    };
  }

  return {
    page: pagination.page,
    pageSize: pagination.pageSize,
    totalCount,
    totalPages:
      pagination.pageSize === 0
        ? 0
        : Math.ceil(totalCount / pagination.pageSize),
  };
};
