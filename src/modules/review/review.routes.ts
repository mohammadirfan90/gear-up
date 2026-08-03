import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ReviewController } from './review.controller';
import { validate } from '@/shared/middlewares/validate.middleware';
import { createAuthMiddleware } from '@/modules/auth/auth.middleware';
import { requireRole } from '@/modules/auth/role.middleware';
import {
  createReviewSchema,
  listGearReviewsSchema,
  reviewIdParamSchema,
} from './review.validator';

export const createReviewRouter = (prisma: PrismaClient): Router => {
  const router = Router();
  const controller = new ReviewController(prisma);
  const auth = createAuthMiddleware(prisma);

  // Public — anyone can read reviews for a gear item
  router.get(
    '/gear/:gearItemId',
    validate(listGearReviewsSchema),
    controller.listForGear
  );

  // Customer only
  router.post(
    '/',
    auth,
    requireRole('customer'),
    validate(createReviewSchema),
    controller.create
  );

  router.get(
    '/:id',
    validate(reviewIdParamSchema),
    controller.getById
  );

  return router;
};