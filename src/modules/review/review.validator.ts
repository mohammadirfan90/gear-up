import { z } from 'zod';

export const createReviewSchema = z.object({
  body: z.object({
    rentalOrderId: z.string().cuid('Invalid rental order id'),
    rating: z.number().int().min(1).max(5),
    comment: z.string().trim().max(1000).optional(),
  }),
});

export const reviewIdParamSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
});

export const listGearReviewsSchema = z.object({
  params: z.object({ gearItemId: z.string().cuid() }),
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>['body'];