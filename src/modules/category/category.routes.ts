import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { CategoryController } from './category.controller';
import { validate } from '@/shared/middlewares/validate.middleware';
import { createAuthMiddleware } from '@/modules/auth/auth.middleware';
import { requireRole } from '@/modules/auth/role.middleware';
import {
  categoryIdParamSchema,
  createCategorySchema,
  listCategoriesSchema,
  updateCategorySchema,
} from './category.validator';

export const createCategoryRouter = (prisma: PrismaClient): Router => {
  const router = Router();
  const controller = new CategoryController(prisma);
  const auth = createAuthMiddleware(prisma);

  router.get('/', validate(listCategoriesSchema), controller.list);
  router.get('/:id', validate(categoryIdParamSchema), controller.getById);

  router.post(
    '/',
    auth,
    requireRole('admin'),
    validate(createCategorySchema),
    controller.create,
  );
  router.patch(
    '/:id',
    auth,
    requireRole('admin'),
    validate(categoryIdParamSchema.merge(updateCategorySchema)),
    controller.update,
  );
  router.delete(
    '/:id',
    auth,
    requireRole('admin'),
    validate(categoryIdParamSchema),
    controller.delete,
  );

  return router;
};
