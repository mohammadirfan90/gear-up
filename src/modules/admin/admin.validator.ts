import { z } from 'zod';

export const adminUserIdParamSchema = z.object({
  params: z.object({ id: z.string().cuid() }),
});

export const updateUserStatusSchema = z.object({
  body: z.object({
    status: z.enum(['active', 'suspended']),
    reason: z.string().trim().max(500).optional(),
  }),
});

export const listUsersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    role: z.enum(['customer', 'provider', 'admin']).optional(),
    status: z.enum(['active', 'suspended']).optional(),
    search: z.string().trim().optional(),
  }),
});

export const listAllGearSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    isAvailable: z.coerce.boolean().optional(),
  }),
});

export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>['body'];
export type ListUsersInput = z.infer<typeof listUsersSchema>['query'];
export type ListAllGearInput = z.infer<typeof listAllGearSchema>['query'];
