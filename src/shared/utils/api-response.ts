import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export const ok = (
  res: Response,
  message: string,
  data: unknown,
  statusCode = 200,
): Response => res.status(statusCode).json({ success: true, message, data });

export const created = (res: Response, message: string, data: unknown): Response =>
  res.status(201).json({ success: true, message, data });

export const noContent = (res: Response): Response => res.status(204).send();

export const paginated = <T>(
  res: Response,
  message: string,
  items: T[],
  pagination: PaginationMeta,
): Response =>
  res.status(200).json({
    success: true,
    message,
    data: { items, pagination },
  });
