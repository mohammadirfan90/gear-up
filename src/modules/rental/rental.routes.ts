import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { RentalController } from './rental.controller';
import { validate } from '@/shared/middlewares/validate.middleware';
import { createAuthMiddleware } from '@/modules/auth/auth.middleware';
import { requireRole } from '@/modules/auth/role.middleware';
import {
  createRentalSchema,
  listRentalsSchema,
  rentalIdParamSchema,
  updateRentalStatusSchema,
} from './rental.validator';

export const createRentalRouter = (prisma: PrismaClient): Router => {
  const router = Router();
  const controller = new RentalController(prisma);
  const auth = createAuthMiddleware(prisma);

  // Customer
  router.post(
    '/',
    auth,
    requireRole('customer'),
    validate(createRentalSchema),
    controller.create,
  );
  router.get(
    '/',
    auth,
    requireRole('customer'),
    validate(listRentalsSchema),
    controller.listMine,
  );

  // Provider
  router.get(
    '/provider',
    auth,
    requireRole('provider'),
    validate(listRentalsSchema),
    controller.listProvider,
  );

  // Admin
  router.get(
    '/admin/all',
    auth,
    requireRole('admin'),
    validate(listRentalsSchema),
    controller.listAdmin,
  );

  // Shared (any authenticated role; service enforces per-record access)
  router.get(
    '/:id',
    auth,
    validate(rentalIdParamSchema),
    controller.getById,
  );
  router.patch(
    '/:id/status',
    auth,
    validate(rentalIdParamSchema.merge(updateRentalStatusSchema)),
    controller.updateStatus,
  );

  return router;
};
