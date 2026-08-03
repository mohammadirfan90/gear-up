import { z } from 'zod';

export const createPaymentSchema = z.object({
  body: z.object({
    rentalOrderId: z.string().cuid('Invalid rental order id'),
  }),
});

export const paymentIdParamSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
});

export const listPaymentsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
  }),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>['body'];
export type ListPaymentsInput = z.infer<typeof listPaymentsSchema>['query'];