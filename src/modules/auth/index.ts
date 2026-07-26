/**
 * Auth Module — Public exports
 *
 * Import everything from this file for clean module boundary:
 *   import { createAuthRouter } from '@/modules/auth';
 */

export { createAuthRouter } from './routes/auth.routes';
export { requireRole } from './middlewares/role.middleware';
export { createAuthMiddleware } from './middlewares/auth.middleware';
export {
  UserRole,
  UserStatus,
  USER_ROLES,
} from './types/auth.types';
export type {
  AuthUser,
  AuthResult,
  AuthTokens,
  JwtPayload,
} from './types/auth.types';