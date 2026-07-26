/**
 * Role-based Authorization Middleware
 *
 * Gates routes to one or more roles. Must run AFTER auth.middleware.
 * Usage: router.post('/admin', auth, requireRole('admin'), handler)
 */

import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '@/shared/errors';
import { UserRole, USER_ROLES } from './auth.types';

/**
 * Type guard — checks if a string is a valid UserRole.
 */
const isUserRole = (value: string): value is UserRole =>
  (USER_ROLES as readonly string[]).includes(value);

export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required'));
      return;
    }

    if (!isUserRole(req.user.role)) {
      next(new ForbiddenError('Invalid role on token'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        new ForbiddenError(
          `Access denied. Required role: ${allowedRoles.join(' or ')}`
        )
      );
      return;
    }

    next();
  };
};