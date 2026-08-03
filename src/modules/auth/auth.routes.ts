import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { createAuthController } from './auth.controller';
import { createAuthMiddleware } from './auth.middleware';
import { validate } from '@/shared/middlewares/validate.middleware';
import {
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  registerSchema,
} from './auth.validator';

export const createAuthRouter = (prisma: PrismaClient): Router => {
  const router = Router();
  const controller = createAuthController(prisma);
  const auth = createAuthMiddleware(prisma);

  router.post('/register', validate(registerSchema), controller.register);
  router.post('/login', validate(loginSchema), controller.login);
  router.post('/refresh', validate(refreshTokenSchema), controller.refresh);

  router.post('/logout', auth, validate(logoutSchema), controller.logout);
  router.get('/me', auth, controller.me);

  return router;
};
