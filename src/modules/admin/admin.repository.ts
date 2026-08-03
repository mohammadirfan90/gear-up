import { PrismaClient, Prisma } from '@prisma/client';

// Public-safe projection — never returns password/refreshToken.
const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} satisfies Prisma.UserSelect;

export class AdminRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findManyUsers(opts: {
    skip: number;
    take: number;
    role?: string;
    status?: string;
    search?: string;
  }) {
    return this.prisma.user.findMany({
      where: {
        ...(opts.role && { role: opts.role as Prisma.EnumRoleFilter }),
        ...(opts.status && { status: opts.status as Prisma.EnumUserStatusFilter }),
        ...(opts.search && {
          OR: [
            { name: { contains: opts.search, mode: 'insensitive' } },
            { email: { contains: opts.search, mode: 'insensitive' } },
          ],
        }),
      },
      skip: opts.skip,
      take: opts.take,
      orderBy: { createdAt: 'desc' },
      select: safeUserSelect,
    });
  }

  async countUsers(opts: { role?: string; status?: string; search?: string }) {
    return this.prisma.user.count({
      where: {
        ...(opts.role && { role: opts.role as Prisma.EnumRoleFilter }),
        ...(opts.status && { status: opts.status as Prisma.EnumUserStatusFilter }),
        ...(opts.search && {
          OR: [
            { name: { contains: opts.search, mode: 'insensitive' } },
            { email: { contains: opts.search, mode: 'insensitive' } },
          ],
        }),
      },
    });
  }

  async findUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: safeUserSelect,
    });
  }

  async updateUserStatus(id: string, status: 'active' | 'suspended') {
    return this.prisma.user.update({
      where: { id },
      data: { status },
      select: safeUserSelect,
    });
  }

  async findAllGear(opts: { skip: number; take: number; isAvailable?: boolean }) {
    return this.prisma.gearItem.findMany({
      where: { ...(opts.isAvailable !== undefined && { isAvailable: opts.isAvailable }) },
      skip: opts.skip,
      take: opts.take,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true } },
        provider: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async countGear(isAvailable?: boolean) {
    return this.prisma.gearItem.count({
      where: { ...(isAvailable !== undefined && { isAvailable }) },
    });
  }

  async getStats() {
    const [users, customers, providers, suspended, gear, orders, payments] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'customer' } }),
      this.prisma.user.count({ where: { role: 'provider' } }),
      this.prisma.user.count({ where: { status: 'suspended' } }),
      this.prisma.gearItem.count(),
      this.prisma.rentalOrder.count(),
      this.prisma.payment.aggregate({
        where: { status: 'completed' },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      users: {
        total: users,
        customers,
        providers,
        suspended,
      },
      gear: { total: gear },
      orders: { total: orders },
      payments: {
        completedCount: payments._count,
        completedTotal: Number(payments._sum.amount ?? 0),
      },
    };
  }
}
