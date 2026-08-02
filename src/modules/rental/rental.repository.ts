import { PrismaClient, Prisma } from '@prisma/client';

export class RentalRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(
    data: Prisma.RentalOrderCreateInput,
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    return tx.rentalOrder.create({
      data,
      include: {
        items: {
          include: {
            gearItem: { select: { id: true, name: true, brand: true, images: true } },
          },
        },
        customer: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findById(id: string) {
    return this.prisma.rentalOrder.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            gearItem: {
              select: {
                id: true,
                name: true,
                brand: true,
                images: true,
                providerId: true,
                pricePerDay: true,
              },
            },
          },
        },
        customer: { select: { id: true, name: true, email: true } },
        payments: { select: { id: true, status: true, amount: true, provider: true } },
      },
    });
  }

  async findManyForCustomer(
    customerId: string,
    opts: { skip: number; take: number; status?: string },
  ) {
    return this.prisma.rentalOrder.findMany({
      where: {
        customerId,
        ...(opts.status && { status: opts.status as Prisma.EnumOrderStatusFilter }),
      },
      skip: opts.skip,
      take: opts.take,
      orderBy: { createdAt: 'desc' },
      include: {
        items: { select: { id: true, quantity: true, pricePerDay: true, subtotal: true } },
      },
    });
  }

  async countForCustomer(customerId: string, status?: string) {
    return this.prisma.rentalOrder.count({
      where: {
        customerId,
        ...(status && { status: status as Prisma.EnumOrderStatusFilter }),
      },
    });
  }

  async findManyForProvider(
    providerId: string,
    opts: { skip: number; take: number; status?: string },
  ) {
    return this.prisma.rentalOrder.findMany({
      where: {
        items: { some: { gearItem: { providerId } } },
        ...(opts.status && { status: opts.status as Prisma.EnumOrderStatusFilter }),
      },
      skip: opts.skip,
      take: opts.take,
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            gearItem: { select: { id: true, name: true, providerId: true } },
          },
        },
        customer: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async countForProvider(providerId: string, status?: string) {
    return this.prisma.rentalOrder.count({
      where: {
        items: { some: { gearItem: { providerId } } },
        ...(status && { status: status as Prisma.EnumOrderStatusFilter }),
      },
    });
  }

  async findManyAdmin(opts: { skip: number; take: number; status?: string }) {
    return this.prisma.rentalOrder.findMany({
      where: { ...(opts.status && { status: opts.status as Prisma.EnumOrderStatusFilter }) },
      skip: opts.skip,
      take: opts.take,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        items: { select: { id: true } },
      },
    });
  }

  async countAdmin(status?: string) {
    return this.prisma.rentalOrder.count({
      where: { ...(status && { status: status as Prisma.EnumOrderStatusFilter }) },
    });
  }

  async updateStatus(
    id: string,
    status: Prisma.RentalOrderUpdateInput['status'],
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    return tx.rentalOrder.update({
      where: { id },
      data: { status },
    });
  }

  async writeStatusHistory(
    data: {
      rentalOrderId: string;
      fromStatus: Prisma.RentalStatusHistoryCreateInput['fromStatus'];
      toStatus: Prisma.RentalStatusHistoryCreateInput['toStatus'];
      changedById: string;
      reason?: string;
    },
    tx: Prisma.TransactionClient = this.prisma,
  ) {
    return tx.rentalStatusHistory.create({
      data: {
        rentalOrderId: data.rentalOrderId,
        fromStatus: data.fromStatus ?? null,
        toStatus: data.toStatus,
        changedById: data.changedById,
        reason: data.reason,
      },
    });
  }

  async decrementStock(
    items: { gearItemId: string; quantity: number }[],
    tx: Prisma.TransactionClient,
  ) {
    return Promise.all(
      items.map((i) =>
        tx.gearItem.update({
          where: { id: i.gearItemId },
          data: { stock: { decrement: i.quantity } },
        }),
      ),
    );
  }

  async restoreStock(
    items: { gearItemId: string; quantity: number }[],
    tx: Prisma.TransactionClient,
  ) {
    return Promise.all(
      items.map((i) =>
        tx.gearItem.update({
          where: { id: i.gearItemId },
          data: { stock: { increment: i.quantity } },
        }),
      ),
    );
  }

  async findGearItemsByIds(ids: string[]) {
    return this.prisma.gearItem.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        pricePerDay: true,
        stock: true,
        isAvailable: true,
        providerId: true,
      },
    });
  }
}
