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
