import { PaginationMeta } from './api-response';

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationResult {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export const buildPagination = (params: PaginationParams): PaginationResult => {
  const page = Math.max(1, params.page);
  const limit = Math.min(MAX_LIMIT, Math.max(1, params.limit));
  return {
    skip: (page - 1) * limit,
    take: limit,
    page,
    limit,
  };
};

export const buildPaginationMeta = (
  page: number,
  limit: number,
  total: number,
): PaginationMeta => {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};
