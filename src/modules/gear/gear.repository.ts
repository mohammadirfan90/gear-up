import { PrismaClient, Prisma } from '@prisma/client';
import { GearFilter } from './gear.types';

const buildWhere = (filter: GearFilter): Prisma.GearItemWhereInput => ({
  ...(filter.categoryId && { categoryId: filter.categoryId }),
  ...(filter.brand && {
    brand: { contains: filter.brand, mode: 'insensitive' },
  }),
  ...(filter.providerId && { providerId: filter.providerId }),
  ...(filter.isAvailable !== undefined && { isAvailable: filter.isAvailable }),
  ...((filter.priceMin !== undefined || filter.priceMax !== undefined) && {
    pricePerDay: {
      ...(filter.priceMin !== undefined && { gte: filter.priceMin }),
      ...(filter.priceMax !== undefined && { lte: filter.priceMax }),
    },
  }),
  ...(filter.search && {
    OR: [
      { name: { contains: filter.search, mode: 'insensitive' } },
      { description: { contains: filter.search, mode: 'insensitive' } },
      { brand: { contains: filter.search, mode: 'insensitive' } },
    ],
  }),
});

const publicInclude = {
  category: { select: { id: true, name: true, slug: true } },
  provider: { select: { id: true, name: true } },
} as const;

export class GearRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findMany(opts: {
    skip: number;
    take: number;
    filter: GearFilter;
    sortBy: 'pricePerDay' | 'createdAt' | 'name';
    sortOrder: 'asc' | 'desc';
  }) {
    return this.prisma.gearItem.findMany({
      where: buildWhere(opts.filter),
      skip: opts.skip,
      take: opts.take,
      orderBy: { [opts.sortBy]: opts.sortOrder },
      include: publicInclude,
    });
  }

  async count(filter: GearFilter): Promise<number> {
    return this.prisma.gearItem.count({ where: buildWhere(filter) });
  }

  async findById(id: string) {
    return this.prisma.gearItem.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        provider: { select: { id: true, name: true } },
        reviews: { select: { rating: true } },
      },
    });
  }

  async create(data: Prisma.GearItemCreateInput) {
    return this.prisma.gearItem.create({
      data,
      include: publicInclude,
    });
  }

  async update(id: string, data: Prisma.GearItemUpdateInput) {
    return this.prisma.gearItem.update({
      where: { id },
      data,
      include: publicInclude,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.gearItem.delete({ where: { id } });
  }
}
