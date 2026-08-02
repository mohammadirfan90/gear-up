import { Request, Response, NextFunction } from 'express';
import { logger } from '@/shared/utils/logger';

export const requestLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const start = Date.now();

  res.on('finish', () => {
    const latency = Date.now() - start;
    logger.info(
      { method: req.method, path: req.path, statusCode: res.statusCode, latency },
      'request completed',
    );
  });

  next();
};
