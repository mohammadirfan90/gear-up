import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AdminController } from './admin.controller';
import { validate } from '@/shared/middlewares/validate.middleware';
import { createAuthMiddleware } from '@/modules/auth/auth.middleware';
import { requireRole } from '@/modules/auth/role.middleware';
import {
  adminUserIdParamSchema,
  listAllGearSchema,
  listUsersSchema,
  updateUserStatusSchema,
} from './admin.validator';

export const createAdminRouter = (prisma: PrismaClient): Router => {
  const router = Router();
  const controller = new AdminController(prisma);
  const auth = createAuthMiddleware(prisma);

  router.use(auth, requireRole('admin'));

  router.get('/users', validate(listUsersSchema), controller.listUsers);
  router.get('/users/:id', validate(adminUserIdParamSchema), controller.getUserById);

  // Spec alias: PATCH /api/admin/users/:id mirrors the assignment's
  // status-update endpoint. PATCH /users/:id/status is the explicit
  // resource-targeted variant kept for clarity.
  const userStatusMiddleware = validate(adminUserIdParamSchema.merge(updateUserStatusSchema));
  router.patch('/users/:id/status', userStatusMiddleware, controller.updateUserStatus);
  router.patch('/users/:id', userStatusMiddleware, controller.updateUserStatus);

  router.get('/gear', validate(listAllGearSchema), controller.listAllGear);

  router.get('/stats', controller.getStats);

  return router;
};
