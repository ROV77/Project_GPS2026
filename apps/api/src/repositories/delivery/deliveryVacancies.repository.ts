import { prisma } from '../../config/prisma';
import type { Prisma } from '@prisma/client';

export class DeliveryVacanciesRepository {
  async findAll() {
    return prisma.delivery_vacancies.findMany({ orderBy: { created_at: 'desc' } });
  }
  async findById(id: bigint) {
    return prisma.delivery_vacancies.findUnique({ where: { id } });
  }
  async create(data: Prisma.delivery_vacanciesUncheckedCreateInput) {
    return prisma.delivery_vacancies.create({ data });
  }
  async update(id: bigint, data: Prisma.delivery_vacanciesUncheckedUpdateInput) {
    return prisma.delivery_vacancies.update({ where: { id }, data });
  }
  async delete(id: bigint) {
    return prisma.delivery_vacancies.delete({ where: { id } });
  }
}
export const deliveryVacanciesRepository = new DeliveryVacanciesRepository();
