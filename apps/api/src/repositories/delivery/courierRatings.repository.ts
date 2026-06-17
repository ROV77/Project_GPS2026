import { prisma } from '../../config/prisma';
import type { Prisma } from '@prisma/client';

export class CourierRatingsRepository {
  async findAll() {
    return prisma.courier_ratings.findMany({ orderBy: { created_at: 'desc' } });
  }
  async findById(id: bigint) {
    return prisma.courier_ratings.findUnique({ where: { id } });
  }
  async create(data: Prisma.courier_ratingsUncheckedCreateInput) {
    return prisma.courier_ratings.create({ data });
  }
  async update(id: bigint, data: Prisma.courier_ratingsUncheckedUpdateInput) {
    return prisma.courier_ratings.update({ where: { id }, data });
  }
  async delete(id: bigint) {
    return prisma.courier_ratings.delete({ where: { id } });
  }
}
export const courierRatingsRepository = new CourierRatingsRepository();
