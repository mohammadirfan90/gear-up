import { z } from 'zod';

export const createGearSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(200, 'Name must not exceed 200 characters'),
    description: z
      .string({ required_error: 'Description is required' })
      .trim()
      .min(10, 'Description must be at least 10 characters')
      .max(2000, 'Description must not exceed 2000 characters'),
    brand: z
      .string({ required_error: 'Brand is required' })
      .trim()
      .min(1)
      .max(100),
    pricePerDay: z
      .number({ required_error: 'Price per day is required' })
      .positive('Price must be positive')
      .max(100000, 'Price exceeds maximum'),
    stock: z.number().int().nonnegative().max(10000).default(0),
    isAvailable: z.boolean().default(true),
    images: z.array(z.string().url()).max(20).default([]),
    specifications: z.record(z.string(), z.unknown()).optional(),
    categoryId: z.string().cuid('Invalid category id'),
  }),
});

export const updateGearSchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(200).optional(),
      description: z.string().trim().min(10).max(2000).optional(),
      brand: z.string().trim().min(1).max(100).optional(),
      pricePerDay: z.number().positive().max(100000).optional(),
      stock: z.number().int().nonnegative().max(10000).optional(),
      isAvailable: z.boolean().optional(),
      images: z.array(z.string().url()).max(20).optional(),
      specifications: z.record(z.string(), z.unknown()).optional(),
      categoryId: z.string().cuid().optional(),
    })
    .refine((d) => Object.keys(d).length > 0, {
      message: 'At least one field is required',
    }),
});

export const gearIdParamSchema = z.object({
  params: z.object({ id: z.string().cuid('Invalid gear id') }),
});

export const listGearSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    categoryId: z.string().cuid().optional(),
    brand: z.string().trim().min(1).max(100).optional(),
    priceMin: z.coerce.number().nonnegative().optional(),
    priceMax: z.coerce.number().positive().optional(),
    isAvailable: z.coerce.boolean().optional(),
    providerId: z.string().cuid().optional(),
    search: z.string().trim().min(1).max(200).optional(),
    sortBy: z.enum(['pricePerDay', 'createdAt', 'name']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});

export type CreateGearInput = z.infer<typeof createGearSchema>['body'];
export type UpdateGearInput = z.infer<typeof updateGearSchema>['body'];
export type ListGearInput = z.infer<typeof listGearSchema>['query'];
