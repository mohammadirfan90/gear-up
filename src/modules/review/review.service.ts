import { PrismaClient } from '@prisma/client';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '@/shared/errors';
import { buildPagination, buildPaginationMeta } from '@/shared/utils/pagination';
import { ReviewRepository } from './review.repository';
import { RentalRepository } from '@/modules/rental/rental.repository';
import { CreateReviewInput } from './review.validator';
import { OrderStatus } from '@/modules/rental/rental.types';

export class ReviewService {
  private readonly repository: ReviewRepository;
  private readonly rentalRepository: RentalRepository;

  constructor(prisma: PrismaClient) {
    this.repository = new ReviewRepository(prisma);
    this.rentalRepository = new RentalRepository(prisma);
  }

  async create(customerId: string, input: CreateReviewInput) {
    const order = await this.rentalRepository.findById(input.rentalOrderId);
    if (!order) {
      throw new NotFoundError('Rental order not found', { resource: 'rental', id: input.rentalOrderId });
    }

    if (order.customerId !== customerId) {
      throw new ForbiddenError('You can only review your own rentals');
    }

    if (order.status !== OrderStatus.RETURNED) {
      throw new BadRequestError(
        `Reviews can only be left after the rental is returned (current status: ${order.status})`,
        { status: 'Order must be returned' },
      );
    }

    const existing = await this.repository.findByRentalOrderId(order.id);
    if (existing) {
      throw new ConflictError('You have already reviewed this rental', {
        rentalOrderId: 'A review already exists for this order',
      });
    }

    if (order.items.length === 0) {
      throw new BadRequestError('Rental order has no items to review');
    }

    // Rental orders carry one primary gear item; the schema's @unique on
    // rentalOrderId enforces exactly one review per order.
    const gearItemId = order.items[0].gearItemId;

    return this.repository.create({
      rentalOrder: { connect: { id: order.id } },
      gearItem: { connect: { id: gearItemId } },
      customer: { connect: { id: customerId } },
      rating: input.rating,
      comment: input.comment,
    });
  }

  async listForGear(gearItemId: string, params: { page: number; limit: number }) {
    const { skip, take, page, limit } = buildPagination(params);
    const [items, total, stats] = await Promise.all([
      this.repository.findManyForGear(gearItemId, { skip, take }),
      this.repository.countForGear(gearItemId),
      this.repository.ratingStats(gearItemId),
    ]);

    return {
      items,
      stats,
      pagination: buildPaginationMeta(page, limit, total),
    };
  }

  async getById(id: string) {
    const review = await this.repository.findById(id);
    if (!review) {
      throw new NotFoundError('Review not found', { resource: 'review', id });
    }
    return review;
  }
}
