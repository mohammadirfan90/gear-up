import { PrismaClient, Prisma } from '@prisma/client';
import { UserRole, UserStatus } from './auth.types';

export type SafeUser = Omit<
  Prisma.UserGetPayload<object>,
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

const userRecordSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  password: true,
  refreshToken: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} satisfies Prisma.UserSelect;

export class AuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: userRecordSelect,
    }) as Promise<UserRecord | null>;
  }

  async findById(id: string): Promise<UserRecord | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: userRecordSelect,
    }) as Promise<UserRecord | null>;
  }

  async findByIdSafe(id: string): Promise<SafeUser | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: safeUserSelect,
    }) as Promise<SafeUser | null>;
  }

  async create(data: CreateUserData): Promise<SafeUser> {
    return this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      },
      select: safeUserSelect,
    }) as Promise<SafeUser>;
  }

  async updateRefreshToken(
    userId: string,
    hashedRefreshToken: string | null,
  ): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });
  }

  async clearRefreshToken(userId: string): Promise<void> {
    await this.updateRefreshToken(userId, null);
  }
}
