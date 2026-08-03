import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { UnauthorizedError } from '@/shared/errors';
import { verifyAccessToken } from '@/shared/utils/jwt';
import { UserStatus } from './auth.types';

const extractToken = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (!header) return null;

  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1] || null;
};

export const createAuthMiddleware = (prisma: PrismaClient) => {
  return async (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const token = extractToken(req);
      if (!token) {
        throw new UnauthorizedError('Authentication token is required');
      }

      let payload;
      try {
        payload = verifyAccessToken(token);
      } catch {
        throw new UnauthorizedError('Invalid or expired token');
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
        },
      });

      if (!user) {
        throw new UnauthorizedError('User no longer exists');
      }

      if (user.status === UserStatus.SUSPENDED) {
        throw new UnauthorizedError('Account has been suspended');
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
      };

      next();
    } catch (err) {
      next(err);
    }
  };
};
