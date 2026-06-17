import { prisma } from '../../config/prisma';
import type { CreateVacancyInput } from '@caserita/shared-types';

export class DeliveryVacanciesService {
  async getAllVacancies() {
    return prisma.delivery_vacancies.findMany({ orderBy: { created_at: 'desc' } });
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
