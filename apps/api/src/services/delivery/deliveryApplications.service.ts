import { prisma } from '../../config/prisma';
import type { CreateApplicationInput } from '@caserita/shared-types';

export class DeliveryApplicationsService {
  async getAllApplications(params: { store_id?: string; vacancy_id?: string; page?: number; limit?: number } = {}) {
    const page = params.page ? Number(params.page) : 1;
    const limit = params.limit ? Number(params.limit) : 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.vacancy_id) {
      where.vacancy_id = BigInt(params.vacancy_id);
    } else if (params.store_id) {
      const storeVacancies = await prisma.delivery_vacancies.findMany({
        where: { store_id: BigInt(params.store_id) },
        select: { id: true }
      });
      const vacancyIds = storeVacancies.map(v => v.id);
      where.vacancy_id = { in: vacancyIds };
    }

    const [data, total] = await Promise.all([
      prisma.delivery_applications.findMany({
        where,
        skip,
        take: limit,
        orderBy: { applied_at: 'desc' },
      }),
      prisma.delivery_applications.count({ where })
    ]);

    return { data, total, page, limit };
  }
  async getApplicationById(id: string) {
    return prisma.delivery_applications.findUnique({ where: { id: BigInt(id) } });
  }
  async createApplication(input: CreateApplicationInput) {
    return prisma.delivery_applications.create({
      data: {
        vacancy_id: BigInt(input.vacancy_id),
        courier_id: BigInt(input.courier_id),
        state_id: input.state_id ? BigInt(input.state_id) : null,
      },
    });
  }
  async updateApplication(id: string, input: Partial<CreateApplicationInput>) {
    const data: any = {};
    if (input.vacancy_id !== undefined) data.vacancy_id = BigInt(input.vacancy_id);
    if (input.courier_id !== undefined) data.courier_id = BigInt(input.courier_id);
    if (input.state_id !== undefined) data.state_id = input.state_id ? BigInt(input.state_id) : null;
    return prisma.delivery_applications.update({ where: { id: BigInt(id) }, data });
  }
  async deleteApplication(id: string) {
    return prisma.delivery_applications.delete({ where: { id: BigInt(id) } });
  }
}
export const deliveryApplicationsService = new DeliveryApplicationsService();
