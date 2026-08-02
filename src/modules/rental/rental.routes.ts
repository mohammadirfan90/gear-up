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

// Customer-facing routes: order creation and personal order history.
// Mounted at /api/rentals.
export const createRentalRouter = (prisma: PrismaClient): Router => {
  const router = Router();
  const controller = new RentalController(prisma);
  const auth = createAuthMiddleware(prisma);

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

  // Shared single-fetch and status-update. Service layer enforces
  // per-record ownership for customer/provider; admin has unconditional
  // access.
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

// Spec alias for providers: incoming order queue + per-order actions.
// Mounted at /api/provider/orders. PATCH /:id mirrors the spec's
// PATCH /api/provider/orders/:id status-update endpoint and reuses the
// existing updateStatus service method (provider role gate enforces
// the allowed target transitions).
export const createProviderOrderRouter = (prisma: PrismaClient): Router => {
  const router = Router();
  const controller = new RentalController(prisma);
  const auth = createAuthMiddleware(prisma);

  router.use(auth, requireRole('provider'));

  router.get('/', validate(listRentalsSchema), controller.listProvider);
  router.get('/:id', validate(rentalIdParamSchema), controller.getById);
  router.patch(
    '/:id',
    validate(rentalIdParamSchema.merge(updateRentalStatusSchema)),
    controller.updateStatus,
  );

  return router;
};

// Admin platform-wide order visibility.
// Mounted at /api/admin/rentals. Admin is unconditional; status
// mutations stay under /api/rentals/:id/status for audit traceability.
export const createAdminRentalRouter = (prisma: PrismaClient): Router => {
  const router = Router();
  const controller = new RentalController(prisma);
  const auth = createAuthMiddleware(prisma);

  router.use(auth, requireRole('admin'));

  router.get('/', validate(listRentalsSchema), controller.listAdmin);
  router.get('/:id', validate(rentalIdParamSchema), controller.getById);

  return router;
};
