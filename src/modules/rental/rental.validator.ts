import { z } from 'zod';
import { ORDER_STATUSES } from './rental.types';

const startOfToday = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const createRentalSchema = z.object({
  body: z
    .object({
      startDate: z.coerce.date().refine((d) => d >= startOfToday(), {
        message: 'Start date must be today or in the future',
      }),
      endDate: z.coerce.date(),
      items: z
        .array(
          z.object({
            gearItemId: z.string().cuid('Invalid gear item id'),
            quantity: z.number().int().min(1).max(100),
          }),
        )
        .min(1, 'At least one item is required'),
      notes: z.string().trim().max(500).optional(),
    })
    .refine((d) => d.endDate > d.startDate, {
      message: 'End date must be after start date',
      path: ['endDate'],
    }),
});

export const rentalIdParamSchema = z.object({
  params: z.object({ id: z.string().cuid('Invalid rental id') }),
});

export const updateRentalStatusSchema = z.object({
  body: z.object({
    status: z.enum(ORDER_STATUSES as [string, ...string[]]),
    reason: z.string().trim().max(500).optional(),
  }),
});

export const listRentalsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(ORDER_STATUSES as [string, ...string[]]).optional(),
  }),
});

export type CreateRentalInput = z.infer<typeof createRentalSchema>['body'];
export type UpdateRentalStatusInput = z.infer<typeof updateRentalStatusSchema>['body'];
export type ListRentalsInput = z.infer<typeof listRentalsSchema>['query'];
