import { PrismaClient, Prisma } from '@prisma/client';

export class ReviewRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(data: Prisma.ReviewCreateInput) {
    return this.prisma.review.create({
      data,
      include: {
        customer: { select: { id: true, name: true } },
      },
    });
  }

  async findByRentalOrderId(rentalOrderId: string) {
    return this.prisma.review.findUnique({ where: { rentalOrderId } });
  }

  async findById(id: string) {
    return this.prisma.review.findUnique({
      where: { id },
      include: {
        rentalOrder: { select: { id: true, customerId: true } },
        gearItem: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
      },
    });
  }

  async findManyForGear(gearItemId: string, opts: { skip: number; take: number }) {
    return this.prisma.review.findMany({
      where: { gearItemId },
      skip: opts.skip,
      take: opts.take,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true } },
      },
    });
  }

  async countForGear(gearItemId: string) {
    return this.prisma.review.count({ where: { gearItemId } });
  }

  async ratingStats(gearItemId: string) {
    const result = await this.prisma.review.aggregate({
      where: { gearItemId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    return {
      average: result._avg.rating ?? 0,
      count: result._count.rating,
    };
  }
}