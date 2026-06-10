import { prisma } from '../../config/prisma';
import type { Prisma } from '@prisma/client';

export class DeliveryApplicationsRepository {
  async findAll() {
    return prisma.delivery_applications.findMany({ orderBy: { applied_at: 'desc' } });
  }
  async findById(id: bigint) {
    return prisma.delivery_applications.findUnique({ where: { id } });
  }
  async create(data: Prisma.delivery_applicationsUncheckedCreateInput) {
    return prisma.delivery_applications.create({ data });
  }
  async update(id: bigint, data: Prisma.delivery_applicationsUncheckedUpdateInput) {
    return prisma.delivery_applications.update({ where: { id }, data });
  }
  async delete(id: bigint) {
    return prisma.delivery_applications.delete({ where: { id } });
  }
}
export const deliveryApplicationsRepository = new DeliveryApplicationsRepository();
