import { PrismaClient, Prisma } from '@prisma/client';
import { ConflictError, NotFoundError } from '@/shared/errors';
import { buildPagination, buildPaginationMeta } from '@/shared/utils/pagination';
import { CategoryRepository } from './category.repository';
import { CreateCategoryInput, UpdateCategoryInput } from './category.validator';
import { CategoryRecord } from './category.types';

const slugify = (name: string): string =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export class CategoryService {
  private readonly repository: CategoryRepository;

  constructor(prisma: PrismaClient) {
    this.repository = new CategoryRepository(prisma);
  }

  async list(params: { page: number; limit: number }) {
    const { skip, take, page, limit } = buildPagination(params);
    const [items, total] = await Promise.all([
      this.repository.findAll({ skip, take }),
      this.repository.count(),
    ]);
    return { items, pagination: buildPaginationMeta(page, limit, total) };
  }

  async getById(id: string): Promise<CategoryRecord> {
    const category = await this.repository.findById(id);
    if (!category) {
      throw new NotFoundError('Category not found', { resource: 'category', id });
    }
    return category;
  }

  async create(input: CreateCategoryInput): Promise<CategoryRecord> {
    const slug = input.slug?.trim() ? input.slug : slugify(input.name);

    const existing = await this.repository.findBySlug(slug);
    if (existing) {
      throw new ConflictError('Category slug already exists', {
        slug: 'A category with this slug already exists',
      });
    }

    try {
      return await this.repository.create({
        name: input.name,
        slug,
        description: input.description,
      });
    } catch (err) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: string }).code === 'P2002'
      ) {
        throw new ConflictError('Category slug already exists', {
          slug: 'A category with this slug already exists',
        });
      }
      throw err;
    }
  }

  async update(id: string, input: UpdateCategoryInput): Promise<CategoryRecord> {
    await this.getById(id);

    if (input.slug) {
      const existing = await this.repository.findBySlug(input.slug);
      if (existing && existing.id !== id) {
        throw new ConflictError('Category slug already exists', {
          slug: 'A category with this slug already exists',
        });
      }
    }

    try {
      const data: Prisma.CategoryUpdateInput = {};
      if (input.name !== undefined) data.name = input.name;
      if (input.slug !== undefined) data.slug = input.slug;
      if (input.description !== undefined) data.description = input.description;
      return await this.repository.update(id, data);
    } catch (err) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: string }).code === 'P2025'
      ) {
        throw new NotFoundError('Category not found', { resource: 'category', id });
      }
      throw err;
    }
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    try {
      await this.repository.delete(id);
    } catch (err) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: string }).code === 'P2003'
      ) {
        throw new ConflictError('Cannot delete category with associated gear', {
          _form: 'Remove or reassign gear items first',
        });
      }
      throw err;
    }
  }
}
