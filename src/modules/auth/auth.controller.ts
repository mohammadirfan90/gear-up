import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { createAuthService } from './auth.service';
import { LoginInput, RefreshTokenInput, RegisterInput } from './auth.validator';
import { ok } from '@/shared/utils/api-response';
import { UserRole, UserStatus } from './auth.types';

type AuthedRequest = Request & {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    status: UserStatus;
  };
};

export class AuthController {
  constructor(private readonly prisma: PrismaClient) {}

  register = async (req: Request, res: Response): Promise<void> => {
    const input = req.body as RegisterInput;
    const service = createAuthService(this.prisma);
    const result = await service.register(input);

    ok(res, 'Registration successful', result, 201);
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const input = req.body as LoginInput;
    const service = createAuthService(this.prisma);
    const result = await service.login(input);

    ok(res, 'Login successful', result);
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body as RefreshTokenInput;
    const service = createAuthService(this.prisma);
    const tokens = await service.refresh(refreshToken);

    ok(res, 'Token refreshed successfully', { tokens });
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthedRequest;
    if (!authReq.user) {
      ok(res, 'Authentication required', null, 401);
      return;
    }

    const service = createAuthService(this.prisma);
    await service.logout(authReq.user.id);

    ok(res, 'Logout successful', null);
  };

  me = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthedRequest;
    if (!authReq.user) {
      ok(res, 'Authentication required', null, 401);
      return;
    }

    const service = createAuthService(this.prisma);
    const user = await service.getCurrentUser(authReq.user.id);

    ok(res, 'Current user retrieved', { user });
  };
}

export const createAuthController = (prisma: PrismaClient) => new AuthController(prisma);
