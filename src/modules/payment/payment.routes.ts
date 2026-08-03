import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { PaymentController } from './payment.controller';
import { validate } from '@/shared/middlewares/validate.middleware';
import { createAuthMiddleware } from '@/modules/auth/auth.middleware';
import { requireRole } from '@/modules/auth/role.middleware';
import {
  createPaymentSchema,
  listPaymentsSchema,
  paymentIdParamSchema,
} from './payment.validator';

export const createPaymentRouter = (prisma: PrismaClient): Router => {
  const router = Router();
  const controller = new PaymentController(prisma);
  const auth = createAuthMiddleware(prisma);

  // Webhook — must be mounted with raw body parser in app.ts
  router.post('/webhook', controller.webhook);

  // Customer
  router.post(
    '/create',
    auth,
    requireRole('customer'),
    validate(createPaymentSchema),
    controller.create
  );
  router.get(
    '/',
    auth,
    requireRole('customer'),
    validate(listPaymentsSchema),
    controller.listMine
  );

  // Admin
  router.get(
    '/admin/all',
    auth,
    requireRole('admin'),
    validate(listPaymentsSchema),
    controller.listAdmin
  );

  // Shared
  router.get(
    '/:id',
    auth,
    validate(paymentIdParamSchema),
    controller.getById
  );

  return router;
};