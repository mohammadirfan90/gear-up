import 'express-async-errors';
import express, { Application, Request, Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import { env } from '@/shared/config/env';
import { prisma } from '@/shared/config/database';
import { errorMiddleware } from '@/shared/middlewares/error.middleware';
import { notFoundMiddleware } from '@/shared/middlewares/not-found.middleware';
import { requestLoggerMiddleware } from '@/shared/middlewares/request-logger.middleware';
import { ok } from '@/shared/utils/api-response';
import { logger } from '@/shared/utils/logger';

import { createAuthRouter } from '@/modules/auth';
import { createCategoryRouter } from '@/modules/category';
import { createGearRouter, createProviderGearRouter } from '@/modules/gear';
import {
  createRentalRouter,
  createProviderOrderRouter,
  createAdminRentalRouter,
} from '@/modules/rental';
import { createPaymentRouter } from '@/modules/payment';
import { createReviewRouter } from '@/modules/review';
import { createAdminRouter } from '@/modules/admin';

const API_PREFIX = '/api';

const parseOrigins = (raw: string): string[] | true => {
  const value = raw.trim();
  if (value === '' || value === '*') return true;
  return value.split(',').map((o) => o.trim()).filter(Boolean);
};

export const createApp = (): Application => {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: parseOrigins(env.CORS_ORIGIN),
      credentials: true,
    }),
  );

  // Stripe signature verification needs the exact bytes of the request body.
  // The `verify` hook copies the raw buffer to req.rawBody without changing
  // how every other route reads parsed JSON.
  app.use(
    express.json({
      limit: '1mb',
      verify: (req: Request, _res, buf) => {
        (req as Request & { rawBody?: Buffer }).rawBody = Buffer.from(buf);
      },
    }),
  );
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(requestLoggerMiddleware);

  app.get(`${API_PREFIX}/health`, (_req, res) => {
    ok(res, 'OK', {
      status: 'up',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  const routers: Array<{ path: string; router: Router }> = [
    { path: `${API_PREFIX}/auth`, router: createAuthRouter(prisma) },
    { path: `${API_PREFIX}/categories`, router: createCategoryRouter(prisma) },
    { path: `${API_PREFIX}/gear`, router: createGearRouter(prisma) },
    { path: `${API_PREFIX}/provider/gear`, router: createProviderGearRouter(prisma) },
    { path: `${API_PREFIX}/rentals`, router: createRentalRouter(prisma) },
    { path: `${API_PREFIX}/provider/orders`, router: createProviderOrderRouter(prisma) },
    { path: `${API_PREFIX}/admin/rentals`, router: createAdminRentalRouter(prisma) },
    { path: `${API_PREFIX}/payments`, router: createPaymentRouter(prisma) },
    { path: `${API_PREFIX}/reviews`, router: createReviewRouter(prisma) },
    { path: `${API_PREFIX}/admin`, router: createAdminRouter(prisma) },
  ];

  for (const { path, router } of routers) {
    app.use(path, router);
  }

  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
};

export const startServer = async (): Promise<void> => {
  const app = createApp();
  const port = env.PORT;

  await new Promise<void>((resolve) => {
    app.listen(port, () => {
      logger.info(
        { port, env: env.NODE_ENV, apiPrefix: API_PREFIX },
        'GearUp API listening',
      );
      resolve();
    });
  });
};
