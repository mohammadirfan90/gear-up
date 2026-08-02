import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { RentalService } from './rental.service';
import { ok, created } from '@/shared/utils/api-response';
import {
  CreateRentalInput,
  ListRentalsInput,
  UpdateRentalStatusInput,
} from './rental.validator';

export class RentalController {
  private readonly service: RentalService;

  constructor(prisma: PrismaClient) {
    this.service = new RentalService(prisma);
  }

  create = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const input = req.body as CreateRentalInput;
    const order = await this.service.create(userId, input);
    created(res, 'Rental order created', { order });
  };

  listMine = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const params = req.query as unknown as ListRentalsInput;
    const result = await this.service.listForCustomer(userId, params);
    ok(res, 'Rentals retrieved', result);
  };

  listProvider = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const params = req.query as unknown as ListRentalsInput;
    const result = await this.service.listForProvider(userId, params);
    ok(res, 'Provider rentals retrieved', result);
  };

  listAdmin = async (req: Request, res: Response): Promise<void> => {
    const params = req.query as unknown as ListRentalsInput;
    const result = await this.service.listAdmin(params);
    ok(res, 'All rentals retrieved', result);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const user = req.user!;
    const order = await this.service.getById(id, user.id, user.role);
    ok(res, 'Rental retrieved', { order });
  };

  updateStatus = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const user = req.user!;
    const input = req.body as UpdateRentalStatusInput;
    const order = await this.service.updateStatus(id, user.id, user.role, input);
    ok(res, 'Rental status updated', { order });
  };
}
