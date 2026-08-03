import { PrismaClient, Prisma } from '@prisma/client';

export class PaymentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findPendingByOrderId(rentalOrderId: string) {
    return this.prisma.payment.findFirst({
      where: { rentalOrderId, status: 'pending' },
    });
  }

  async findById(id: string) {
    return this.prisma.payment.findUnique({
      where: { id },
      include: {
        rentalOrder: {
          select: { id: true, customerId: true, totalAmount: true, status: true },
        },
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findByTransactionId(transactionId: string) {
    return this.prisma.payment.findUnique({ where: { transactionId } });
  }

  async create(data: Prisma.PaymentCreateInput) {
    return this.prisma.payment.create({ data });
  }

  async updateStatus(id: string, data: Prisma.PaymentUpdateInput) {
    return this.prisma.payment.update({ where: { id }, data });
  }

  async findManyForUser(userId: string, opts: {
    skip: number;
    take: number;
    status?: string;
  }) {
    return this.prisma.payment.findMany({
      where: {
        userId,
        ...(opts.status && { status: opts.status as Prisma.EnumPaymentStatusFilter }),
      },
      skip: opts.skip,
      take: opts.take,
      orderBy: { createdAt: 'desc' },
      include: {
        rentalOrder: { select: { id: true, startDate: true, endDate: true } },
      },
    });
  }

  async countForUser(userId: string, status?: string) {
    return this.prisma.payment.count({
      where: {
        userId,
        ...(status && { status: status as Prisma.EnumPaymentStatusFilter }),
      },
    });
  }

  async findManyAdmin(opts: { skip: number; take: number; status?: string }) {
    return this.prisma.payment.findMany({
      where: { ...(opts.status && { status: opts.status as Prisma.EnumPaymentStatusFilter }) },
      skip: opts.skip,
      take: opts.take,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        rentalOrder: { select: { id: true } },
      },
    });
  }

  async countAdmin(status?: string) {
    return this.prisma.payment.count({
      where: { ...(status && { status: status as Prisma.EnumPaymentStatusFilter }) },
    });
  }
}