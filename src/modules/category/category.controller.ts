import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CategoryService } from './category.service';
import { ok, created } from '@/shared/utils/api-response';
import {
  CreateCategoryInput,
  ListCategoriesQuery,
  UpdateCategoryInput,
} from './category.validator';

export class CategoryController {
  private readonly service: CategoryService;

  constructor(prisma: PrismaClient) {
    this.service = new CategoryService(prisma);
  }

  list = async (req: Request, res: Response): Promise<void> => {
    const { page, limit } = req.query as unknown as ListCategoriesQuery;
    const result = await this.service.list({ page, limit });
    ok(res, 'Categories retrieved', result);
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const category = await this.service.getById(id);
    ok(res, 'Category retrieved', { category });
  };

  create = async (req: Request, res: Response): Promise<void> => {
    const input = req.body as CreateCategoryInput;
    const category = await this.service.create(input);
    created(res, 'Category created', { category });
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    const input = req.body as UpdateCategoryInput;
    const category = await this.service.update(id, input);
    ok(res, 'Category updated', { category });
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params as { id: string };
    await this.service.delete(id);
    ok(res, 'Category deleted', null);
  };
}
