import { Prisma, PrismaClient } from '@prisma/client';

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
    const [
      users,
      customers,
      providers,
      suspended,
      totalGear,
      availableGear,
      totalCategories,
      totalOrders,
      activeRentals,
      ordersByStatus,
      completedPayments,
      pendingPayments,
      recentPayments,
      totalReviews,
      averageRating,
      topRevenue,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'customer' } }),
      this.prisma.user.count({ where: { role: 'provider' } }),
      this.prisma.user.count({ where: { status: 'suspended' } }),
      this.prisma.gearItem.count(),
      this.prisma.gearItem.count({ where: { isAvailable: true } }),
      this.prisma.category.count(),
      this.prisma.rentalOrder.count(),
      this.prisma.rentalOrder.count({ where: { status: { notIn: ['returned', 'cancelled'] } } }),
      this.prisma.rentalOrder.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'completed' },
        _sum: { amount: true },
        _count: { _all: true },
        _avg: { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'pending' },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.payment.aggregate({
        where: {
          status: 'completed',
          paidAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        _sum: { amount: true },
        _count: { _all: true },
      }),
      this.prisma.review.count(),
      this.prisma.review.aggregate({ _avg: { rating: true } }),
      this.prisma.payment.groupBy({
        by: ['userId'],
        where: { status: 'completed' },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 5,
      }),
    ]);

    const orderStatusCounts: Record<string, number> = {};
    for (const row of ordersByStatus) {
      orderStatusCounts[row.status] = row._count._all;
    }

    const topProviderIds = topRevenue.map((row) => row.userId);
    const topProviders = topProviderIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: topProviderIds } },
          select: { id: true, name: true, email: true },
        })
      : [];
    const providerById = new Map(topProviders.map((p) => [p.id, p]));

    return {
      users: {
        total: users,
        customers,
        providers,
        suspended,
      },
      gear: {
        total: totalGear,
        available: availableGear,
        unavailable: totalGear - availableGear,
      },
      categories: {
        total: totalCategories,
      },
      orders: {
        total: totalOrders,
        active: activeRentals,
        byStatus: orderStatusCounts,
      },
      revenue: {
        completedTotal: Number(completedPayments._sum.amount ?? 0),
        completedCount: completedPayments._count._all,
        completedAverage: Number(completedPayments._avg.amount ?? 0),
        pendingTotal: Number(pendingPayments._sum.amount ?? 0),
        pendingCount: pendingPayments._count._all,
        last30DaysTotal: Number(recentPayments._sum.amount ?? 0),
        last30DaysCount: recentPayments._count._all,
      },
      reviews: {
        total: totalReviews,
        averageRating: averageRating._avg.rating
          ? Number(Number(averageRating._avg.rating).toFixed(2))
          : 0,
      },
      topCustomers: topRevenue.map((row) => ({
        user: providerById.get(row.userId) ?? { id: row.userId, name: null, email: null },
        totalSpent: Number(row._sum.amount ?? 0),
      })),
      generatedAt: new Date().toISOString(),
    };
  }
}
