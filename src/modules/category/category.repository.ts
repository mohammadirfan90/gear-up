import { PrismaClient, Prisma } from '@prisma/client';
import { CategoryRecord } from './category.types';

export class CategoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(opts: { skip: number; take: number }): Promise<CategoryRecord[]> {
    return this.prisma.category.findMany({
      skip: opts.skip,
      take: opts.take,
      orderBy: { name: 'asc' },
    });
  }

  async count(): Promise<number> {
    return this.prisma.category.count();
  }

  async findById(id: string): Promise<CategoryRecord | null> {
    return this.prisma.category.findUnique({ where: { id } });
  }

  async findBySlug(slug: string): Promise<CategoryRecord | null> {
    return this.prisma.category.findUnique({ where: { slug } });
  }

  async create(data: {
    name: string;
    slug: string;
    description?: string;
  }): Promise<CategoryRecord> {
    return this.prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
      },
    });
  }

  async update(id: string, data: Prisma.CategoryUpdateInput): Promise<CategoryRecord> {
    return this.prisma.category.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({ where: { id } });
  }
}
