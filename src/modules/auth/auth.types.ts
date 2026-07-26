/**
 * Auth Module — Type Definitions
 *
 * All types and role enums specific to the auth module.
 * Mirrors Prisma enums where applicable.
 */

export const UserRole = {
  CUSTOMER: 'customer',
  PROVIDER: 'provider',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const USER_ROLES = Object.values(UserRole);

export const UserStatus = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

/**
 * JWT payload carried in both access and refresh tokens.
 */
export interface JwtPayload {
  id: string;
  email: string;
  role: UserRole;
}

/**
 * Decoded token shape returned to clients.
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
}

/**
 * Public user shape — never includes password.
 */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Result of a successful register/login.
 */
export interface AuthResult {
  user: AuthUser;
  tokens: AuthTokens;
}
