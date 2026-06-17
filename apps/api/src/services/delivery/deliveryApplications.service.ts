import { prisma } from '../../config/prisma';
import type { CreateApplicationInput } from '@caserita/shared-types';

export class DeliveryApplicationsService {
  async getAllApplications() {
    return prisma.delivery_applications.findMany({ orderBy: { applied_at: 'desc' } });
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
