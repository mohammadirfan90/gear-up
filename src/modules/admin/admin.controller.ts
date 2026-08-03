import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AdminService } from './admin.service';
import { ok } from '@/shared/utils/api-response';
import {
  ListAllGearInput,
  ListUsersInput,
  UpdateUserStatusInput,
} from './admin.validator';

export class AdminController {
  private readonly service: AdminService;

  constructor(prisma: PrismaClient) {
    this.service = new AdminService(prisma);
  }

  listUsers = async (req: Request, res: Response): Promise<void> => {
    const params = req.query as unknown as ListUsersInput;
    const result = await this.service.listUsers(params);
    ok(res, 'Users retrieved', result);
  };

  getUserById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const user = await this.service.getUserById(id);
    ok(res, 'User retrieved', { user });
  };

  updateUserStatus = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const input = req.body as UpdateUserStatusInput;
    const user = await this.service.updateUserStatus(id, input);
    ok(res, 'User status updated', { user });
  };

  listAllGear = async (req: Request, res: Response): Promise<void> => {
    const params = req.query as unknown as ListAllGearInput;
    const result = await this.service.listAllGear(params);
    ok(res, 'All gear retrieved', result);
  };

  getStats = async (_req: Request, res: Response): Promise<void> => {
    const stats = await this.service.getStats();
    ok(res, 'Platform statistics', stats);
  };
}