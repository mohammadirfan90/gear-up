import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { GearController } from './gear.controller';
import { validate } from '@/shared/middlewares/validate.middleware';
import { createAuthMiddleware } from '@/modules/auth/auth.middleware';
import { requireRole } from '@/modules/auth/role.middleware';
import {
  createGearSchema,
  gearIdParamSchema,
  listGearSchema,
  updateGearSchema,
} from './gear.validator';

export const createGearRouter = (prisma: PrismaClient): Router => {
  const router = Router();
  const controller = new GearController(prisma);
  const auth = createAuthMiddleware(prisma);

  router.get('/', validate(listGearSchema), controller.list);
  router.get('/:id', validate(gearIdParamSchema), controller.getById);

  router.post(
    '/',
    auth,
    requireRole('provider'),
    validate(createGearSchema),
    controller.create,
  );
  router.patch(
    '/:id',
    auth,
    requireRole('provider'),
    validate(gearIdParamSchema.merge(updateGearSchema)),
    controller.update,
  );
  router.delete(
    '/:id',
    auth,
    requireRole('provider'),
    validate(gearIdParamSchema),
    controller.delete,
  );

  return router;
};

// Spec alias: 2-GearUp.md exposes provider CRUD under /api/provider/gear.
// PUT is the assignment's verb of choice; PATCH is the in-router alias for
// partial updates — both reach the same controller.update handler.
export const createProviderGearRouter = (prisma: PrismaClient): Router => {
  const router = Router();
  const controller = new GearController(prisma);
  const auth = createAuthMiddleware(prisma);

  router.use(auth, requireRole('provider'));

  router.post('/', validate(createGearSchema), controller.create);
  router.put('/:id', validate(gearIdParamSchema.merge(updateGearSchema)), controller.update);
  router.patch('/:id', validate(gearIdParamSchema.merge(updateGearSchema)), controller.update);
  router.delete('/:id', validate(gearIdParamSchema), controller.delete);

  return router;
};
