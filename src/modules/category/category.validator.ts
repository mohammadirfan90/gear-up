import { z } from 'zod';

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createCategorySchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must not exceed 100 characters'),
    slug: z
      .string()
      .trim()
      .toLowerCase()
      .regex(slugRegex, 'Invalid slug format')
      .min(2)
      .max(120)
      .optional(),
    description: z.string().trim().max(500).optional(),
  }),
});

export const updateCategorySchema = z.object({
  body: z
    .object({
      name: z.string().trim().min(2).max(100).optional(),
      slug: z
        .string()
        .trim()
        .toLowerCase()
        .regex(slugRegex, 'Invalid slug format')
        .min(2)
        .max(120)
        .optional(),
      description: z.string().trim().max(500).optional(),
    })
    .refine((d) => Object.keys(d).length > 0, {
      message: 'At least one field is required',
    }),
});

export const categoryIdParamSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid category id'),
  }),
});

export const listCategoriesSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  }),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>['body'];
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>['body'];
export type ListCategoriesQuery = z.infer<typeof listCategoriesSchema>['query'];
