import { PrismaClient, Prisma } from '@prisma/client';
import { ForbiddenError, NotFoundError } from '@/shared/errors';
import { buildPagination, buildPaginationMeta } from '@/shared/utils/pagination';
import { GearRepository } from './gear.repository';
import { CreateGearInput, ListGearInput, UpdateGearInput } from './gear.validator';
import { GearDetailRecord, GearFilter } from './gear.types';

const mapDetailRating = (gear: GearDetailRecord) => {
  const ratings = gear.reviews.map((r) => r.rating);
  const reviewCount = ratings.length;
  const avgRating =
    reviewCount === 0 ? null : Number((ratings.reduce((a, b) => a + b, 0) / reviewCount).toFixed(2));
  return { reviewCount, avgRating };
};

export class GearService {
  private readonly repository: GearRepository;

  constructor(prisma: PrismaClient) {
    this.repository = new GearRepository(prisma);
  }

  async list(params: ListGearInput) {
    const filter: GearFilter = {
      categoryId: params.categoryId,
      brand: params.brand,
      priceMin: params.priceMin,
      priceMax: params.priceMax,
      isAvailable: params.isAvailable ?? true,
      providerId: params.providerId,
      search: params.search,
    };

    const { skip, take, page, limit } = buildPagination({
      page: params.page,
      limit: params.limit,
    });

    const [items, total] = await Promise.all([
      this.repository.findMany({
        skip,
        take,
        filter,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      }),
      this.repository.count(filter),
    ]);

    return { items, pagination: buildPaginationMeta(page, limit, total) };
  }

  async getById(id: string) {
    const gear = await this.repository.findById(id);
    if (!gear) {
      throw new NotFoundError('Gear not found', { resource: 'gear', id });
    }
    return { ...gear, ...mapDetailRating(gear as GearDetailRecord) };
  }

  async create(providerId: string, input: CreateGearInput) {
    return this.repository.create({
      name: input.name,
      description: input.description,
      brand: input.brand,
      pricePerDay: input.pricePerDay,
      stock: input.stock,
      isAvailable: input.isAvailable,
      images: input.images,
      specifications:
        (input.specifications as Prisma.InputJsonValue | undefined) ?? Prisma.JsonNull,
      category: { connect: { id: input.categoryId } },
      provider: { connect: { id: providerId } },
    });
  }

  async update(gearId: string, providerId: string, input: UpdateGearInput) {
    const gear = await this.getById(gearId);

    if (gear.providerId !== providerId) {
      throw new ForbiddenError('You can only update your own gear');
    }

    const data: Prisma.GearItemUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.brand !== undefined) data.brand = input.brand;
    if (input.pricePerDay !== undefined) data.pricePerDay = input.pricePerDay;
    if (input.stock !== undefined) data.stock = input.stock;
    if (input.isAvailable !== undefined) data.isAvailable = input.isAvailable;
    if (input.images !== undefined) data.images = input.images;
    if (input.specifications !== undefined) {
      data.specifications = input.specifications as Prisma.InputJsonValue;
    }
    if (input.categoryId) data.category = { connect: { id: input.categoryId } };

    return this.repository.update(gearId, data);
  }

  async delete(gearId: string, providerId: string): Promise<void> {
    const gear = await this.getById(gearId);

    if (gear.providerId !== providerId) {
      throw new ForbiddenError('You can only delete your own gear');
    }

    try {
      await this.repository.delete(gearId);
    } catch (err) {
      if (
        err &&
        typeof err === 'object' &&
        'code' in err &&
        (err as { code: string }).code === 'P2003'
      ) {
        // Gear is referenced by past rental orders — soft-delete instead.
        await this.repository.update(gearId, { isAvailable: false, stock: 0 });
        return;
      }
      throw err;
    }
  }
}
