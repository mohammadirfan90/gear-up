/**
 * Auth Module — Repository
 *
 * All Prisma queries for the auth module.
 * The service layer calls this; controllers never touch Prisma directly.
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { UserRole, UserStatus } from '../types/auth.types';

/**
 * Type for the Prisma user record excluding password.
 */
export type SafeUser = Omit<
  Prisma.UserGetPayload<{}>,
  'password' | 'refreshToken'
>;

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  password: string;
  refreshToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class AuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Find user by email — includes password for hashing verification.
   * Should never be returned to clients.
   */
  async findByEmail(email: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({
      where: { email },
    }) as Promise<UserRecord | null>;
  }

  /**
   * Find user by id — includes refresh token for validation.
   */
  async findById(id: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({
      where: { id },
    }) as Promise<UserRecord | null>;
  }

  /**
   * Find user by id, excluding password & refresh token.
   * Used for /me endpoint.
   */
  async findByIdSafe(id: string): Promise<SafeUser | null> {
    return this.prisma.user.findUnique({
      where: { id },
      omit: { password: true, refreshToken: true },
    }) as Promise<SafeUser | null>;
  }

  /**
   * Create a new user.
   * Throws ConflictError on duplicate email (Prisma P2002).
   */
  async create(data: CreateUserData): Promise<SafeUser> {
    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      },
      omit: { password: true, refreshToken: true },
    }) as Promise<SafeUser>;
  }

  /**
   * Store hashed refresh token for a user.
   * Only one active refresh token per user (latest replaces previous).
   */
  async updateRefreshToken(
    userId: string,
    hashedRefreshToken: string | null
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });
  }

  /**
   * Clear refresh token (used on logout).
   */
  async clearRefreshToken(userId: string): Promise<void> {
    await this.updateRefreshToken(userId, null);
  }
}