import { prisma } from '../../config/prisma';
import type { CreateVacancyInput } from '@caserita/shared-types';

export class DeliveryVacanciesService {
  async getAllVacancies(params: { store_id?: string; page?: number; limit?: number } = {}) {
    const page = params.page ? Number(params.page) : 1;
    const limit = params.limit ? Number(params.limit) : 10;
    const skip = (page - 1) * limit;
    const where = params.store_id ? { store_id: BigInt(params.store_id) } : {};

    const [data, total] = await Promise.all([
      prisma.delivery_vacancies.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' }
      }),
      prisma.delivery_vacancies.count({ where })
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }
  async getVacancyById(id: string) {
    return prisma.delivery_vacancies.findUnique({ where: { id: BigInt(id) } });
  }
  async createVacancy(input: CreateVacancyInput) {
    return prisma.delivery_vacancies.create({
      data: {
        store_id: BigInt(input.store_id),
        description: input.description,
        state_id: input.state_id ? BigInt(input.state_id) : null,
      },
    });
  }
  async updateVacancy(id: string, input: Partial<CreateVacancyInput>) {
    const data: any = {};
    if (input.store_id !== undefined) data.store_id = BigInt(input.store_id);
    if (input.description !== undefined) data.description = input.description;
    if (input.state_id !== undefined) data.state_id = input.state_id ? BigInt(input.state_id) : null;
    return prisma.delivery_vacancies.update({ where: { id: BigInt(id) }, data });
  }
  async deleteVacancy(id: string) {
    return prisma.delivery_vacancies.delete({ where: { id: BigInt(id) } });
  }
}
export const deliveryVacanciesService = new DeliveryVacanciesService();
