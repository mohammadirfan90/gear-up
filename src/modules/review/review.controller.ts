import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ReviewService } from './review.service';
import { ok, created } from '@/shared/utils/api-response';
import { CreateReviewInput } from './review.validator';

export class ReviewController {
  private readonly service: ReviewService;

  constructor(prisma: PrismaClient) {
    this.service = new ReviewService(prisma);
  }

  create = async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const input = req.body as CreateReviewInput;
    const review = await this.service.create(userId, input);
    created(res, 'Review created', { review });
  };

  listForGear = async (req: Request, res: Response): Promise<void> => {
    const { gearItemId } = req.params as { gearItemId: string };
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const result = await this.service.listForGear(gearItemId, { page, limit });
    ok(res, 'Reviews retrieved', result);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const review = await this.service.getById(id);
    ok(res, 'Review retrieved', { review });
  };
}