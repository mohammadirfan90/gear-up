import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { createAuthService } from "./auth.service";
import { LoginInput, RefreshTokenInput, RegisterInput } from "./auth.validator";
import { ok } from "@/shared/utils/api-response";

type AuthedRequest = Request & {
  user?: {
    id: string;
    email: string;
    role: "customer" | "provider" | "admin";
    status: "active" | "suspended";
  };
};

export class AuthController {
  constructor(private readonly prisma: PrismaClient) {}

  /**
   * POST /api/auth/register
   */
  register = async (req: Request, res: Response): Promise<void> => {
    const input = req.body as RegisterInput;
    const service = createAuthService(this.prisma);
    const result = await service.register(input);

    ok(res, "Registration successful", result, 201);
  };

  /**
   * POST /api/auth/login
   */
  login = async (req: Request, res: Response): Promise<void> => {
    const input = req.body as LoginInput;
    const service = createAuthService(this.prisma);
    const result = await service.login(input);

    ok(res, "Login successful", result);
  };

  /**
   * POST /api/auth/refresh
   */
  refresh = async (req: Request, res: Response): Promise<void> => {
    const { refreshToken } = req.body as RefreshTokenInput;
    const service = createAuthService(this.prisma);
    const tokens = await service.refresh(refreshToken);

    ok(res, "Token refreshed successfully", { tokens });
  };

  /**
   * POST /api/auth/logout
   */
  logout = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthedRequest;
    if (!authReq.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
        errorDetails: {},
      });
      return;
    }

    const service = createAuthService(this.prisma);
    await service.logout(authReq.user.id);

    ok(res, "Logout successful", null);
  };

  /**
   * GET /api/auth/me
   */
  me = async (req: Request, res: Response): Promise<void> => {
    const authReq = req as AuthedRequest;
    if (!authReq.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
        errorDetails: {},
      });
      return;
    }

    const service = createAuthService(this.prisma);
    const user = await service.getCurrentUser(authReq.user.id);

    ok(res, "Current user retrieved", { user });
  };
}

/**
 * Factory — instantiate controller with shared Prisma client.
 */
export const createAuthController = (prisma: PrismaClient) =>
  new AuthController(prisma);
