import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { GearService } from './gear.service';
import { ok, created } from '@/shared/utils/api-response';
import {
  CreateGearInput,
  ListGearInput,
  UpdateGearInput,
} from './gear.validator';

export class GearController {
  private readonly service: GearService;

  constructor(prisma: PrismaClient) {
    this.service = new GearService(prisma);
  }

  list = async (req: Request, res: Response): Promise<void> => {
    const params = req.query as unknown as ListGearInput;
    const result = await this.service.list(params);
    ok(res, 'Gear retrieved', result);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const gear = await this.service.getById(id);
    ok(res, 'Gear retrieved', { gear });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const input = req.body as CreateGearInput;
    const gear = await this.service.create(userId, input);
    created(res, 'Gear created', { gear });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { id } = req.params as { id: string };
    const input = req.body as UpdateGearInput;
    const gear = await this.service.update(id, userId, input);
    ok(res, 'Gear updated', { gear });
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { id } = req.params as { id: string };
    await this.service.delete(id, userId);
    ok(res, 'Gear deleted', null);
  };
}
