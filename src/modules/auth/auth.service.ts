import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  ForbiddenError,
} from '@/shared/errors';
import { generateTokens, verifyRefreshToken, hashToken } from '@/shared/utils/jwt';
import { AuthRepository, UserRecord } from './auth.repository';
import {
  AuthResult,
  AuthUser,
  AuthTokens,
  JwtPayload,
  UserStatus,
} from './auth.types';
import { LoginInput, RegisterInput } from './auth.validator';

const BCRYPT_SALT_ROUNDS = 12;

export class AuthService {
  private readonly repository: AuthRepository;

  constructor(prisma: PrismaClient) {
    this.repository = new AuthRepository(prisma);
  }

  async register(input: RegisterInput): Promise<AuthResult> {
    const { name, email, password, role } = input;

    const existing = await this.repository.findByEmail(email);
    if (existing) {
      throw new ConflictError('Email already registered', {
        email: 'An account with this email already exists',
      });
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    let user;
    try {
      user = await this.repository.create({
        name,
        email,
        password: hashedPassword,
        role,
      });
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: string }).code === 'P2002'
      ) {
        throw new ConflictError('Email already registered', {
          email: 'An account with this email already exists',
        });
      }
      throw err;
    }

    const tokens = await generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    await this.repository.updateRefreshToken(user.id, await hashToken(tokens.refreshToken));

    return {
      user: this.toAuthUser(user),
      tokens,
    };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const { email, password } = input;

    const user = await this.repository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenError(
        'Your account has been suspended. Please contact support.',
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const tokens = await generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    await this.repository.updateRefreshToken(user.id, await hashToken(tokens.refreshToken));

    return {
      user: this.toAuthUser(user),
      tokens,
    };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: JwtPayload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    const user = await this.repository.findById(payload.id);
    if (!user) {
      throw new UnauthorizedError('User no longer exists');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenError('Account has been suspended');
    }

    if (!user.refreshToken) {
      throw new UnauthorizedError('Refresh token revoked. Please log in again.');
    }

    const tokenMatches = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!tokenMatches) {
      throw new UnauthorizedError('Refresh token does not match');
    }

    const tokens = await generateTokens({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    await this.repository.updateRefreshToken(user.id, await hashToken(tokens.refreshToken));

    return tokens;
  }

  async logout(userId: string): Promise<void> {
    const user = await this.repository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    await this.repository.clearRefreshToken(user.id);
  }

  async getCurrentUser(userId: string): Promise<AuthUser> {
    const user = await this.repository.findByIdSafe(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenError('Account has been suspended');
    }
    return this.toAuthUser(user);
  }

  private toAuthUser(user: UserRecord | AuthUser): AuthUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}

export const createAuthService = (prisma: PrismaClient) => new AuthService(prisma);
