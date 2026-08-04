import { PrismaClient, Prisma } from '@prisma/client';
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '@/shared/errors';
import { buildPagination, buildPaginationMeta } from '@/shared/utils/pagination';
import { RentalRepository } from './rental.repository';
import {
  CreateRentalInput,
  ListRentalsInput,
  UpdateRentalStatusInput,
} from './rental.validator';
import {
  ALLOWED_TRANSITIONS,
  OrderStatus,
  ComputedOrderItem,
} from './rental.types';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const computeRentalDays = (start: Date, end: Date): number => {
  const ms = end.getTime() - start.getTime();
  return Math.max(1, Math.ceil(ms / MS_PER_DAY));
};

export class RentalService {
  private readonly repository: RentalRepository;
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.repository = new RentalRepository(prisma);
  }

  async create(customerId: string, input: CreateRentalInput) {
    const gearIds = input.items.map((i) => i.gearItemId);
    const gearItems = await this.repository.findGearItemsByIds(gearIds);

    if (gearItems.length !== gearIds.length) {
      throw new NotFoundError('One or more gear items not found', {
        _form: 'Some gear items do not exist',
      });
    }

    const gearById = new Map(gearItems.map((g) => [g.id, g]));

    for (const gear of gearItems) {
      if (gear.providerId === customerId) {
        throw new ForbiddenError('You cannot rent your own gear', {
          gearItemId: gear.id,
        });
      }
    }

    for (const requested of input.items) {
      const gear = gearById.get(requested.gearItemId);
      if (!gear) continue;
      if (!gear.isAvailable) {
        throw new BadRequestError(`Gear "${gear.name}" is not available`, {
          gearItemId: gear.id,
        });
      }
      if (gear.stock < requested.quantity) {
        throw new BadRequestError(
          `Insufficient stock for "${gear.name}". Available: ${gear.stock}, requested: ${requested.quantity}`,
          { gearItemId: gear.id },
        );
      }
    }

    const days = computeRentalDays(input.startDate, input.endDate);
    const computedItems: ComputedOrderItem[] = input.items.map((i) => {
      const gear = gearById.get(i.gearItemId)!;
      const pricePerDay = Number(gear.pricePerDay);
      const subtotal = pricePerDay * i.quantity * days;
      return {
        gearItemId: i.gearItemId,
        quantity: i.quantity,
        pricePerDay,
        subtotal,
      };
    });
    const totalAmount = computedItems.reduce((sum, i) => sum + i.subtotal, 0);

    // Atomic: order + line items + stock decrement + initial history log
    // commit together, so a failure never leaves stock without an order.
    const order = await this.prisma.$transaction(
      async (tx) => {
        const created = await this.repository.create(
          {
            customer: { connect: { id: customerId } },
            startDate: input.startDate,
            endDate: input.endDate,
            totalAmount,
            status: OrderStatus.PLACED,
            notes: input.notes,
            items: {
              create: computedItems.map((i) => ({
                gearItem: { connect: { id: i.gearItemId } },
                quantity: i.quantity,
                pricePerDay: i.pricePerDay,
                subtotal: i.subtotal,
              })),
            },
          },
          tx,
        );

        await this.repository.decrementStock(
          computedItems.map((i) => ({ gearItemId: i.gearItemId, quantity: i.quantity })),
          tx,
        );

        await this.repository.writeStatusHistory(
          {
            rentalOrderId: created.id,
            fromStatus: null,
            toStatus: OrderStatus.PLACED,
            changedById: customerId,
          },
          tx,
        );

        return created;
      },
      {
        timeout: 20000,
      },
    );

    return order;
  }

  async getById(id: string, userId: string, userRole: string) {
    const order = await this.repository.findById(id);
    if (!order) {
      throw new NotFoundError('Rental order not found', { resource: 'rental', id });
    }

    if (userRole === 'admin') return order;
    if (userRole === 'customer' && order.customerId === userId) return order;
    if (userRole === 'provider') {
      const ownsGear = order.items.some((i) => i.gearItem.providerId === userId);
      if (ownsGear) return order;
    }

    throw new ForbiddenError('You cannot view this rental');
  }

  async listForCustomer(customerId: string, params: ListRentalsInput) {
    const { skip, take, page, limit } = buildPagination(params);
    const [items, total] = await Promise.all([
      this.repository.findManyForCustomer(customerId, { skip, take, status: params.status }),
      this.repository.countForCustomer(customerId, params.status),
    ]);
    return { items, pagination: buildPaginationMeta(page, limit, total) };
  }

  async listForProvider(providerId: string, params: ListRentalsInput) {
    const { skip, take, page, limit } = buildPagination(params);
    const [items, total] = await Promise.all([
      this.repository.findManyForProvider(providerId, { skip, take, status: params.status }),
      this.repository.countForProvider(providerId, params.status),
    ]);
    return { items, pagination: buildPaginationMeta(page, limit, total) };
  }

  async listAdmin(params: ListRentalsInput) {
    const { skip, take, page, limit } = buildPagination(params);
    const [items, total] = await Promise.all([
      this.repository.findManyAdmin({ skip, take, status: params.status }),
      this.repository.countAdmin(params.status),
    ]);
    return { items, pagination: buildPaginationMeta(page, limit, total) };
  }

  async updateStatus(
    orderId: string,
    userId: string,
    userRole: string,
    input: UpdateRentalStatusInput,
  ) {
    const order = await this.repository.findById(orderId);
    if (!order) {
      throw new NotFoundError('Rental order not found', {
        resource: 'rental',
        id: orderId,
      });
    }

    const currentStatus = order.status as OrderStatus;
    const targetStatus = input.status as OrderStatus;

    const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? [];
    if (!allowed.includes(targetStatus)) {
      throw new ConflictError(
        `Cannot transition from "${currentStatus}" to "${targetStatus}"`,
        { status: `Allowed transitions: ${allowed.join(', ') || 'none'}` },
      );
    }

    if (userRole === 'provider') {
      const ownsGear = order.items.some((i) => i.gearItem.providerId === userId);
      if (!ownsGear) {
        throw new ForbiddenError('You can only update orders for your own gear');
      }
      const providerAllowed: OrderStatus[] = [
        OrderStatus.CONFIRMED,
        OrderStatus.PICKED_UP,
        OrderStatus.RETURNED,
      ];
      if (!providerAllowed.includes(targetStatus)) {
        throw new ForbiddenError('Providers cannot perform this transition');
      }
    } else if (userRole === 'customer') {
      if (order.customerId !== userId) {
        throw new ForbiddenError('You can only cancel your own orders');
      }
      if (targetStatus !== OrderStatus.CANCELLED) {
        throw new ForbiddenError('Customers can only cancel their orders');
      }
    }

    const updated = await this.prisma.$transaction(
      async (tx) => {
        if (targetStatus === OrderStatus.CANCELLED) {
          await this.repository.restoreStock(
            order.items.map((i) => ({ gearItemId: i.gearItemId, quantity: i.quantity })),
            tx,
          );
        }

        const updatedOrder = await this.repository.updateStatus(orderId, targetStatus, tx);

        await this.repository.writeStatusHistory(
          {
            rentalOrderId: orderId,
            fromStatus: currentStatus,
            toStatus: targetStatus,
            changedById: userId,
            reason: input.reason,
          },
          tx,
        );

        return updatedOrder;
      },
      {
        timeout: 20000,
      },
    );

    return updated;
  }
}

export type { Prisma };
