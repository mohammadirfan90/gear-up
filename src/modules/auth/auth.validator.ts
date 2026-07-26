/**
 * Auth Module — Zod Validation Schemas
 *
 * All input validation for auth endpoints.
 * Errors are mapped to { success: false, message, errorDetails } via global handler.
 */

import { z } from 'zod';
import { USER_ROLES } from '../types/auth.types';

/**
 * POST /api/auth/register
 */
export const registerSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must not exceed 100 characters'),

    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email format')
      .toLowerCase()
      .max(255, 'Email must not exceed 255 characters'),

    password: z
      .string({ required_error: 'Password is required' })
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must not exceed 128 characters'),

    role: z.enum(
      [USER_ROLES[0], USER_ROLES[1]] as [string, ...string[]],
      {
        errorMap: () => ({
          message: 'Role must be either "customer" or "provider"',
        }),
      }
    ),
  }),
});

/**
 * POST /api/auth/login
 */
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email format')
      .toLowerCase(),

    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password is required'),
  }),
});

/**
 * POST /api/auth/refresh
 */
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z
      .string({ required_error: 'Refresh token is required' })
      .min(1, 'Refresh token is required'),
  }),
});

/**
 * GET /api/auth/me — no body, but kept for consistency
 */
export const getCurrentUserSchema = z.object({});

/**
 * POST /api/auth/logout — no body required
 */
export const logoutSchema = z.object({});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>['body'];
