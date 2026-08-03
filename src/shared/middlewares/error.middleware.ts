import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '@/shared/errors';
import { env } from '@/shared/config/env';
import { logger } from '@/shared/utils/logger';

const formatZodError = (err: ZodError): Record<string, string> => {
  const details: Record<string, string> = {};
  for (const issue of err.issues) {
    const path = issue.path.join('.') || '_form';
    if (!details[path]) details[path] = issue.message;
  }
  return details;
};

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let statusCode = 500;
  let message = 'Internal server error';
  let errorDetails: Record<string, unknown> = {};

  if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation failed';
    errorDetails = formatZodError(err);
  } else if (err instanceof ValidationError) {
    statusCode = err.statusCode;
    message = err.message;
    errorDetails = err.errorDetails;
  } else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorDetails = err.errorDetails;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      statusCode = 409;
      message = 'Resource already exists';
      const target = (err.meta?.target as string[]) ?? [];
      const field = target[0] ?? 'field';
      errorDetails = { [field]: `${field} already taken` };
    } else if (err.code === 'P2025') {
      statusCode = 404;
      message = 'Resource not found';
    } else if (err.code === 'P2003') {
      statusCode = 400;
      message = 'Invalid reference';
      errorDetails = { _form: 'Referenced resource does not exist' };
    }
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (err.name === 'StripeSignatureVerificationError') {
    statusCode = 400;
    message = 'Webhook signature verification failed';
  } else if (env.NODE_ENV !== 'production') {
    message = err.message || 'Internal server error';
    errorDetails = { stack: err.stack };
  }

  if (statusCode >= 500) {
    logger.error({ method: req.method, path: req.path, err }, err.message);
  } else {
    logger.warn({ method: req.method, path: req.path, statusCode }, message);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorDetails,
  });
};
