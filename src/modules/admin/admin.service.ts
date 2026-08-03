import { PrismaClient } from '@prisma/client';
import { NotFoundError, ConflictError } from '@/shared/errors';
import { buildPagination, buildPaginationMeta } from '@/shared/utils/pagination';
import { logger } from '@/shared/utils/logger';
import { AdminRepository } from './admin.repository';
import { ListUsersInput, UpdateUserStatusInput } from './admin.validator';

const ADMIN_ROLE = 'admin';

export class AdminService {
  private readonly repository: AdminRepository;

  constructor(prisma: PrismaClient) {
    this.repository = new AdminRepository(prisma);
  }

  async listUsers(params: ListUsersInput) {
    const { skip, take, page, limit } = buildPagination(params);
    const [items, total] = await Promise.all([
      this.repository.findManyUsers({ skip, take, ...params }),
      this.repository.countUsers(params),
    ]);
    return { items, pagination: buildPaginationMeta(page, limit, total) };
  }

  async getUserById(id: string) {
    const user = await this.repository.findUserById(id);
    if (!user) {
      throw new NotFoundError('User not found', { resource: 'user', id });
    }
    return user;
  }

  async updateUserStatus(id: string, input: UpdateUserStatusInput) {
    const user = await this.getUserById(id);

    if (user.role === ADMIN_ROLE) {
      throw new ConflictError('Cannot change status of admin user', {
        role: 'Admin status is immutable',
      });
    }

    if (user.status === input.status) {
      throw new ConflictError(`User is already ${input.status}`, {
        status: `User is already ${input.status}`,
      });
    }

    const updated = await this.repository.updateUserStatus(id, input.status);

    logger.info(
      {
        targetUserId: id,
        previousStatus: user.status,
        newStatus: input.status,
        reason: input.reason,
      },
      'admin.user_status_changed',
    );

    return updated;
  }

  async listAllGear(params: { page: number; limit: number; isAvailable?: boolean }) {
    const { skip, take, page, limit } = buildPagination(params);
    const [items, total] = await Promise.all([
      this.repository.findAllGear({ skip, take, isAvailable: params.isAvailable }),
      this.repository.countGear(params.isAvailable),
    ]);
    return { items, pagination: buildPaginationMeta(page, limit, total) };
  }

  async getStats() {
    return this.repository.getStats();
  }
}
